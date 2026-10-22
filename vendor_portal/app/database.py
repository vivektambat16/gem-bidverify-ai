"""Database access and shared SQLite schema management for GeM Vendor Portal.

Handles seamless interoperability between Vendor Submissions and the
Procurement Officer AI Verification Dashboard.
"""
import hashlib
import json
import os
import random
import re
import shutil
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from . import config

# Schema definitions
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    gstin TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    pan TEXT,
    contact_phone TEXT,
    business_type TEXT DEFAULT 'REGULAR',
    address TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tender_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    department TEXT,
    tender_value REAL,
    deadline TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    description TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tender_pk INTEGER NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    requirement_code TEXT NOT NULL,
    requirement_name TEXT NOT NULL,
    is_mandatory INTEGER NOT NULL DEFAULT 1,
    verification_source TEXT,
    min_condition TEXT,
    weight REAL NOT NULL DEFAULT 10,
    applicable_bidder_type TEXT DEFAULT 'ALL'
);

CREATE TABLE IF NOT EXISTS bidders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    cin TEXT,
    pan TEXT,
    gstin TEXT,
    registered_address TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    is_msme INTEGER DEFAULT 0,
    msme_reg_no TEXT,
    is_startup INTEGER DEFAULT 0,
    startup_dipp_no TEXT
);

CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bid_id TEXT UNIQUE NOT NULL,
    tender_pk INTEGER NOT NULL REFERENCES tenders(id),
    bidder_pk INTEGER NOT NULL REFERENCES bidders(id),
    submission_date TEXT NOT NULL,
    status TEXT NOT NULL,
    compliance_score INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'LOW',
    ai_recommendation TEXT,
    ai_explanation TEXT,
    risk_score INTEGER DEFAULT 0,
    risk_factors TEXT DEFAULT '[]',
    recommended_action TEXT,
    tender_id TEXT,
    vendor_name TEXT,
    gstin TEXT,
    file_paths TEXT
);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bid_pk INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size_kb INTEGER,
    stored_path TEXT,
    classified_type TEXT,
    classification_confidence REAL,
    ocr_status TEXT,
    extracted_fields TEXT DEFAULT '[]',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS compliance_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bid_pk INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    requirement_code TEXT NOT NULL,
    requirement_name TEXT,
    status TEXT NOT NULL,
    points_awarded REAL,
    max_points REAL,
    evidence_document TEXT,
    confidence_score REAL,
    rule_applied TEXT,
    explanation TEXT,
    flags TEXT DEFAULT '[]',
    is_mandatory INTEGER DEFAULT 1,
    officer_override INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bid_id INTEGER,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    details TEXT,
    rule_applied TEXT,
    ip_address TEXT,
    timestamp TEXT NOT NULL,
    prev_hash TEXT,
    entry_hash TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    message TEXT,
    category TEXT,
    is_read INTEGER DEFAULT 0,
    link TEXT,
    created_at TEXT NOT NULL
);
"""

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


@contextmanager
def get_db():
    """Provides a SQLite connection with dict-like row access and WAL mode."""
    conn = sqlite3.connect(config.DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def row_to_dict(row: Optional[sqlite3.Row]) -> Optional[Dict[str, Any]]:
    return dict(row) if row else None


def rows_to_list(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    return [dict(r) for r in rows]


def _entry_hash(prev_hash: str, entry: dict) -> str:
    payload = json.dumps(entry, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256((prev_hash + payload).encode()).hexdigest()


def add_audit_log(conn, action: str, details: str, entity_type: str = "BID",
                  bid_id: Optional[int] = None, user_name: str = "Vendor Portal",
                  rule_applied: Optional[str] = "GFR_2017_RULE_149", ip_address: str = "127.0.0.1"):
    try:
        last = conn.execute("SELECT entry_hash FROM audit_logs ORDER BY id DESC LIMIT 1").fetchone()
        prev = last["entry_hash"] if last and last["entry_hash"] else "GENESIS"
        ts = now_iso()
        entry = {
            "bid_id": bid_id,
            "user_name": user_name,
            "action": action,
            "entity_type": entity_type,
            "details": details,
            "rule_applied": rule_applied,
            "ip_address": ip_address,
            "timestamp": ts,
        }
        h = _entry_hash(prev, entry)
        conn.execute(
            "INSERT INTO audit_logs (bid_id, user_name, action, entity_type, details, rule_applied, ip_address, timestamp, prev_hash, entry_hash) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (bid_id, user_name, action, entity_type, details, rule_applied, ip_address, ts, prev, h)
        )
    except Exception as e:
        print(f"[Audit Log Warning] {e}")


def init_db():
    """Initializes schema and runs safe migrations on existing database."""
    with get_db() as conn:
        conn.executescript(SCHEMA_SQL)

        # Ensure safe column migrations on bids table
        for col in ("tender_id", "vendor_name", "gstin", "file_paths"):
            try:
                conn.execute(f"ALTER TABLE bids ADD COLUMN {col} TEXT")
            except sqlite3.OperationalError:
                pass

        # Seed sample active government tenders if tenders table is empty
        count = conn.execute("SELECT COUNT(*) AS c FROM tenders").fetchone()["c"]
        if count == 0:
            seed_sample_tenders(conn)


# Ensure schema is bootstrapped on module load
try:
    init_db()
except Exception:
    pass



def seed_sample_tenders(conn):
    """Seed authentic GeM procurement tenders if starting on an empty database."""
    samples = [
        {
            "tender_id": "GEM/2026/B/89201",
            "title": "Supply, Deployment & Maintenance of Enterprise Cloud Compute Infrastructure",
            "department": "Ministry of Electronics & Information Technology (MeitY)",
            "tender_value": 45000000.0,
            "deadline": "2026-11-15T18:00:00Z",
            "status": "ACTIVE",
            "description": "Comprehensive procurement of cloud compute nodes, hypervisor clusters, and 24x7 managed support for central government digital services.",
            "requirements": [
                ("REQ-GST-01", "Valid GST Registration Certificate (Active Status)", 1, "GSTN_API_VERIFY", "Active in State of Registration", 20),
                ("REQ-TECH-01", "Technical Bid Compliance & Tier-3 Certified Datacenter SLA", 1, "DOC_EVALUATION", "Tier-3 Datacenter certification", 30),
                ("REQ-FIN-01", "Financial Turnover & Audited Statements (>= 10 Cr avg)", 1, "FINANCIAL_VERIFY", "Average Annual Turnover >= 10 Crores", 25),
                ("REQ-PAN-01", "Permanent Account Number (PAN) Card & Tax Compliance", 1, "CBDT_CROSS_CHECK", "Valid PAN matching corporate name", 15),
                ("REQ-MSME-01", "MSME / Startup Exemption Certificate (if applicable)", 0, "UDYAM_VERIFY", "Valid Udyam Registration", 10),
            ]
        },
        {
            "tender_id": "GEM/2026/B/45210",
            "title": "Procurement of AI-Assisted Citizen Grievance Analytics Platform",
            "department": "Department of Administrative Reforms and Public Grievances (DARPG)",
            "tender_value": 28000000.0,
            "deadline": "2026-11-20T17:30:00Z",
            "status": "ACTIVE",
            "description": "Design and implementation of NLP/LLM powered grievance triage, root-cause categorization, and multi-lingual sentiment monitoring engine.",
            "requirements": [
                ("REQ-GST-01", "Valid GST Registration Certificate", 1, "GSTN_API_VERIFY", "Valid 15-digit GSTIN", 20),
                ("REQ-TECH-01", "Technical Architecture, Security Whitepaper & AI Model Specs", 1, "DOC_EVALUATION", "Security audit clearance", 35),
                ("REQ-FIN-01", "Financial Bid & Priced Schedule of Quantities", 1, "FINANCIAL_VERIFY", "Signed Price Bid", 25),
                ("REQ-PAN-01", "PAN Card & Corporate Registration (CIN)", 1, "MCA21_CBDT", "Corporate verification", 20),
            ]
        },
        {
            "tender_id": "GEM/2026/B/67104",
            "title": "Annual Maintenance & Cybersecurity Audit for State Data Center (SDC)",
            "department": "Department of Telecommunications / USOF",
            "tender_value": 15000000.0,
            "deadline": "2026-11-30T15:00:00Z",
            "status": "ACTIVE",
            "description": "CERT-In empaneled security audit, vulnerability assessment, penetration testing, and ISO 27001 renewal for State Data Center infrastructure.",
            "requirements": [
                ("REQ-GST-01", "Valid GSTIN & Tax Clearance Certificate", 1, "GSTN_API_VERIFY", "Active GSTIN", 25),
                ("REQ-TECH-01", "CERT-In Empanelment Proof & Technical Methodology", 1, "DOC_EVALUATION", "Current CERT-In Empanelment", 40),
                ("REQ-FIN-01", "Commercial Price Bid Schedule", 1, "FINANCIAL_VERIFY", "GFR 149 Compliance", 20),
                ("REQ-EXP-01", "Past 3-Year Government Project Experience (Min 2 projects)", 1, "EXPERIENCE_CHECK", "Satisfactory completion certs", 15),
            ]
        }
    ]

    for s in samples:
        cur = conn.execute(
            "INSERT INTO tenders (tender_id, title, department, tender_value, deadline, status, description, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (s["tender_id"], s["title"], s["department"], s["tender_value"], s["deadline"], s["status"], s["description"], now_iso())
        )
        t_id = cur.lastrowid
        for r in s["requirements"]:
            conn.execute(
                "INSERT INTO requirements (tender_pk, requirement_code, requirement_name, is_mandatory, verification_source, min_condition, weight) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (t_id, r[0], r[1], r[2], r[3], r[4], r[5])
            )


# -----------------------------------------------------------------------------
# Vendor Authentication Queries
# -----------------------------------------------------------------------------
def get_vendor_by_id(vendor_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        r = conn.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
        return row_to_dict(r)


def get_vendor_by_email(email: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        r = conn.execute("SELECT * FROM vendors WHERE lower(email) = lower(?)", (email.strip(),)).fetchone()
        return row_to_dict(r)


def get_vendor_by_gstin(gstin: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        r = conn.execute("SELECT * FROM vendors WHERE upper(gstin) = upper(?)", (gstin.strip(),)).fetchone()
        return row_to_dict(r)


def create_vendor(company_name: str, gstin: str, email: str, password_hash: str,
                  contact_phone: str = "", business_type: str = "REGULAR", address: str = "") -> Dict[str, Any]:
    company_name = company_name.strip()
    gstin = gstin.strip().upper()
    email = email.strip().lower()
    # PAN is typically characters 2..12 in Indian GSTIN
    pan = gstin[2:12] if len(gstin) == 15 else ""

    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO vendors (company_name, gstin, email, password_hash, pan, contact_phone, business_type, address, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (company_name, gstin, email, password_hash, pan, contact_phone, business_type, address, now_iso())
        )
        vendor_id = cur.lastrowid

        # Also ensure vendor is mirrored in bidders table for seamless officer dashboard lookup
        bidder = conn.execute("SELECT id FROM bidders WHERE upper(gstin) = ?", (gstin,)).fetchone()
        if not bidder:
            conn.execute(
                "INSERT INTO bidders (company_name, pan, gstin, registered_address, contact_email, contact_phone, is_msme, is_startup) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (company_name, pan, gstin, address or "Registered Vendor Address", email, contact_phone,
                 1 if business_type.upper() == "MSME" else 0,
                 1 if business_type.upper() == "STARTUP" else 0)
            )

        add_audit_log(conn, "VENDOR_REGISTERED", f"Vendor registered: '{company_name}' (GSTIN: {gstin})",
                      entity_type="VENDOR", user_name=company_name)

        return get_vendor_by_id(vendor_id)


# -----------------------------------------------------------------------------
# Tender Queries
# -----------------------------------------------------------------------------
def get_active_tenders(search_query: str = "", department_filter: str = "") -> List[Dict[str, Any]]:
    with get_db() as conn:
        sql = "SELECT * FROM tenders WHERE status = 'ACTIVE'"
        params = []
        if search_query:
            sql += " AND (title LIKE ? OR tender_id LIKE ? OR description LIKE ?)"
            term = f"%{search_query.strip()}%"
            params.extend([term, term, term])
        if department_filter:
            sql += " AND department LIKE ?"
            params.append(f"%{department_filter.strip()}%")
        sql += " ORDER BY id DESC"

        tenders = rows_to_list(conn.execute(sql, params).fetchall())
        for t in tenders:
            reqs = conn.execute("SELECT * FROM requirements WHERE tender_pk = ? ORDER BY id", (t["id"],)).fetchall()
            t["requirements"] = rows_to_list(reqs)
            bids_cnt = conn.execute("SELECT COUNT(*) AS c FROM bids WHERE tender_pk = ?", (t["id"],)).fetchone()["c"]
            t["bids_count"] = bids_cnt
        return tenders


def get_tender_by_id(tender_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        t = conn.execute("SELECT * FROM tenders WHERE id = ?", (tender_id,)).fetchone()
        if not t:
            return None
        res = row_to_dict(t)
        reqs = conn.execute("SELECT * FROM requirements WHERE tender_pk = ? ORDER BY id", (t["id"],)).fetchall()
        res["requirements"] = rows_to_list(reqs)
        return res


def get_all_departments() -> List[str]:
    with get_db() as conn:
        rows = conn.execute("SELECT DISTINCT department FROM tenders WHERE department IS NOT NULL AND department != ''").fetchall()
        return [r["department"] for r in rows]


# -----------------------------------------------------------------------------
# Bid Submission & Tracking Queries
# -----------------------------------------------------------------------------
def submit_vendor_bid(vendor: Dict[str, Any], tender: Dict[str, Any],
                      uploaded_docs: List[Dict[str, Any]], client_ip: str = "127.0.0.1") -> Dict[str, Any]:
    """Saves vendor bid submission and all uploaded PDFs to shared SQLite database."""
    with get_db() as conn:
        # 1. Ensure bidder record exists and get bidder_pk
        bidder = conn.execute("SELECT id FROM bidders WHERE upper(gstin) = ?", (vendor["gstin"].upper(),)).fetchone()
        if bidder:
            bidder_pk = bidder["id"]
        else:
            pan = vendor.get("pan") or (vendor["gstin"][2:12] if len(vendor["gstin"]) == 15 else "")
            cur = conn.execute(
                "INSERT INTO bidders (company_name, pan, gstin, registered_address, contact_email, contact_phone, is_msme, is_startup) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (vendor["company_name"], pan, vendor["gstin"], vendor.get("address", ""),
                 vendor["email"], vendor.get("contact_phone", ""),
                 1 if vendor.get("business_type") == "MSME" else 0,
                 1 if vendor.get("business_type") == "STARTUP" else 0)
            )
            bidder_pk = cur.lastrowid

        # 2. Prevent duplicate bid submission for the same tender
        existing = conn.execute("SELECT id, bid_id FROM bids WHERE tender_pk = ? AND bidder_pk = ?",
                                (tender["id"], bidder_pk)).fetchone()
        if existing:
            raise ValueError(f"Your company already submitted bid '{existing['bid_id']}' for this tender.")

        # 3. Generate official GeM Bid Reference ID (e.g. BID/89201/TEC-01)
        tender_code = tender["tender_id"]
        code_number = re.sub(r"\D", "", tender_code)[-5:] or "89201"
        prefix = re.sub(r"[^A-Z]", "", vendor["company_name"].upper())[:3].ljust(3, "X")
        seq = conn.execute("SELECT COUNT(*) AS c FROM bids WHERE tender_pk = ?", (tender["id"],)).fetchone()["c"] + 1
        bid_code = f"BID/{code_number}/{prefix}-{seq:02d}"

        # Ensure uniqueness
        while conn.execute("SELECT id FROM bids WHERE bid_id = ?", (bid_code,)).fetchone():
            seq += 1
            bid_code = f"BID/{code_number}/{prefix}-{seq:02d}"

        # 4. Prepare file paths list
        file_paths_list = [d["stored_path"] for d in uploaded_docs]
        file_paths_json = json.dumps(file_paths_list)
        sub_date = now_iso()

        # 5. Insert bid record into shared `bids` table
        # Status is explicitly set to 'Pending AI Verification' as required!
        status_val = "Pending AI Verification"

        cur = conn.execute(
            """INSERT INTO bids (
                bid_id, tender_pk, bidder_pk, submission_date, status,
                compliance_score, risk_level, ai_recommendation, ai_explanation,
                risk_score, risk_factors, recommended_action,
                tender_id, vendor_name, gstin, file_paths
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                bid_code,
                tender["id"],
                bidder_pk,
                sub_date,
                status_val,
                0,                               # Initial compliance score
                "LOW",                           # Default risk level
                "PENDING_AI_VERIFICATION",       # AI Recommendation
                "Bid submitted via GeM Vendor Portal. Documents queued for AI compliance verification.",
                0,                               # Risk score
                json.dumps([]),
                "Verify submitted compliance documents and run rule engine.",
                tender["tender_id"],
                vendor["company_name"],
                vendor["gstin"],
                file_paths_json
            )
        )
        bid_pk = cur.lastrowid

        # 6. Insert uploaded files into `documents` table
        # Also copy into backend uploads directory if officer backend exists
        for doc in uploaded_docs:
            dest_officer_dir = config.OFFICER_UPLOADS_DIR / str(bid_pk)
            dest_officer_dir.mkdir(parents=True, exist_ok=True)
            stored_officer_path = dest_officer_dir / Path(doc["stored_path"]).name
            try:
                shutil.copy2(doc["stored_path"], stored_officer_path)
                doc_path_for_db = str(stored_officer_path)
            except Exception:
                doc_path_for_db = doc["stored_path"]

            conn.execute(
                """INSERT INTO documents (
                    bid_pk, file_name, file_type, file_size_kb, stored_path,
                    classified_type, classification_confidence, ocr_status,
                    extracted_fields, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    bid_pk,
                    doc["file_name"],
                    "pdf",
                    doc["file_size_kb"],
                    doc_path_for_db,
                    doc.get("classified_type", "TECHNICAL_PROPOSAL"),
                    0.95,
                    "PARSED",
                    json.dumps(doc.get("extracted_fields", [])),
                    sub_date
                )
            )

        # 7. Add instant notification for procurement officer dashboard
        conn.execute(
            "INSERT INTO notifications (title, message, category, is_read, link, created_at) "
            "VALUES (?, ?, ?, 0, ?, ?)",
            (
                "New Vendor Bid Submitted",
                f"Vendor '{vendor['company_name']}' (GSTIN: {vendor['gstin']}) submitted bid {bid_code} for {tender['tender_id']}.",
                "INFO",
                f"/bids/{bid_pk}",
                sub_date
            )
        )

        # 8. Cryptographic audit log entry
        add_audit_log(
            conn,
            action="VENDOR_BID_SUBMITTED",
            details=f"New bid '{bid_code}' submitted by '{vendor['company_name']}' for tender '{tender['tender_id']}' with {len(uploaded_docs)} PDF documents.",
            entity_type="BID",
            bid_id=bid_pk,
            user_name=vendor["company_name"],
            ip_address=client_ip
        )

        # Return the created bid
        created = conn.execute("SELECT * FROM bids WHERE id = ?", (bid_pk,)).fetchone()
        res = row_to_dict(created)
        res["documents_count"] = len(uploaded_docs)
        return res


def get_vendor_bids(vendor_gstin: str) -> List[Dict[str, Any]]:
    """Fetches all submitted bids for a specific vendor with documents and compliance status."""
    with get_db() as conn:
        bids = conn.execute(
            """SELECT b.*, COALESCE(b.gstin, bd.gstin) AS gstin, COALESCE(b.vendor_name, bd.company_name) AS vendor_name,
                      t.title AS tender_title, t.department AS tender_department, t.deadline AS tender_deadline
               FROM bids b
               JOIN tenders t ON b.tender_pk = t.id
               LEFT JOIN bidders bd ON b.bidder_pk = bd.id
               WHERE upper(COALESCE(b.gstin, bd.gstin)) = ?
               ORDER BY b.id DESC""",
            (vendor_gstin.upper(),)
        ).fetchall()

        out = []
        for b in bids:
            d = row_to_dict(b)
            # Fetch attached documents
            docs = conn.execute("SELECT * FROM documents WHERE bid_pk = ? ORDER BY id", (b["id"],)).fetchall()
            d["documents"] = rows_to_list(docs)
            # Fetch compliance results for this bid
            comp = conn.execute(
                "SELECT requirement_code, requirement_name, status, points_awarded, max_points, explanation FROM compliance_results WHERE bid_pk = ? ORDER BY id",
                (b["id"],)
            ).fetchall()
            d["compliance_results"] = rows_to_list(comp)
            # Fetch official decision if recorded
            dec = conn.execute(
                "SELECT decision, comments, clarification_details, decided_at FROM decisions WHERE bid_pk = ?",
                (b["id"],)
            ).fetchone()
            d["decision_info"] = row_to_dict(dec) if dec else None
            out.append(d)
        return out


def get_bid_by_id(bid_pk: int) -> Optional[Dict[str, Any]]:
    """Fetches full bid details by ID."""
    with get_db() as conn:
        b = conn.execute(
            """SELECT b.*, COALESCE(b.gstin, bd.gstin) AS gstin, COALESCE(b.vendor_name, bd.company_name) AS vendor_name,
                      t.title AS tender_title, t.department AS tender_department,
                      t.tender_value AS tender_value, t.deadline AS tender_deadline, t.description AS tender_description
               FROM bids b
               JOIN tenders t ON b.tender_pk = t.id
               LEFT JOIN bidders bd ON b.bidder_pk = bd.id
               WHERE b.id = ?""",
            (bid_pk,)
        ).fetchone()
        if not b:
            return None
        res = row_to_dict(b)
        docs = conn.execute("SELECT * FROM documents WHERE bid_pk = ? ORDER BY id", (b["id"],)).fetchall()
        res["documents"] = rows_to_list(docs)
        comp = conn.execute(
            "SELECT requirement_code, requirement_name, status, points_awarded, max_points, explanation FROM compliance_results WHERE bid_pk = ? ORDER BY id",
            (b["id"],)
        ).fetchall()
        res["compliance_results"] = rows_to_list(comp)
        dec = conn.execute(
            "SELECT decision, comments, clarification_details, decided_at FROM decisions WHERE bid_pk = ?",
            (b["id"],)
        ).fetchone()
        res["decision_info"] = row_to_dict(dec) if dec else None
        return res


def get_vendor_bid_by_id(bid_pk: int, vendor_gstin: str) -> Optional[Dict[str, Any]]:
    """Fetches bid details only if owned by the requesting vendor (enforces ownership)."""
    bid = get_bid_by_id(bid_pk)
    if not bid:
        return None
    bid_gstin = (bid.get("gstin") or "").upper().strip()
    if bid_gstin != vendor_gstin.upper().strip():
        return None
    return bid

