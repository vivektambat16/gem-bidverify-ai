"""Compliance rule engine.

Input : bidder record, the tender's requirements, the bid's analysed documents.
Output: one result per applicable requirement (VERIFIED / MISMATCH / NON_COMPLIANT) with points,
        an overall compliance score, a risk assessment and a recommendation for the officer.

Scoring:  VERIFIED = full weight, MISMATCH = half weight (needs human review), NON_COMPLIANT = 0.
The engine only recommends; the final decision is always taken by the procurement officer.
"""
import re
from datetime import date

from . import adapters, config
from .extraction import GSTIN_RE, PAN_RE, UDYAM_RE, UDIN_RE, parse_money

REQUIREMENT_DOCUMENT = {
    "PAN": "PAN_CARD", "GST": "GST_CERTIFICATE", "UDYAM": "UDYAM_CERTIFICATE",
    "ITR": "ITR_AND_FINANCIALS", "OEM_AUTH": "OEM_AUTHORIZATION", "MAKE_IN_INDIA": "MAKE_IN_INDIA",
    "EPFO": "EPFO_REGISTRATION", "ESIC": "ESIC_REGISTRATION", "DEBARMENT": "DEBARMENT_AFFIDAVIT",
}
MISMATCH_FACTOR = 0.5
NAME_MATCH_THRESHOLD = 0.80


def _field(doc: dict, name: str):
    for item in doc.get("extracted_fields", []):
        if item["field_name"] == name:
            return item
    return None


def _value(doc: dict, name: str):
    item = _field(doc, name)
    if not item:
        return None
    return item.get("extracted_value") or item.get("value")



def _outcome(status, confidence, rule, explanation, flags=None, evidence=None):
    return {"status": status, "confidence": round(confidence, 2), "rule": rule,
            "explanation": explanation, "flags": flags or [], "evidence": evidence}


# ---------------------------------------------------------------------------------------
# One check per requirement code
# ---------------------------------------------------------------------------------------
def check_pan(bidder, req, doc):
    rule = "PAN format + ITD registry match (simulated adapter)"
    pan = (_value(doc, "pan_number") or "").upper()
    if not pan:
        return _outcome("MISMATCH", 0.4, rule, "PAN number could not be read from the document; manual review needed.")
    if not PAN_RE.fullmatch(pan):
        return _outcome("NON_COMPLIANT", 0.9, rule, f"'{pan}' is not a valid PAN format.")
    registry = adapters.lookup_pan(pan)
    problems = []
    if bidder.get("pan") and bidder["pan"].upper() != pan:
        problems.append(f"PAN on document ({pan}) differs from the bidder's registered PAN ({bidder['pan']})")
    doc_name = _value(doc, "name_on_pan")
    reference = registry["entity_name"] or bidder.get("company_name")
    if doc_name and reference and adapters.name_similarity(doc_name, reference) < NAME_MATCH_THRESHOLD:
        problems.append(f"name on PAN ('{doc_name}') does not match '{reference}'")
    if problems:
        return _outcome("MISMATCH", 0.8, rule, "; ".join(problems).capitalize() + ".")
    return _outcome("VERIFIED", _field(doc, "pan_number")["confidence"], rule,
                    f"PAN {pan} is valid and matches the bidder identity.")


def check_gst(bidder, req, doc):
    rule = "GSTIN format, checksum, embedded-PAN and GSTN status check (simulated adapter)"
    gstin = (_value(doc, "gstin") or "").upper()
    if not gstin:
        return _outcome("MISMATCH", 0.4, rule, "GSTIN could not be read from the certificate; manual review needed.")
    info = adapters.lookup_gst(gstin)
    if info["status"] == "INVALID_FORMAT":
        return _outcome("NON_COMPLIANT", 0.9, rule, f"'{gstin}' is not a valid GSTIN format.")
    doc_status = (_value(doc, "status") or "").upper()
    if info["status"] != "ACTIVE" or doc_status in ("CANCELLED", "SUSPENDED"):
        shown = info["status"] if info["status"] != "ACTIVE" else doc_status
        return _outcome("NON_COMPLIANT", 0.95, rule,
                        f"GSTIN {gstin} is {shown}. {info['filing_status']}.", flags=["GST_NOT_ACTIVE"])
    problems = []
    if not info["checksum_ok"]:
        if config.STRICT_GSTIN_CHECKSUM:
            return _outcome("NON_COMPLIANT", 0.9, rule, f"GSTIN {gstin} fails the check-digit validation.")
        problems.append("GSTIN check digit does not validate")
    if bidder.get("pan") and gstin[2:12] != bidder["pan"].upper():
        problems.append("PAN embedded in the GSTIN differs from the bidder's PAN")
    if bidder.get("gstin") and bidder["gstin"].upper() != gstin:
        problems.append("GSTIN differs from the bidder's registered GSTIN")
    if problems:
        return _outcome("MISMATCH", 0.75, rule, "; ".join(problems).capitalize() + ".")
    return _outcome("VERIFIED", _field(doc, "gstin")["confidence"], rule,
                    f"GSTIN {gstin} is active in {info['state']}; PAN matches.")


def check_udyam(bidder, req, doc):
    rule = "Udyam registration number format and bidder MSME record match"
    number = (_value(doc, "udyam_no") or "").upper()
    if not UDYAM_RE.fullmatch(number):
        return _outcome("MISMATCH", 0.4, rule, "Valid Udyam registration number not found on the document.")
    if bidder.get("msme_reg_no") and bidder["msme_reg_no"].upper() != number:
        return _outcome("MISMATCH", 0.8, rule, f"Udyam number {number} differs from the bidder's registered {bidder['msme_reg_no']}.")
    return _outcome("VERIFIED", _field(doc, "udyam_no")["confidence"], rule, f"Udyam registration {number} is well-formed and consistent.")


def check_itr(bidder, req, doc):
    rule = "Average annual turnover vs tender minimum; UDIN presence"
    item = _field(doc, "avg_annual_turnover")
    if not item or item.get("normalized_value") is None:
        return _outcome("MISMATCH", 0.4, rule, "Turnover figure could not be read; manual review needed.")
    turnover = float(item["normalized_value"])
    minimum = parse_money(req.get("min_condition") or "") if re.search(r"turnover", req.get("min_condition") or "", re.I) else None
    needs_udin = "udin" in (req.get("min_condition") or "").lower()
    udin = (_value(doc, "ca_udin") or "").upper()
    if minimum and turnover < minimum:
        return _outcome("NON_COMPLIANT", 0.95, rule,
                        f"Average turnover {item['extracted_value']} is below the required ₹ {minimum / 1e7:.2f} Cr.")
    if needs_udin and not UDIN_RE.fullmatch(udin):
        return _outcome("MISMATCH", 0.7, rule, "Turnover meets the minimum but a valid UDIN was not found on the certificate.")
    return _outcome("VERIFIED", item["confidence"], rule,
                    f"Average turnover {item['extracted_value']} meets the requirement" + (f" and UDIN {udin} is present." if udin else "."))


def check_oem(bidder, req, doc):
    rule = "Authorization addressed to bidder; validity date"
    entity = _value(doc, "authorized_entity_name")
    validity = _field(doc, "valid_until")
    if validity and validity.get("normalized_value"):
        if date.fromisoformat(validity["normalized_value"]) < date.today():
            return _outcome("NON_COMPLIANT", 0.9, rule, f"The authorization expired on {validity['normalized_value']}.")
    if not entity:
        return _outcome("MISMATCH", 0.4, rule, "Authorized entity could not be read; manual review needed.")
    if adapters.name_similarity(entity, bidder.get("company_name", "")) < 0.7:
        return _outcome("MISMATCH", 0.8, rule, f"Authorization names '{entity}', not the bidder '{bidder.get('company_name')}'.")
    return _outcome("VERIFIED", _field(doc, "authorized_entity_name")["confidence"], rule,
                    f"Authorization is issued to '{entity}'" + (f" and is valid until {validity['normalized_value']}." if validity else "."))


def check_mii(bidder, req, doc):
    rule = "Local content % vs minimum for Class-I local supplier"
    item = _field(doc, "local_content_percentage")
    if not item or item.get("normalized_value") is None:
        return _outcome("MISMATCH", 0.4, rule, "Local content percentage could not be read; manual review needed.")
    m = re.search(r"(\d{1,3})\s*%", req.get("min_condition") or "")
    minimum = float(m.group(1)) if m else 50.0
    percent = float(item["normalized_value"])
    if percent < minimum:
        return _outcome("NON_COMPLIANT", 0.95, rule, f"Local content {percent:g}% is below the required {minimum:g}%.")
    return _outcome("VERIFIED", item["confidence"], rule, f"Local content {percent:g}% meets the required {minimum:g}%.")


def check_registration(bidder, req, doc):
    rule = "Registration certificate present and readable"
    if doc["classification_confidence"] >= 0.6 and doc.get("ocr_status") == "COMPLETED":
        return _outcome("VERIFIED", doc["classification_confidence"], rule, f"{req['requirement_name']} certificate submitted.")
    return _outcome("MISMATCH", doc["classification_confidence"], rule, "Certificate is unreadable or could not be confirmed; manual review needed.")


def check_debarment(bidder, req, doc):
    rule = "CPPP central debarment directory + affidavit (simulated adapter)"
    registry = adapters.check_debarment(bidder.get("company_name", ""), bidder.get("pan", ""))
    if registry["status"] == "DEBARRED_MATCH_FOUND":
        return _outcome("NON_COMPLIANT", 1.0, rule,
                        f"Entity matches debarment order {registry['order_number']} ({registry['ministry']}). {registry['gfr_rule']}.",
                        flags=["DEBARMENT_MATCH"], evidence="CPPP Central Debarment Directory")
    if doc is None:
        return _outcome("MISMATCH", 0.8, rule, "No debarment record found, but the mandatory affidavit was not submitted.",
                        evidence="CPPP Central Debarment Directory")
    if _value(doc, "affidavit_status") == "DECLARES_DEBARRED":
        return _outcome("NON_COMPLIANT", 0.9, rule, "The affidavit itself declares that the entity has been debarred.", flags=["DEBARMENT_MATCH"])
    return _outcome("VERIFIED", 0.95, rule, "No debarment record found and the affidavit is on file.")


CHECKS = {"PAN": check_pan, "GST": check_gst, "UDYAM": check_udyam, "ITR": check_itr,
          "OEM_AUTH": check_oem, "MAKE_IN_INDIA": check_mii, "EPFO": check_registration,
          "ESIC": check_registration, "DEBARMENT": check_debarment}


# ---------------------------------------------------------------------------------------
# Evaluation of a whole bid
# ---------------------------------------------------------------------------------------
def _applicable(bidder, req) -> bool:
    kind = (req.get("applicable_bidder_type") or "ALL").upper()
    if kind == "MSME":
        return bool(bidder.get("is_msme"))
    if kind == "STARTUP":
        return bool(bidder.get("is_startup"))
    return True


def evaluate_requirements(bidder: dict, requirements: list, documents: list) -> list:
    """Return a result dict for each applicable requirement that can be (or must be) judged."""
    results = []
    for req in requirements:
        if not _applicable(bidder, req):
            continue
        code = req["requirement_code"]
        wanted = REQUIREMENT_DOCUMENT.get(code)
        candidates = [d for d in documents if d["classified_type"] == wanted]
        doc = max(candidates, key=lambda d: d["classification_confidence"]) if candidates else None
        weight = float(req.get("weight") or 0)
        check = CHECKS.get(code)

        if code == "DEBARMENT":
            out = check_debarment(bidder, req, doc)
        elif doc is None:
            if not req.get("is_mandatory"):
                continue  # optional and not submitted: not judged
            out = _outcome("NON_COMPLIANT", 1.0, "Mandatory document presence check",
                           f"No {req['requirement_name']} document was submitted.", flags=["MISSING_MANDATORY"])
        elif check:
            out = check(bidder, req, doc)
        else:
            out = _outcome("MISMATCH", doc["classification_confidence"], "Manual review",
                           "No automatic rule exists for this requirement; officer review needed.")

        factor = {"VERIFIED": 1.0, "MISMATCH": MISMATCH_FACTOR, "NON_COMPLIANT": 0.0}[out["status"]]
        results.append({
            "requirement_code": code, "requirement_name": req["requirement_name"],
            "status": out["status"], "points_awarded": round(weight * factor, 1), "max_points": weight,
            "evidence_document": out["evidence"] or (doc["file_name"] if doc else "None"),
            "confidence_score": out["confidence"], "rule_applied": out["rule"],
            "explanation": out["explanation"], "flags": out["flags"], "is_mandatory": bool(req.get("is_mandatory")),
        })
    return results


def summarize(results: list, document_count: int, ocr_confidences=()) -> dict:
    """Overall score, risk assessment and recommendation from per-requirement results."""
    total = sum(r["max_points"] for r in results)
    awarded = sum(r["points_awarded"] for r in results)
    score = round(100 * awarded / total) if total else 0
    flags = {f for r in results for f in r.get("flags", [])}
    factors, risk = [], 0

    if "DEBARMENT_MATCH" in flags:
        factors.append("Central Debarment Registry Match")
        risk += 70
    if "GST_NOT_ACTIVE" in flags:
        factors.append("GSTIN not in active status")
        risk += 25
    missing = [r for r in results if "MISSING_MANDATORY" in r.get("flags", [])]
    for r in missing:
        factors.append(f"Missing mandatory {r['requirement_code']}")
        risk += 20
    failed = [r for r in results if r["status"] == "NON_COMPLIANT" and not r.get("flags")]
    for r in failed:
        factors.append(f"Failed {r['requirement_code']} requirement")
        risk += 20
    mismatches = [r for r in results if r["status"] == "MISMATCH"]
    if mismatches:
        factors.append(f"{len(mismatches)} requirement(s) need manual review")
        risk += 8 * len(mismatches)
    if any(c < 0.6 for c in ocr_confidences):
        factors.append("Low OCR confidence on at least one document")
        risk += 5
    risk = min(100, risk)

    mandatory_failed = any(r["status"] == "NON_COMPLIANT" and r.get("is_mandatory") for r in results)
    if "DEBARMENT_MATCH" in flags or risk >= 70:
        level, reco = "CRITICAL", "CRITICAL_DISQUALIFICATION_REQUIRED"
        action = "Issue formal disqualification memo under GFR Rule 151" if "DEBARMENT_MATCH" in flags \
            else "Escalate for disqualification review"
    else:
        level = "HIGH" if risk >= 45 else "MEDIUM" if risk >= 20 else "LOW"
        if score >= 80 and not mandatory_failed and level == "LOW":
            reco, action = "QUALIFIED_WITH_HIGH_CONFIDENCE", "Proceed to commercial envelope opening"
        else:
            reco, action = "REVIEW_REQUIRED", "Examine flagged requirements and verify the credentials manually"

    verified = sum(1 for r in results if r["status"] == "VERIFIED")
    explanation = f"{verified} of {len(results)} evaluated requirements verified; compliance score {score}/100."
    notable = [r["explanation"] for r in results if r["status"] != "VERIFIED"][:2]
    if notable:
        explanation += " " + " ".join(notable)
    status = "VERIFIED" if reco == "QUALIFIED_WITH_HIGH_CONFIDENCE" else "PENDING_REVIEW"
    return {"compliance_score": score, "risk_score": risk, "risk_level": level, "risk_factors": factors,
            "ai_recommendation": reco, "recommended_action": action, "ai_explanation": explanation,
            "status": status}


def awaiting_documents(bidder: dict, requirements: list) -> dict:
    """State of a new bid with no documents: only the registry-based debarment check can run."""
    debarred = adapters.check_debarment(bidder.get("company_name", ""), bidder.get("pan", ""))
    if debarred["status"] == "DEBARRED_MATCH_FOUND":
        return {"compliance_score": 0, "risk_score": 90, "risk_level": "CRITICAL",
                "risk_factors": ["Central Debarment Registry Match"],
                "ai_recommendation": "CRITICAL_DISQUALIFICATION_REQUIRED",
                "recommended_action": "Issue formal disqualification memo under GFR Rule 151",
                "ai_explanation": f"Entity matches debarment order {debarred['order_number']} ({debarred['ministry']}). {debarred['gfr_rule']}.",
                "status": "PENDING_REVIEW"}
    return {"compliance_score": 0, "risk_score": 10, "risk_level": "LOW", "risk_factors": [],
            "ai_recommendation": "REVIEW_REQUIRED", "recommended_action": "Upload the required documents to start verification",
            "ai_explanation": "No documents have been uploaded yet. Verification starts when the first document is added.",
            "status": "UNDER_VERIFICATION"}
