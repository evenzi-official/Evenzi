# Lovable Prompt — Evenzi Guest Wedding Website (bold-festive · Kerala interfaith)

> **What this is:** a single, self-contained prompt to paste into Lovable. It builds a *pure-design*, mobile-first wedding invitation website used as a **scratch template**. No backend. Everything Lovable needs is inside this prompt.
> **Demo couple:** Brindo Sylen & Sreelekshmy M · Kochi · 26 Jan 2027 · Hindu–Christian fusion.

---

## ⬇️ PASTE EVERYTHING BELOW THIS LINE INTO LOVABLE ⬇️

---

# Build: a mobile-first wedding invitation website (design only)

You are building a **beautiful, fully-responsive single-page wedding invitation website**. This link is shared over **WhatsApp**, so **~90% of visitors open it on a phone** — mobile is the priority and must be flawless. But people will **also open it on laptops and desktops**, so the desktop experience must be a **first-class, intentionally-designed layout too** — not a stretched phone column. Design mobile-first, then design real, generous desktop layouts (multi-column where it helps, larger imagery, full-width hero).

This is a **design/prototype only**. **Do NOT build any backend, database, auth, or API.** Countdown, RSVP, and the unlock gate are **visual mocks** using client-side state only. No Supabase, no forms that POST anywhere, no server.

## Non-negotiable constraints

1. **Mobile-first, phone-native — but properly responsive to desktop.** Design at **390px** first and make it feel like a polished native mobile experience. Then build **real, deliberate layouts** at each larger breakpoint — the content re-flows into multi-column / wider treatments, it does NOT just center a narrow phone column on a big screen. The site should look intentional and beautiful on a 1440px laptop as well as a 390px phone.
2. **Perfect breakpoints — verify all of them.** Test at **360 / 390 / 414px** (phones), **768px** (tablet), **1024 / 1280 / 1440px** (laptop/desktop). No horizontal scroll at any width. No clipped content. No tiny tap targets — every interactive element ≥ 44×44px on touch. Respect `env(safe-area-inset-*)` on any fixed/sticky chrome. Use a sensible content **max-width (~1200px) centered** on very large screens so lines never run too long — but sections genuinely use the extra width (columns, side-by-side media), they don't collapse to a phone strip.
3. **Fast & familiar.** Use patterns mobile users know: sticky bottom CTA, bottom-sheet modals, thumb-reachable actions, smooth scroll, tasteful scroll-reveal. Nothing exotic. Optimize images (lazy-load below the fold).
4. **Self-contained.** All content (copy, names, dates, Q&A, bios) is provided below — use it verbatim. Do not invent placeholder lorem.
5. **Componentized for hand-off.** One React component per section, in its own file, cleanly named (`Hero.tsx`, `StorySection.tsx`, `ScheduleSection.tsx`, etc.). Keep content in a single `weddingData.ts` config object so it's easy to swap. This site will later be ported to a Next.js App Router codebase — keep components pure, presentational, and free of framework-specific coupling.
6. **Stack:** React + TypeScript + Tailwind CSS. Light theme only (no dark mode for the guest site).

## Visual system — "Bold Festive · Kerala"

A confident, editorial, festive look rooted in a Kerala wedding: temple maroon, warm gold, and kasavu (off-white cream with a gold thread). Big, bold headings; generous imagery; elegant restraint.

**Palette (use as Tailwind theme tokens):**
- `maroon` (primary) `#8A1C2B` — deep temple red, used for headings accents, CTAs
- `gold` `#C69A4B` — warm kasavu-border gold, used for dividers, small accents, active states
- `cream` `#FAF4EA` — page background (kasavu off-white)
- `ink` `#2A2320` — body text (warm near-black)
- `blush` `#F3E3DA` — soft section-alt background
- `muted` `#8B7E74` — secondary text
- White `#FFFFFF` for cards.

**Type:**
- Headings: **Poppins** 700–800, tight tracking, large (hero title clamp ~40–56px).
- Body: **Poppins** 400–500, 16px min, 1.6 line-height.
- Optional decorative accent for the couple's names / section eyebrows: **"Cormorant Garamond"** serif italic for a wedding touch (use sparingly — eyebrows, the couple's monogram).
- Small-caps brand-red eyebrows above section titles (e.g. `OUR STORY`).

**Motifs (subtle, tasteful):**
- A thin **gold hairline divider** with a small centered ornament (a tiny lamp/`✦`) between sections.
- A repeating faint **kasavu gold border** treatment on cards.
- Because the couple are aviation people, allow **one light aviation flourish**: a faint dotted flight-path line + small plane glyph in the countdown or the "journey" divider. Keep it optional and removable — it must not dominate.

**Motion:** gentle fade-up on scroll (reduced-motion users get instant). A soft parallax on the hero cover is welcome. Nothing flashy.

## Global structure & the two-tier gate

The site has a **public tier** (anyone with the link) and a **private tier** (revealed after a mock "unlock"):

- On load, show the **public Hero** only, with an **"Unlock Guest Details"** button.
- Tapping it opens an **unlock bottom-sheet** (mock): a phone-number field OR a password field + "View Invitation" button. **No validation, no backend** — any submit (or a "skip / demo unlock" link) reveals the rest of the page by scrolling into the private content. Persist "unlocked" in local component state / `localStorage` so a reload keeps it unlocked.
- After unlock, the full scrollable site is revealed below the hero.
- Add a **sticky bottom "RSVP" button** once unlocked (thumb-reachable, respects safe-area).

## Responsive layout intent (mobile → desktop)

Each section must have a deliberate desktop treatment, not a centered phone strip:

| Section | Mobile (≤414px) | Desktop (≥1024px) |
|---|---|---|
| Hero | Full-bleed vertical cover, content stacked, countdown row | Full-viewport cover, content anchored left/centered, larger type, countdown as a wider tile row |
| Story | Single column, photos stacked between paragraphs | Two-column: narrative text beside the photos; flight-path timeline runs horizontally |
| Itinerary | Vertical stack of event cards | 2- or 3-column card grid (grouped by day), or an alternating timeline |
| Venue & Travel | Map card, then stacked getting-there + hotel cards | Map beside address; getting-there + hotels in a 2–3 column row |
| Wedding Party | Segmented tabs, 2-across person cards | All shown, 3–4 across per side, no tab needed (or side-by-side "Bride's / Groom's" columns) |
| Gallery | 2-column masonry | 3–4 column masonry |
| Q&A | Full-width accordion | Centered ~800px accordion (don't stretch full width) |
| RSVP | Stacked controls, full-width submit | Centered ~640px card |
| Sticky RSVP CTA | Sticky bottom bar (safe-area) | Becomes a pinned top-right / inline CTA — no bottom bar clutter on desktop |

## Sections (in order)

### 1. Hero (public)
- Full-bleed vertical cover photo, dark gradient scrim at bottom for legibility.
- Small eyebrow: `WITH THE BLESSINGS OF OUR FAMILIES`.
- Couple monogram / names: **Brindo & Sreelekshmy** (large, Cormorant italic for names or bold Poppins — designer's call, make it gorgeous).
- Date line: **26 · 01 · 2027 — Kochi, Kerala**.
- **Live countdown** to 26 Jan 2027 (days · hrs · mins · secs), styled as a row of gold-bordered tiles. (Optional aviation flourish here.)
- One-line tagline: *"Two families, two faiths, one forever — join us in Kochi."*
- **"Unlock Guest Details"** primary button.
- Scroll cue at the bottom.

### 2. Announcement banner (private, top of revealed content)
- A slim maroon ribbon: *"We can't wait to celebrate with you! Scroll down for schedule, venue & to RSVP."* (dismissible).

### 3. Our Story (private)
- Eyebrow `OUR STORY`, title **How We Took Off**.
- Two photos (one posed, one candid) + the narrative copy (below).
- Light aviation motif — a dotted flight-path timeline connecting 3 mini-milestones ("Met at work → First flight together → Cleared for forever").

### 4. Schedule / Itinerary (private)
- Eyebrow `THE CELEBRATIONS`, title **Our Wedding Itinerary**.
- Optionally framed as a "flight itinerary / boarding pass" style set of cards (tasteful, on-brand) — each **sub-event** is a card with: icon, name, date, time, venue, dress-code chip, one-line note.
- 6 cards (data below). Group visually by day.

### 5. Venue & Travel (private)
- Eyebrow `GETTING THERE`, title **Venue & Travel**.
- Primary venue card with a **static map image/embed placeholder** (use a styled map placeholder box — no live Google API), address, "Open in Maps" button (mock link).
- "Getting There": nearest airport **Cochin International (COK), Nedumbassery** + **Ernakulam Junction** railway — small cards.
- "Where to Stay": 2–3 hotel cards (name, distance, one-line, "Book" mock button) — data below.

### 6. Wedding Party (private)
- Eyebrow `OUR FAVOURITE PEOPLE`, title **The Wedding Party**.
- Person cards (circular photo, name, role) grouped in two tabs/segments: **Bride's Side** and **Groom's Side**. 6 people (data below).

### 7. Gallery (private)
- Eyebrow `MOMENTS`, title **A Few Of Our Favourites**.
- A masonry / 2-column photo grid, 9 images, tap → lightbox. Lazy-loaded.

### 8. Q & A (private)
- Eyebrow `GOOD TO KNOW`, title **Questions & Answers**.
- Accordion list (data below, ~7 items).

### 9. RSVP (private)
- Eyebrow `WILL YOU JOIN US`, title **RSVP**.
- Mock flow: a "Responding as **[Guest Name]**" line (hardcode a demo name, e.g. "Aravind & family"), then **per-sub-event Yes/No** toggles for the 6 events, a plus-ones stepper (0–2), an optional message textarea, and a **Submit** button that shows a **thank-you success state** (client-side only) with a small celebration animation. No backend.

### 10. Footer (private)
- Couple monogram, date, city.
- **"Download our invitation card"** button (mock).
- Small: *"Made with 💛 on Evenzi"*.

---

## PHOTO DIRECTION (Lovable: pull from Unsplash)

Wire each image slot from Unsplash using the search terms below. Prefer **portrait/vertical** orientation for hero and person shots. Keep a warm, golden, South-Indian-wedding tone throughout. If a specific term returns nothing suitable, use the fallback term.

| Slot | Count | Orientation | Unsplash search terms | Fallback |
|---|---|---|---|---|
| Hero cover | 1 | vertical | `south indian wedding couple` | `indian wedding couple` |
| Our Story | 2 | vertical/square | `kerala wedding couple`, `indian couple candid` | `wedding couple laughing` |
| Venue | 1 | landscape | `kerala wedding mandapam`, `indian wedding stage decor` | `wedding venue decor` |
| Wedding Party | 6 | square/portrait | `indian wedding guests portrait`, `south indian woman saree portrait`, `indian man traditional portrait` | `portrait smiling person` |
| Gallery | 9 | mixed | `mehendi hands`, `haldi ceremony`, `sangeet dance`, `indian wedding ceremony`, `wedding reception india`, `kerala wedding sadhya`, `indian bride kasavu`, `wedding jewellery`, `wedding flowers jasmine` | `indian wedding` |

---

## CONTENT — use this copy verbatim (put it all in `weddingData.ts`)

**Couple:** Brindo Sylen & Sreelekshmy M
**Date:** Tuesday, 26 January 2027
**City:** Kochi, Kerala
**Hashtag:** #BrindoWedsSreelekshmy
**Tagline:** Two families, two faiths, one forever — join us in Kochi.

### Our Story — narrative
> They met the way the best stories start — unexpectedly, at work. Sreelekshmy had spent years in the sky as cabin crew before moving into a corporate role, and that's where a certain aviation-obsessed operations enthusiast couldn't stop finding reasons to talk to her. He knew every aircraft by its silhouette; she knew every airport by its 3 AM coffee. Somewhere between shared shifts and endless conversations about runways and layovers, work turned into something that felt a lot like home.
>
> Then she went back to what she loved — flying — and he stayed on the ground keeping operations running, and somehow the distance only made them surer. Two people, two faiths, one very well-coordinated flight plan. On the 26th of January, with the blessings of both our families, we're finally cleared for forever — and we'd love for you to be on board.

**Story milestones (flight-path timeline):**
1. `Met at work` — where corporate schedules and aviation talk collided.
2. `First flight together` — the trip that made it official.
3. `Cleared for forever` — 26 Jan 2027, Kochi.

### Sub-events (6)
| # | Name | Icon idea | Date | Time | Venue | Dress code | Note |
|---|---|---|---|---|---|---|---|
| 1 | **Nischayam & Blessing** | ring / lamp | Fri, 22 Jan 2027 | 6:00 PM | Sreelekshmy's Residence, Tripunithura | Traditional, festive | An intimate betrothal with both families' blessings. |
| 2 | **Mehendi** | henna hand | Sat, 23 Jan 2027 | 11:00 AM | Poolside Lawn, Le Meridien Kochi | Yellow & green florals | Henna, music & a lazy afternoon together. |
| 3 | **Sangeet** | music note | Sat, 23 Jan 2027 | 7:00 PM | Grand Ballroom, Le Meridien Kochi | Cocktail / Indo-western | Dance floor open — "sky's the limit". |
| 4 | **Muhurtham** | temple lamp | Tue, 26 Jan 2027 | 8:00 AM | Sree Kalyana Mandapam, Tripunithura | Kasavu / traditional Kerala | The Hindu ceremony, followed by a Sadhya on banana leaf. |
| 5 | **Nuptial Mass** | church | Tue, 26 Jan 2027 | 4:00 PM | Santa Cruz Basilica, Fort Kochi | Formal / church elegant | The Christian ceremony & exchange of vows. |
| 6 | **Reception** | champagne | Tue, 26 Jan 2027 | 7:00 PM | Bolgatty Palace, Bolgatty Island | Cocktail / festive | Dinner, dancing & one big celebration for all of us. |

### Venue & Travel
- **Main venue (for map):** Bolgatty Palace, Mulavukad, Bolgatty Island, Kochi, Kerala 682504. ("Open in Maps" mock.)
- **Airport:** Cochin International Airport (COK), Nedumbassery — ~35 km / ~60 min from the city.
- **Railway:** Ernakulam Junction (South) — ~8 km from most venues.
- **Where to Stay (hotel cards):**
  1. **Grand Hyatt Kochi Bolgatty** — 5★ · beside the reception venue · "Book" (mock).
  2. **Le Meridien Kochi** — 5★ · Mehendi & Sangeet venue · "Book" (mock).
  3. **Fragrant Nature Kochi** — 4★ boutique · Marine Drive · "Book" (mock).

### Wedding Party (6)
**Bride's Side (Sreelekshmy):**
1. **Latha Mohanan** — Mother of the Bride
2. **Mohanan Nair** — Father of the Bride
3. **Gopika M** — Sister of the Bride (Maid of Honour)

**Groom's Side (Brindo):**
4. **Elsy Sylen** — Mother of the Groom
5. **Sylen Joseph** — Father of the Groom
6. **Brian Sylen** — Brother of the Groom (Best Man)

### Q & A (7)
1. **What should I wear?** Each function has a dress-code chip on the itinerary — comfortable, festive, and phone-ready for photos! For the Muhurtham, traditional Kerala attire (kasavu) is very welcome.
2. **Are kids invited?** We love your little ones — they're welcome at all functions. The Sangeet runs late, so plan naps accordingly!
3. **Is there parking?** Yes, valet/parking is available at Le Meridien and Bolgatty Palace. The Basilica has limited street parking — carpooling is easier.
4. **Veg or non-veg?** The Muhurtham features a traditional vegetarian **Sadhya** on banana leaf. Reception has both veg and non-veg. Tell us any allergies in your RSVP.
5. **Two ceremonies — do I attend both?** You're warmly invited to all of it. Come for what you can; the Reception is where everyone reunites.
6. **When should I RSVP by?** Please respond by **31 December 2026** so we can plan seating and Sadhya counts.
7. **Getting there & staying?** Fly into Cochin (COK) or take the train to Ernakulam Junction. See "Where to Stay" for hotels near the venues.

### RSVP (mock)
- Responding-as demo name: **"Aravind & family"**.
- Per-event Yes/No for all 6 sub-events.
- Plus-ones stepper: 0–2.
- Optional message: placeholder *"Leave the couple a note…"*.
- Submit → success state: *"Thank you! Your RSVP is on its way. ✈️ We can't wait to see you in Kochi."*

---

## OUTPUT REQUIREMENTS
- One component per section in its own file; a single `weddingData.ts` holding all content above.
- Tailwind theme extended with the palette tokens named above.
- Fully responsive with **deliberate layouts at every breakpoint** — verified at 360/390/414 (phone), 768 (tablet), 1024/1280/1440 (desktop). Desktop uses multi-column layouts per the "Responsive layout intent" table, centered within a ~1200px max-width — never a stretched or narrow phone strip.
- Smooth scroll, scroll-reveal (reduced-motion safe), lazy-loaded images.
- Clean, commented, presentational components ready to port to Next.js.

## ⬆️ END OF LOVABLE PROMPT ⬆️
