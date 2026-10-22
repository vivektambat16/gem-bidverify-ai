"""GeM BidVerify AI - HTTP API.

Run from the backend folder:   uvicorn app.main:app --reload --port 8000
Interactive docs:              http://localhost:8000/docs
All endpoints live under /api and (except /api/auth/* and /api/health) need a Bearer token.
"""
from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, File, Form, Header, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from . import db, services
from .services import ServiceError

app = FastAPI(title="GeM BidVerify AI", version="2.0.0",
              description="AI-assisted bid compliance verification for GeM procurement officers.")
# The API uses bearer tokens (no cookies), so a permissive CORS policy is safe for local use.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def _startup():
    db.init_db()


@app.exception_handler(ServiceError)
async def _service_error(_: Request, exc: ServiceError):
    return JSONResponse(status_code=exc.status, content={"detail": exc.message})


def current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ServiceError(401, "Authentication required.")
    return services.user_from_token(authorization.split(" ", 1)[1].strip())


def require_officer(user: dict = Depends(current_user)) -> dict:
    role = (user.get("role") or "").strip()
    ALLOWED_OFFICER_ROLES = {"Procurement Officer", "Evaluation Cell Lead", "Vigilance Officer", "admin", "Super Admin"}
    if role not in ALLOWED_OFFICER_ROLES:
        raise ServiceError(403, "Access denied: This operation requires an authorized Procurement Officer role.")
    return user



# ----------------------------------------------------------------------------- request models
class LoginIn(BaseModel):
    username: str
    password: str


class OtpRequestIn(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None


class Verify2FAIn(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    otp: str


class ResetPasswordIn(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    otp: str
    new_password: str


class RegisterIn(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: str
    password: str
    department: Optional[str] = None
    phone: Optional[str] = None


class RequirementIn(BaseModel):
    requirement_code: str
    requirement_name: str
    is_mandatory: bool = True
    verification_source: Optional[str] = None
    min_condition: Optional[str] = None
    weight: float = 10
    applicable_bidder_type: Optional[str] = "ALL"


class TenderIn(BaseModel):
    tender_id: Optional[str] = None
    title: str
    department: Optional[str] = ""
    tender_value: Optional[float] = None
    deadline: Optional[str] = None
    description: Optional[str] = ""
    requirements: List[RequirementIn] = []


class BidderIn(BaseModel):
    company_name: str
    cin: Optional[str] = None
    pan: Optional[str] = ""
    gstin: Optional[str] = None
    registered_address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_msme: bool = False
    msme_reg_no: Optional[str] = None
    is_startup: bool = False
    startup_dipp_no: Optional[str] = None


class BidIn(BaseModel):
    tender_id: int
    bidder_id: int


class ComplianceUpdateIn(BaseModel):
    points_awarded: float
    status: Literal["VERIFIED", "MISMATCH", "NON_COMPLIANT"]
    explanation: Optional[str] = None


class DecisionIn(BaseModel):
    decision: Literal["APPROVED", "REJECTED", "REQUIRES_CLARIFICATION"]
    comments: Optional[str] = ""
    clarification_details: Optional[str] = None


def _dump(model) -> dict:
    return model.model_dump() if hasattr(model, "model_dump") else model.dict()


# ----------------------------------------------------------------------------- health + auth
@app.get("/api/health")
def health():
    from . import extraction
    return {"status": "ok", "ocr_available": extraction.ocr_available()}


@app.post("/api/auth/login")
def login(body: LoginIn, request: Request):
    return services.login(body.username, body.password, request.client.host if request.client else "unknown")


@app.post("/api/auth/send-otp")
def send_otp(body: OtpRequestIn):
    return services.send_otp(body.username, body.email)


@app.post("/api/auth/verify-2fa")
def verify_2fa(body: Verify2FAIn):
    return services.verify_otp(body.username, body.email, body.otp)


@app.post("/api/auth/reset-password")
def reset_password(body: ResetPasswordIn):
    return services.reset_password(body.username, body.email, body.otp, body.new_password)


@app.post("/api/auth/register")
def register(body: RegisterIn, admin_user: dict = Depends(require_officer)):
    return services.register(_dump(body), authorized_by=admin_user)


@app.get("/api/auth/me")
def me(user: dict = Depends(current_user)):
    return services._public_user(user)


# ----------------------------------------------------------------------------- dashboard
@app.get("/api/dashboard")
def dashboard(user: dict = Depends(require_officer)):
    return services.dashboard()


# ----------------------------------------------------------------------------- tenders / bidders
@app.get("/api/tenders")
def list_tenders(user: dict = Depends(require_officer)):
    return services.list_tenders()


@app.get("/api/tenders/{tender_ref}")
def get_tender(tender_ref: str, user: dict = Depends(require_officer)):
    return services.get_tender(tender_ref)


@app.post("/api/tenders")
def create_tender(body: TenderIn, user: dict = Depends(require_officer)):
    return services.create_tender(_dump(body), user)


@app.post("/api/tenders/{tender_id}/requirements")
def add_requirement(tender_id: int, body: RequirementIn, user: dict = Depends(require_officer)):
    return services.add_requirement(tender_id, _dump(body), user)


@app.get("/api/bidders")
def list_bidders(user: dict = Depends(require_officer)):
    return services.list_bidders()


@app.post("/api/bidders")
def create_bidder(body: BidderIn, user: dict = Depends(require_officer)):
    return services.create_bidder(_dump(body), user)


# ----------------------------------------------------------------------------- bids
@app.get("/api/bids")
def list_bids(tender_id: Optional[int] = Query(None), user: dict = Depends(require_officer)):
    return services.list_bids(tender_id)


@app.get("/api/bids/{bid_ref}")
def get_bid(bid_ref: str, user: dict = Depends(require_officer)):
    return services.get_bid(bid_ref)


@app.post("/api/bids")
def create_bid(body: BidIn, user: dict = Depends(require_officer)):
    return services.create_bid(body.tender_id, body.bidder_id, user)


@app.post("/api/bids/{bid_ref}/documents")
def upload_document(bid_ref: str, file: UploadFile = File(...), classified_type_hint: Optional[str] = Form(None),
                    user: dict = Depends(require_officer)):
    return services.upload_document(bid_ref, file.filename, file.file.read(), classified_type_hint, user)


@app.delete("/api/bids/{bid_ref}/documents/{doc_id}")
def delete_document(bid_ref: str, doc_id: int, user: dict = Depends(require_officer)):
    return services.delete_document(bid_ref, doc_id, user)


@app.get("/api/documents/{doc_id}/file")
def download_document(doc_id: int, user: dict = Depends(require_officer)):
    path, name = services.document_file(doc_id)
    return FileResponse(path, filename=name)


@app.put("/api/bids/{bid_ref}/compliance/{result_id}")
def update_compliance(bid_ref: str, result_id: int, body: ComplianceUpdateIn, user: dict = Depends(require_officer)):
    return services.update_compliance_result(bid_ref, result_id, _dump(body), user)


@app.post("/api/bids/{bid_ref}/verify")
def verify_bid(bid_ref: str, user: dict = Depends(require_officer)):
    return services.verify_bid(bid_ref, user)


@app.post("/api/bids/{bid_ref}/decision")
def decision(bid_ref: str, body: DecisionIn, user: dict = Depends(require_officer)):
    return services.submit_decision(bid_ref, _dump(body), user)


# ----------------------------------------------------------------------------- integrations (simulated)
@app.get("/api/integrations/status")
def integrations_status(user: dict = Depends(require_officer)):
    return services.integrations_status()


@app.post("/api/integrations/test-gst")
def test_gst(gstin: str, user: dict = Depends(require_officer)):
    from . import adapters
    return adapters.lookup_gst(gstin)


@app.post("/api/integrations/test-pan")
def test_pan(pan: str, user: dict = Depends(require_officer)):
    from . import adapters
    return adapters.lookup_pan(pan)


@app.post("/api/integrations/test-debarment")
def test_debarment(company_name: str, pan: str = "", user: dict = Depends(require_officer)):
    from . import adapters
    return adapters.check_debarment(company_name, pan)


# ----------------------------------------------------------------------------- audit / notifications / admin
@app.get("/api/audit")
def audit(user: dict = Depends(require_officer)):
    return services.audit_logs()


@app.get("/api/audit/verify")
def audit_verify(user: dict = Depends(require_officer)):
    return services.audit_verify()


@app.get("/api/notifications")
def notifications(user: dict = Depends(require_officer)):
    return services.notifications()


@app.post("/api/notifications/{notification_id}/read")
def read_notification(notification_id: int, user: dict = Depends(require_officer)):
    return services.mark_notification_read(notification_id)


@app.get("/api/admin/export")
def export_data(user: dict = Depends(require_officer)):
    return services.export_data()


@app.post("/api/admin/reset-demo")
def reset_demo(user: dict = Depends(require_officer)):
    return services.reset_demo(user)
