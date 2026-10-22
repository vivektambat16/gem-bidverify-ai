"""
Generates the formal Form XIV & Statement of Particulars / Filing Dossier PDF
for the Indian Copyright Office (copyright.gov.in) application.
"""
import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT_DIR = os.path.join(ROOT, 'copyright_filing')

def build_pdf():
    os.makedirs(OUT_DIR, exist_ok=True)
    pdf_path = os.path.join(OUT_DIR, 'GeM-BidVerify-AI_Copyright_Statement_of_Particulars.pdf')

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        alignment=1 # Center
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#334155'),
        alignment=1
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=12,
        spaceAfter=6
    )
    cell_label = ParagraphStyle(
        'CellLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1E293B')
    )
    cell_val = ParagraphStyle(
        'CellVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    body_text = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1E293B')
    )

    story = []

    # Header / Title
    story.append(Paragraph("GOVERNMENT OF INDIA &mdash; COPYRIGHT OFFICE", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("REGISTRATION OF COPYRIGHT IN A COMPUTER PROGRAMME", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("[Form XIV &bull; Rule 70 of the Copyright Rules, 2013 &bull; Section 2(o) of The Copyright Act, 1957]", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1E3A8A'), spaceAfter=14))

    # Statement of Particulars Table
    story.append(Paragraph("PART I: STATEMENT OF PARTICULARS", section_heading))

    sop_data = [
        [Paragraph("Col No.", cell_label), Paragraph("Particulars Required", cell_label), Paragraph("Details Provided by Applicant", cell_label)],
        [
            Paragraph("1", cell_val),
            Paragraph("Registration Number", cell_val),
            Paragraph("(To be allotted by the Copyright Office upon submission / Diary No.)", cell_val)
        ],
        [
            Paragraph("2", cell_val),
            Paragraph("Name, Address &amp; Nationality of the Applicant", cell_val),
            Paragraph("<b>1. Vivek Tambat</b><br/>Nationality: Indian<br/><b>2. Priyansh Jain</b><br/>Nationality: Indian", cell_val)
        ],
        [
            Paragraph("3", cell_val),
            Paragraph("Nature of the Applicant's interest in the copyright of the work", cell_val),
            Paragraph("<b>Author(s) &amp; Absolute Owner(s)</b> of the original computer programme", cell_val)
        ],
        [
            Paragraph("4", cell_val),
            Paragraph("Class of the work", cell_val),
            Paragraph("<b>Computer Software Work</b> (Literary Work under Section 2(o) of Copyright Act, 1957)", cell_val)
        ],
        [
            Paragraph("5", cell_val),
            Paragraph("Title of the work", cell_val),
            Paragraph("<b>GeM BidVerify AI &mdash; Automated Public Procurement Compliance &amp; Verification Suite</b>", cell_val)
        ],
        [
            Paragraph("6", cell_val),
            Paragraph("Language(s) of the work", cell_val),
            Paragraph("<b>Python 3.11, JavaScript (ES6+), React 18 / JSX, HTML5, CSS3, SQL</b>", cell_val)
        ],
        [
            Paragraph("7", cell_val),
            Paragraph("Name, Address &amp; Nationality of the Author(s)", cell_val),
            Paragraph("<b>1. Vivek Tambat</b> (Indian)<br/><b>2. Priyansh Jain</b> (Indian)", cell_val)
        ],
        [
            Paragraph("8", cell_val),
            Paragraph("Whether the work is Published or Unpublished?", cell_val),
            Paragraph("<b>Unpublished</b> (Created as an original software application / activity)", cell_val)
        ],
        [
            Paragraph("9", cell_val),
            Paragraph("Year &amp; Country of First Publication (if published)", cell_val),
            Paragraph("N/A (Work is Unpublished)", cell_val)
        ],
        [
            Paragraph("10", cell_val),
            Paragraph("Years and countries of subsequent publications (if any)", cell_val),
            Paragraph("N/A", cell_val)
        ],
        [
            Paragraph("11", cell_val),
            Paragraph("Names, addresses and nationalities of the owners of the various rights comprising the copyright", cell_val),
            Paragraph("<b>Vivek Tambat and Priyansh Jain</b> (Joint Owners / Co-Authors), Indian Nationals", cell_val)
        ],
        [
            Paragraph("12", cell_val),
            Paragraph("Names, addresses and nationalities of other persons authorised to assign or license rights", cell_val),
            Paragraph("None (Restricted to the Authors)", cell_val)
        ],
        [
            Paragraph("13", cell_val),
            Paragraph("If the work is an 'Artistic work' / Trademark NOC", cell_val),
            Paragraph("Not Applicable (Work is a Computer Software / Literary Programme)", cell_val)
        ],
    ]

    t_sop = Table(sop_data, colWidths=[45, 180, 290])
    t_sop.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_sop)

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#94A3B8'), spaceAfter=10))

    # Statement of Further Particulars
    story.append(Paragraph("PART II: STATEMENT OF FURTHER PARTICULARS (FOR COMPUTER PROGRAMMES)", section_heading))

    sofp_data = [
        [Paragraph("Col No.", cell_label), Paragraph("Particulars Required", cell_label), Paragraph("Technical Specification", cell_label)],
        [
            Paragraph("1", cell_val),
            Paragraph("Is the computer programme original?", cell_val),
            Paragraph("<b>Yes.</b> The programme is entirely original and authored from the ground up by the applicants.", cell_val)
        ],
        [
            Paragraph("2", cell_val),
            Paragraph("Language, Hardware and Operating Environment Specifications", cell_val),
            Paragraph(
                "&bull; <b>Programming Languages:</b> Python 3.10+, JavaScript (ES6+), JSX, HTML5, CSS3.<br/>"
                "&bull; <b>Operating System:</b> Platform Independent (Windows 10/11, Linux Ubuntu 20.04+, macOS).<br/>"
                "&bull; <b>Core Frameworks:</b> FastAPI (Asynchronous REST API), React 18, Vite, SQLite3 (WAL mode), Tesseract OCR / PDFPlumber, PyJWT.<br/>"
                "&bull; <b>Hardware Requirements:</b> x86_64 or ARM64 multi-core processor, 4 GB RAM minimum, 2 GB storage.",
                cell_val
            )
        ],
        [
            Paragraph("3", cell_val),
            Paragraph("Brief Synopsis / Functional Overview of the Software", cell_val),
            Paragraph(
                "<b>GeM BidVerify AI</b> is an intelligent, automated compliance and verification platform designed for "
                "public procurement on the Government e-Marketplace (GeM) adhering to Rule 149 of the General Financial Rules (GFR 2017).<br/><br/>"
                "<b>Key Architectural &amp; Algorithmic Modules:</b><br/>"
                "1. <i>Dual-Portal Architecture:</i> Segregated Vendor Bid Gateway (FastAPI/HTML5) and Procurement Officer Verification Console (React/Vite) backed by a shared ACID SQLite ledger.<br/>"
                "2. <i>Deterministic Compliance Engine:</i> Extracts and cross-verifies statutory vendor certificates (GSTIN REG-06, PAN, Udyam MSME, audited financial turnover) using optical character recognition and regex pattern matching.<br/>"
                "3. <i>Scoring &amp; Risk Formulation:</i> Computes weighted compliance scores ($S_c$) and financial/eligibility risk indices ($R_k$) preventing subjective human evaluation errors.<br/>"
                "4. <i>Tamper-Evident Audit Ledger:</i> Implements SHA-256 cryptographic hash-chaining across all bid reviews, officer overrides, and final eligibility determinations to ensure non-repudiation.",
                cell_val
            )
        ]
    ]

    t_sofp = Table(sofp_data, colWidths=[45, 180, 290])
    t_sofp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_sofp)

    story.append(PageBreak())

    # Page 2: Source Code Deposit Manifest & Submission Declaration
    story.append(Paragraph("PART III: SOURCE CODE DEPOSIT & VERIFICATION SUMMARY", section_heading))
    story.append(Paragraph(
        "Under Rule 70(6) of the Copyright Rules 2013, for computer programmes exceeding 20 pages, the applicant "
        "deposits the <b>first 10 and last 10 pages</b> of the unredacted source code listing, with the full source code "
        "listing maintained and certified under cryptographic SHA-256 integrity hashes.",
        body_text
    ))
    story.append(Spacer(1, 8))

    deposit_summary = [
        [Paragraph("Document Name", cell_label), Paragraph("Purpose / Filing Role", cell_label), Paragraph("Pages / Details", cell_label)],
        [
            Paragraph("<b>GeM-BidVerify-AI_source-code_FIRST10_LAST10.pdf</b>", cell_val),
            Paragraph("<b>Primary Mandatory Upload Document</b> for Copyright Office online portal", cell_val),
            Paragraph("<b>20 Pages</b> (Pages 1&ndash;10 &amp; 180&ndash;189 of 189 total pages)", cell_val)
        ],
        [
            Paragraph("<b>GeM-BidVerify-AI_source-code_FULL.pdf</b>", cell_val),
            Paragraph("Complete Source Code Repository (for physical CD/DVD deposit / audit record)", cell_val),
            Paragraph("<b>189 Pages</b> (65 source code files, 13,800+ lines)", cell_val)
        ],
        [
            Paragraph("<b>SOURCE_MANIFEST.txt</b>", cell_val),
            Paragraph("Cryptographic Fingerprint Manifest", cell_val),
            Paragraph("SHA-256 integrity hash for each individual source file", cell_val)
        ]
    ]

    t_dep = Table(deposit_summary, colWidths=[175, 185, 155])
    t_dep.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_dep)

    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#94A3B8'), spaceAfter=12))

    # Declaration and Signature Block
    story.append(Paragraph("PART IV: APPLICANT DECLARATION & SIGNATURES", section_heading))
    story.append(Paragraph(
        "We hereby declare that the particulars given above are true and complete to the best of our knowledge and "
        "belief, that the computer programme titled <i>'GeM BidVerify AI &mdash; Automated Public Procurement Compliance &amp; Verification Suite'</i> "
        "is an original creation authored by us, and that no part thereof infringes upon any existing copyright.",
        body_text
    ))
    story.append(Spacer(1, 25))

    sig_data = [
        [
            Paragraph("<b>Author &amp; Applicant 1:</b><br/><br/><br/>___________________________________<br/><b>Vivek Tambat</b><br/>Co-Author &amp; Joint Copyright Owner", cell_val),
            Paragraph("<b>Author &amp; Applicant 2:</b><br/><br/><br/>___________________________________<br/><b>Priyansh Jain</b><br/>Co-Author &amp; Joint Copyright Owner", cell_val)
        ],
        [
            Paragraph("Date: ____ / ____ / 2026<br/>Place: ________________________", cell_val),
            Paragraph("Date: ____ / ____ / 2026<br/>Place: ________________________", cell_val)
        ]
    ]

    t_sig = Table(sig_data, colWidths=[255, 260])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sig)

    doc.build(story)
    print(f"Statement of Particulars PDF generated at: {pdf_path}")

if __name__ == '__main__':
    build_pdf()
