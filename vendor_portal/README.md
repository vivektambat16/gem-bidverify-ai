# GeM BidVerify AI — Vendor e-Bidding Portal

> **National Public Procurement Portal (GeM) — External Vendor Application Suite**  
> Built with **FastAPI**, **Jinja2 HTML5**, and **Tailwind CSS**, operating on a **Shared SQLite Database** linked directly to the Procurement Officer AI Verification Dashboard.

---

## 🏛 Project Context & Purpose

In government procurement under the **General Financial Rules (GFR 2017)**, the procurement lifecycle starts with external companies/vendors discovering active tenders and submitting their technical proposals and compliance certificates. 

The **GeM Vendor Portal** solves this critical link:
1. **External Vendors** can register their corporate identity (GSTIN, PAN, Email, Company Name).
2. **Browse Active Government Tenders** published by Central & State Ministries.
3. **Submit Bids & Upload Compliance Documents** (Technical Proposal PDF, Commercial Bid PDF, Form GST REG-06 Certificate, MSME Udyam Exemption).
4. **Instant Shared Ledger Synchronization**: The moment a vendor submits a bid, it is stored in the shared SQLite database (`gem_bidverify.db`) with status `'Pending AI Verification'`.
5. **Procurement Officer Verification**: The bid immediately appears on the **Procurement Officer Dashboard** (`http://localhost:5173`), where officers can inspect the documents, view OCR extractions, run automated AI compliance scoring, and issue approvals.

---

## 🗂 Complete Folder Structure

```text
gem-bidverify-ai/
├── vendor_portal/                   # 🚀 Dedicated Vendor Application Portal
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                # Database paths, upload constraints, session settings
│   │   ├── database.py              # SQLite storage, schema bootstrap, safe column migrations
│   │   ├── models.py                # Pydantic schemas (VendorRegister, Login, BidSubmission)
│   │   ├── auth.py                  # PBKDF2-HMAC-SHA256 hashing, JWT session cookies
│   │   ├── sample_generator.py      # 1-Click sample PDF generator for easy testing
│   │   └── main.py                  # FastAPI app & all HTML page routes
│   ├── templates/                   # 🎨 Tailwind CSS Styled HTML5 Templates
│   │   ├── base.html                # Master layout with authentic GeM branding & header
│   │   ├── register.html            # Vendor Registration with live GSTIN format validation
│   │   ├── login.html               # Vendor Login with 1-click demo credential filler
│   │   ├── tenders.html             # Active Tenders Dashboard with search & filter
│   │   ├── tender_detail.html       # Tender scope & statutory compliance rules
│   │   ├── apply.html               # PDF Drag-and-drop submission form with validation
│   │   ├── my_bids.html             # Submissions tracking with live status indicators
│   │   ├── success.html             # Submission confirmation & reference receipt
│   │   └── receipt.html             # Printable official statutory acknowledgment slip
│   ├── uploads/                     # Secure local storage for submitted vendor PDFs
│   ├── static/                      # Custom CSS, JS, and portal assets
│   ├── requirements.txt             # Python dependencies (FastAPI, Uvicorn, Jinja2, etc.)
│   ├── run.py                       # Python direct runner (starts on port 8001)
│   └── README.md                    # Documentation & setup guide
├── backend/                         # 🛡️ Procurement Officer Backend API (Port 8000)
│   ├── data/
│   │   ├── gem_bidverify.db         # 🗄️ SHARED SQLite DATABASE (Used by both portals!)
│   │   └── uploads/                 # Synced document storage for officer inspection
│   └── app/                         # Officer API, AI extraction, and rule engine
├── src/                             # 🖥️ Procurement Officer Frontend (Port 5173 - React/Vite)
├── start-vendor-portal.bat          # 1-Click launcher for Vendor Portal (Port 8001)
├── start-backend.bat                # 1-Click launcher for Officer Backend (Port 8000)
├── start-frontend.bat               # 1-Click launcher for Officer Frontend (Port 5173)
└── start-all.bat                    # 🌟 1-Click launcher for ALL THREE services together
```

---

## ⚡ Quick Start & How to Run

### Option 1: Start Everything with 1-Click (Recommended for Demo)
Double-click `start-all.bat` in the project root:
- **Vendor Portal**: `http://127.0.0.1:8001`
- **Procurement Officer Dashboard**: `http://127.0.0.1:5173`
- **Officer Backend API**: `http://127.0.0.1:8000`

### Option 2: Run Vendor Portal Manually via Command Line
```powershell
# From the project root:
cd vendor_portal

# Install dependencies:
pip install -r requirements.txt

# Start the FastAPI Vendor Portal server:
python run.py
```
The Vendor Portal is now accessible at **`http://127.0.0.1:8001`**.

---

## 🧪 Demonstration Workflow for Your Professor

1. **Open the Vendor Portal** at `http://127.0.0.1:8001`.
2. **Sign In or Register**:
   - Click **"Sign In"** and press **"Use →"** on the pre-configured enterprise (`bids@nexgencompute.in` / `Vendor@2026`).
   - *OR* Click **"Register Company"**, enter a new entity name, and use the **"⚡ Auto-Fill Demo Enterprise"** shortcut.
3. **Browse Active Tenders**:
   - View open tenders such as `GEM/2026/B/89201` (Cloud Infrastructure) or `GEM/2026/B/45210` (AI Analytics).
   - Click **"Apply Now"** on any active tender.
4. **Upload Compliance PDFs**:
   - The form provides 1-click download buttons (`⬇ Sample GST`, `⬇ Sample Tech Bid`, `⬇ Sample Fin Bid`) so you never have to search for PDFs.
   - Attach the three required PDF documents and click **"Submit Tender Bid"**.
5. **View Instant Submission Receipt**:
   - Receive the unique reference code (e.g. `BID/89201/NEX-01`) and print the official statutory acknowledgment.
6. **Switch to Officer Dashboard (`http://127.0.0.1:5173/bids`)**:
   - **Notice the magic:** The newly submitted bid appears **instantly** at the top of the table with status **"Pending AI Verification"** and 3 documents attached!
   - Click **"Verify Bid"** to run the AI compliance engine, inspect the documents, and sign off the procurement decision.
