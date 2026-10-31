"""Reading Office files without extra libraries."""
import io
import re
import zipfile


def docx_text(content):
    """Plain text of a .docx: one paragraph per line."""
    z = zipfile.ZipFile(io.BytesIO(content))
    x = z.read('word/document.xml').decode('utf8')
    x = re.sub(r'</w:p>', '\n', x)
    x = re.sub(r'<w:tab/>', '\t', x)
    x = re.sub(r'<w:br/>', '\n', x)
    t = re.sub(r'<[^>]+>', '', x)
    for a, b in (('&lt;', '<'), ('&gt;', '>'), ('&quot;', '"'), ('&apos;', "'"), ('&amp;', '&')):
        t = t.replace(a, b)
    return re.sub(r'\n{3,}', '\n\n', t.replace('﻿', '')).strip()
