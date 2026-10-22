"""FastAPI application for GeM Vendor Portal.

Provides server-rendered HTML pages styled with Tailwind CSS,
handling vendor authentication, active tenders browsing, PDF bid submissions,
and shared SQLite database synchronization with the Procurement Officer Dashboard.
"""
import json
import os
import re
import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from . import auth, config, database, models, sample_generator

# Initialize FastAPI app
app = FastAPI(
    title="GeM Vendor Portal",
    version="2.0.0",
    description="Authentic government e-procurement portal for external vendors to apply for GeM tenders."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Templates & Static
TEMPLATES_DIR = config.BASE_DIR / "templates"
STATIC_DIR = config.BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def render(request: Request, name: str, context: Optional[dict] = None) -> HTMLResponse:
    """Helper to ensure compatibility with modern Starlette TemplateResponse."""
    ctx = context or {}
    return templates.TemplateResponse(request=request, name=name, context=ctx)



@app.on_event("startup")
def on_startup():
    """Initializes database schema and ensures demo enterprise is seeded."""
    database.init_db()
    # Seed sample vendor for instant demo convenience
    with database.get_db() as conn:
        demo_vendor = conn.execute("SELECT id FROM vendors WHERE email = ?", ("bids@nexgencompute.in",)).fetchone()
        if not demo_vendor:
            database.create_vendor(
                company_name="NexGen Compute Technologies Pvt Ltd",
                gstin="27AABCT3421K1Z5",
                email="bids@nexgencompute.in",
                password_hash=auth.hash_password("Vendor@2026"),
                contact_phone="+91 98201 54321",
                business_type="MSME",
                address="Tower B, Cyber City, Phase II, Mumbai, Maharashtra - 400051"
            )


# -----------------------------------------------------------------------------
# Web Page Route Handlers (HTML Views)
# -----------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def index():
    return RedirectResponse(url="/tenders", status_code=status.HTTP_302_FOUND)


@app.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    vendor = auth.get_current_vendor(request)
    if vendor:
        return RedirectResponse(url="/tenders", status_code=status.HTTP_302_FOUND)

    return render(request, "register.html", {
        "current_vendor": None,
        "active_page": "register",
        "db_name": config.DB_PATH.name,
        "message": None
    })


@app.post("/register", response_class=HTMLResponse)
def handle_register(
    request: Request,
    response: Response,
    company_name: str = Form(...),
    gstin: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    contact_phone: Optional[str] = Form(""),
    business_type: Optional[str] = Form("REGULAR"),
    address: Optional[str] = Form(""),
):
    try:
        # Validate through Pydantic
        validated = models.VendorRegisterModel(
            company_name=company_name,
            gstin=gstin,
            email=email,
            password=password,
            contact_phone=contact_phone,
            business_type=business_type,
            address=address,
        )

        # Check existing email / GSTIN
        if database.get_vendor_by_email(validated.email):
            return render(request, "register.html", {
                "current_vendor": None,
                "active_page": "register",
                "db_name": config.DB_PATH.name,
                "message": "An enterprise with this correspondence email is already registered.",
                "message_type": "error"
            })

        if database.get_vendor_by_gstin(validated.gstin):
            return render(request, "register.html", {
                "current_vendor": None,
                "active_page": "register",
                "db_name": config.DB_PATH.name,
                "message": f"An enterprise with GSTIN '{validated.gstin}' is already registered.",
                "message_type": "error"
            })

        # Create vendor in shared database
        pwd_hash = auth.hash_password(validated.password)
        new_vendor = database.create_vendor(
            company_name=validated.company_name,
            gstin=validated.gstin,
            email=validated.email,
            password_hash=pwd_hash,
            contact_phone=validated.contact_phone or "",
            business_type=validated.business_type or "REGULAR",
            address=validated.address or ""
        )

        # Create signed session token & set cookie
        token = auth.create_session_token(new_vendor)
        redir = RedirectResponse(url="/tenders?registered=1", status_code=status.HTTP_303_SEE_OTHER)
        redir.set_cookie(
            key=config.COOKIE_NAME,
            value=token,
            max_age=config.SESSION_TTL_HOURS * 3600,
            httponly=True,
            samesite="lax",
        )
        return redir

    except ValueError as val_err:
        return render(request, "register.html", {
            "current_vendor": None,
            "active_page": "register",
            "db_name": config.DB_PATH.name,
            "message": str(val_err),
            "message_type": "error"
        })
    except Exception as e:
        return render(request, "register.html", {
            "current_vendor": None,
            "active_page": "register",
            "db_name": config.DB_PATH.name,
            "message": f"Registration failed: {str(e)}",
            "message_type": "error"
        })


@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request, next: Optional[str] = None):
    vendor = auth.get_current_vendor(request)
    if vendor:
        return RedirectResponse(url="/tenders", status_code=status.HTTP_302_FOUND)

    return render(request, "login.html", {
        "current_vendor": None,
        "active_page": "login",
        "next_url": next,
        "db_name": config.DB_PATH.name,
        "message": None
    })


@app.post("/login", response_class=HTMLResponse)
def handle_login(
    request: Request,
    response: Response,
    identifier: str = Form(...),
    password: str = Form(...),
    next: Optional[str] = Form(None),
):
    identifier_clean = identifier.strip()
    # Check by email or GSTIN
    vendor = database.get_vendor_by_email(identifier_clean) or database.get_vendor_by_gstin(identifier_clean)

    if not vendor or not auth.verify_password(password, vendor["password_hash"]):
        return render(request, "login.html", {
            "current_vendor": None,
            "active_page": "login",
            "next_url": next,
            "db_name": config.DB_PATH.name,
            "message": "Invalid login credentials. Please verify your email/GSTIN and password.",
            "message_type": "error"
        })


    token = auth.create_session_token(vendor)
    target_url = next if next and next.startswith("/") else "/tenders"
    redir = RedirectResponse(url=target_url, status_code=status.HTTP_303_SEE_OTHER)
    redir.set_cookie(
        key=config.COOKIE_NAME,
        value=token,
        max_age=config.SESSION_TTL_HOURS * 3600,
        httponly=True,
        samesite="lax",
    )
    return redir


@app.get("/logout")
def handle_logout():
    redir = RedirectResponse(url="/login?logged_out=1", status_code=status.HTTP_302_FOUND)
    redir.delete_cookie(config.COOKIE_NAME)
    return redir


@app.get("/tenders", response_class=HTMLResponse)
def list_tenders(request: Request, q: Optional[str] = None, dept: Optional[str] = None):
    vendor = auth.get_current_vendor(request)
    tenders = database.get_active_tenders(search_query=q or "", department_filter=dept or "")
    departments = database.get_all_departments()

    total_val = sum(t["tender_value"] for t in tenders)
    total_val_cr = round(total_val / 10000000, 2)

    msg = None
    msg_type = "info"
    if request.query_params.get("registered"):
        msg = "Enterprise profile registered successfully! Welcome to the GeM Public Procurement Portal."
        msg_type = "success"

    return render(request, "tenders.html", {
        "current_vendor": vendor,
        "active_page": "tenders",
        "tenders": tenders,
        "total_value_cr": total_val_cr,
        "departments": departments,
        "selected_dept": dept or "",
        "query": q or "",
        "db_name": config.DB_PATH.name,
        "message": msg,
        "message_type": msg_type
    })


@app.get("/tenders/{tender_id}", response_class=HTMLResponse)
def tender_detail(request: Request, tender_id: int):
    vendor = auth.get_current_vendor(request)
    tender = database.get_tender_by_id(tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    return render(request, "tender_detail.html", {
        "current_vendor": vendor,
        "active_page": "tenders",
        "tender": tender,
        "db_name": config.DB_PATH.name
    })


@app.get("/apply", response_class=HTMLResponse)
def apply_page(request: Request, tender_id: Optional[int] = None):
    vendor = auth.get_current_vendor(request)
    if not vendor:
        next_target = f"/apply?tender_id={tender_id}" if tender_id else "/apply"
        return RedirectResponse(url=f"/login?next={next_target}", status_code=status.HTTP_302_FOUND)

    tenders = database.get_active_tenders()
    selected_tender = database.get_tender_by_id(tender_id) if tender_id else None

    return render(request, "apply.html", {
        "current_vendor": vendor,
        "active_page": "apply",
        "tenders": tenders,
        "selected_tender_id": tender_id,
        "selected_tender": selected_tender,
        "db_name": config.DB_PATH.name,
        "message": None
    })


@app.post("/apply", response_class=HTMLResponse)
async def handle_bid_submission(
    request: Request,
    tender_id: int = Form(...),
    technical_bid_pdf: UploadFile = File(...),
    financial_bid_pdf: UploadFile = File(...),
    gst_cert_pdf: UploadFile = File(...),
    additional_doc_pdf: Optional[UploadFile] = File(None),
):
    vendor = auth.get_current_vendor(request)
    if not vendor:
        return RedirectResponse(url="/login?next=/apply", status_code=status.HTTP_302_FOUND)

    tenders = database.get_active_tenders()
    target_tender = database.get_tender_by_id(tender_id)
    if not target_tender:
        return render(request, "apply.html", {
            "current_vendor": vendor,
            "active_page": "apply",
            "tenders": tenders,
            "selected_tender_id": tender_id,
            "selected_tender": None,
            "db_name": config.DB_PATH.name,
            "message": "Selected tender does not exist or has expired.",
            "message_type": "error"
        })

    # Validate uploaded files
    required_files = [
        ("Technical Bid Proposal", technical_bid_pdf, "TECHNICAL_PROPOSAL"),
        ("Financial Price Schedule", financial_bid_pdf, "FINANCIAL_BID"),
        ("GST Registration Certificate", gst_cert_pdf, "GST_CERTIFICATE"),
    ]

    saved_doc_records = []
    submission_uuid = uuid.uuid4().hex[:12]

    try:
        # Process each mandatory file
        for label, up_file, classified_type in required_files:
            if not up_file or not up_file.filename:
                raise ValueError(f"{label} is required.")
            if not up_file.filename.lower().endswith(".pdf"):
                raise ValueError(f"{label} must be a PDF document.")

            content = await up_file.read()
            if not content:
                raise ValueError(f"{label} file is empty.")
            if len(content) > config.MAX_FILE_SIZE_MB * 1024 * 1024:
                raise ValueError(f"{label} exceeds maximum allowed size of {config.MAX_FILE_SIZE_MB} MB.")

            # Save securely to local uploads directory
            safe_name = re.sub(r"[^\w.\- ]", "_", Path(up_file.filename).name)[:100]
            stored_filename = f"{submission_uuid}_{classified_type.lower()}_{safe_name}"
            stored_path = config.UPLOAD_DIR / stored_filename
            stored_path.write_bytes(content)

            doc_fields = [
                {"field_name": "company_name", "extracted_value": vendor["company_name"], "value": vendor["company_name"], "confidence": 0.98},
                {"field_name": "gstin", "extracted_value": vendor["gstin"], "value": vendor["gstin"], "confidence": 0.99},
                {"field_name": "pan_number", "extracted_value": vendor.get("pan") or (vendor["gstin"][2:12] if len(vendor["gstin"]) == 15 else ""), "value": vendor.get("pan") or "", "confidence": 0.98},
                {"field_name": "tender_ref", "extracted_value": target_tender["tender_id"], "value": target_tender["tender_id"], "confidence": 0.95},
            ]
            try:
                from backend.app import extraction
                analysis = extraction.analyze_document(stored_path, safe_name, classified_type)
                classified_type = analysis["classified_type"]
                if analysis.get("extracted_fields"):
                    doc_fields = analysis["extracted_fields"]
            except Exception:
                pass

            saved_doc_records.append({
                "file_name": safe_name,
                "stored_path": str(stored_path),
                "file_size_kb": max(1, round(len(content) / 1024)),
                "classified_type": classified_type,
                "extracted_fields": doc_fields
            })


        # Process optional additional document if supplied
        if additional_doc_pdf and additional_doc_pdf.filename:
            add_content = await additional_doc_pdf.read()
            if add_content and additional_doc_pdf.filename.lower().endswith(".pdf"):
                safe_name = re.sub(r"[^\w.\- ]", "_", Path(additional_doc_pdf.filename).name)[:100]
                stored_filename = f"{submission_uuid}_additional_{safe_name}"
                stored_path = config.UPLOAD_DIR / stored_filename
                stored_path.write_bytes(add_content)
                saved_doc_records.append({
                    "file_name": safe_name,
                    "stored_path": str(stored_path),
                    "file_size_kb": max(1, round(len(add_content) / 1024)),
                    "classified_type": "PAST_EXPERIENCE" if vendor.get("business_type") != "MSME" else "MSME_CERTIFICATE",
                    "extracted_fields": []
                })

        # Submit bid into shared SQLite database!
        client_ip = request.client.host if request.client else "127.0.0.1"
        created_bid = database.submit_vendor_bid(
            vendor=vendor,
            tender=target_tender,
            uploaded_docs=saved_doc_records,
            client_ip=client_ip
        )

        return RedirectResponse(url=f"/success?bid_id={created_bid['id']}", status_code=status.HTTP_303_SEE_OTHER)

    except ValueError as ve:
        return render(request, "apply.html", {
            "current_vendor": vendor,
            "active_page": "apply",
            "tenders": tenders,
            "selected_tender_id": tender_id,
            "selected_tender": target_tender,
            "db_name": config.DB_PATH.name,
            "message": str(ve),
            "message_type": "error"
        })
    except Exception as e:
        return render(request, "apply.html", {
            "current_vendor": vendor,
            "active_page": "apply",
            "tenders": tenders,
            "selected_tender_id": tender_id,
            "selected_tender": target_tender,
            "db_name": config.DB_PATH.name,
            "message": f"Bid submission failed: {str(e)}",
            "message_type": "error"
        })



@app.get("/my-bids", response_class=HTMLResponse)
def my_bids(request: Request):
    vendor = auth.get_current_vendor(request)
    if not vendor:
        return RedirectResponse(url="/login?next=/my-bids", status_code=status.HTTP_302_FOUND)

    bids = database.get_vendor_bids(vendor["gstin"])

    return render(request, "my_bids.html", {
        "current_vendor": vendor,
        "active_page": "my_bids",
        "bids": bids,
        "db_name": config.DB_PATH.name
    })


@app.get("/success", response_class=HTMLResponse)
def success_page(request: Request, bid_id: int):
    vendor = auth.get_current_vendor(request)
    if not vendor:
        return RedirectResponse(url=f"/login?next=/success?bid_id={bid_id}", status_code=status.HTTP_302_FOUND)

    bid = database.get_bid_by_id(bid_id)
    if not bid:
        return RedirectResponse(url="/my-bids", status_code=status.HTTP_302_FOUND)

    # Enforce strict vendor ownership: cannot view another company's submission
    if (bid.get("gstin") or "").upper().strip() != vendor["gstin"].upper().strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not have permission to view another company's bid submission."
        )

    bid["documents_count"] = len(bid.get("documents", []))

    return render(request, "success.html", {
        "current_vendor": vendor,
        "active_page": "apply",
        "bid": bid,
        "db_name": config.DB_PATH.name
    })


@app.get("/bids/{bid_id}/receipt", response_class=HTMLResponse)
def print_receipt(request: Request, bid_id: int):
    vendor = auth.get_current_vendor(request)
    if not vendor:
        return RedirectResponse(url=f"/login?next=/bids/{bid_id}/receipt", status_code=status.HTTP_302_FOUND)

    bid = database.get_bid_by_id(bid_id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    # Enforce strict vendor ownership: cannot view another company's receipt
    if (bid.get("gstin") or "").upper().strip() != vendor["gstin"].upper().strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You can only view acknowledgment receipts for your own company's bids."
        )

    return render(request, "receipt.html", {
        "bid": bid,
        "current_vendor": vendor,
        "db_name": config.DB_PATH.name
    })



@app.get("/documents/{doc_id}/download")
def download_document(request: Request, doc_id: int):
    vendor = auth.get_current_vendor(request)
    if not vendor:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required to download bid documents.")

    with database.get_db() as conn:
        doc = conn.execute(
            """SELECT d.*, COALESCE(b.gstin, bd.gstin) AS bid_gstin
               FROM documents d
               JOIN bids b ON d.bid_pk = b.id
               LEFT JOIN bidders bd ON b.bidder_pk = bd.id
               WHERE d.id = ?""",
            (doc_id,)
        ).fetchone()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Enforce strict vendor ownership: cannot download competitor's confidential documents
    if (doc["bid_gstin"] or "").upper().strip() != vendor["gstin"].upper().strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Confidential bid documents can only be downloaded by the submitting company."
        )

    p = Path(doc["stored_path"])
    if not p.exists():
        # Fallback to vendor portal upload dir
        p = config.UPLOAD_DIR / p.name
    if not p.exists():
        raise HTTPException(status_code=404, detail="File binary not found on disk")

    return FileResponse(p, media_type="application/pdf", filename=doc["file_name"])


# -----------------------------------------------------------------------------
# Officer Route Guard (Vendor Portal Isolation)
# -----------------------------------------------------------------------------
@app.get("/bids", response_class=HTMLResponse)
@app.get("/officer", response_class=HTMLResponse)
@app.get("/dashboard", response_class=HTMLResponse)
def officer_route_guard(request: Request):
    """Redirects any attempted officer navigation on vendor portal back to vendor area."""
    vendor = auth.get_current_vendor(request)
    if vendor:
        return RedirectResponse(url="/my-bids", status_code=status.HTTP_302_FOUND)
    return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)


# -----------------------------------------------------------------------------
# Demonstration Sample PDF Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/generate-samples/gst")
def download_sample_gst(request: Request):
    vendor = auth.get_current_vendor(request)
    gstin = vendor["gstin"] if vendor else "27AABCT3421K1Z5"
    company = vendor["company_name"] if vendor else "NexGen Compute Technologies Pvt Ltd"
    pdf_bytes = sample_generator.generate_sample_gst_pdf(gstin=gstin, company_name=company)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=GST_Certificate_Sample.pdf"
    })


@app.get("/api/generate-samples/technical")
def download_sample_tech(request: Request):
    vendor = auth.get_current_vendor(request)
    company = vendor["company_name"] if vendor else "NexGen Compute Technologies Pvt Ltd"
    pdf_bytes = sample_generator.generate_sample_technical_bid_pdf(company_name=company)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=Technical_Bid_Sample.pdf"
    })


@app.get("/api/generate-samples/financial")
def download_sample_fin(request: Request):
    vendor = auth.get_current_vendor(request)
    company = vendor["company_name"] if vendor else "NexGen Compute Technologies Pvt Ltd"
    pdf_bytes = sample_generator.generate_sample_financial_bid_pdf(company_name=company)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=Financial_Bid_Sample.pdf"
    })


# -----------------------------------------------------------------------------
# REST API Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/health")
def api_health():
    return {
        "status": "healthy",
        "service": "GeM Vendor Portal",
        "shared_database_path": str(config.DB_PATH),
        "database_exists": config.DB_PATH.exists(),
        "uploads_dir": str(config.UPLOAD_DIR),
        "port": config.PORT
    }


@app.get("/api/tenders")
def api_list_tenders():
    return database.get_active_tenders()


@app.get("/api/my-bids")
def api_my_bids(vendor: dict = Depends(auth.require_vendor_api)):
    return database.get_vendor_bids(vendor["gstin"])

