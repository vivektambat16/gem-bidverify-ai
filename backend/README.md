# Backend

FastAPI application with a SQLite database. Start it from the project root with `start-backend.bat`,
or manually:

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The database and uploaded files are created in `backend/data/` on first start (demo records are seeded).

## Modules

| File | Purpose |
|---|---|
| `app/main.py` | HTTP routes (`/api/...`), authentication dependency, CORS |
| `app/services.py` | business logic: auth/OTP, tenders, bidders, bids, documents, decisions, audit |
| `app/rules.py` | compliance rule engine: scores each tender requirement, risk level, recommendation |
| `app/extraction.py` | text from PDF/image (PDF text layer or Tesseract OCR), document classification, field extraction |
| `app/adapters.py` | simulated government connectors (GSTN, PAN, debarment) |
| `app/security.py` | password hashing, signed tokens |
| `app/db.py` | schema, seeding, hash-chained audit log |
| `app/config.py` | settings read from environment variables |
| `tests/` | `python tests/test_backend.py` (logic) and `python tests/test_routes_stub.py` (route wiring) |

## Settings (environment variables)

`GEM_SECRET_KEY` token signing key (generated and stored in `data/secret.key` if not set),
`GEM_SMTP_HOST`, `GEM_SMTP_PORT`, `GEM_SMTP_USER`, `GEM_SMTP_PASSWORD`, `GEM_SMTP_FROM` (send OTP by e-mail;
without them the OTP is printed in the console), `GEM_DEMO_OFFICER_EMAIL`, `TESSERACT_CMD`,
`GEM_DATA_DIR`, `GEM_STRICT_GSTIN`.
