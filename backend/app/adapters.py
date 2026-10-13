"""Statutory registry adapters (GSTN, Income Tax PAN, CPPP debarment list).

IMPORTANT: these adapters are SIMULATED. Real access to GSTN, the Income Tax Department or the
CPPP debarment directory needs official API agreements. Each function below is the single place
to replace with a real API call; the rest of the system only depends on the returned dictionaries.
"""
import re
from difflib import SequenceMatcher

from .extraction import GSTIN_RE, PAN_RE, gstin_checksum_ok

GST_STATE_CODES = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
    "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
    "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa",
    "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
    "35": "Andaman & Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
}

# Simulated registry records (demo data).
_GST_REGISTRY = {
    "27ABCDE1234F1Z5": {"legal_name": "ABC Technologies Pvt Ltd", "status": "ACTIVE",
                        "filing_status": "Clean Filing Record (All returns submitted up to date)"},
    "07XYZAB5678C1Z2": {"legal_name": "XYZ Solutions Ltd", "status": "ACTIVE",
                        "filing_status": "Clean Filing Record (All returns submitted up to date)"},
    "08BHART9999K1Z8": {"legal_name": "Bharat Systems Pvt Ltd", "status": "SUSPENDED",
                        "filing_status": "Defaulted / GSTR-3B overdue for 4 quarters"},
}
_PAN_REGISTRY = {
    "ABCDE1234F": "ABC TECHNOLOGIES PVT LTD",
    "XYZAB5678C": "XYZ SOLUTIONS LTD",
    "BHART9999K": "BHARAT SYSTEMS PVT LTD",
}
_DEBARMENT_LIST = [{
    "pan": "BHART9999K", "name": "Bharat Systems Pvt Ltd",
    "ministry": "Ministry of Defence (Acquisition Wing)", "order_number": "MOD/DEB/2025/892",
    "period": "2 Years (Active until 15-Nov-2027)",
    "reason": "Submission of fabricated experience credentials in defense procurement",
    "gfr_rule": "Mandatory disqualification under GFR Rule 151",
}]

_SUFFIXES = {"PVT", "PRIVATE", "LTD", "LIMITED", "LLP", "INC", "CO", "COMPANY", "THE", "M", "S"}


def normalize_name(name: str) -> str:
    cleaned = re.sub(r"[^A-Z0-9 ]", " ", (name or "").upper().replace("&", " AND "))
    return " ".join(w for w in cleaned.split() if w not in _SUFFIXES)


def name_similarity(a: str, b: str) -> float:
    """0..1 similarity of two company names, ignoring punctuation and legal suffixes."""
    na, nb = normalize_name(a), normalize_name(b)
    if not na or not nb:
        return 0.0
    return SequenceMatcher(None, na, nb).ratio()


def lookup_gst(gstin: str) -> dict:
    gstin = (gstin or "").strip().upper()
    if not GSTIN_RE.fullmatch(gstin):
        return {"gstin": gstin, "status": "INVALID_FORMAT", "legal_name": None, "state": None,
                "taxpayer_type": None, "filing_status": "Not a valid GSTIN", "flag": "INVALID",
                "checksum_ok": False, "registry_hit": False}
    state_code = gstin[:2]
    record = _GST_REGISTRY.get(gstin)
    status = record["status"] if record else "ACTIVE"
    return {
        "gstin": gstin, "status": status,
        "legal_name": record["legal_name"] if record else None,
        "state": f"{GST_STATE_CODES.get(state_code, 'Unknown')} ({state_code})",
        "taxpayer_type": "Regular",
        "filing_status": record["filing_status"] if record else "Not in simulated registry (treated as active)",
        "flag": "COMPLIANT" if status == "ACTIVE" else "HIGH_RISK_DEFAULTER",
        "checksum_ok": gstin_checksum_ok(gstin), "registry_hit": record is not None,
    }


def lookup_pan(pan: str) -> dict:
    pan = (pan or "").strip().upper()
    if not PAN_RE.fullmatch(pan):
        return {"pan": pan, "status": "INVALID", "entity_name": None, "entity_type": None,
                "aadhaar_seeded": False, "itd_verification": "Invalid PAN format", "registry_hit": False}
    name = _PAN_REGISTRY.get(pan)
    return {"pan": pan, "status": "VALID", "entity_name": name,
            "entity_type": "Company", "aadhaar_seeded": True,
            "itd_verification": "Active & In Good Standing" if name else "Format valid; not in simulated registry",
            "registry_hit": name is not None}


def check_debarment(company_name: str, pan: str = "") -> dict:
    pan = (pan or "").strip().upper()
    for entry in _DEBARMENT_LIST:
        if (pan and pan == entry["pan"]) or name_similarity(company_name, entry["name"]) >= 0.85:
            return {"company_name": company_name, "status": "DEBARRED_MATCH_FOUND", "severity": "CRITICAL",
                    "ministry": entry["ministry"], "order_number": entry["order_number"],
                    "period": entry["period"], "reason": entry["reason"], "gfr_rule": entry["gfr_rule"]}
    return {"company_name": company_name, "status": "NO_DEBARMENT_RECORD", "severity": "CLEAR",
            "ministry": "All Central Ministries & CPSUs", "records_checked": len(_DEBARMENT_LIST),
            "gfr_rule": "Clear for participation under GFR 2017"}
