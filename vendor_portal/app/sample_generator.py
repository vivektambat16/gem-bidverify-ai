"""Utility to generate sample compliance PDFs for demonstration testing.

Allows the student or evaluating professor to download and upload authentic
test documents (GST Certificate, Technical Proposal, Financial Schedule)
without needing to locate random PDFs on their local machine.
"""
import io
from typing import Dict

try:
    from reportlab.lib.colors import HexColor
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


def generate_sample_gst_pdf(gstin: str = "27AABCT3421K1Z5", company_name: str = "NexGen Compute Technologies Pvt Ltd") -> bytes:
    """Generates an authentic looking Form GST REG-06 Certificate of Registration."""
    buf = io.BytesIO()
    if HAS_REPORTLAB:
        c = canvas.Canvas(buf, pagesize=letter)
        w, h = letter

        # Header Banner
        c.setFillColor(HexColor("#003366"))
        c.rect(0, h - 70, w, 70, fill=True, stroke=False)
        c.setFillColor(HexColor("#ffffff"))
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(w / 2, h - 35, "GOVERNMENT OF INDIA")
        c.setFont("Helvetica", 10)
        c.drawCentredString(w / 2, h - 50, "CENTRAL BOARD OF INDIRECT TAXES AND CUSTOMS")

        # Title
        c.setFillColor(HexColor("#0a2540"))
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(w / 2, h - 105, "FORM GST REG-06")
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(w / 2, h - 122, "REGISTRATION CERTIFICATE")

        # Table Box
        c.setStrokeColor(HexColor("#cbd5e1"))
        c.setLineWidth(1)
        c.rect(50, h - 450, w - 100, 300)

        # Content rows
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(HexColor("#1e293b"))
        y = h - 160

        rows = [
            ("Registration Number (GSTIN):", gstin),
            ("Legal Name of Enterprise:", company_name),
            ("Trade Name:", company_name),
            ("Constitution of Business:", "Private Limited Company"),
            ("Address of Principal Place:", "Tower B, Cyber City, Phase II, Mumbai - 400051"),
            ("Date of Liability:", "01/07/2017"),
            ("Period of Validity:", "From: 01/07/2017  To: Regular / Ongoing"),
            ("Type of Registration:", "Regular Taxpayer"),
            ("Jurisdictional Office:", "Range-IV, Division-II, Mumbai East"),
        ]

        for label, val in rows:
            c.setFont("Helvetica-Bold", 9)
            c.drawString(65, y, label)
            c.setFont("Helvetica", 9)
            c.drawString(240, y, val)
            c.setStrokeColor(HexColor("#f1f5f9"))
            c.line(60, y - 6, w - 60, y - 6)
            y -= 30

        # Footer Signoff
        c.setFillColor(HexColor("#475569"))
        c.setFont("Helvetica", 8)
        c.drawString(65, 80, "Digitally Verified & Issued by Government of India Goods and Services Tax Network (GSTN).")
        c.drawString(65, 68, "Statutory compliance valid under Rule 10(1) of CGST Rules, 2017.")

        # Digital Seal Box
        c.setStrokeColor(HexColor("#0066cc"))
        c.rect(w - 180, 55, 120, 60)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#0066cc"))
        c.drawCentredString(w - 120, 95, "[ GSTN VERIFIED ]")
        c.setFont("Helvetica", 7)
        c.drawCentredString(w - 120, 80, "SHA-256 Validated")
        c.drawCentredString(w - 120, 68, "Status: ACTIVE")

        c.save()
        return buf.getvalue()
    else:
        # Fallback minimal valid PDF binary
        return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"


def generate_sample_technical_bid_pdf(company_name: str = "NexGen Compute Technologies Pvt Ltd") -> bytes:
    """Generates an authentic Technical Bid Proposal PDF."""
    buf = io.BytesIO()
    if HAS_REPORTLAB:
        c = canvas.Canvas(buf, pagesize=letter)
        w, h = letter

        c.setFillColor(HexColor("#0f172a"))
        c.rect(0, h - 70, w, 70, fill=True, stroke=False)
        c.setFillColor(HexColor("#ffffff"))
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(w / 2, h - 35, "TECHNICAL BID PROPOSAL & SLA COMPLIANCE")
        c.setFont("Helvetica", 9)
        c.drawCentredString(w / 2, h - 50, "SUBMITTED FOR GOVERNMENT e-MARKETPLACE (GeM) TENDER")

        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, h - 100, f"Bidder: {company_name}")
        c.setFont("Helvetica", 9)
        c.drawString(50, h - 116, "Ref: Technical Compliance Envelope · GFR 2017 Rule 149")

        c.setStrokeColor(HexColor("#cbd5e1"))
        c.rect(50, h - 550, w - 100, 410)

        sections = [
            ("1. System Architecture & Datacenter Tier", "Tier-3 Datacenter certification compliance confirmed with MeitY empanelment."),
            ("2. High Availability & SLA Commitment", "99.95% Annual uptime guarantee backed by financial credit SLA matrix."),
            ("3. Information Security & Compliance", "ISO 27001:2022, ISO 9001:2015, SOC 2 Type II certified infrastructure."),
            ("4. Data Sovereignty & GFR Compliance", "100% of telemetry, primary compute, and disaster recovery resides inside India."),
            ("5. Scalability & Hypervisor Support", "KVM/OpenStack compute fabric with bare-metal clustering capabilities."),
            ("6. 24x7 Enterprise Incident Support", "Level 3 NOC & SOC engineers available with 15-minute P1 incident response time."),
            ("7. Past Performance Government Record", "Successfully executed 3 large-scale IT projects for Central & State PSUs."),
        ]

        y = h - 150
        for title, desc in sections:
            c.setFont("Helvetica-Bold", 10)
            c.setFillColor(HexColor("#003366"))
            c.drawString(65, y, title)
            c.setFont("Helvetica", 9)
            c.setFillColor(HexColor("#334155"))
            c.drawString(65, y - 16, desc)
            c.setStrokeColor(HexColor("#e2e8f0"))
            c.line(60, y - 26, w - 60, y - 26)
            y -= 52

        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#059669"))
        c.drawString(65, 80, "✓ Complete Technical Bid Specifications Accepted & Verified by Authorized Signatory.")

        c.save()
        return buf.getvalue()
    else:
        return generate_sample_gst_pdf()


def generate_sample_financial_bid_pdf(company_name: str = "NexGen Compute Technologies Pvt Ltd") -> bytes:
    """Generates an authentic Commercial Price Bid PDF."""
    buf = io.BytesIO()
    if HAS_REPORTLAB:
        c = canvas.Canvas(buf, pagesize=letter)
        w, h = letter

        c.setFillColor(HexColor("#047857"))
        c.rect(0, h - 70, w, 70, fill=True, stroke=False)
        c.setFillColor(HexColor("#ffffff"))
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(w / 2, h - 35, "COMMERCIAL & FINANCIAL PRICE BID SCHEDULE")
        c.setFont("Helvetica", 9)
        c.drawCentredString(w / 2, h - 50, "BILL OF QUANTITIES (BOQ) · GeM PUBLIC PROCUREMENT")

        c.setFillColor(HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, h - 100, f"Bidder: {company_name}")
        c.setFont("Helvetica", 9)
        c.drawString(50, h - 116, "Priced Schedule Envelope · Inclusive of All Taxes (INR)")

        c.setStrokeColor(HexColor("#cbd5e1"))
        c.rect(50, h - 450, w - 100, 310)

        items = [
            ("Item 1: Enterprise Cloud Compute Instances (100 Nodes)", "INR 1,80,00,000.00"),
            ("Item 2: NVMe High-Speed Storage Subsystem (200 TB)", "INR 85,00,000.00"),
            ("Item 3: Multi-Gigabit Managed Network Fabric & Firewalls", "INR 65,00,000.00"),
            ("Item 4: 24x7 Managed Infrastructure & SRE Operations", "INR 50,00,000.00"),
            ("Item 5: Implementation, Migration & DR Drill Support", "INR 40,00,000.00"),
            ("Sub-Total Commercial Proposal:", "INR 4,20,00,000.00"),
            ("Applicable GST @ 18%:", "INR 75,60,000.00"),
            ("TOTAL CONTRACT VALUE (INCLUSIVE OF GST):", "INR 4,95,60,000.00"),
        ]

        y = h - 150
        for item, price in items:
            is_total = "TOTAL" in item
            c.setFont("Helvetica-Bold" if is_total else "Helvetica", 9)
            c.setFillColor(HexColor("#0f172a") if is_total else HexColor("#334155"))
            c.drawString(65, y, item)
            c.setFont("Helvetica-Bold", 9)
            c.drawRightString(w - 65, y, price)
            c.setStrokeColor(HexColor("#cbd5e1") if is_total else HexColor("#f1f5f9"))
            c.line(60, y - 6, w - 60, y - 6)
            y -= 34

        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#047857"))
        c.drawString(65, 80, "✓ Prices firm and fixed for the entire contract period under GFR 2017 provisions.")

        c.save()
        return buf.getvalue()
    else:
        return generate_sample_gst_pdf()
