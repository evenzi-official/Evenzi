#!/usr/bin/env python3
"""Patch sapphire-mivon/index.html with Sapphire graft, Manifest, FAQ."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"
text = INDEX.read_text(encoding="utf-8")

SAPPHIRE_GRAFT = '''
  <a class="sp-skip" href="#schedule">Skip to manifest</a>
  <div class="sp-visually-hidden" id="sp-live" aria-live="polite"></div>

  <div class="sp-intro" id="sp-intro" role="dialog" aria-modal="true" aria-labelledby="sp-intro-title">
    <video class="sp-intro-video" id="sp-intro-video" playsinline preload="auto" aria-hidden="true">
      <source src="media/intro.mp4" type="video/mp4" />
    </video>
    <div class="sp-intro-scrim" aria-hidden="true"></div>
    <div class="sp-intro-ui">
      <p class="sp-intro-eyebrow" id="sp-intro-title">Flight BS-2027</p>
      <button type="button" class="sp-intro-play" id="sp-intro-play">
        <span class="sp-intro-play-icon" aria-hidden="true"></span>
        <span class="sp-intro-play-label">Tap to board</span>
      </button>
      <button type="button" class="sp-intro-skip" id="sp-intro-skip">Skip intro</button>
    </div>
  </div>

  <header class="sp-hero" id="sp-hero" data-section="hero">
    <div class="sp-page-grid" aria-hidden="true">
      <svg><defs><pattern id="sp-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#sp-grid)"/></svg>
    </div>
    <div class="sp-hero-inner">
      <div class="sp-flight-topline">
        <span>FLIGHT BS-2027 · GATE 26</span>
        <span class="sp-flight-topline-end">BOARDING · 26 JAN 2027</span>
      </div>
      <div class="sp-ticket" role="img" aria-label="Boarding pass for Brindo and Sreelekshmy">
        <div class="sp-ticket-side sp-ticket-side--groom">
          <p class="sp-ticket-label">Passenger — Groom</p>
          <p class="sp-ticket-name">Brindo</p>
          <div class="sp-ticket-route" aria-hidden="true"><span>HIS</span><span class="sp-ticket-rule"></span><span>→</span><span class="sp-ticket-rule"></span><span>HERS</span></div>
        </div>
        <div class="sp-ticket-perf" aria-hidden="true"><span class="sp-ticket-notch sp-ticket-notch--top"></span><span class="sp-ticket-notch sp-ticket-notch--bottom"></span></div>
        <div class="sp-ticket-side sp-ticket-side--bride">
          <p class="sp-ticket-label">Passenger — Bride</p>
          <p class="sp-ticket-name">Sreelekshmy</p>
          <p class="sp-ticket-meta">SEAT 26A · CLASS FIRST</p>
        </div>
      </div>
      <div class="sp-depart">
        <p class="sp-depart-label">Departure in</p>
        <div class="sp-countdown" id="sp-countdown" role="timer" aria-live="polite">
          <div class="sp-countdown-tile"><span class="sp-countdown-num" data-unit="days">00</span><span class="sp-countdown-label">Days</span></div>
          <div class="sp-countdown-tile"><span class="sp-countdown-num" data-unit="hours">00</span><span class="sp-countdown-label">Hrs</span></div>
          <div class="sp-countdown-tile"><span class="sp-countdown-num" data-unit="mins">00</span><span class="sp-countdown-label">Min</span></div>
          <div class="sp-countdown-tile"><span class="sp-countdown-num" data-unit="secs">00</span><span class="sp-countdown-label">Sec</span></div>
        </div>
        <button type="button" class="sp-btn sp-btn--gold" id="sp-unlock-open">Check In</button>
        <a class="sp-proceed" id="sp-proceed" href="#schedule" hidden>Proceed to manifest ↓</a>
      </div>
    </div>
  </header>

  <div class="sp-sheet-scrim" id="sp-unlock-scrim" hidden></div>
  <div class="sp-sheet" id="sp-unlock-sheet" role="dialog" aria-modal="true" aria-labelledby="sp-unlock-title" hidden>
    <div class="sp-sheet-handle" aria-hidden="true"></div>
    <h2 class="sp-sheet-title" id="sp-unlock-title">Check in for guest details</h2>
    <p class="sp-sheet-sub">Enter your phone or invitation password. Demo: any value works.</p>
    <form class="sp-unlock-form" id="sp-unlock-form" novalidate>
      <div class="sp-field"><label class="sp-label" for="sp-unlock-phone">Phone number</label><input class="sp-input" type="tel" id="sp-unlock-phone" placeholder="+91 98765 43210" /></div>
      <p class="sp-or" aria-hidden="true">or</p>
      <div class="sp-field"><label class="sp-label" for="sp-unlock-pass">Invitation password</label><input class="sp-input" type="password" id="sp-unlock-pass" placeholder="••••••••" /></div>
      <button type="submit" class="sp-btn sp-btn--gold sp-btn--block">View boarding pass</button>
      <button type="button" class="sp-btn sp-btn--ghost sp-btn--block" id="sp-unlock-skip">Skip / demo unlock</button>
    </form>
    <button type="button" class="sp-sheet-close" id="sp-unlock-close" aria-label="Close"><span aria-hidden="true">×</span></button>
  </div>
'''

BARCODE = "".join("<span></span>" for _ in range(18))

PASSES = [
    ("01", "Ring", "Nischayam &amp; Blessing", "22 Jan 2027", "6:00 PM", "03", "Sreelekshmy's Residence, Tripunithura", "Traditional, festive", "01A", "", ""),
    ("02", "Henna", "Mehendi", "23 Jan 2027", "11:00 AM", "06", "Poolside Lawn, Le Meridien Kochi", "Yellow &amp; green florals", "02A", "offset-lg-6", "bg-light"),
    ("03", "Music", "Sangeet", "23 Jan 2027", "7:00 PM", "09", "Grand Ballroom, Le Meridien Kochi", "Cocktail / Indo-western", "03A", "offset-lg-1", ""),
    ("04", "Lamp", "Muhurtham", "26 Jan 2027", "8:00 AM", "12", "Sree Kalyana Mandapam, Tripunithura", "Kasavu / traditional Kerala", "04A", "offset-lg-5", "bg-light"),
    ("05", "Church", "Nuptial Mass", "26 Jan 2027", "4:00 PM", "15", "Santa Cruz Basilica, Fort Kochi", "Formal / church elegant", "05A", "offset-lg-2", ""),
    ("06", "Champagne", "Reception", "26 Jan 2027", "7:00 PM", "18", "Bolgatty Palace, Bolgatty Island", "Cocktail / festive", "06A", "offset-lg-4", "bg-light"),
]

pass_blocks = []
for num, chip, name, date, time, gate, venue, dress, seat, offset, light in PASSES:
    pass_blocks.append(f'''
                            <div class="col-lg-5 col-md-6 items {offset}" data-ui-animate data-delay="0.4" data-direction="up">
                                <div class="item stackCard mt-60px mb-60px {light}">
                                    <article class="sp-pass fit-img border-radius-30px o-hidden">
                                        <div class="sp-pass-main">
                                            <div class="sp-pass-top">
                                                <p class="sp-pass-id">Boarding pass · {num}</p>
                                                <span class="sp-pass-chip">{chip}</span>
                                            </div>
                                            <h3 class="sp-pass-name">{name}</h3>
                                            <div class="sp-pass-meta">
                                                <div><p class="sp-pass-k">Date</p><p class="sp-pass-v">{date}</p></div>
                                                <div><p class="sp-pass-k">Time</p><p class="sp-pass-v">{time}</p></div>
                                                <div><p class="sp-pass-k">Gate</p><p class="sp-pass-v">{gate}</p></div>
                                            </div>
                                            <p class="sp-pass-venue">{venue}</p>
                                            <p class="sp-pass-dress">Dress · {dress}</p>
                                        </div>
                                        <div class="sp-pass-stub" aria-hidden="true">
                                            <span class="sp-pass-notch sp-pass-notch--top"></span>
                                            <span class="sp-pass-notch sp-pass-notch--bottom"></span>
                                            <p class="sp-pass-k">Seat</p>
                                            <p class="sp-pass-seat">{seat}</p>
                                            <div class="sp-barcode">{BARCODE}</div>
                                        </div>
                                    </article>
                                </div>
                            </div>''')

MANIFEST = f'''
                <section class="features portfolio-style2 p-0" id="schedule" data-section="schedule">
                    <div class="container">
                        <div class="sec-head text-align-center stack-title text-uppercase md-hide">
                            <h2>manifest</h2>
                        </div>
                        <div class="sec-head mb-80px">
                            <span class="butn-bord-sm mb-15px">Departure manifest</span>
                            <h2 class="fs-60">Six flights. <br> One celebration.</h2>
                            <p class="mt-20px opacity-7">Present this pass at each gate. Boarding begins promptly.</p>
                        </div>
                        <div class="row gallery lg-marg">
{"".join(pass_blocks)}
                        </div>
                    </div>
                </section>
'''

FAQ = '''
                <section class="faq-style1" id="qa" data-section="qa">
                    <div class="container position-relative">
                        <div class="row justify-content-center">
                            <div class="col-lg-9">
                                <div class="sec-head mb-60px text-align-center">
                                    <span class="butn-bord-sm mb-15px">Pre-flight briefing</span>
                                    <h2 class="fs-60">Ask before you board.</h2>
                                </div>
                                <div class="accordion-style2">
                                    <div class="accordion wow fadeInUp slow" id="accordionExample">
                                        <div class="accordion-item active mb-20px">
                                            <div class="accordion-header" id="heading1">
                                                <div class="accordion-button d-flex" data-bs-toggle="collapse" data-bs-target="#collapse1" aria-expanded="true">
                                                    <h6>What should I wear?</h6>
                                                    <div class="ml-auto arrow"><img src="assets/imgs/arrow-crv.svg" alt="" class="w-15px"></div>
                                                </div>
                                            </div>
                                            <div id="collapse1" class="accordion-collapse collapse show" data-bs-parent="#accordionExample">
                                                <div class="accordion-body"><p>Each function has a dress-code chip on the itinerary — comfortable, festive, and phone-ready for photos! For the Muhurtham, traditional Kerala attire (kasavu) is very welcome.</p></div>
                                            </div>
                                        </div>
                                        <div class="accordion-item mb-20px">
                                            <div class="accordion-header" id="heading2">
                                                <div class="accordion-button" data-bs-toggle="collapse" data-bs-target="#collapse2">
                                                    <h6>Are kids invited?</h6>
                                                    <div class="ml-auto arrow"><img src="assets/imgs/arrow-crv.svg" alt="" class="w-15px"></div>
                                                </div>
                                            </div>
                                            <div id="collapse2" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
                                                <div class="accordion-body"><p>We love your little ones — they're welcome at all functions. The Sangeet runs late, so plan naps accordingly!</p></div>
                                            </div>
                                        </div>
                                        <div class="accordion-item mb-20px">
                                            <div class="accordion-header" id="heading3">
                                                <div class="accordion-button" data-bs-toggle="collapse" data-bs-target="#collapse3">
                                                    <h6>Is there parking?</h6>
                                                    <div class="ml-auto arrow"><img src="assets/imgs/arrow-crv.svg" alt="" class="w-15px"></div>
                                                </div>
                                            </div>
                                            <div id="collapse3" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
                                                <div class="accordion-body"><p>Yes, valet/parking is available at Le Meridien and Bolgatty Palace. The Basilica has limited street parking — carpooling is easier.</p></div>
                                            </div>
                                        </div>
                                        <div class="accordion-item mb-20px">
                                            <div class="accordion-header" id="heading4">
                                                <div class="accordion-button" data-bs-toggle="collapse" data-bs-target="#collapse4">
                                                    <h6>Veg or non-veg?</h6>
                                                    <div class="ml-auto arrow"><img src="assets/imgs/arrow-crv.svg" alt="" class="w-15px"></div>
                                                </div>
                                            </div>
                                            <div id="collapse4" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
                                                <div class="accordion-body"><p>The Muhurtham features a traditional vegetarian Sadhya on banana leaf. Reception has both veg and non-veg. Tell us any allergies in your RSVP.</p></div>
                                            </div>
                                        </div>
                                        <div class="accordion-item mb-20px">
                                            <div class="accordion-header" id="heading5">
                                                <div class="accordion-button" data-bs-toggle="collapse" data-bs-target="#collapse5">
                                                    <h6>Two ceremonies — do I attend both?</h6>
                                                    <div class="ml-auto arrow"><img src="assets/imgs/arrow-crv.svg" alt="" class="w-15px"></div>
                                                </div>
                                            </div>
                                            <div id="collapse5" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
                                                <div class="accordion-body"><p>You're warmly invited to all of it. Come for what you can; the Reception is where everyone reunites.</p></div>
                                            </div>
                                        </div>
                                        <div class="accordion-item mb-20px">
                                            <div class="accordion-header" id="heading6">
                                                <div class="accordion-button" data-bs-toggle="collapse" data-bs-target="#collapse6">
                                                    <h6>When should I RSVP by?</h6>
                                                    <div class="ml-auto arrow"><img src="assets/imgs/arrow-crv.svg" alt="" class="w-15px"></div>
                                                </div>
                                            </div>
                                            <div id="collapse6" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
                                                <div class="accordion-body"><p>Please respond by 31 December 2026 so we can plan seating and Sadhya counts.</p></div>
                                            </div>
                                        </div>
                                        <div class="accordion-item">
                                            <div class="accordion-header" id="heading7">
                                                <div class="accordion-button" data-bs-toggle="collapse" data-bs-target="#collapse7">
                                                    <h6>Getting there &amp; staying?</h6>
                                                    <div class="ml-auto arrow"><img src="assets/imgs/arrow-crv.svg" alt="" class="w-15px"></div>
                                                </div>
                                            </div>
                                            <div id="collapse7" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
                                                <div class="accordion-body"><p>Fly into Cochin (COK) or take the train to Ernakulam Junction. See venue section for hotels near the celebrations.</p></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="shape-top-left w-300px opacity-5" data-speed="0.7" data-lag="0">
                            <img src="assets/imgs/mshap3.png" alt="">
                        </div>
                    </div>
                </section>
'''

# Head updates
text = text.replace("<title>Mivon</title>", "<title>Brindo &amp; Sreelekshmy · Sapphire × Mivon · 26 Jan 2027</title>")
text = text.replace(
    '<link rel="stylesheet" href="assets/css/style.css">',
    '<link rel="stylesheet" href="assets/css/style.css">\n    <link rel="stylesheet" href="sapphire-overlay.css">',
)

# Sapphire graft after body
text = text.replace("<body class=\"home-main\">", "<body class=\"home-main\">" + SAPPHIRE_GRAFT)

# Wrap main content in sp-private
text = text.replace("<main class=\"o-hidden\">", '<div id="sp-private" class="sp-private is-locked" hidden aria-hidden="true">\n            <main class="o-hidden">')
text = text.replace("</main>", "</main>\n            </div>", 1)

# Replace features/approach section
start = text.find("<!-- ==================== Start Features ====================")
end = text.find("<!-- ==================== End Features ====================")
if start == -1 or end == -1:
    raise SystemExit("Features section markers not found")
end = text.find("-->", end) + 3
text = text[:start] + "<!-- ==================== Start Manifest ==================== -->" + MANIFEST + "\n\n                <!-- ==================== End Manifest ==================== -->" + text[end:]

# Insert FAQ before testimonials
marker = "<!-- ==================== Start Testimonials ===================="
if marker not in text:
    raise SystemExit("Testimonials marker not found")
text = text.replace(marker, "<!-- ==================== Start FAQ ==================== -->" + FAQ + "\n\n                " + marker)

# Bridge script
text = text.replace(
    '<script src="assets/js/scripts.js"></script>',
    '<script src="assets/js/scripts.js"></script>\n    <script src="sapphire-bridge.js"></script>',
)

INDEX.write_text(text, encoding="utf-8")
print("Patched", INDEX)
