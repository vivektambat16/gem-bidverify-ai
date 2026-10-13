"""Runtime configuration.

Everything can be overridden with environment variables; the defaults are safe for a
local demo (SQLite file next to the code, OTP shown in the console).
"""
import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("GEM_DATA_DIR", BASE_DIR / "data"))
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = Path(os.getenv("GEM_DB_PATH", DATA_DIR / "gem_bidverify.db"))
for _p in (DATA_DIR, UPLOAD_DIR):
    _p.mkdir(parents=True, exist_ok=True)


def _load_secret() -> str:
    """JWT signing key: from GEM_SECRET_KEY, else generated once and kept in data/secret.key."""
    env = os.getenv("GEM_SECRET_KEY")
    if env:
        return env
    key_file = DATA_DIR / "secret.key"
    if not key_file.exists():
        key_file.write_text(secrets.token_hex(32))
    return key_file.read_text().strip()


SECRET_KEY = _load_secret()
TOKEN_TTL_HOURS = 8

OTP_TTL_SECONDS = 300
OTP_MAX_ATTEMPTS = 5
LOGIN_MAX_FAILURES = 5
LOGIN_LOCK_SECONDS = 300
MIN_PASSWORD_LENGTH = 6

MAX_UPLOAD_MB = 15
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".txt"}

# E-mail (optional). Without SMTP_HOST the OTP is printed in the server console.
SMTP_HOST = os.getenv("GEM_SMTP_HOST", "")
SMTP_PORT = int(os.getenv("GEM_SMTP_PORT", "587"))
SMTP_USER = os.getenv("GEM_SMTP_USER", "")
SMTP_PASSWORD = os.getenv("GEM_SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("GEM_SMTP_FROM", SMTP_USER or "noreply@example.gov.in")
# For local demos the OTP is also returned to the browser when no mail server is set up.
SHOW_OTP_IN_RESPONSE = os.getenv("GEM_SHOW_OTP", "false" if SMTP_HOST else "true").lower() == "true"

DEMO_OFFICER_EMAIL = os.getenv("GEM_DEMO_OFFICER_EMAIL", "officer@example.gov.in")

# OCR
OCR_LANG = os.getenv("GEM_OCR_LANG", "eng")
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")
_WIN_TESSERACT = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if not TESSERACT_CMD and _WIN_TESSERACT.exists():
    TESSERACT_CMD = str(_WIN_TESSERACT)

# If true a GSTIN whose check digit is wrong is treated as a failure (real GSTINs always pass).
STRICT_GSTIN_CHECKSUM = os.getenv("GEM_STRICT_GSTIN", "false").lower() == "true"
