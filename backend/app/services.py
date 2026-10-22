"""Business logic. Every function returns plain dictionaries shaped exactly like the frontend expects."""
import json
import random
import re
import smtplib
import time
import uuid
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path

from . import adapters, config, db, extraction, rules, security
from .db import connect, loads, now_iso, row, rows
from .extraction import PAN_RE, GSTIN_RE


class ServiceError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status, self.message = status, message


def _num(x):
    """JSON-friendly number: 10.0 -> 10, 7.5 -> 7.5"""
    if x is None:
        return None
    return int(x) if float(x).is_integer() else round(float(x), 2)


# =========================================================================================
# Authentication
# =========================================================================================
_login_failures = {}  # username -> (count, locked_until)


def _public_user(u: dict) -> dict:
    return {"id": u["id"], "username": u["username"], "full_name": u["full_name"], "role": u["role"],
            "department": u["department"], "email": u["email"], "phone": u["phone"], "is_active": bool(u["is_active"])}


def _session(u: dict) -> dict:
    return {"access_token": security.create_token(u), "token_type": "bearer", "user": _public_user(u)}


def _find_user(conn, username=None, email=None):
    if username:
        u = row(conn, "SELECT * FROM users WHERE username=? OR lower(email)=lower(?)", (username, username))
        if u:
            return u
    if email:
        return row(conn, "SELECT * FROM users WHERE lower(email)=lower(?)", (email,))
    return None


def user_from_token(token: str) -> dict:
    import jwt
    try:
        payload = security.decode_token(token)
    except jwt.InvalidTokenError:
        raise ServiceError(401, "Session expired or invalid. Please sign in again.")
    with connect() as conn:
        u = row(conn, "SELECT * FROM users WHERE id=? AND is_active=1", (int(payload["sub"]),))
    if not u:
        raise ServiceError(401, "Account not found or disabled.")
    # Verify token role matches database user role
    token_role = payload.get("role")
    if token_role and token_role != u["role"]:
        raise ServiceError(403, "Access denied: Token role does not match user account.")
    return u


def login(username: str, password: str, ip: str = "unknown") -> dict:
    count, locked_until = _login_failures.get(username, (0, 0))
    if locked_until > time.time():
        raise ServiceError(429, "Too many failed attempts. Try again in a few minutes.")
    with connect() as conn:
        # Check if this identifier belongs to a vendor trying to access officer portal
        vendor_check = row(conn, "SELECT id, company_name FROM vendors WHERE email=? OR gstin=?", (username, username))
        if vendor_check:
            db.add_audit(conn, "OFFICER_ACCESS_DENIED", f"Vendor '{vendor_check['company_name']}' attempted to access Procurement Officer Portal.", "AUTH", None, username, ip_address=ip)
            conn.commit()
            raise ServiceError(403, "Access Denied: This portal is exclusively for authorized GeM Procurement Officers. Registered vendors and companies must sign in through the GeM Vendor Portal.")

        u = row(conn, "SELECT * FROM users WHERE username=? AND is_active=1", (username,))
        if not u or not security.verify_password(password, u["password_hash"]):
            count += 1
            lock = time.time() + config.LOGIN_LOCK_SECONDS if count >= config.LOGIN_MAX_FAILURES else 0
            _login_failures[username] = (0 if lock else count, lock)
            db.add_audit(conn, "LOGIN_FAILED", f"Failed sign-in attempt for '{username}'.", "AUTH", None, username, ip_address=ip)
            conn.commit()
            raise ServiceError(401, "Invalid username or password.")

        # Ensure user role is an authorized officer role
        ALLOWED_OFFICER_ROLES = {"Procurement Officer", "Evaluation Cell Lead", "Vigilance Officer", "admin", "Super Admin"}
        if u.get("role") not in ALLOWED_OFFICER_ROLES:
            db.add_audit(conn, "OFFICER_ACCESS_DENIED", f"User '{u['username']}' with non-officer role '{u.get('role')}' denied access.", "AUTH", None, username, ip_address=ip)
            conn.commit()
            raise ServiceError(403, "Access Denied: Account lacks required Procurement Officer privileges.")

        _login_failures.pop(username, None)
        db.add_audit(conn, "OFFICER_LOGIN", f"Officer '{u['full_name']}' authenticated via GeM console.", "AUTH",
                     None, u["full_name"], ip_address=ip)
        return _session(u)


def _send_mail(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = config.SMTP_FROM, to, subject
    msg.set_content(body)
    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=20) as smtp:
        smtp.starttls()
        if config.SMTP_USER:
            smtp.login(config.SMTP_USER, config.SMTP_PASSWORD)
        smtp.send_message(msg)


def send_otp(username=None, email=None) -> dict:
    with connect() as conn:
        u = _find_user(conn, username, email)
        target = (u["email"] if u else None) or email or ""
        masked = security.mask_email(target) if target else "your registered e-mail"
        generic = {"success": True, "message": f"If the account exists, an OTP was sent to {masked}",
                   "masked_email": masked, "email_masked": masked}
        if not u:
            return generic  # do not reveal whether the account exists
        otp = security.generate_otp()
        conn.execute("INSERT OR REPLACE INTO otps (key,otp_hash,email,expires_at,attempts) VALUES (?,?,?,?,0)",
                     (u["username"], security.hash_otp(otp), u["email"], time.time() + config.OTP_TTL_SECONDS))
        db.add_audit(conn, "OTP_REQUESTED", f"OTP requested for '{u['username']}'.", "AUTH", None, u["full_name"])
    body = (f"Your One-Time Password for GeM BidVerify AI is: {otp}\n\n"
            f"It is valid for {config.OTP_TTL_SECONDS // 60} minutes. If you did not request it, ignore this e-mail.")
    if config.SMTP_HOST and u["email"]:
        try:
            _send_mail(u["email"], "[GeM BidVerify AI] Your one-time password", body)
        except Exception as exc:  # network / credentials problem
            raise ServiceError(502, f"Could not send the OTP e-mail: {exc}")
    else:
        print(f"[GeM 2FA] OTP for {u['username']}: {otp}  (no SMTP configured - shown here for local demo)")
    result = dict(generic)
    if config.SHOW_OTP_IN_RESPONSE:
        result["otp"] = otp
    return result


def _check_otp(conn, u: dict, otp: str):
    rec = row(conn, "SELECT * FROM otps WHERE key=?", (u["username"],))
    if not rec:
        raise ServiceError(400, "No active OTP found. Please request a new OTP.")
    if time.time() > rec["expires_at"]:
        conn.execute("DELETE FROM otps WHERE key=?", (u["username"],))
        raise ServiceError(400, "OTP has expired. Please request a new one.")
    if security.hash_otp(str(otp or "")) != rec["otp_hash"]:
        attempts = rec["attempts"] + 1
        if attempts >= config.OTP_MAX_ATTEMPTS:
            conn.execute("DELETE FROM otps WHERE key=?", (u["username"],))
            conn.commit()
            raise ServiceError(400, "Too many failed attempts. Please request a new OTP.")
        conn.execute("UPDATE otps SET attempts=? WHERE key=?", (attempts, u["username"]))
        conn.commit()
        raise ServiceError(400, "Invalid OTP code. Please check and try again.")
    conn.execute("DELETE FROM otps WHERE key=?", (u["username"],))


def verify_otp(username=None, email=None, otp=None) -> dict:
    with connect() as conn:
        u = _find_user(conn, username, email)
        if not u:
            raise ServiceError(400, "No active OTP found. Please request a new OTP.")
        _check_otp(conn, u, otp)
        db.add_audit(conn, "2FA_VERIFIED", f"2FA OTP verified for '{u['full_name']}'.", "AUTH", None, u["full_name"])
        return _session(u)


def reset_password(username=None, email=None, otp=None, new_password="") -> dict:
    if len(new_password or "") < config.MIN_PASSWORD_LENGTH:
        raise ServiceError(422, f"Password must be at least {config.MIN_PASSWORD_LENGTH} characters.")
    with connect() as conn:
        u = _find_user(conn, username, email)
        if not u:
            raise ServiceError(400, "No active OTP found. Please request a new OTP.")
        _check_otp(conn, u, otp)
        conn.execute("UPDATE users SET password_hash=? WHERE id=?", (security.hash_password(new_password), u["id"]))
        db.add_audit(conn, "PASSWORD_RESET", f"Password reset for user '{u['username']}'.", "AUTH", None, u["full_name"])
    return {"success": True, "message": "Password has been successfully updated. Please sign in with your new password."}


def register(data: dict, authorized_by: dict = None) -> dict:
    # Public self-registration of Procurement Officer accounts is prohibited under GFR 2017
    if not authorized_by or authorized_by.get("role") not in {"Procurement Officer", "Evaluation Cell Lead", "admin", "Super Admin"}:
        raise ServiceError(
            403,
            "Public registration of Procurement Officer accounts is restricted under GFR 2017 Rule 149. "
            "Officer profiles must be pre-authorized and provisioned by the GeM Competent Authority. "
            "For evaluation and demonstration, please use authorized officer demo credentials (officer / demo123)."
        )
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,32}", username):
        raise ServiceError(422, "Username must be 3-32 characters (letters, digits, . _ -).")
    if "@" not in email:
        raise ServiceError(422, "A valid e-mail address is required.")
    if len(data.get("password") or "") < config.MIN_PASSWORD_LENGTH:
        raise ServiceError(422, f"Password must be at least {config.MIN_PASSWORD_LENGTH} characters.")
    with connect() as conn:
        if row(conn, "SELECT id FROM users WHERE lower(username)=lower(?) OR lower(email)=lower(?)", (username, email)):
            raise ServiceError(409, "An account with this username or e-mail already exists.")
        cur = conn.execute(
            "INSERT INTO users (username,full_name,role,department,email,phone,password_hash,is_active) VALUES (?,?,?,?,?,?,?,1)",
            (username, (data.get("full_name") or username).strip(), "Procurement Officer",
             data.get("department") or "Department of Electronics & IT (GeM Evaluation Cell)", email,
             data.get("phone") or "", security.hash_password(data["password"])))
        u = row(conn, "SELECT * FROM users WHERE id=?", (cur.lastrowid,))
        db.add_audit(conn, "ACCOUNT_CREATED", f"New officer account created for '{u['full_name']}' ({username}) by '{authorized_by['full_name']}'.", "AUTH", None, authorized_by["full_name"])
        return _session(u)


# =========================================================================================
# Tenders and bidders
# =========================================================================================
def _requirement(r: dict) -> dict:
    return {"id": r["id"], "requirement_code": r["requirement_code"], "requirement_name": r["requirement_name"],
            "is_mandatory": bool(r["is_mandatory"]), "verification_source": r["verification_source"],
            "min_condition": r["min_condition"], "weight": _num(r["weight"]),
            "applicable_bidder_type": r["applicable_bidder_type"] or "ALL"}


def _tender(conn, t: dict) -> dict:
    reqs = rows(conn, "SELECT * FROM requirements WHERE tender_pk=? ORDER BY id", (t["id"],))
    count = row(conn, "SELECT COUNT(*) AS n FROM bids WHERE tender_pk=?", (t["id"],))["n"]
    return {"id": t["id"], "tender_id": t["tender_id"], "title": t["title"], "department": t["department"],
            "tender_value": _num(t["tender_value"]), "deadline": t["deadline"], "status": t["status"],
            "description": t["description"] or "", "created_at": t["created_at"], "bids_count": count,
            "requirements": [_requirement(r) for r in reqs]}


def list_tenders() -> list:
    with connect() as conn:
        return [_tender(conn, t) for t in rows(conn, "SELECT * FROM tenders ORDER BY id DESC")]


def get_tender(ref) -> dict:
    with connect() as conn:
        t = row(conn, "SELECT * FROM tenders WHERE id=? OR tender_id=?", (_as_int(ref), str(ref)))
        if not t:
            raise ServiceError(404, "Tender not found")
        return _tender(conn, t)


def _as_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return -1


def _insert_requirement(conn, tender_pk, r: dict):
    conn.execute(
        "INSERT INTO requirements (tender_pk,requirement_code,requirement_name,is_mandatory,verification_source,min_condition,weight,applicable_bidder_type) VALUES (?,?,?,?,?,?,?,?)",
        (tender_pk, r["requirement_code"], r["requirement_name"], 1 if r.get("is_mandatory", True) else 0,
         r.get("verification_source") or "PORTAL_CROSS_CHECK", r.get("min_condition") or "Standard GFR Rule 149 condition",
         float(r.get("weight") or 10), r.get("applicable_bidder_type") or "ALL"))


def create_tender(data: dict, user: dict) -> dict:
    title = (data.get("title") or "").strip()
    if not title:
        raise ServiceError(422, "Tender title is required.")
    with connect() as conn:
        code = (data.get("tender_id") or "").strip() or f"GEM/{datetime.now().year}/B/{random.randint(10000, 99999)}"
        if row(conn, "SELECT id FROM tenders WHERE tender_id=?", (code,)):
            raise ServiceError(409, f"Tender ID {code} already exists.")
        deadline = data.get("deadline") or (datetime.now() + timedelta(days=14)).date().isoformat()
        cur = conn.execute(
            "INSERT INTO tenders (tender_id,title,department,tender_value,deadline,status,description,created_at) VALUES (?,?,?,?,?,?,?,?)",
            (code, title, data.get("department") or "", float(data.get("tender_value") or 5_000_000), deadline,
             "ACTIVE", data.get("description") or "", now_iso()))
        for r in data.get("requirements") or []:
            _insert_requirement(conn, cur.lastrowid, r)
        db.add_audit(conn, "TENDER_PUBLISHED", f"New Tender '{code}' published: {title}", "TENDER", None, user["full_name"])
        return _tender(conn, row(conn, "SELECT * FROM tenders WHERE id=?", (cur.lastrowid,)))


def add_requirement(tender_pk: int, data: dict, user: dict) -> dict:
    with connect() as conn:
        if not row(conn, "SELECT id FROM tenders WHERE id=?", (tender_pk,)):
            raise ServiceError(404, "Tender not found")
        _insert_requirement(conn, tender_pk, data)
        db.add_audit(conn, "REQUIREMENT_ADDED", f"Requirement {data.get('requirement_code')} added to tender {tender_pk}.",
                     "TENDER", None, user["full_name"])
    return {"success": True}


def _bidder(b: dict) -> dict:
    return {"id": b["id"], "company_name": b["company_name"], "cin": b["cin"] or None, "pan": b["pan"],
            "gstin": b["gstin"] or None, "registered_address": b["registered_address"] or None,
            "contact_email": b["contact_email"] or None, "contact_phone": b["contact_phone"] or None,
            "is_msme": bool(b["is_msme"]), "msme_reg_no": b["msme_reg_no"] or None,
            "is_startup": bool(b["is_startup"]), "startup_dipp_no": b["startup_dipp_no"] or None}


def list_bidders() -> list:
    with connect() as conn:
        return [_bidder(b) for b in rows(conn, "SELECT * FROM bidders ORDER BY id DESC")]


def create_bidder(data: dict, user: dict) -> dict:
    name = (data.get("company_name") or "").strip()
    pan = (data.get("pan") or "").strip().upper()
    gstin = (data.get("gstin") or "").strip().upper()
    if not name:
        raise ServiceError(422, "Company name is required.")
    if pan and not PAN_RE.fullmatch(pan):
        raise ServiceError(422, "PAN must look like ABCDE1234F.")
    if gstin and not GSTIN_RE.fullmatch(gstin):
        raise ServiceError(422, "GSTIN must be a valid 15-character GSTIN.")
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO bidders (company_name,cin,pan,gstin,registered_address,contact_email,contact_phone,is_msme,msme_reg_no,is_startup,startup_dipp_no) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (name, data.get("cin") or None, pan, gstin or None, data.get("registered_address") or None,
             data.get("contact_email") or None, data.get("contact_phone") or None, 1 if data.get("is_msme") else 0,
             data.get("msme_reg_no") or None, 1 if data.get("is_startup") else 0, data.get("startup_dipp_no") or None))
        db.add_audit(conn, "BIDDER_REGISTERED", f"Bidder '{name}' registered with PAN {pan}", "BIDDER", None, user["full_name"])
        return _bidder(row(conn, "SELECT * FROM bidders WHERE id=?", (cur.lastrowid,)))


# =========================================================================================
# Bids
# =========================================================================================
def _date_in(iso: str) -> str:
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except (ValueError, AttributeError):
        return ""


def _document(d: dict) -> dict:
    fields = loads(d["extracted_fields"], [])
    for i, f in enumerate(fields):
        f.setdefault("id", d["id"] * 1000 + i)
    return {"id": d["id"], "bid_id": d["bid_pk"], "file_name": d["file_name"], "file_type": d["file_type"],
            "file_size_kb": d["file_size_kb"], "classified_type": d["classified_type"],
            "classification_confidence": d["classification_confidence"], "ocr_status": d["ocr_status"],
            "created_at": d["created_at"], "extracted_fields": fields, "has_file": bool(d["stored_path"])}


def _result(r: dict) -> dict:
    return {"id": r["id"], "requirement_code": r["requirement_code"], "requirement_name": r["requirement_name"],
            "status": r["status"], "points_awarded": _num(r["points_awarded"]), "max_points": _num(r["max_points"]),
            "evidence_document": r["evidence_document"], "confidence_score": r["confidence_score"],
            "rule_applied": r["rule_applied"], "explanation": r["explanation"], "officer_override": bool(r["officer_override"])}


def _bid_full(conn, b: dict) -> dict:
    tender_row = row(conn, "SELECT * FROM tenders WHERE id=?", (b["tender_pk"],)) if b.get("tender_pk") else None
    if not tender_row and b.get("tender_id"):
        tender_row = row(conn, "SELECT * FROM tenders WHERE tender_id=?", (str(b["tender_id"]),))
    tender = _tender(conn, tender_row) if tender_row else {
        "id": b.get("tender_pk") or 0, "tender_id": str(b.get("tender_id") or "N/A"), "title": "Active Procurement Tender",
        "department": "Government e-Marketplace", "tender_value": 0, "deadline": "", "status": "ACTIVE",
        "description": "", "created_at": b.get("submission_date") or "", "bids_count": 1, "requirements": []
    }

    bidder_row = row(conn, "SELECT * FROM bidders WHERE id=?", (b["bidder_pk"],)) if b.get("bidder_pk") else None
    bidder = _bidder(bidder_row) if bidder_row else {
        "id": b.get("bidder_pk") or 0, "company_name": str(b.get("vendor_name") or "Registered Vendor"), "cin": None,
        "pan": str((b.get("gstin") or "")[2:12]), "gstin": b.get("gstin"), "registered_address": None,
        "contact_email": None, "contact_phone": None, "is_msme": False, "msme_reg_no": None,
        "is_startup": False, "startup_dipp_no": None
    }
    docs = [_document(d) for d in rows(conn, "SELECT * FROM documents WHERE bid_pk=? ORDER BY id", (b["id"],))]
    results = [_result(r) for r in rows(conn, "SELECT * FROM compliance_results WHERE bid_pk=? ORDER BY id", (b["id"],))]
    decision = row(conn, "SELECT * FROM decisions WHERE bid_pk=?", (b["id"],))
    return {
        "id": b["id"], "bid_id": b["bid_id"] or f"BID-V-{b['id']}", "tender_id": b.get("tender_pk") or (tender_row["id"] if tender_row else 1), "bidder_id": b.get("bidder_pk") or (bidder_row["id"] if bidder_row else 1),
        "submission_date": b["submission_date"], "status": b["status"], "compliance_score": b["compliance_score"] or 0,
        "risk_level": b["risk_level"] or "LOW", "ai_recommendation": b["ai_recommendation"] or "PENDING_VERIFICATION", "ai_explanation": b["ai_explanation"] or "Bid submitted via Vendor Portal. Awaiting AI Document Verification.",
        "bidder": bidder, "tender": tender, "documents": docs, "compliance_results": results,
        "risk_assessment": {"id": b["id"], "risk_level": b["risk_level"] or "LOW", "risk_score": b["risk_score"] or 0,
                            "risk_factors": loads(b["risk_factors"], []), "recommendation": b["ai_recommendation"] or "PENDING_VERIFICATION",
                            "recommended_action": b["recommended_action"] or "Proceed with compliance document verification."},
        "officer_decision": ({"id": decision["id"], "officer_name": decision["officer_name"], "decision": decision["decision"],
                              "comments": decision["comments"], "clarification_details": decision["clarification_details"],
                              "decided_at": decision["decided_at"]} if decision else None),
    }



def _bid_row(conn, ref):
    b = row(conn, "SELECT * FROM bids WHERE id=? OR bid_id=?", (_as_int(ref), str(ref)))
    if not b:
        raise ServiceError(404, "Bid not found")
    return b


def get_bid(ref) -> dict:
    with connect() as conn:
        return _bid_full(conn, _bid_row(conn, ref))


def _bid_summary_rows(conn, where="", params=()):
    out = []
    for b in rows(conn, f"SELECT * FROM bids {where} ORDER BY id DESC", params):
        tender = row(conn, "SELECT tender_id FROM tenders WHERE id=?", (b["tender_pk"],)) if b.get("tender_pk") else None
        tender_code = tender["tender_id"] if tender else str(b.get("tender_id") or "N/A")
        bidder = row(conn, "SELECT company_name, pan FROM bidders WHERE id=?", (b["bidder_pk"],)) if b.get("bidder_pk") else None
        bidder_name = bidder["company_name"] if bidder else str(b.get("vendor_name") or "Unknown Vendor")
        bidder_pan = bidder["pan"] if bidder else str((b.get("gstin") or "")[2:12])
        docs = row(conn, "SELECT COUNT(*) AS n FROM documents WHERE bid_pk=?", (b["id"],))["n"]
        last = row(conn, "SELECT evaluated_at FROM evaluations WHERE bid_pk=? ORDER BY id DESC LIMIT 1", (b["id"],))
        out.append({"id": b["id"], "bid_id": b["bid_id"] or f"BID-V-{b['id']}", "tender_id": tender_code, "bidder_name": bidder_name,
                    "bidder_pan": bidder_pan, "documents_count": docs, "compliance_score": b["compliance_score"] or 0,
                    "risk_level": b["risk_level"] or "LOW", "status": b["status"],
                    "last_verified": _date_in(last["evaluated_at"] if last else b.get("submission_date") or "")})
    return out



def list_bids(tender_pk=None) -> list:
    with connect() as conn:
        if tender_pk:
            return _bid_summary_rows(conn, "WHERE tender_pk=?", (int(tender_pk),))
        return _bid_summary_rows(conn)


_DECISION_STATUS = {"APPROVED": "APPROVED", "REJECTED": "REJECTED", "REQUIRES_CLARIFICATION": "REQUIRES_CLARIFICATION"}


def _reevaluate(conn, bid_pk: int, user_name: str = "AI Rule Engine"):
    """Run the rule engine for a bid, keep the officer's manual overrides, and store the outcome."""
    b = row(conn, "SELECT * FROM bids WHERE id=?", (bid_pk,))
    bidder = _bidder(row(conn, "SELECT * FROM bidders WHERE id=?", (b["bidder_pk"],)))
    reqs = [_requirement(r) for r in rows(conn, "SELECT * FROM requirements WHERE tender_pk=?", (b["tender_pk"],))]
    docs = [_document(d) for d in rows(conn, "SELECT * FROM documents WHERE bid_pk=?", (bid_pk,))]

    if not docs:
        summary = rules.awaiting_documents(bidder, reqs)
        conn.execute("DELETE FROM compliance_results WHERE bid_pk=? AND officer_override=0", (bid_pk,))
        merged_ocr = []
    else:
        overrides = {r["requirement_code"]: r for r in
                     rows(conn, "SELECT * FROM compliance_results WHERE bid_pk=? AND officer_override=1", (bid_pk,))}
        fresh = rules.evaluate_requirements(bidder, reqs, docs)
        conn.execute("DELETE FROM compliance_results WHERE bid_pk=?", (bid_pk,))
        final = []
        for r in fresh:
            kept = overrides.get(r["requirement_code"])
            if kept:
                r = {**r, "status": kept["status"], "points_awarded": kept["points_awarded"],
                     "explanation": kept["explanation"], "rule_applied": kept["rule_applied"]}
            final.append(r)
            conn.execute(
                "INSERT INTO compliance_results (bid_pk,requirement_code,requirement_name,status,points_awarded,max_points,evidence_document,confidence_score,rule_applied,explanation,flags,is_mandatory,officer_override) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (bid_pk, r["requirement_code"], r["requirement_name"], r["status"], r["points_awarded"], r["max_points"],
                 r["evidence_document"], r["confidence_score"], r["rule_applied"], r["explanation"], json.dumps(r["flags"]),
                 1 if r["is_mandatory"] else 0, 1 if kept else 0))
        merged_ocr = [d["classification_confidence"] for d in docs]
        summary = rules.summarize(final, len(docs), merged_ocr)

    decision = row(conn, "SELECT decision FROM decisions WHERE bid_pk=?", (bid_pk,))
    status = _DECISION_STATUS[decision["decision"]] if decision else summary["status"]
    _store_summary(conn, bid_pk, summary, status)
    db.add_audit(conn, "BID_COMPLIANCE_EVALUATION",
                 f"Automated evaluation completed for {b['bid_id']}. Compliance Score: {summary['compliance_score']}/100, "
                 f"Risk Level: {summary['risk_level']}.", "BID", bid_pk, user_name, "GFR_2017_RULE_149")
    return summary


def _store_summary(conn, bid_pk, summary, status):
    conn.execute(
        "UPDATE bids SET status=?, compliance_score=?, risk_level=?, ai_recommendation=?, ai_explanation=?, risk_score=?, risk_factors=?, recommended_action=? WHERE id=?",
        (status, summary["compliance_score"], summary["risk_level"], summary["ai_recommendation"], summary["ai_explanation"],
         summary["risk_score"], json.dumps(summary["risk_factors"]), summary["recommended_action"], bid_pk))
    conn.execute("INSERT INTO evaluations (bid_pk,evaluated_at,score,risk_level,recommendation) VALUES (?,?,?,?,?)",
                 (bid_pk, now_iso(), summary["compliance_score"], summary["risk_level"], summary["ai_recommendation"]))


def create_bid(tender_pk, bidder_pk, user: dict) -> dict:
    with connect() as conn:
        t = row(conn, "SELECT * FROM tenders WHERE id=?", (_as_int(tender_pk),))
        bidder = row(conn, "SELECT * FROM bidders WHERE id=?", (_as_int(bidder_pk),))
        if not t:
            raise ServiceError(404, "Tender not found")
        if not bidder:
            raise ServiceError(404, "Bidder not found")
        if row(conn, "SELECT id FROM bids WHERE tender_pk=? AND bidder_pk=?", (t["id"], bidder["id"])):
            raise ServiceError(409, f"{bidder['company_name']} already has a bid on {t['tender_id']}.")
        number = (t["tender_id"].split("/") + ["", "", "", "00000"])[3] or "00000"
        prefix = re.sub(r"[^A-Z]", "", bidder["company_name"].upper())[:3].ljust(3, "X")
        seq = row(conn, "SELECT COUNT(*) AS n FROM bids WHERE tender_pk=?", (t["id"],))["n"] + 1
        bid_code = f"BID/{number}/{prefix}-{seq:02d}"
        while row(conn, "SELECT id FROM bids WHERE bid_id=?", (bid_code,)):
            seq += 1
            bid_code = f"BID/{number}/{prefix}-{seq:02d}"
        cur = conn.execute(
            "INSERT INTO bids (bid_id,tender_pk,bidder_pk,submission_date,status) VALUES (?,?,?,?,'UNDER_VERIFICATION')",
            (bid_code, t["id"], bidder["id"], now_iso()))
        db.add_audit(conn, "CREATE_BID_SUBMISSION",
                     f"Registered new bid '{bid_code}' for '{bidder['company_name']}' under tender '{t['tender_id']}'.",
                     "BID", cur.lastrowid, user["full_name"])
        _reevaluate(conn, cur.lastrowid)
        conn.execute("INSERT INTO notifications (title,message,category,is_read,link,created_at) VALUES (?,?,?,?,?,?)",
                     ("New Bid Received", f"Bidder '{bidder['company_name']}' submitted bid for {t['tender_id']}",
                      "INFO", 0, f"/bids/{cur.lastrowid}", now_iso()))
        return _bid_full(conn, row(conn, "SELECT * FROM bids WHERE id=?", (cur.lastrowid,)))


def upload_document(bid_ref, filename: str, content: bytes, type_hint, user: dict) -> dict:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in config.ALLOWED_EXTENSIONS:
        raise ServiceError(415, f"File type '{suffix or 'unknown'}' is not supported. Allowed: {', '.join(sorted(config.ALLOWED_EXTENSIONS))}")
    if not content:
        raise ServiceError(422, "The uploaded file is empty.")
    if len(content) > config.MAX_UPLOAD_MB * 1024 * 1024:
        raise ServiceError(413, f"File is larger than {config.MAX_UPLOAD_MB} MB.")
    with connect() as conn:
        b = _bid_row(conn, bid_ref)
        folder = config.UPLOAD_DIR / str(b["id"])
        folder.mkdir(parents=True, exist_ok=True)
        stored = folder / f"{uuid.uuid4().hex}{suffix}"
        stored.write_bytes(content)
        analysis = extraction.analyze_document(stored, filename, type_hint)
        clean_name = re.sub(r"[^\w.\- ]", "_", Path(filename).name)[:120]
        cur = conn.execute(
            "INSERT INTO documents (bid_pk,file_name,file_type,file_size_kb,stored_path,classified_type,classification_confidence,ocr_status,extracted_fields,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (b["id"], clean_name, suffix.lstrip("."), max(1, round(len(content) / 1024)), str(stored),
             analysis["classified_type"], analysis["classification_confidence"], analysis["ocr_status"],
             json.dumps(analysis["extracted_fields"]), now_iso()))
        db.add_audit(conn, "DOCUMENT_UPLOADED",
                     f"Uploaded document '{clean_name}' classified as {analysis['classified_type']} for bid {b['bid_id']}",
                     "DOCUMENT", b["id"], user["full_name"])
        _reevaluate(conn, b["id"])
        return _document(row(conn, "SELECT * FROM documents WHERE id=?", (cur.lastrowid,)))


def delete_document(bid_ref, doc_pk, user: dict) -> dict:
    with connect() as conn:
        b = _bid_row(conn, bid_ref)
        d = row(conn, "SELECT * FROM documents WHERE id=? AND bid_pk=?", (_as_int(doc_pk), b["id"]))
        if not d:
            raise ServiceError(404, "Document not found")
        conn.execute("DELETE FROM documents WHERE id=?", (d["id"],))
        if d["stored_path"]:
            Path(d["stored_path"]).unlink(missing_ok=True)
        db.add_audit(conn, "DOCUMENT_DELETED", f"Deleted document '{d['file_name']}' from bid {b['bid_id']}",
                     "DOCUMENT", b["id"], user["full_name"])
        _reevaluate(conn, b["id"])
    return {"success": True}


def document_file(doc_pk):
    with connect() as conn:
        d = row(conn, "SELECT * FROM documents WHERE id=?", (_as_int(doc_pk),))
    if not d or not d["stored_path"] or not Path(d["stored_path"]).exists():
        raise ServiceError(404, "The original file is not available for this document.")
    return Path(d["stored_path"]), d["file_name"]


def update_compliance_result(bid_ref, result_pk, data: dict, user: dict) -> dict:
    status = data.get("status")
    if status not in ("VERIFIED", "MISMATCH", "NON_COMPLIANT"):
        raise ServiceError(422, "Status must be VERIFIED, MISMATCH or NON_COMPLIANT.")
    with connect() as conn:
        b = _bid_row(conn, bid_ref)
        r = row(conn, "SELECT * FROM compliance_results WHERE id=? AND bid_pk=?", (_as_int(result_pk), b["id"]))
        if not r:
            raise ServiceError(404, "Compliance result not found")
        points = max(0.0, min(float(data.get("points_awarded") or 0), float(r["max_points"] or 0)))
        explanation = data.get("explanation") or r["explanation"]
        conn.execute("UPDATE compliance_results SET points_awarded=?, status=?, explanation=?, officer_override=1 WHERE id=?",
                     (points, status, explanation, r["id"]))
        results = []
        for x in rows(conn, "SELECT * FROM compliance_results WHERE bid_pk=?", (b["id"],)):
            x["flags"] = loads(x["flags"], [])
            x["is_mandatory"] = bool(x["is_mandatory"])
            results.append(x)
        docs = row(conn, "SELECT COUNT(*) AS n FROM documents WHERE bid_pk=?", (b["id"],))["n"]
        summary = rules.summarize(results, docs)
        decision = row(conn, "SELECT decision FROM decisions WHERE bid_pk=?", (b["id"],))
        _store_summary(conn, b["id"], summary, _DECISION_STATUS[decision["decision"]] if decision else summary["status"])
        db.add_audit(conn, "HUMAN_OFFICER_VERIFICATION_EVALUATION",
                     f"Officer adjusted score for '{r['requirement_name']}' to {_num(points)}/{_num(r['max_points'])} pts. "
                     f"Total score updated to {summary['compliance_score']}/100.", "COMPLIANCE", b["id"], user["full_name"])
        return {"success": True, "compliance_score": summary["compliance_score"]}


def verify_bid(bid_ref, user: dict) -> dict:
    with connect() as conn:
        b = _bid_row(conn, bid_ref)
        _reevaluate(conn, b["id"], user["full_name"])
        return _bid_full(conn, row(conn, "SELECT * FROM bids WHERE id=?", (b["id"],)))


def submit_decision(bid_ref, data: dict, user: dict) -> dict:
    decision = data.get("decision")
    if decision not in _DECISION_STATUS:
        raise ServiceError(422, "Decision must be APPROVED, REJECTED or REQUIRES_CLARIFICATION.")
    with connect() as conn:
        b = _bid_row(conn, bid_ref)
        conn.execute("DELETE FROM decisions WHERE bid_pk=?", (b["id"],))
        decided_at = now_iso()
        cur = conn.execute(
            "INSERT INTO decisions (bid_pk,officer_name,decision,comments,clarification_details,decided_at) VALUES (?,?,?,?,?,?)",
            (b["id"], user["full_name"], decision, data.get("comments") or "", data.get("clarification_details"), decided_at))
        conn.execute("UPDATE bids SET status=? WHERE id=?", (_DECISION_STATUS[decision], b["id"]))
        db.add_audit(conn, f"OFFICER_DECISION_{decision}",
                     f"Officer signed decision '{decision}' for bid {b['bid_id']}. Remarks: {data.get('comments') or ''}",
                     "DECISION", b["id"], user["full_name"])
        return {"success": True, "officer_decision": {
            "id": cur.lastrowid, "officer_name": user["full_name"], "decision": decision, "comments": data.get("comments") or "",
            "clarification_details": data.get("clarification_details"), "decided_at": decided_at}}


# =========================================================================================
# Dashboard, integrations, audit, notifications, admin
# =========================================================================================
def dashboard() -> dict:
    with connect() as conn:
        bids = rows(conn, "SELECT * FROM bids")
        tenders = rows(conn, "SELECT status FROM tenders")
        by = lambda f: sum(1 for b in bids if f(b))
        today = datetime.now(timezone.utc).date()
        activity = []
        for offset in range(5, -1, -1):
            day = today - timedelta(days=offset)
            evals = [e for e in rows(conn, "SELECT evaluated_at, risk_level, recommendation FROM evaluations")
                     if e["evaluated_at"][:10] == day.isoformat()]
            activity.append({"date": "Today" if offset == 0 else day.strftime("%d %b"),
                             "verified": sum(1 for e in evals if e["recommendation"] == "QUALIFIED_WITH_HIGH_CONFIDENCE"),
                             "flagged": sum(1 for e in evals if e["risk_level"] in ("HIGH", "CRITICAL"))})
        recent = [{k: v for k, v in s.items() if k != "bidder_pan"} for s in _bid_summary_rows(conn)]
        return {
            "total_tenders": len(tenders), "active_tenders": sum(1 for t in tenders if t["status"] == "ACTIVE"),
            "bids_under_verification": by(lambda b: b["status"] in ("UNDER_VERIFICATION", "PENDING_REVIEW", "Pending AI Verification", "PENDING_AI_VERIFICATION")),

            "verified_bids": by(lambda b: b["status"] in ("VERIFIED", "APPROVED")),
            "high_risk_bids": by(lambda b: b["risk_level"] in ("HIGH", "CRITICAL")),
            "pending_reviews": by(lambda b: b["status"] == "PENDING_REVIEW" or b["risk_level"] == "MEDIUM"),
            "compliance_overview": {"Compliant": by(lambda b: b["compliance_score"] >= 80),
                                    "Review Required": by(lambda b: 60 <= b["compliance_score"] < 80),
                                    "Non-Compliant": by(lambda b: b["compliance_score"] < 60)},
            "risk_distribution": {lvl.capitalize(): by(lambda b, l=lvl: b["risk_level"] == l)
                                  for lvl in ("LOW", "MEDIUM", "HIGH", "CRITICAL")},
            "verification_activity": activity, "recent_bids": recent,
        }


def integrations_status() -> dict:
    with connect() as conn:
        connectors = rows(conn, "SELECT * FROM connectors ORDER BY rowid")
    return {"connectors": connectors,
            "disclaimer": "All statutory connectors currently run in SIMULATION mode with demo registry data. "
                          "Each adapter is isolated in backend/app/adapters.py so a real API can replace it once official access is granted."}


def audit_logs(limit: int = 500) -> list:
    with connect() as conn:
        out = rows(conn, "SELECT id,bid_id,user_name,action,entity_type,details,rule_applied,ip_address,timestamp FROM audit_logs ORDER BY id DESC LIMIT ?", (limit,))
    return out


def audit_verify() -> dict:
    with connect() as conn:
        return db.verify_audit_chain(conn)


def notifications() -> list:
    with connect() as conn:
        out = rows(conn, "SELECT * FROM notifications ORDER BY id DESC")
    for n in out:
        n["is_read"] = bool(n["is_read"])
    return out


def mark_notification_read(pk) -> dict:
    with connect() as conn:
        conn.execute("UPDATE notifications SET is_read=1 WHERE id=?", (_as_int(pk),))
    return {"success": True}


def export_data() -> dict:
    with connect() as conn:
        return {"appName": "GeM BidVerify AI", "version": "2.0", "exportedAt": now_iso(),
                "tenders": [_tender(conn, t) for t in rows(conn, "SELECT * FROM tenders")],
                "bidders": [_bidder(b) for b in rows(conn, "SELECT * FROM bidders")],
                "bids": [_bid_full(conn, b) for b in rows(conn, "SELECT * FROM bids")],
                "audit_logs": rows(conn, "SELECT * FROM audit_logs ORDER BY id")}


def reset_demo(user: dict) -> dict:
    db.reset_demo_data()
    return {"success": True}
