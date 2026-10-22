# Copyright Filing Guide: GeM-BidVerify AI
**Registration of Copyright in a Computer Programme (Software)**

---

## 📁 1. Files Ready in Your `copyright_filing/` Folder

| File Name | Purpose / What to do with it |
| :--- | :--- |
| **`GeM-BidVerify-AI_source-code_FIRST10_LAST10.pdf`** | **🔥 THIS IS THE EXACT FILE TO UPLOAD** on the copyright portal. Contains the first 10 and last 10 pages (20 pages total) of source code with authentic line numbers and file headers. |
| **`GeM-BidVerify-AI_Copyright_Statement_of_Particulars.pdf`** | **Form XIV Statement of Particulars & Synopsis**. Print, sign, and keep ready if asked to upload/send hard copy. |
| **`GeM-BidVerify-AI_source-code_FULL.pdf`** | Complete unredacted repository source code (189 pages, 65 files, 13,800+ lines). Keep for records or burn to CD/DVD if requested by the registrar. |
| **`SOURCE_MANIFEST.txt`** | Cryptographic audit trail containing SHA-256 integrity hashes for each individual file in the code repository. |

---

## 📋 2. Form XIV & Portal Fields (Copy-Paste Reference)

When filling the online application on **[copyright.gov.in](https://copyright.gov.in)** (e-Filing Portal):

### Basic Details
* **Class of Work:** `Computer Software` (Under Literary Work, Sec 2(o) of Copyright Act, 1957)
* **Title of Work:** `GeM BidVerify AI — Automated Public Procurement Compliance & Verification Suite`
* **Language of Work:** `Python 3.11, JavaScript (ES6+), React 18, JSX, HTML5, CSS3, SQL`
* **Status:** `Unpublished` (or `Published` if you have deployed it to a public domain / URL)
* **Year of Completion / Creation:** `2026`

### Author & Applicant Particulars
* **Author 1:**
  * **Name:** Vivek Tambat
  * **Nationality:** Indian
  * **Address:** (Your residential or institutional address)
* **Author 2:**
  * **Name:** Priyansh Jain
  * **Nationality:** Indian
  * **Address:** (Your residential or institutional address)
* **Applicant's Interest:** `Author and Absolute Owner`

### Statement of Further Particulars (Technical Specifics)
* **Is the work original?** `Yes. Original computer software programme.`
* **Operating Environment & Hardware Requirements:**
  ```text
  Hardware: 64-bit multi-core CPU (x86_64 or ARM64), 4 GB RAM, 2 GB free disk storage.
  Operating System: Platform independent (Windows 10/11, Linux Ubuntu 20.04+, macOS 12+).
  Languages & Runtimes: Python 3.10+, Node.js 18+, SQLite3 (WAL Mode).
  Key Libraries: FastAPI, React 18, Vite, PDFPlumber, Tesseract OCR, PyJWT.
  ```
* **Brief Synopsis / Abstract of the Software:**
  ```text
  GeM BidVerify AI is an automated public procurement compliance verification platform designed in accordance with Rule 149 of the General Financial Rules (GFR 2017) and Government e-Marketplace (GeM) Special Purpose Vehicle guidelines. The system features a decoupled dual-portal architecture comprising an external Vendor Bid Gateway and an internal Procurement Officer Verification Platform, synchronized via an ACID-compliant SQLite ledger. It automates technical bid evaluation by performing layout-aware OCR and document parsing on statutory envelopes (GST REG-06, PAN, Udyam MSME certificates, OEM authorisations, and audited balance sheets), validating statutory identifiers against deterministic rule matrices, computing mathematical compliance scores and risk indices, and cryptographically recording all officer verifications and overrides in a forward-secure, SHA-256 hash-chained audit ledger to guarantee non-repudiation.
  ```

---

## 🚀 3. Step-by-Step Filing Procedure (Indian Copyright Office)

1. **Create an Account:**
   * Go to **[https://copyright.gov.in](https://copyright.gov.in)**.
   * Click on **"New User Registration"** (or Log in if already registered).
2. **Start New Application:**
   * Click **"Click for Online Copyright Registration"**.
   * Select **"Form XIV (Application for Registration of Copyright)"**.
3. **Fill Form XIV & Statement of Particulars:**
   * Use the copy-paste text provided in Section 2 above.
   * In applicant/author section, add the names (Vivek Tambat & Priyansh Jain).
4. **Upload Work (Source Code):**
   * Under the **Upload Work** section, upload:
     👉 **`GeM-BidVerify-AI_source-code_FIRST10_LAST10.pdf`**
   * *Note:* Under Indian Copyright Rule 70(6), for software programs exceeding 20 pages, depositing the **first 10 and last 10 pages** of the unredacted source code in PDF format is the standard legal procedure.
5. **Pay Statutory Fee:**
   * Statutory government fee for Computer Software / Literary work (₹500 for Individual / Startups / SMEs).
   * Pay online via Bharatkosh / NetBanking / Debit Card / UPI.
6. **Download Acknowledgment & Diary Number:**
   * Immediately note down your **Diary Number** (e.g., `12345/2026-CO/L`).
   * Download the generated **Acknowledgement Slip** and **Form XIV copy**.
7. **Physical Dispatch (If required by the portal):**
   * Sign the generated Form XIV.
   * Attach the Acknowledgement slip and a copy of the Statement of Particulars (`GeM-BidVerify-AI_Copyright_Statement_of_Particulars.pdf`).
   * Send via Speed Post to the Copyright Office address (New Delhi) if prompted, or track online until the 30-day mandatory waiting period passes.

---

## 🛡️ 4. Code Cleanliness & Non-Redaction Rule
The Copyright Office mandates that submitted source code must **not be blacked out or redacted**. All credentials, API tokens, and passwords have been kept dummy/mock (`demo123`, `gem_officer_token_standalone_2026`) and personal email strings have been replaced with standard institutional addresses.
