"""
Builds the source-code documents needed for the Indian Copyright Office (Form XIV, computer programme).

Run from the project root (the folder that contains package.json):

    pip install reportlab
    python tools/make_code_pdf.py

Output goes to the folder  copyright_filing/ :
  1. GeM-BidVerify-AI_source-code_FULL.pdf          complete listing, keep this for your records
  2. GeM-BidVerify-AI_source-code_FIRST10_LAST10.pdf  the first 10 and last 10 pages (upload this)
  3. SOURCE_MANIFEST.txt                            list of files, line counts and SHA-256 fingerprints

The Copyright Office does not allow any part of the code to be blacked out, so this script also warns you
about things like personal e-mail addresses or passwords written inside the code. Remove them BEFORE you
create the final PDF.
"""
import datetime
import hashlib
import os
import re
import sys

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
except ImportError:
    sys.exit('reportlab is missing. Run:  pip install reportlab   and then run this script again.')

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT_DIR = os.path.join(ROOT, 'copyright_filing')
TITLE = 'GeM BidVerify AI - Source Code Listing'

INCLUDE_EXT = {'.py', '.js', '.jsx', '.css', '.html', '.bat'}
INCLUDE_NAMES = {'requirements.txt', 'package.json'}
EXCLUDE_DIRS = {'node_modules', '.venv', 'venv', 'dist', '__pycache__', 'data', '.git', 'copyright_filing', '.vscode'}
EXCLUDE_FILES = {'package-lock.json', 'seeds.json', 'secrets.bat'}

# files that should come first, in this order; everything else follows alphabetically
PRIORITY = [
    'backend/app/main.py', 'backend/app/config.py', 'backend/app/db.py', 'backend/app/security.py',
    'backend/app/services.py', 'backend/app/rules.py', 'backend/app/extraction.py', 'backend/app/adapters.py',
    'src/main.jsx', 'src/App.jsx',
]

FONT_CANDIDATES = [
    r'C:\Windows\Fonts\consola.ttf',
    r'C:\Windows\Fonts\cour.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
    '/Library/Fonts/Courier New.ttf',
]
FONT_SIZE = 7.5
LEADING = 9.2
MARGIN_X = 40
TOP = 60
BOTTOM = 48
MAX_COLS = 112


def pick_font():
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont('CodeFont', path))
                return 'CodeFont', True
            except Exception:
                pass
    return 'Courier', False


def collect_files():
    found = []
    for folder, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for name in files:
            if name in EXCLUDE_FILES or name.endswith('.min.js'):
                continue
            ext = os.path.splitext(name)[1].lower()
            if ext in INCLUDE_EXT or name in INCLUDE_NAMES:
                rel = os.path.relpath(os.path.join(folder, name), ROOT).replace('\\', '/')
                if rel.startswith('tools/'):
                    continue
                found.append(rel)

    def key(rel):
        return (0, PRIORITY.index(rel)) if rel in PRIORITY else (1, rel)

    return sorted(found, key=key)


def read_text(rel):
    with open(os.path.join(ROOT, rel), 'rb') as fh:
        raw = fh.read()
    return raw, raw.decode('utf-8', errors='replace').replace('\r\n', '\n').replace('\r', '\n')


SECRET_PATTERNS = [
    (re.compile(r'[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com', re.I), 'personal e-mail address'),
    (re.compile(r'(password|passwd|secret|api[_-]?key|token)\s*[:=]\s*[\'"][^\'"]{6,}[\'"]', re.I), 'possible password / key written in code'),
]


def scan_warnings(rel, text):
    out = []
    for n, line in enumerate(text.split('\n'), 1):
        for pat, what in SECRET_PATTERNS:
            if pat.search(line):
                out.append(f'  {rel}:{n}  {what}: {line.strip()[:90]}')
    return out


def wrap(line):
    line = line.expandtabs(2)
    if len(line) <= MAX_COLS:
        return [line]
    parts = [line[:MAX_COLS]]
    rest = line[MAX_COLS:]
    while rest:
        parts.append('    ' + rest[: MAX_COLS - 4])
        rest = rest[MAX_COLS - 4:]
    return parts


def build_lines(files):
    lines = []
    manifest = []
    warnings = []
    for rel in files:
        raw, text = read_text(rel)
        body = text.rstrip('\n').split('\n')
        warnings += scan_warnings(rel, text)
        manifest.append((rel, len(body), hashlib.sha256(raw).hexdigest()))
        lines.append(f'//// FILE: {rel}  ({len(body)} lines)')
        lines.append('')
        for ln in body:
            lines.extend(wrap(ln))
        lines.append('')
        lines.append('')
    return lines, manifest, warnings


def paginate(lines):
    per_page = int((A4[1] - TOP - BOTTOM) // LEADING)
    return [lines[i:i + per_page] for i in range(0, len(lines), per_page)]


def render(path, pages, numbers, total, font, unicode_ok):
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle(TITLE)
    c.setAuthor('Vivek Tambat and Priyansh Jain')
    today = datetime.date.today().strftime('%d %B %Y')
    for page_lines, number in zip(pages, numbers):
        c.setFont('Helvetica', 8)
        c.drawString(MARGIN_X, A4[1] - 34, TITLE)
        c.drawRightString(A4[0] - MARGIN_X, A4[1] - 34, f'Generated {today}')
        c.line(MARGIN_X, A4[1] - 40, A4[0] - MARGIN_X, A4[1] - 40)
        c.setFont(font, FONT_SIZE)
        y = A4[1] - TOP
        for ln in page_lines:
            if not unicode_ok:
                ln = ln.encode('latin-1', 'replace').decode('latin-1')
            c.drawString(MARGIN_X, y, ln)
            y -= LEADING
        c.setFont('Helvetica', 8)
        c.line(MARGIN_X, 36, A4[0] - MARGIN_X, 36)
        c.drawCentredString(A4[0] / 2, 24, f'Page {number} of {total}')
        c.showPage()
    c.save()


def main():
    font, unicode_ok = pick_font()
    files = collect_files()
    if not files:
        sys.exit('No source files found. Run this script from inside the project folder.')
    os.makedirs(OUT_DIR, exist_ok=True)
    lines, manifest, warnings = build_lines(files)
    pages = paginate(lines)
    total = len(pages)

    full = os.path.join(OUT_DIR, 'GeM-BidVerify-AI_source-code_FULL.pdf')
    render(full, pages, list(range(1, total + 1)), total, font, unicode_ok)

    if total <= 20:
        chosen = list(range(1, total + 1))
    else:
        chosen = list(range(1, 11)) + list(range(total - 9, total + 1))
    extract = os.path.join(OUT_DIR, 'GeM-BidVerify-AI_source-code_FIRST10_LAST10.pdf')
    render(extract, [pages[i - 1] for i in chosen], chosen, total, font, unicode_ok)

    with open(os.path.join(OUT_DIR, 'SOURCE_MANIFEST.txt'), 'w', encoding='utf-8') as fh:
        fh.write(f'{TITLE}\nGenerated: {datetime.datetime.now():%Y-%m-%d %H:%M}\n')
        fh.write(f'Files: {len(manifest)}   Lines: {sum(m[1] for m in manifest)}   Listing pages: {total}\n\n')
        fh.write(f'{"lines":>6}  {"SHA-256":<64}  file\n')
        for rel, n, digest in manifest:
            fh.write(f'{n:>6}  {digest}  {rel}\n')

    print(f'Files listed : {len(manifest)}')
    print(f'Total pages  : {total}  (filing PDF has {len(chosen)} pages: {chosen[0]}-{chosen[min(9, len(chosen) - 1)]} and {chosen[-1] - 9 if total > 20 else chosen[-1]}-{chosen[-1]})')
    print(f'Output folder: {OUT_DIR}')
    if not unicode_ok:
        print('Note: a Unicode monospace font was not found, so a few special characters were shown as "?".')
    if warnings:
        print('\nWARNING - fix these in the code BEFORE filing (the Copyright Office does not allow redaction):')
        print('\n'.join(warnings[:25]))
    else:
        print('\nNo personal e-mail addresses or hard-coded passwords were detected.')


if __name__ == '__main__':
    main()
