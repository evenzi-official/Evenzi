#!/usr/bin/env python3
"""Strip Mivon placeholder sections; keep wedding content only."""

from pathlib import Path
import re

INDEX = Path(__file__).resolve().parent / "index.html"
text = INDEX.read_text(encoding="utf-8")


def extract(start_marker: str, end_marker: str) -> str:
    s = text.find(start_marker)
    if s == -1:
        raise SystemExit(f"Missing start: {start_marker}")
    e = text.find(end_marker, s)
    if e == -1:
        raise SystemExit(f"Missing end: {end_marker}")
    if end_marker.startswith("<!--"):
        e = text.find("-->", e) + 3
    return text[s:e].rstrip()


WEDDING_NAV = '''
    <nav class="navbar navbar-expand-lg sp-nav">
        <div class="container align-items-center">
            <a class="logo w-100px" href="#sp-hero">
                <img src="assets/imgs/logo-light.svg" alt="Brindo &amp; Sreelekshmy">
            </a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="icon-bar"><i class="fas fa-bars"></i></span>
            </button>
            <div class="collapse navbar-collapse justify-content-center" id="navbarSupportedContent">
                <ul class="navbar-nav">
                    <li class="nav-item"><a class="nav-link" href="#story"><span class="rolling-text">Story</span></a></li>
                    <li class="nav-item"><a class="nav-link" href="#schedule"><span class="rolling-text">Manifest</span></a></li>
                    <li class="nav-item"><a class="nav-link" href="#party"><span class="rolling-text">Party</span></a></li>
                    <li class="nav-item"><a class="nav-link" href="#gallery"><span class="rolling-text">Gallery</span></a></li>
                    <li class="nav-item"><a class="nav-link" href="#qa"><span class="rolling-text">Q&amp;A</span></a></li>
                </ul>
            </div>
            <div class="dark-mode-icon">
                <button type="button" class="theme-icon">
                    <i aria-hidden="true" class="pe-7s-moon moon" title="Toggle between dark and light mode"></i>
                    <i aria-hidden="true" class="pe-7s-sun sun" title="Toggle between dark and light mode"></i>
                </button>
            </div>
        </div>
    </nav>
'''

WEDDING_FOOTER = '''
                <footer class="footer-style1 pb-50px" id="site-footer">
                    <div class="container">
                        <div class="row sm-marg align-items-end">
                            <div class="col-lg-8" data-ui-animate data-delay="0.2">
                                <span class="butn-bord-sm mb-15px">Flight BS-2027</span>
                                <h2 class="fs-60"><span class="opacity-7">Brindo</span> &amp; Sreelekshmy</h2>
                                <p class="mt-20px opacity-7 fs-18">Kochi, Kerala · 26 January 2027</p>
                                <p class="mt-10px opacity-7">We can’t wait to celebrate with you.</p>
                            </div>
                            <div class="col-lg-4 md-mt30 text-lg-right" data-ui-animate data-delay="0.3">
                                <p class="fs-14 opacity-7 mb-10px">Questions? See <a href="#qa" class="underline">Q&amp;A</a> or your invitation.</p>
                                <p class="fs-12 opacity-5">Evenzi · Sapphire × Mivon lab prototype</p>
                            </div>
                        </div>
                    </div>
                </footer>
'''

MAIN = f"""
            <main class="o-hidden">

{extract('<!-- ==================== Start Story ==================== -->', '<!-- ==================== End Story ==================== -->')}

{extract('<!-- ==================== Start Announce ==================== -->', '<!-- ==================== End Announce ==================== -->')}

{extract('<!-- ==================== Start Manifest ==================== -->', '<!-- ==================== End Manifest ==================== -->')}

{extract('<!-- ==================== Start Wedding Party ==================== -->', '<!-- ==================== End Wedding Party ==================== -->')}

{extract('<!-- ==================== Start Gallery ==================== -->', '<!-- ==================== End Gallery ==================== -->')}

{extract('<!-- ==================== Start FAQ ==================== -->', '<!-- ==================== Start Testimonials ====================')}

{WEDDING_FOOTER}

            </main>
"""

# Head meta
text = re.sub(
    r'<meta name="keywords" content="[^"]*">',
    '<meta name="keywords" content="Brindo, Sreelekshmy, wedding, Kochi, guest site">',
    text,
)
text = re.sub(
    r'<meta name="description" content="[^"]*">',
    '<meta name="description" content="Wedding guest site for Brindo &amp; Sreelekshmy — 26 Jan 2027, Kochi.">',
    text,
)
text = text.replace('lang="zxx"', 'lang="en"')
text = text.replace('<a class="sp-skip" href="#schedule">', '<a class="sp-skip" href="#story">')

# Remove HTTrack mirror comments
text = re.sub(r"\n<!-- Mirrored from.*?-->\n", "\n", text, flags=re.DOTALL)

# Replace navbar
nav_start = text.find("<!-- ==================== Start Navbar ====================")
nav_end = text.find("<!-- ==================== End Navbar ====================")
nav_end = text.find("-->", nav_end) + 3
text = text[:nav_start] + "<!-- ==================== Start Navbar ==================== -->" + WEDDING_NAV + "\n\n    <!-- ==================== End Navbar ==================== -->" + text[nav_end:]

# Replace sp-private main block
priv_start = text.find('<div id="sp-private"')
main_start = text.find("<main", priv_start)
main_end = text.find("</main>", main_start) + len("</main>")
text = text[:main_start] + MAIN.strip() + text[main_end:]

# Remove inline hr-sec GSAP (portfolio removed)
text = re.sub(
    r"\n    <script>\s*\$\(function \(\) \{.*?</script>\n",
    "\n",
    text,
    flags=re.DOTALL,
)

INDEX.write_text(text, encoding="utf-8")
print("Cleaned", INDEX)
