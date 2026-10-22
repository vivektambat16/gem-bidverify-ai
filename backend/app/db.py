"""SQLite storage: schema, small helpers, hash-chained audit log, first-run demo data."""
import hashlib
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from . import config, security

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL,
  role TEXT NOT NULL, department TEXT, email TEXT, phone TEXT, password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS otps (
  key TEXT PRIMARY KEY, otp_hash TEXT NOT NULL, email TEXT, expires_at REAL NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS tenders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tender_id TEXT UNIQUE NOT NULL, title TEXT NOT NULL, department TEXT,
  tender_value REAL, deadline TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE', description TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tender_pk INTEGER NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  requirement_code TEXT NOT NULL, requirement_name TEXT NOT NULL, is_mandatory INTEGER NOT NULL DEFAULT 1,
  verification_source TEXT, min_condition TEXT, weight REAL NOT NULL DEFAULT 10, applicable_bidder_type TEXT DEFAULT 'ALL');
CREATE TABLE IF NOT EXISTS bidders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, company_name TEXT NOT NULL, cin TEXT, pan TEXT, gstin TEXT,
  registered_address TEXT, contact_email TEXT, contact_phone TEXT, is_msme INTEGER DEFAULT 0, msme_reg_no TEXT,
  is_startup INTEGER DEFAULT 0, startup_dipp_no TEXT);
CREATE TABLE IF NOT EXISTS bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT, bid_id TEXT UNIQUE NOT NULL,
  tender_pk INTEGER NOT NULL REFERENCES tenders(id), bidder_pk INTEGER NOT NULL REFERENCES bidders(id),
  submission_date TEXT NOT NULL, status TEXT NOT NULL, compliance_score INTEGER DEFAULT 0, risk_level TEXT DEFAULT 'LOW',
  ai_recommendation TEXT, ai_explanation TEXT, risk_score INTEGER DEFAULT 0, risk_factors TEXT DEFAULT '[]',
  recommended_action TEXT, tender_id TEXT, vendor_name TEXT, gstin TEXT, file_paths TEXT);
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT, company_name TEXT NOT NULL, gstin TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, pan TEXT, contact_phone TEXT,
  business_type TEXT DEFAULT 'REGULAR', address TEXT, created_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT, bid_pk INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL, file_type TEXT, file_size_kb INTEGER, stored_path TEXT, classified_type TEXT,
  classification_confidence REAL, ocr_status TEXT, extracted_fields TEXT DEFAULT '[]', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS compliance_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT, bid_pk INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  requirement_code TEXT NOT NULL, requirement_name TEXT, status TEXT NOT NULL, points_awarded REAL, max_points REAL,
  evidence_document TEXT, confidence_score REAL, rule_applied TEXT, explanation TEXT, flags TEXT DEFAULT '[]',
  is_mandatory INTEGER DEFAULT 1, officer_override INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, bid_pk INTEGER UNIQUE NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  officer_name TEXT, decision TEXT NOT NULL, comments TEXT, clarification_details TEXT, decided_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, bid_id INTEGER, user_name TEXT, action TEXT NOT NULL, entity_type TEXT,
  details TEXT, rule_applied TEXT, ip_address TEXT, timestamp TEXT NOT NULL, prev_hash TEXT, entry_hash TEXT);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, message TEXT, category TEXT, is_read INTEGER DEFAULT 0,
  link TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS connectors (
  id TEXT PRIMARY KEY, name TEXT, type TEXT, mode TEXT, status TEXT, latency_ms INTEGER, badge TEXT);
CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, bid_pk INTEGER NOT NULL, evaluated_at TEXT NOT NULL, score INTEGER,
  risk_level TEXT, recommendation TEXT);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


@contextmanager
def connect():
    conn = sqlite3.connect(config.DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def rows(conn, sql, params=()):
    return [dict(r) for r in conn.execute(sql, params).fetchall()]


def row(conn, sql, params=()):
    r = conn.execute(sql, params).fetchone()
    return dict(r) if r else None


def loads(value, default):
    try:
        return json.loads(value) if value else default
    except (TypeError, ValueError):
        return default


# ----------------------------------------------------------------------------------------
# Tamper-evident audit log: every entry stores SHA-256(previous hash + entry content).
# Changing or deleting an old row breaks the chain, which verify_audit_chain() detects.
# ----------------------------------------------------------------------------------------
def _entry_hash(prev_hash: str, entry: dict) -> str:
    payload = json.dumps(entry, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256((prev_hash + payload).encode()).hexdigest()


def add_audit(conn, action, details, entity_type="BID", bid_id=None, user_name="System",
              rule_applied=None, ip_address="127.0.0.1", timestamp=None):
    last = row(conn, "SELECT entry_hash FROM audit_logs ORDER BY id DESC LIMIT 1")
    prev = last["entry_hash"] if last and last["entry_hash"] else "GENESIS"
    entry = {"bid_id": bid_id, "user_name": user_name, "action": action, "entity_type": entity_type,
             "details": details, "rule_applied": rule_applied, "ip_address": ip_address,
             "timestamp": timestamp or now_iso()}
    conn.execute(
        "INSERT INTO audit_logs (bid_id,user_name,action,entity_type,details,rule_applied,ip_address,timestamp,prev_hash,entry_hash)"
        " VALUES (:bid_id,:user_name,:action,:entity_type,:details,:rule_applied,:ip_address,:timestamp,:prev,:h)",
        {**entry, "prev": prev, "h": _entry_hash(prev, entry)})


def verify_audit_chain(conn) -> dict:
    prev, count = "GENESIS", 0
    for r in conn.execute("SELECT * FROM audit_logs ORDER BY id"):
        r = dict(r)
        entry = {k: r[k] for k in ("bid_id", "user_name", "action", "entity_type", "details",
                                    "rule_applied", "ip_address", "timestamp")}
        if r["prev_hash"] != prev or r["entry_hash"] != _entry_hash(prev, entry):
            return {"valid": False, "entries_checked": count, "first_broken_id": r["id"]}
        prev, count = r["entry_hash"], count + 1
    return {"valid": True, "entries_checked": count, "first_broken_id": None}


# ----------------------------------------------------------------------------------------
# Schema + demo data
# ----------------------------------------------------------------------------------------
def init_db():
    with connect() as conn:
        conn.executescript(SCHEMA)
        for col in ("tender_id", "vendor_name", "gstin", "file_paths"):
            try:
                conn.execute(f"ALTER TABLE bids ADD COLUMN {col} TEXT")
            except sqlite3.OperationalError:
                pass
        if not row(conn, "SELECT id FROM users LIMIT 1"):
            seed_demo_data(conn)



def _b(v):
    return 1 if v else 0


def seed_demo_data(conn):
    """Load the demo tenders, bidders, bids and users that ship with the project."""
    seeds = json.loads((Path(__file__).parent / "seed_data" / "seeds.json").read_text(encoding="utf-8"))

    for u in seeds["seedUsers"]:
        conn.execute(
            "INSERT INTO users (id,username,full_name,role,department,email,phone,password_hash,is_active) VALUES (?,?,?,?,?,?,?,?,1)",
            (u["id"], u["username"], u["full_name"], u["role"], u["department"], config.DEMO_OFFICER_EMAIL,
             u.get("phone"), security.hash_password(u["password"])))

    for t in seeds["seedTenders"]:
        conn.execute(
            "INSERT INTO tenders (id,tender_id,title,department,tender_value,deadline,status,description,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            (t["id"], t["tender_id"], t["title"], t["department"], t["tender_value"], t["deadline"], t["status"],
             t.get("description"), t["created_at"]))
        for r in t["requirements"]:
            conn.execute(
                "INSERT INTO requirements (tender_pk,requirement_code,requirement_name,is_mandatory,verification_source,min_condition,weight,applicable_bidder_type) VALUES (?,?,?,?,?,?,?,?)",
                (t["id"], r["requirement_code"], r["requirement_name"], _b(r["is_mandatory"]), r["verification_source"],
                 r["min_condition"], r["weight"], r.get("applicable_bidder_type", "ALL")))

    for b in seeds["seedBidders"]:
        conn.execute(
            "INSERT INTO bidders (id,company_name,cin,pan,gstin,registered_address,contact_email,contact_phone,is_msme,msme_reg_no,is_startup,startup_dipp_no) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (b["id"], b["company_name"], b.get("cin"), b.get("pan"), b.get("gstin"), b.get("registered_address"),
             b.get("contact_email"), b.get("contact_phone"), _b(b.get("is_msme")), b.get("msme_reg_no"),
             _b(b.get("is_startup")), b.get("startup_dipp_no")))

    for bid in seeds["seedBids"]:
        ra = bid["risk_assessment"]
        conn.execute(
            "INSERT INTO bids (id,bid_id,tender_pk,bidder_pk,submission_date,status,compliance_score,risk_level,ai_recommendation,ai_explanation,risk_score,risk_factors,recommended_action) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (bid["id"], bid["bid_id"], bid["tender_id"], bid["bidder_id"], bid["submission_date"], bid["status"],
             bid["compliance_score"], bid["risk_level"], bid["ai_recommendation"], bid["ai_explanation"],
             ra["risk_score"], json.dumps(ra["risk_factors"]), ra["recommended_action"]))
        for d in bid["documents"]:
            conn.execute(
                "INSERT INTO documents (id,bid_pk,file_name,file_type,file_size_kb,stored_path,classified_type,classification_confidence,ocr_status,extracted_fields,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (d["id"], bid["id"], d["file_name"], d["file_type"], d["file_size_kb"], None, d["classified_type"],
                 d["classification_confidence"], d["ocr_status"], json.dumps(d["extracted_fields"]), d["created_at"]))
        for c in bid["compliance_results"]:
            conn.execute(
                "INSERT INTO compliance_results (id,bid_pk,requirement_code,requirement_name,status,points_awarded,max_points,evidence_document,confidence_score,rule_applied,explanation,flags) VALUES (?,?,?,?,?,?,?,?,?,?,?,'[]')",
                (c["id"], bid["id"], c["requirement_code"], c["requirement_name"], c["status"], c["points_awarded"],
                 c["max_points"], c["evidence_document"], c["confidence_score"], c["rule_applied"], c["explanation"]))
        conn.execute("INSERT INTO evaluations (bid_pk,evaluated_at,score,risk_level,recommendation) VALUES (?,?,?,?,?)",
                     (bid["id"], bid["submission_date"], bid["compliance_score"], bid["risk_level"], bid["ai_recommendation"]))

    for a in seeds["seedAuditLogs"]:
        add_audit(conn, a["action"], a["details"], a.get("entity_type", "BID"), None, a["user_name"],
                  a.get("rule_applied"), a.get("ip_address", "127.0.0.1"), a["timestamp"])
    for n in seeds["seedNotifications"]:
        conn.execute("INSERT INTO notifications (id,title,message,category,is_read,link,created_at) VALUES (?,?,?,?,?,?,?)",
                     (n["id"], n["title"], n["message"], n["category"], _b(n["is_read"]), n.get("link"), n["created_at"]))
    for c in seeds["seedConnectors"]:
        conn.execute("INSERT INTO connectors (id,name,type,mode,status,latency_ms,badge) VALUES (?,?,?,?,?,?,?)",
                     (c["id"], c["name"], c["type"], c["mode"], c["status"], c["latency_ms"], "Simulated"))


def reset_demo_data():
    """Drop everything and reload the demo data (uploaded files are removed as well)."""
    with connect() as conn:
        for table in ("evaluations", "decisions", "compliance_results", "documents", "bids", "requirements",
                      "tenders", "bidders", "audit_logs", "notifications", "connectors", "otps", "users"):
            conn.execute(f"DELETE FROM {table}")
        conn.execute("DELETE FROM sqlite_sequence")
        seed_demo_data(conn)
        add_audit(conn, "DATA_RESET_DEFAULT", "Demo data restored to the shipped baseline.", "SYSTEM", None, "System")
    for f in config.UPLOAD_DIR.glob("**/*"):
        if f.is_file():
            f.unlink()
