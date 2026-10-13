# GeM BidVerify AI

AI-powered bid compliance verification portal for GeM (Government e-Marketplace) procurement.

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts (folder `src/`)
- **Backend:** FastAPI + SQLite, OCR (Tesseract), rule engine, hash-chained audit trail (folder `backend/`)

## Quick start on Windows

Needs Node.js (LTS) and Python 3.10+.

1. Double-click `start-all.bat` (or run `start-backend.bat` and `start-frontend.bat` separately).
   The first run installs the packages, so it takes a few minutes.
2. Open http://localhost:5173
3. Sign in with `officer` / `demo123` (no OTP step; sign-in is username and password only).

API documentation (interactive): http://127.0.0.1:8000/docs

## Optional: scanned documents and photos (OCR)

PDFs that contain real text work out of the box. For scanned PDFs and photos install Tesseract:
download the Windows installer from the "UB Mannheim" build of Tesseract, install it in the default
folder (`C:\Program Files\Tesseract-OCR`) and restart the backend. It is detected automatically.

## Offline demo mode (no backend)

Create a file named `.env.development.local` next to `package.json` containing
`VITE_API_MODE=mock`, then run `npm run dev`. Data is then kept in the browser only.
`npm run build` makes a single offline `dist/index.html`.

## Folder structure

```
src/        React app: pages, components, context, api (httpApi = real server, mockApi = offline)
backend/    FastAPI server (see backend/README.md)
start-*.bat Windows launchers
```

## What is real and what is simulated

Real: accounts and password hashing, OTP login, database, document upload, OCR and field
extraction, classification, the compliance rule engine and scoring, officer overrides and decisions,
and the tamper-evident audit trail. Simulated: the live connections to GSTN, Income Tax (PAN),
MCA21, CPPP and other government portals. They sit behind adapters in `backend/app/adapters.py`
that return demo data, so real APIs can be plugged in later if access is granted.

## Before sharing or submitting

Replace the demo officer details and set your own `GEM_SECRET_KEY` (see backend/README.md).
