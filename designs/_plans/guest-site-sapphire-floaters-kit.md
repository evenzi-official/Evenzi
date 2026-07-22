# Sapphire — floaters gather kit (paper plane → lab)

> **Status:** Gathering · 2026-07-21  
> **Preview sandbox:** `sapphire-lab/sapphire-sandbox.html` (jet A/C/D + floater M1–M4)
> **Build target:** `sapphire-lab/` first → founder approve → promote to `sapphire/`  
> **Related:** [`guest-site-paper-plane-preview.md`](guest-site-paper-plane-preview.md) · [`guest-site-sapphire-lab-upgrade.md`](guest-site-sapphire-lab-upgrade.md)

---

## Locked so far

| Topic | Decision |
|-------|----------|
| Path shape on site | **Landmark hops** — fly between 2–3 section anchors (not one full-page mega-path) |
| Extensibility | Same engine for **other SVG floaters** later (stamp, stub, pin…) |
| Layering | **Mixed** — behind some surfaces, in front of others (z-index bands per segment) |
| Build order | Lab → approve → promote stable |
| Scroll drivers | **Keep all four** (M1–M4) in the floater engine — not a single bake-off winner. Sapphire default wire = **M3+M4** (Lenis + ScrollTrigger landmark hops). M1/M2 remain for light pages / no-Lenis contexts / debugging |
| Preview | Bake-off page keeps all demos as living reference |

---

## Open — start gate (need founder pick)

When does the first flight arm?

| Option | Pros | Cons |
|--------|------|------|
| **A** After intro video ends (or skip) | Feels like “boarding begun” | Busy right as hero appears |
| **B** After unlock sheet dismisses | Private content + plane together | Locked guests never see it |
| **C** First scroll past hero mid-point | Quiet until guest engages | Easy to miss |
| **D** Intro end **arms** it; first scroll **starts** scrub | Best of A+C | Slightly more state |

**Recommend D** unless you want plane only for unlocked guests → then **B**.

*(Methods are locked as “all four.” Start gate is still the open call.)*

---

## Mobile (agent pick — optimal / safe)

| Viewport | Behavior |
|----------|----------|
| ≥768px | Full landmark path + snake trail + mixed z |
| &lt;768px | **Same landmarks, simplified polyline** (fewer control points); thinner dashes; lower spawn rate |
| `prefers-reduced-motion` | No snake; optional static gold dash between first→last landmark OR hide floater entirely |
| Very short viewport / WA in-app | Cap to **one** hop (hero → schedule) if two hops jank |

Do **not** run three heavy methods at once on Sapphire — preview compares; production picks **one** driver.

---

## Method bake-off (preview page)

| ID | Method | Role in kit |
|----|--------|-------------|
| **M1** | Vanilla scroll scrub | Light / no deps |
| **M2** | GSAP ScrollTrigger scrub | ST without Lenis |
| **M3** | Lenis + ScrollTrigger | **Sapphire default stack** |
| **M4** | Landmark section pins | **Sapphire default route shape** |

**Locked 2026-07-21:** ship the engine with **all four** selectable via floater config (`driver: 'vanilla' | 'st' | 'lenis-st' | 'landmarks'`). Production Sapphire lab first wire uses `lenis-st` + `landmarks` together.

---

## Asset kit to gather (before Sapphire build)

| Asset | Status | Notes |
|-------|--------|-------|
| `media/paper-plane.svg` | ✅ | Plane only, nose +X, `currentColor` |
| Snake trail renderer | ✅ in preview JS | Extract to shared module when porting |
| Path definition format | 🔲 | JSON or SVG paths per hop: `{ from: '#sp-hero', to: '#schedule', d: '…' }` |
| Floater registry stub | 🔲 | `{ id, svg, color, zBand, hops[] }` — plane first |
| Extra SVG candidates (optional later) | 🔲 | Ticket stub · wax seal · gate stamp — same API |
| Z-band tokens | 🔲 | e.g. `--sp-float-back` / `--sp-float-mid` / `--sp-float-front` |
| Start-gate hook | 🔲 | Depends on A/B/C/D above |
| Reduced-motion policy | ✅ drafted | See mobile table |

---

## Sapphire section landmarks (proposed)

Demo content already has: `#sp-hero`, `#story`, `#schedule`, `#venue`, `#party`, `#gallery`, `#faq`, `#rsvp`.

**Proposed first route (3 hops):**

1. Hero (boarding pass) → Schedule (departure manifest)  
2. Schedule → Venue  
3. Venue → RSVP  

Adjust after visual pass. Mixed z: behind ticket on hero, in front of section washes mid-page, behind sticky RSVP CTA at end.

---

## Build phases (after method + start-gate chosen)

1. Freeze preview winner + extract `sp-floater.js` API in lab  
2. Wire landmarks + one paper-plane route in `sapphire-lab`  
3. Mobile simplify + reduced-motion QA  
4. Founder approve → promote to `sapphire/`  
5. Catalog note in `components.html` (W6b floater)

---

## Acceptance (Sapphire lab, when built)

- [ ] Plane flies landmark hops only (not full-bleed chaos)  
- [ ] Snake trail gold; oldest dashes fade  
- [ ] Mixed z doesn’t block taps (pointer-events: none on floater layer)  
- [ ] Start gate matches chosen A/B/C/D  
- [ ] Mobile + reduced-motion safe  
- [ ] Other floater can register without rewriting scroll code  

---

## Built / next

- Preview renamed to **sapphire-sandbox** ✅ (`sapphire-sandbox.html` / `.css` / `.js`)
- Jet demos **A / C / D** + floater **M1–M4** ✅
- Full-viewport section sims (not tiny cards) ✅
- Bidirectional scrub: scroll up reverses plane/jet/trail ✅
- Demo **A** runway: path-sampled taxi → quadratic climb + tangent nose (not rigid diagonal) ✅
- **Methods:** all four retained; Sapphire default = M3+M4  
- **Next:** founder picks start gate **A / B / C / D** → extract `sp-floater` API → wire into `sapphire-lab` story section
