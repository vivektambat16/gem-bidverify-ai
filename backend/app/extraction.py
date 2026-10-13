"""Document understanding for bid attachments.

Pipeline:  read text (PDF text layer, else OCR)  ->  classify document type  ->  extract fields.

Every extracted field carries a confidence value and, when the word positions are known,
a bounding box so the review screen can point at the evidence.
"""
import re
from datetime import date, datetime
from pathlib import Path

from . import config

# ----------------------------------------------------------------------------------------
# Regular expressions for Indian statutory identifiers
# ----------------------------------------------------------------------------------------
PAN_RE = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
GSTIN_RE = re.compile(r"\b[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b")
UDYAM_RE = re.compile(r"\bUDYAM-[A-Z]{2}-\d{2}-\d{7}\b")
UDIN_RE = re.compile(r"\b\d{12}[A-Z0-9]{6}\b")

_GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def gstin_checksum_ok(gstin: str) -> bool:
    """Validate the GSTIN check character (mod-36 weighted sum)."""
    if not GSTIN_RE.fullmatch(gstin):
        return False
    total = 0
    for i, ch in enumerate(gstin[:14]):
        product = _GSTIN_CHARS.index(ch) * (1 if i % 2 == 0 else 2)
        total += product // 36 + product % 36
    return _GSTIN_CHARS[(36 - total % 36) % 36] == gstin[14]


# ----------------------------------------------------------------------------------------
# Document classification
# ----------------------------------------------------------------------------------------
CLASSIFIERS = {
    "PAN_CARD": [(r"permanent\s*account\s*number", 3), (r"income\s*tax\s*department", 2),
                 (r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", 2), (r"\bpan\b", 1)],
    "GST_CERTIFICATE": [(r"goods\s*(and|&)\s*services\s*tax", 3), (r"\bgstin\b", 3),
                        (r"registration\s*certificate", 1),
                        (r"\b[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b", 3)],
    "UDYAM_CERTIFICATE": [(r"udyam", 4), (r"\bmsme\b", 2), (r"micro,?\s*small", 2)],
    "ITR_AND_FINANCIALS": [(r"turnover", 3), (r"\budin\b", 3), (r"chartered\s*accountant", 2),
                           (r"balance\s*sheet", 2), (r"income\s*tax\s*return|\bitr\b", 2)],
    "OEM_AUTHORIZATION": [(r"authori[sz]ation\s*(letter|certificate)", 3),
                          (r"authori[sz]ed\s*(dealer|partner|reseller|distributor)", 3),
                          (r"\boem\b|original\s*equipment", 2), (r"manufacturer", 1)],
    "MAKE_IN_INDIA": [(r"make\s*in\s*india", 3), (r"local\s*content", 3),
                      (r"class[\s-]*(i|ii|1|2)\s*local\s*supplier", 3), (r"dpiit", 2)],
    "DEBARMENT_AFFIDAVIT": [(r"debarred|debarment", 3), (r"black[\s-]*list", 3),
                            (r"affidavit|self[\s-]*declaration", 2)],
    "EPFO_REGISTRATION": [(r"provident\s*fund|\bepfo\b", 4), (r"establishment\s*code", 2)],
    "ESIC_REGISTRATION": [(r"employees'?\s*state\s*insurance|\besic\b", 4)],
}

FILENAME_TOKENS = {
    "pan": "PAN_CARD", "gst": "GST_CERTIFICATE", "gstin": "GST_CERTIFICATE",
    "udyam": "UDYAM_CERTIFICATE", "msme": "UDYAM_CERTIFICATE", "itr": "ITR_AND_FINANCIALS",
    "turnover": "ITR_AND_FINANCIALS", "financials": "ITR_AND_FINANCIALS", "udin": "ITR_AND_FINANCIALS",
    "oem": "OEM_AUTHORIZATION", "maf": "OEM_AUTHORIZATION", "authorization": "OEM_AUTHORIZATION",
    "authorisation": "OEM_AUTHORIZATION", "mii": "MAKE_IN_INDIA", "local": "MAKE_IN_INDIA",
    "debarment": "DEBARMENT_AFFIDAVIT", "affidavit": "DEBARMENT_AFFIDAVIT",
    "blacklist": "DEBARMENT_AFFIDAVIT", "epfo": "EPFO_REGISTRATION", "pf": "EPFO_REGISTRATION",
    "esic": "ESIC_REGISTRATION",
}


def _filename_hint(filename: str):
    tokens = re.split(r"[^a-z0-9]+", Path(filename).stem.lower())
    for token in tokens:
        if token in FILENAME_TOKENS:
            return FILENAME_TOKENS[token]
    return None


def classify(text: str, filename: str, hint: str = None):
    """Return (document_type, confidence). `hint` is the type chosen by the user (or AUTO)."""
    scores = {}
    for doc_type, patterns in CLASSIFIERS.items():
        scores[doc_type] = sum(w for pattern, w in patterns if re.search(pattern, text, re.I))
    if hint and hint not in ("AUTO", "GENERAL_DOCUMENT"):
        support = scores.get(hint, 0)
        return hint, (0.97 if support >= 3 else 0.60)
    name_hint = _filename_hint(filename)
    if name_hint:
        scores[name_hint] = scores.get(name_hint, 0) + 2
    best = max(scores, key=scores.get)
    if scores[best] < 3:
        return "GENERAL_DOCUMENT", 0.30
    return best, round(min(0.99, 0.45 + 0.08 * scores[best]), 2)


# ----------------------------------------------------------------------------------------
# Reading text: PDF text layer, scanned PDF / image via OCR
# ----------------------------------------------------------------------------------------
_ocr_state = {"checked": False, "available": False}


def ocr_available() -> bool:
    if not _ocr_state["checked"]:
        _ocr_state["checked"] = True
        try:
            import pytesseract
            if config.TESSERACT_CMD:
                pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_CMD
            pytesseract.get_tesseract_version()
            _ocr_state["available"] = True
        except Exception:
            _ocr_state["available"] = False
    return _ocr_state["available"]


def _ocr_image(image, page_no: int):
    """OCR one PIL image -> (text, words, mean_confidence 0..1)."""
    import pytesseract
    data = pytesseract.image_to_data(image, lang=config.OCR_LANG, output_type=pytesseract.Output.DICT)
    words, confs, lines = [], [], {}
    for i, raw in enumerate(data["text"]):
        word = raw.strip()
        if not word:
            continue
        conf = float(data["conf"][i])
        if conf >= 0:
            confs.append(conf)
        words.append({"text": word, "x": data["left"][i], "y": data["top"][i],
                      "w": data["width"][i], "h": data["height"][i], "page": page_no})
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lines.setdefault(key, []).append(word)
    text = "\n".join(" ".join(ws) for _, ws in sorted(lines.items()))
    return text, words, (sum(confs) / len(confs) / 100 if confs else 0.0)


def read_document(path: Path):
    """Return (text, words, confidence, ocr_status)."""
    suffix = path.suffix.lower()
    if suffix == ".txt":
        return path.read_text(errors="ignore"), [], 1.0, "COMPLETED"

    if suffix == ".pdf":
        text_parts, words = [], []
        try:
            import pdfplumber
            with pdfplumber.open(path) as pdf:
                for n, page in enumerate(pdf.pages, start=1):
                    text_parts.append(page.extract_text() or "")
                    for w in page.extract_words():
                        words.append({"text": w["text"], "x": round(w["x0"]), "y": round(w["top"]),
                                      "w": round(w["x1"] - w["x0"]), "h": round(w["bottom"] - w["top"]),
                                      "page": n})
        except Exception:
            text_parts = []
        text = "\n".join(text_parts)
        if len(text.strip()) >= 30:
            return text, words, 1.0, "COMPLETED"
        if not ocr_available():
            return text, words, 0.0, "OCR_UNAVAILABLE"
        try:  # scanned PDF: render pages and OCR them
            import pypdfium2
            pdf = pypdfium2.PdfDocument(str(path))
            all_text, all_words, confs = [], [], []
            for n in range(len(pdf)):
                image = pdf[n].render(scale=2).to_pil()
                t, w, c = _ocr_image(image, n + 1)
                all_text.append(t)
                all_words.extend(w)
                confs.append(c)
            return "\n".join(all_text), all_words, (sum(confs) / len(confs) if confs else 0.0), "COMPLETED"
        except Exception:
            return text, words, 0.0, "FAILED"

    # image files
    if not ocr_available():
        return "", [], 0.0, "OCR_UNAVAILABLE"
    try:
        from PIL import Image
        with Image.open(path) as img:
            t, w, c = _ocr_image(img.convert("RGB"), 1)
        return t, w, c, "COMPLETED"
    except Exception:
        return "", [], 0.0, "FAILED"


# ----------------------------------------------------------------------------------------
# Field extraction helpers
# ----------------------------------------------------------------------------------------
_NAME_LABEL = (r"(?:legal\s*name(?:\s*of\s*(?:the\s*)?business)?|name\s*of\s*(?:the\s*)?"
               r"(?:entity|firm|company|business|enterprise|unit)|(?:entity|firm|company|enterprise)\s*name|name)")


def label_value(text: str, label_pattern: str):
    """Value that follows a label on the same line, or on the next non-empty line."""
    lines = text.splitlines()
    rx = re.compile(rf"^\s*(?:{label_pattern})\s*[:\-]?\s*(.*)$", re.I)
    for i, line in enumerate(lines):
        if re.match(r"^\s*father", line, re.I):
            continue
        m = rx.match(line)
        if m:
            value = m.group(1).strip()
            if not value:
                for nxt in lines[i + 1:]:
                    if nxt.strip():
                        value = nxt.strip()
                        break
            if value:
                return value
    return None


def parse_money(value: str):
    """Rupee amounts such as 'Rs. 2.5 Cr', '₹ 1,50,00,000' or '80 lakh' -> float rupees (or None)."""
    m = re.search(r"([\d,]+(?:\.\d+)?)\s*(crores?|cr\b\.?|lakhs?|lacs?)?", value, re.I)
    if not m:
        return None
    number = float(m.group(1).replace(",", "") or 0)
    unit = (m.group(2) or "").lower()
    if unit.startswith("cr"):
        return number * 1e7
    if unit.startswith(("lakh", "lac")):
        return number * 1e5
    return number


def format_crore(rupees: float) -> str:
    return f"₹ {rupees / 1e7:.2f} Cr"


def find_amounts_near(text: str, keyword: str):
    """All money amounts on lines that mention `keyword` (years and tiny numbers are ignored)."""
    amounts = []
    for line in text.splitlines():
        if keyword not in line.lower():
            continue
        for m in re.finditer(r"(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(crores?|cr\b\.?|lakhs?|lacs?)?", line, re.I):
            raw, unit = m.group(1), m.group(2)
            digits = raw.replace(",", "")
            if not unit and (len(digits) == 4 and digits.startswith(("19", "20")) or float(digits or 0) < 1000):
                continue
            value = parse_money(m.group(0))
            if value:
                amounts.append(value)
    return amounts


_DATE_FORMATS = ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%d %B %Y", "%d %b %Y", "%B %d, %Y")


def parse_date(raw: str):
    raw = raw.strip().rstrip(".,")
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


def find_validity_date(text: str):
    m = re.search(r"valid\s*(?:till|until|upto|up\s*to|through)\s*[:\-]?\s*([0-9A-Za-z ,/.\-]{6,20})", text, re.I)
    return parse_date(m.group(1)) if m else None


def find_box(words, value: str):
    """Bounding box (page, x, y, width, height) of the words that spell `value`, or None."""
    tokens = value.split()
    if not tokens or not words:
        return None
    norm = lambda s: re.sub(r"[^A-Za-z0-9]", "", s).lower()
    wanted = [norm(t) for t in tokens]
    for i in range(len(words) - len(wanted) + 1):
        window = words[i:i + len(wanted)]
        if all(norm(w["text"]) == t or (t and t in norm(w["text"])) for w, t in zip(window, wanted)):
            x0 = min(w["x"] for w in window)
            y0 = min(w["y"] for w in window)
            x1 = max(w["x"] + w["w"] for w in window)
            y1 = max(w["y"] + w["h"] for w in window)
            return {"page": window[0]["page"], "x": x0, "y": y0, "width": x1 - x0, "height": y1 - y0}
    return None


class _Fields:
    """Collects extracted fields for one document."""

    def __init__(self, words, base_conf):
        self.words, self.base_conf, self.items = words, base_conf, []

    def add(self, name, value, strength=1.0, normalized=None):
        if value in (None, ""):
            return
        conf = round(max(0.05, min(0.99, self.base_conf * strength)), 2)
        self.items.append({
            "field_name": name, "extracted_value": str(value), "confidence": conf,
            "bounding_box": find_box(self.words, str(value)) or {"page": 1, "x": 0, "y": 0, "width": 0, "height": 0},
            "is_verified": conf >= 0.85, "normalized_value": normalized,
        })


def extract_fields(doc_type: str, text: str, words, base_conf: float):
    f = _Fields(words, base_conf)
    upper = text.upper()

    if doc_type == "PAN_CARD":
        m = PAN_RE.search(upper)
        f.add("pan_number", m.group(0) if m else None, 1.0)
        f.add("name_on_pan", label_value(text, _NAME_LABEL), 0.95)

    elif doc_type == "GST_CERTIFICATE":
        m = GSTIN_RE.search(upper)
        f.add("gstin", m.group(0) if m else None, 1.0)
        f.add("legal_name", label_value(text, _NAME_LABEL), 0.95)
        status = re.search(r"\b(active|cancelled|canceled|suspended)\b", text, re.I)
        f.add("status", status.group(1).upper().replace("CANCELED", "CANCELLED") if status else None, 0.9)

    elif doc_type == "UDYAM_CERTIFICATE":
        m = UDYAM_RE.search(upper)
        f.add("udyam_no", m.group(0) if m else None, 1.0)
        kind = re.search(r"\b(micro|small|medium)\b", text, re.I)
        f.add("enterprise_type", kind.group(1).capitalize() if kind else None, 0.9)
        f.add("legal_name", label_value(text, _NAME_LABEL), 0.9)

    elif doc_type == "ITR_AND_FINANCIALS":
        m = UDIN_RE.search(upper)
        f.add("ca_udin", m.group(0) if m else None, 1.0)
        amounts = find_amounts_near(text, "turnover")
        if amounts:
            avg = sum(amounts) / len(amounts)
            f.add("avg_annual_turnover", format_crore(avg), 0.9, normalized=avg)

    elif doc_type == "OEM_AUTHORIZATION":
        m = re.search(r"\bM/s\.?\s+([A-Za-z0-9&.,' \-]{3,80}?)(?:\s*(?:,|\n|is\b|are\b|\(|$))", text)
        entity = m.group(1).strip() if m else label_value(text, r"authori[sz]ed\s*(?:dealer|partner|entity|to)")
        f.add("authorized_entity_name", entity, 0.9)
        brand = re.search(r"\bWe,?\s+([A-Z][A-Za-z0-9&.\- ]{2,40}?)(?:\s*(?:,|\n|are\b|hereby|\())", text)
        f.add("oem_brand", brand.group(1).strip() if brand else None, 0.85)
        validity = find_validity_date(text)
        f.add("valid_until", validity.isoformat() if validity else None, 0.9, normalized=validity.isoformat() if validity else None)

    elif doc_type == "MAKE_IN_INDIA":
        pct = re.search(r"local\s*content[^0-9\n]{0,40}(\d{1,3}(?:\.\d+)?)\s*%", text, re.I) or \
            re.search(r"(\d{1,3}(?:\.\d+)?)\s*%[^\n]{0,40}local\s*content", text, re.I)
        f.add("local_content_percentage", f"{pct.group(1)}%" if pct else None, 0.95,
              normalized=float(pct.group(1)) if pct else None)
        tier = re.search(r"class[\s-]*(i{1,2}|1|2)\b", text, re.I)
        if tier:
            f.add("supplier_tier", "Class-I Local Supplier" if tier.group(1).lower() in ("i", "1") else "Class-II Local Supplier", 0.9)

    elif doc_type == "DEBARMENT_AFFIDAVIT":
        if re.search(r"(has|have)\s+been\s+(debarred|blacklisted)", text, re.I) and not re.search(
                r"(not|never)\s+(been\s+)?(debarred|blacklisted)", text, re.I):
            f.add("affidavit_status", "DECLARES_DEBARRED", 0.9)
        elif re.search(r"(not|never|no)\b[^.\n]{0,30}(debarred|blacklist)", text, re.I):
            f.add("affidavit_status", "DECLARES_NOT_DEBARRED", 0.9)

    return f.items


def analyze_document(path: Path, filename: str, type_hint: str = None) -> dict:
    """Run the whole pipeline on one stored file."""
    text, words, conf, status = read_document(path)
    doc_type, class_conf = classify(text, filename, type_hint)
    if status != "COMPLETED":
        class_conf = min(class_conf, 0.5)
    fields = extract_fields(doc_type, text, words, conf if status == "COMPLETED" else 0.0)
    return {
        "ocr_status": status,
        "classified_type": doc_type,
        "classification_confidence": class_conf,
        "extracted_fields": fields,
        "text_length": len(text),
    }
