"""Authentication, password security, and session management for GeM Vendor Portal."""
import base64
import hashlib
import hmac
import secrets
import time
from typing import Any, Dict, Optional

import jwt
from fastapi import HTTPException, Request, status
from fastapi.responses import RedirectResponse

from . import config, database

_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    """Standard PBKDF2-HMAC-SHA256 password hashing."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        _ITERATIONS, base64.b64encode(salt).decode(), base64.b64encode(digest).decode()
    )


def verify_password(password: str, stored_hash: str) -> bool:
    """Verifies candidate password against stored hash."""
    try:
        parts = stored_hash.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = base64.b64decode(parts[2])
        expected_digest = base64.b64decode(parts[3])
        actual_digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
        return hmac.compare_digest(actual_digest, expected_digest)
    except Exception:
        return False


def create_session_token(vendor: Dict[str, Any]) -> str:
    """Creates a signed JWT session token with explicit vendor role."""
    now = int(time.time())
    payload = {
        "sub": str(vendor["id"]),
        "email": vendor["email"],
        "company_name": vendor["company_name"],
        "gstin": vendor["gstin"],
        "role": "vendor",
        "iat": now,
        "exp": now + (config.SESSION_TTL_HOURS * 3600),
    }
    return jwt.encode(payload, config.SECRET_KEY, algorithm="HS256")


def decode_session_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates JWT session token."""
    try:
        return jwt.decode(token, config.SECRET_KEY, algorithms=["HS256"])
    except (jwt.PyJWTError, Exception):
        return None


def get_current_vendor(request: Request) -> Optional[Dict[str, Any]]:
    """Retrieves current logged-in vendor from cookie or bearer token, else None."""
    token = request.cookies.get(config.COOKIE_NAME)
    if not token:
        # Check Authorization header as fallback
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        return None

    payload = decode_session_token(token)
    if not payload or "sub" not in payload:
        return None

    # Strict role verification: token must have role 'vendor'
    if payload.get("role") and payload.get("role") != "vendor":
        return None

    try:
        vendor_id = int(payload["sub"])
        vendor = database.get_vendor_by_id(vendor_id)
        if vendor:
            vendor["role"] = "vendor"
        return vendor
    except Exception:
        return None


def require_vendor_redirect(request: Request) -> Dict[str, Any]:
    """Dependency that ensures vendor is logged in; raises redirect exception if not."""
    vendor = get_current_vendor(request)
    if not vendor:
        # Save intended destination
        redirect_url = f"/login?next={request.url.path}"
        raise HTTPException(
            status_code=status.HTTP_303_SEE_OTHER,
            headers={"Location": redirect_url}
        )
    return vendor


def require_vendor_api(request: Request) -> Dict[str, Any]:
    """Dependency for API endpoints that returns JSON 401 when unauthorized."""
    vendor = get_current_vendor(request)
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to the Vendor Portal."
        )
    return vendor

