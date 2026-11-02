"""Design guardrails: the patterns from DESIGN.md that made the app look generated.

Scans frontend/src. Skips when the frontend source is not there (the docker image
only carries the built dist)."""
import re
import unittest
from pathlib import Path

from django.conf import settings

SRC = Path(settings.REPO_DIR) / 'frontend' / 'src'
TOKENS = {'system.css', 'print.css'}  # colours live here; print needs fixed black on white
GLYPHS = re.compile('[✓✔☐☑✗✘✦✨✈\U0001F4E3\U0001F389\U0001F680]')
HEX = re.compile(r'#[0-9a-fA-F]{3,8}\b')
BLACK = re.compile(r'#0{3}[0-9a-fA-F]?$|#0{6}([0-9a-fA-F]{2})?$')  # shadows in pure black are fine
TILT = re.compile(r'rotate\(\s*(-?[\d.]+)deg\s*\)')


def files(*suffixes):
    return [p for p in SRC.rglob('*') if p.suffix in suffixes and p.is_file()]


def hits(pattern, paths, skip=lambda p, m: False):
    out = []
    for p in paths:
        for n, line in enumerate(p.read_text(encoding='utf-8').splitlines(), 1):
            for m in pattern.finditer(line):
                if not skip(p, m):
                    out.append(f'{p.relative_to(SRC)}:{n}: {m.group(0)}')
    return out


@unittest.skipUnless(SRC.is_dir(), 'frontend source not present')
class DesignRulesTests(unittest.TestCase):
    def test_no_gradients(self):
        self.assertEqual(hits(re.compile(r'gradient\('), files('.css', '.tsx', '.ts')), [], 'Geen gradients: vlakke kleuren uit system.css.')

    def test_no_decorative_tilt(self):
        tilted = hits(TILT, files('.css', '.tsx'), skip=lambda p, m: float(m.group(1)) % 90 == 0)
        self.assertEqual(tilted, [], 'Geen scheve kaartjes/stickies: alleen rotaties van 90° (iconen, spinner).')

    def test_no_glyph_icons(self):
        paths = [p for p in files('.tsx', '.ts', '.css') if p.name != 'i18n.ts']
        self.assertEqual(hits(GLYPHS, paths), [], 'Geen ✓ ☐ ✦ ✈ en emoji als icoon: gebruik <Icon> of gewone tekst.')

    def test_colours_only_from_tokens(self):
        paths = [p for p in files('.css', '.tsx', '.ts') if p.name not in TOKENS]
        loose = hits(HEX, paths, skip=lambda p, m: bool(BLACK.match(m.group(0))))
        self.assertEqual(loose, [], 'Kleuren alleen als token in system.css (var(--…)).')

    def test_no_animated_orbs(self):
        self.assertEqual(hits(re.compile(r'thinking-orbs|ThinkingOrb'), files('.tsx', '.ts')), [], 'Laden = de gewone spinner.')

    def test_page_titles_without_eyebrow(self):
        found = hits(re.compile(r'<PageTitle[^>]*\beyebrow="'), files('.tsx'))
        self.assertEqual(found, [], 'Geen bovenkopjes (eyebrows) boven paginatitels.')
