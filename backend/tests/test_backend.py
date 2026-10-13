"""End-to-end test of the backend logic (services, rule engine, OCR, audit chain) without the web layer.

Run from the backend folder:   python tests/test_backend.py
"""
import os, sys, tempfile, shutil, io
from pathlib import Path

TMP = tempfile.mkdtemp(prefix="gemtest_")
os.environ["GEM_DATA_DIR"] = TMP
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import db, services, extraction, adapters, security  # noqa: E402
from app.services import ServiceError  # noqa: E402

failures = []
def check(cond, msg):
    print(("  ok   " if cond else "  FAIL ") + msg)
    if not cond:
        failures.append(msg)

def expect_error(status, fn, *a, **k):
    try:
        fn(*a, **k)
    except ServiceError as e:
        return e.status == status
    return False

# ---------------------------------------------------------------- sample document factory
from reportlab.pdfgen import canvas  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

def make_pdf(lines):
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    y = 800
    for line in lines:
        c.drawString(60, y, line)
        y -= 22
    c.save()
    return buf.getvalue()

def font(size=34):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def make_png(lines):
    img = Image.new("RGB", (1400, 120 + 70 * len(lines)), "white")
    d = ImageDraw.Draw(img)
    for i, line in enumerate(lines):
        d.text((50, 50 + i * 70), line, fill="black", font=font())
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()

def gstin_for(pan, state="27"):
    base = state + pan + "1Z"
    chars = extraction._GSTIN_CHARS
    total = 0
    for i, ch in enumerate(base):
        prod = chars.index(ch) * (1 if i % 2 == 0 else 2)
        total += prod // 36 + prod % 36
    return base + chars[(36 - total % 36) % 36]

PAN, NAME = "DELTA1234X", "Delta Infotech Pvt Ltd"
GSTIN = gstin_for(PAN)

docs_good = {
    "pan_card.pdf": make_pdf(["INCOME TAX DEPARTMENT", "Permanent Account Number Card", f"Permanent Account Number: {PAN}", f"Name: {NAME.upper()}"]),
    "gst_certificate.pdf": make_pdf(["Government of India", "Goods and Services Tax Registration Certificate", f"GSTIN: {GSTIN}", f"Legal Name of Business: {NAME}", "Status: Active"]),
    "ca_turnover_certificate.pdf": make_pdf(["Chartered Accountant Certificate", "Annual turnover FY 2023-24: Rs. 2.60 Cr", "Annual turnover FY 2022-23: Rs. 2.40 Cr", "Annual turnover FY 2021-22: Rs. 2.50 Cr", "UDIN: 240112345612ABCDEF"]),
    "oem_authorization.pdf": make_pdf(["Manufacturer Authorization Letter", "We, Dell Technologies, are the original equipment manufacturer.", f"We hereby authorize M/s {NAME}, to bid for tender GEM/2026/B/12345.", "Valid till 31/12/2030"]),
    "make_in_india.pdf": make_pdf(["Make in India - Class-I Local Supplier Certificate", "Local content: 65% as per DPIIT order."]),
    "debarment_affidavit.pdf": make_pdf(["AFFIDAVIT", "We hereby declare that our company has not been debarred or blacklisted by any Government department."]),
}

print("== setup")
db.init_db()
with db.connect() as c:
    check(db.row(c, "SELECT COUNT(*) n FROM tenders")["n"] == 2, "seed: 2 tenders")
    check(db.row(c, "SELECT COUNT(*) n FROM bids")["n"] == 3, "seed: 3 bids")
    check("khandelwal" not in str(db.rows(c, "SELECT email FROM users")), "seed: personal email replaced")
check(adapters.name_similarity("ABC Technologies Pvt Ltd", "ABC TECHNOLOGIES PRIVATE LIMITED") > 0.95, "name similarity ignores suffixes")
check(extraction.gstin_checksum_ok(GSTIN), "generated GSTIN passes checksum")

print("== auth")
s = services.login("officer", "demo123")
check(s["user"]["username"] == "officer" and s["access_token"], "login ok")
check("password" not in str(s), "no password in response")
check(services.user_from_token(s["access_token"])["username"] == "officer", "token round-trip")
check(expect_error(401, services.login, "officer", "wrong"), "wrong password rejected")
check(expect_error(401, services.user_from_token, "garbage"), "bad token rejected")
r = services.send_otp(username="officer")
check(len(r.get("otp", "")) == 6, "otp issued (demo mode returns it)")
check(expect_error(400, services.verify_otp, "officer", None, "000000"), "wrong otp rejected")
check(services.verify_otp("officer", None, r["otp"])["access_token"], "correct otp accepted")
check(expect_error(400, services.verify_otp, "officer", None, r["otp"]), "otp is single use")
ghost = services.send_otp(username="nobody-here")
check(ghost["success"] and "otp" not in ghost, "unknown user gets generic reply, no otp")
reg = services.register({"username": "asha", "full_name": "Asha Rao", "email": "asha@example.org", "password": "secret1"})
check(reg["user"]["username"] == "asha", "register ok")
check(expect_error(409, services.register, {"username": "asha", "email": "x@y.z", "password": "secret1"}), "duplicate username rejected")
r = services.send_otp(username="asha")
services.reset_password("asha", None, r["otp"], "newsecret")
check(services.login("asha", "newsecret")["user"]["username"] == "asha", "password reset works")
user = services.user_from_token(s["access_token"])

print("== bidder, bid and empty state")
bidder = services.create_bidder({"company_name": NAME, "pan": PAN.lower(), "gstin": GSTIN, "is_msme": False}, user)
check(bidder["pan"] == PAN, "pan uppercased")
check(expect_error(422, services.create_bidder, {"company_name": "Bad Co", "pan": "123"}, user), "bad PAN rejected")
bid = services.create_bid(1, bidder["id"], user)
check(bid["status"] == "UNDER_VERIFICATION" and bid["compliance_score"] == 0, "new bid awaits documents")
check(bid["bid_id"].startswith("BID/12345/DEL-"), f"bid code {bid['bid_id']}")
check(expect_error(409, services.create_bid, 1, bidder["id"], user), "duplicate bid rejected")
check(expect_error(404, services.create_bid, 99, bidder["id"], user), "unknown tender rejected")

print("== upload good documents (text PDFs)")
for name, content in docs_good.items():
    d = services.upload_document(bid["id"], name, content, "AUTO", user)
    print(f"      {name:30} -> {d['classified_type']:20} conf={d['classification_confidence']} fields={[ (f['field_name'], f['extracted_value']) for f in d['extracted_fields']]}")
b = services.get_bid(bid["id"])
types = {d["classified_type"] for d in b["documents"]}
check(types == {"PAN_CARD", "GST_CERTIFICATE", "ITR_AND_FINANCIALS", "OEM_AUTHORIZATION", "MAKE_IN_INDIA", "DEBARMENT_AFFIDAVIT"}, "all 6 documents classified correctly")
statuses = {r["requirement_code"]: r["status"] for r in b["compliance_results"]}
print("      results:", statuses, "score", b["compliance_score"], b["risk_level"], b["status"], b["ai_recommendation"])
check(statuses == {"PAN": "VERIFIED", "GST": "VERIFIED", "ITR": "VERIFIED", "OEM_AUTH": "VERIFIED", "MAKE_IN_INDIA": "VERIFIED", "DEBARMENT": "VERIFIED"}, "all evaluated requirements verified")
check(b["compliance_score"] == 100 and b["status"] == "VERIFIED" and b["ai_recommendation"] == "QUALIFIED_WITH_HIGH_CONFIDENCE", "qualified with 100 score")
check(not any(r["requirement_code"] in ("EPFO", "ESIC", "UDYAM") for r in b["compliance_results"]), "optional unsubmitted requirements not judged")
f = {x["field_name"]: x for d in b["documents"] for x in d["extracted_fields"]}
check(f["avg_annual_turnover"]["extracted_value"] == "₹ 2.50 Cr", "turnover averaged over 3 years")
check(f["pan_number"]["bounding_box"]["width"] > 0, "bounding box located for PAN text")

print("== negative scenarios")
b2 = services.create_bid(2, bidder["id"], user)  # tender 2 needs 2.5 Cr, has PAN/GST/ITR/DEBARMENT
services.upload_document(b2["id"], "pan.pdf", docs_good["pan_card.pdf"], "AUTO", user)
low = make_pdf(["Chartered Accountant Certificate", "Annual turnover FY 2023-24: Rs. 1.0 Cr", "UDIN: 240112345612ABCDEF"])
services.upload_document(b2["id"], "turnover.pdf", low, "AUTO", user)
b2 = services.get_bid(b2["id"])
st = {r["requirement_code"]: r for r in b2["compliance_results"]}
print("      tender2:", {k: v["status"] for k, v in st.items()}, b2["compliance_score"], b2["risk_level"], b2["risk_factors"] if "risk_factors" in b2 else b2["risk_assessment"]["risk_factors"])
check(st["ITR"]["status"] == "NON_COMPLIANT" and "below" in st["ITR"]["explanation"], "turnover below minimum is NON_COMPLIANT")
check(st["GST"]["status"] == "NON_COMPLIANT" and "No Goods" in st["GST"]["explanation"], "missing mandatory GST flagged")
check(b2["status"] == "PENDING_REVIEW" and b2["ai_recommendation"] != "QUALIFIED_WITH_HIGH_CONFIDENCE", "incomplete bid is not qualified")

bharat = services.list_bidders()
bharat = next(x for x in bharat if x["company_name"].startswith("Bharat"))
b3 = services.create_bid(2, bharat["id"], user)
check(b3["risk_level"] == "CRITICAL" and b3["ai_recommendation"] == "CRITICAL_DISQUALIFICATION_REQUIRED", "debarred bidder flagged critical immediately")
gst_bad = make_pdf(["Goods and Services Tax Registration Certificate", "GSTIN: 08BHART9999K1Z8", "Legal Name: Bharat Systems Pvt Ltd", "Status: Active"])
services.upload_document(b3["id"], "gst.pdf", gst_bad, "AUTO", user)
b3 = services.get_bid(b3["id"])
gst_res = next(r for r in b3["compliance_results"] if r["requirement_code"] == "GST")
check(gst_res["status"] == "NON_COMPLIANT" and "SUSPENDED" in gst_res["explanation"], "suspended GSTIN fails")
check("GSTIN not in active status" in b3["risk_assessment"]["risk_factors"], "risk factor lists GST status")

print("== OCR paths (image + scanned PDF)")
if extraction.ocr_available():
    png = make_png(["INCOME TAX DEPARTMENT", "Permanent Account Number Card", f"Permanent Account Number: {PAN}", f"Name: {NAME.upper()}"])
    d = services.upload_document(bid["id"], "scan_card.png", png, "AUTO", user)
    fields = {x["field_name"]: x["extracted_value"] for x in d["extracted_fields"]}
    print("      png ->", d["classified_type"], d["ocr_status"], fields)
    check(d["classified_type"] == "PAN_CARD" and fields.get("pan_number") == PAN, "OCR on image reads the PAN")
    img = Image.open(io.BytesIO(png)).convert("RGB")
    pdf_buf = io.BytesIO(); img.save(pdf_buf, "PDF")
    d = services.upload_document(bid["id"], "scanned.pdf", pdf_buf.getvalue(), "AUTO", user)
    fields = {x["field_name"]: x["extracted_value"] for x in d["extracted_fields"]}
    print("      scanned pdf ->", d["classified_type"], d["ocr_status"], fields)
    check(fields.get("pan_number") == PAN, "OCR on scanned PDF reads the PAN")
else:
    print("      (tesseract not installed - skipped)")

print("== safety checks")
check(expect_error(415, services.upload_document, bid["id"], "evil.exe", b"MZ", "AUTO", user), "exe upload rejected")
check(expect_error(422, services.upload_document, bid["id"], "empty.pdf", b"", "AUTO", user), "empty upload rejected")
junk = services.upload_document(bid["id"], "photo.txt", b"hello this is just some text", "AUTO", user)
check(junk["classified_type"] == "GENERAL_DOCUMENT", "unrecognised text -> GENERAL_DOCUMENT")

print("== officer actions + audit chain")
b = services.get_bid(bid["id"])
res = next(r for r in b["compliance_results"] if r["requirement_code"] == "GST")
out = services.update_compliance_result(bid["id"], res["id"], {"points_awarded": 5, "status": "MISMATCH", "explanation": "Checked manually"}, user)
check(out["compliance_score"] < 100, f"override lowers score to {out['compliance_score']}")
b = services.verify_bid(bid["id"], user)
gst = next(r for r in b["compliance_results"] if r["requirement_code"] == "GST")
check(gst["status"] == "MISMATCH" and gst["explanation"] == "Checked manually", "re-verification keeps the officer override")
dec = services.submit_decision(bid["id"], {"decision": "APPROVED", "comments": "Reviewed"}, user)
check(dec["officer_decision"]["decision"] == "APPROVED" and services.get_bid(bid["id"])["status"] == "APPROVED", "decision sets status")
services.delete_document(bid["id"], junk["id"], user)
check(services.get_bid(bid["id"])["status"] == "APPROVED", "status kept after later changes")
check(expect_error(422, services.submit_decision, bid["id"], {"decision": "MAYBE"}, user), "invalid decision rejected")
ver = services.audit_verify()
check(ver["valid"] and ver["entries_checked"] > 20, f"audit chain valid ({ver['entries_checked']} entries)")
with db.connect() as c:
    c.execute("UPDATE audit_logs SET details='tampered' WHERE id=5")
check(not services.audit_verify()["valid"], "tampering with an old audit row is detected")

print("== dashboard / lists / misc")
dash = services.dashboard()
check(dash["total_tenders"] == 2 and len(dash["verification_activity"]) == 6 and len(dash["recent_bids"]) == len(services.list_bids()), "dashboard shape")
check(set(dash["risk_distribution"]) == {"Low", "Medium", "High", "Critical"}, "risk distribution keys match UI")
check(services.get_tender("GEM/2026/B/12345")["bids_count"] >= 4, "tender lookup by code and bid count")
t = services.create_tender({"title": "New tender", "requirements": [{"requirement_code": "PAN", "requirement_name": "PAN", "weight": 10}]}, user)
check(t["tender_id"].startswith("GEM/") and len(t["requirements"]) == 1, "create tender")
check(len(services.export_data()["bids"]) == len(services.list_bids()), "export")
services.reset_demo(user)
check(len(services.list_bids()) == 3 and services.audit_verify()["valid"], "reset restores demo data with a valid chain")

shutil.rmtree(TMP, ignore_errors=True)
print("\n" + ("ALL CHECKS PASSED" if not failures else f"{len(failures)} FAILURE(S): {failures}"))
sys.exit(1 if failures else 0)
