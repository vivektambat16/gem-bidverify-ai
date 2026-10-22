"""Configuration settings for GeM Vendor Portal.

Handles database resolution, file upload locations, secret keys,
and interoperability with the Procurement Officer dashboard.
"""
import os
import secrets
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# Shared Database Resolution:
# Priority 1: GEM_DB_PATH environment variable (if explicitly set)
# Priority 2: backend/data/gem_bidverify.db (existing shared database of the project)
# Priority 3: gem_bids.db in project root or vendor_portal
ENV_DB = os.getenv("GEM_DB_PATH")
DEFAULT_PROJECT_DB = PROJECT_ROOT / "backend" / "data" / "gem_bidverify.db"
ROOT_GEM_BIDS_DB = PROJECT_ROOT / "gem_bids.db"
LOCAL_GEM_BIDS_DB = BASE_DIR / "gem_bids.db"

def resolve_db_path() -> Path:
    if ENV_DB:
        p = Path(ENV_DB)
        p.parent.mkdir(parents=True, exist_ok=True)
        return p
    if DEFAULT_PROJECT_DB.exists():
        return DEFAULT_PROJECT_DB
    if ROOT_GEM_BIDS_DB.exists():
        return ROOT_GEM_BIDS_DB
    # Default to project DB location so both systems link immediately
    DEFAULT_PROJECT_DB.parent.mkdir(parents=True, exist_ok=True)
    return DEFAULT_PROJECT_DB

DB_PATH = resolve_db_path()

# Upload directories
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Also detect officer backend uploads dir for cross-system document access
OFFICER_UPLOADS_DIR = PROJECT_ROOT / "backend" / "data" / "uploads"

# Security & Session Settings
SECRET_KEY = os.getenv("VENDOR_SECRET_KEY", "gem-vendor-portal-secret-key-2026-secure-token")
COOKIE_NAME = "gem_vendor_session"
SESSION_TTL_HOURS = 24

# File Upload Constraints
MAX_FILE_SIZE_MB = 25
ALLOWED_EXTENSIONS = {".pdf"}

# Server Settings
HOST = os.getenv("VENDOR_HOST", "127.0.0.1")
PORT = int(os.getenv("VENDOR_PORT", "8001"))
