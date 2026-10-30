"""Small dependency-free PDF writer for riders and advancing sheets.

   The server has no runtime packages, so this writes PDF 1.4 directly with
   the built-in Helvetica fonts (WinAnsi encoding covers Dutch, German and
   French accents). Layout is deliberately simple: a title block, headings,
   paragraphs, bullet lines, key/value lists and plain tables, with
   automatic wrapping and page breaks.

   Blocks:
     ('h', text)                      section heading
     ('p', text)                      paragraph; blank lines split paragraphs
     ('li', text)                     bullet line
     ('kv', [(label, value), ...])    two-column facts
     ('table', [headers], [[cells]])  table, columns sized by content
     ('rule',)                        thin separator
     ('space',)                       vertical gap
"""
import time, unicodedata, zlib

PAGE_W, PAGE_H = 595.28, 841.89
MARGIN = 54
BODY = 10
ACCENT = (0.93, 0.14, 0.24)

# Advance widths (1/1000 em) for ASCII 32..126, from the standard Adobe
# Helvetica and Helvetica-Bold metrics. Only used for line wrapping.
_REGULAR = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
            556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
            1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
            667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
            333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
            556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584]
_BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
         556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
         975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
         667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
         333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
         611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584]


def _char_width(ch, bold):
    table = _BOLD if bold else _REGULAR
    code = ord(ch)
    if 32 <= code <= 126:
        return table[code - 32]
    base = unicodedata.normalize('NFKD', ch)[:1]
    if base and 32 <= ord(base) <= 126:
        return table[ord(base) - 32]
    return 556


def text_width(text, size, bold=False):
    return sum(_char_width(ch, bold) for ch in text) * size / 1000


# Characters outside WinAnsi that riders and sheets commonly use.
_FALLBACK = str.maketrans({'\u2192': '->', '\u2190': '<-', '\u2194': '<->', '\u2713': 'v', '\u2714': 'v',
                           '\u2212': '-', '\u00a0': ' ', '\u202f': ' ', '\u2009': ' '})


def _clean(text):
    """Tabs and odd whitespace confuse wrapping; control characters have no
    place in a PDF string."""
    text = str(text or '').translate(_FALLBACK).replace('\t', '    ').replace('\r\n', '\n').replace('\r', '\n')
    return ''.join(ch for ch in text if ch == '\n' or unicodedata.category(ch)[0] != 'C')


def wrap(text, width, size, bold=False):
    """Greedy word wrap. A single word wider than the line is split."""
    lines = []
    for raw in _clean(text).split('\n'):
        words = raw.split(' ')
        line = ''
        for word in words:
            candidate = word if not line else line + ' ' + word
            if text_width(candidate, size, bold) <= width:
                line = candidate
                continue
            if line:
                lines.append(line)
            while text_width(word, size, bold) > width and len(word) > 1:
                cut = len(word)
                while cut > 1 and text_width(word[:cut], size, bold) > width:
                    cut -= 1
                lines.append(word[:cut])
                word = word[cut:]
            line = word
        lines.append(line)
    return lines


def _pdf_string(text):
    data = _clean(text).replace('\n', ' ').encode('cp1252', 'replace')
    out = bytearray(b'(')
    for byte in data:
        if byte in (0x28, 0x29, 0x5C):
            out += b'\\' + bytes([byte])
        else:
            out.append(byte)
    out += b')'
    return bytes(out)


class _Canvas:
    def __init__(self, title, subtitle):
        self.title, self.subtitle = _clean(title), _clean(subtitle)
        self.pages = []
        self.ops = None
        self.y = 0
        self.new_page()

    def new_page(self):
        self.ops = []
        self.pages.append(self.ops)
        self.y = PAGE_H - MARGIN
        if len(self.pages) == 1:
            self.text(MARGIN, self.y - 20, self.title, 20, True)
            self.y -= 30
            if self.subtitle:
                self.text(MARGIN, self.y - 11, self.subtitle, 10, False, (0.35, 0.35, 0.38))
                self.y -= 18
            self.line(MARGIN, self.y - 4, PAGE_W - MARGIN, self.y - 4, ACCENT, 1.2)
            self.y -= 22
        else:
            self.text(MARGIN, self.y - 9, self.title, 9, True, (0.35, 0.35, 0.38))
            self.y -= 26

    def ensure(self, height):
        if self.y - height < MARGIN + 24:
            self.new_page()

    def text(self, x, y, value, size, bold=False, color=(0.08, 0.08, 0.09)):
        r, g, b = color
        self.ops.append(b'BT %.3f %.3f %.3f rg /%s %.1f Tf 1 0 0 1 %.2f %.2f Tm ' % (
            r, g, b, b'F2' if bold else b'F1', size, x, y) + _pdf_string(value) + b' Tj ET')

    def line(self, x1, y1, x2, y2, color=(0.82, 0.82, 0.84), width=0.5):
        r, g, b = color
        self.ops.append(b'%.3f %.3f %.3f RG %.2f w %.2f %.2f m %.2f %.2f l S' % (r, g, b, width, x1, y1, x2, y2))

    def paragraph(self, value, size=BODY, bold=False, indent=0, color=(0.08, 0.08, 0.09), gap=6):
        leading = size * 1.38
        for line in wrap(value, PAGE_W - 2 * MARGIN - indent, size, bold):
            self.ensure(leading)
            self.text(MARGIN + indent, self.y - size, line, size, bold, color)
            self.y -= leading
        self.y -= gap


def _table(canvas, headers, rows):
    usable = PAGE_W - 2 * MARGIN
    columns = max(len(headers), max((len(r) for r in rows), default=0))
    if not columns:
        return
    headers = list(headers) + [''] * (columns - len(headers))
    rows = [[_clean(c) for c in row] + [''] * (columns - len(row)) for row in rows]
    # Every column keeps at least its (bold) header; when the content does
    # not fit, the columns with the most slack give way first.
    minimum = [text_width(_clean(h), BODY, True) + 12 for h in headers]
    natural = []
    for i in range(columns):
        longest = max([text_width(r[i], BODY) for r in rows] or [0]) + 12
        natural.append(max(minimum[i], min(longest, usable * 0.6)))
    if sum(natural) > usable:
        if sum(minimum) >= usable:
            widths = [w * usable / sum(minimum) for w in minimum]
        else:
            # Cap the widest columns at one common width so short values
            # (e-mail, phone, times) stay on one line.
            low, high = 0.0, max(natural)
            for _ in range(40):
                cap = (low + high) / 2
                if sum(max(m, min(n, cap)) for n, m in zip(natural, minimum)) > usable:
                    high = cap
                else:
                    low = cap
            widths = [max(m, min(n, low)) for n, m in zip(natural, minimum)]
            widths[widths.index(max(widths))] += usable - sum(widths)
    else:
        widths = natural[:]
        widths[-1] += usable - sum(widths)

    def draw_row(cells, bold, shade):
        wrapped = [wrap(c, widths[i] - 10, BODY, bold) for i, c in enumerate(cells)]
        height = max(len(w) for w in wrapped) * BODY * 1.3 + 8
        canvas.ensure(height)
        top = canvas.y
        if shade:
            canvas.ops.append(b'0.95 0.95 0.96 rg %.2f %.2f %.2f %.2f re f' % (MARGIN, top - height, usable, height))
        x = MARGIN
        for i, lines in enumerate(wrapped):
            y = top - 4 - BODY
            for line in lines:
                canvas.text(x + 5, y, line, BODY, bold)
                y -= BODY * 1.3
            x += widths[i]
        canvas.y = top - height
        canvas.line(MARGIN, canvas.y, MARGIN + usable, canvas.y)

    draw_row(headers, True, True)
    for row in rows:
        draw_row(row, False, False)
    canvas.y -= 10


def render(title, subtitle='', blocks=()):
    canvas = _Canvas(title, subtitle)
    for block in blocks:
        kind = block[0]
        if kind == 'h':
            canvas.ensure(40)
            canvas.y -= 6
            canvas.paragraph(block[1], 13, True, gap=4)
        elif kind == 'p':
            for part in _clean(block[1]).split('\n\n'):
                canvas.paragraph(part)
        elif kind == 'li':
            canvas.ensure(BODY * 1.4)
            canvas.text(MARGIN + 2, canvas.y - BODY, '•', BODY, True, ACCENT)
            canvas.paragraph(block[1], indent=14, gap=2)
        elif kind == 'kv':
            label_w = min(max((text_width(k, BODY, True) for k, _ in block[1]), default=0) + 14, 170)
            for label, value in block[1]:
                lines = wrap(value or '-', PAGE_W - 2 * MARGIN - label_w, BODY)
                canvas.ensure(BODY * 1.38 * len(lines))
                canvas.text(MARGIN, canvas.y - BODY, label, BODY, True, (0.35, 0.35, 0.38))
                for line in lines:
                    canvas.text(MARGIN + label_w, canvas.y - BODY, line, BODY)
                    canvas.y -= BODY * 1.38
            canvas.y -= 6
        elif kind == 'table':
            _table(canvas, block[1], block[2])
        elif kind == 'rule':
            canvas.ensure(12)
            canvas.line(MARGIN, canvas.y - 4, PAGE_W - MARGIN, canvas.y - 4)
            canvas.y -= 14
        elif kind == 'space':
            canvas.y -= 10
    return _serialize(canvas)


def _serialize(canvas):
    total = len(canvas.pages)
    stamp = time.strftime('%d-%m-%Y')
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        None,
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        b'<< /Title ' + _pdf_string(canvas.title) + b' /Producer (Moonshine Backoffice) >>',
    ]
    kids = []
    for number, ops in enumerate(canvas.pages, 1):
        footer = 'Moonshine · ' + stamp + '    ' + str(number) + ' / ' + str(total)
        ops = ops + [b'BT 0.45 0.45 0.48 rg /F1 8 Tf 1 0 0 1 %.2f %.2f Tm ' % (MARGIN, MARGIN - 18) + _pdf_string(footer) + b' Tj ET']
        stream = zlib.compress(b'\n'.join(ops))
        objects.append(b'<< /Length %d /Filter /FlateDecode >>\nstream\n' % len(stream) + stream + b'\nendstream')
        content_ref = len(objects)
        objects.append(b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.2f %.2f] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents %d 0 R >>' % (PAGE_W, PAGE_H, content_ref))
        kids.append(len(objects))
    objects[1] = b'<< /Type /Pages /Kids [' + b' '.join(b'%d 0 R' % k for k in kids) + b'] /Count %d >>' % total

    out = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    offsets = []
    for index, body in enumerate(objects, 1):
        offsets.append(len(out))
        out += b'%d 0 obj\n' % index + body + b'\nendobj\n'
    xref = len(out)
    out += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objects) + 1)
    for offset in offsets:
        out += b'%010d 00000 n \n' % offset
    out += b'trailer\n<< /Size %d /Root 1 0 R /Info 5 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objects) + 1, xref)
    return bytes(out)
