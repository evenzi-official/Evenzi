# Guest-site scroll motion — Figma motion spec

> **Status:** Draft — Figma boards built; awaiting founder sign-off before HTML motion work on themes 02–05.  
> **Owner:** Abhijith · **Started:** 2026-07-21 · **Related:** [guest-website-templates-build-plan.md](guest-website-templates-build-plan.md)

---

## Figma source of truth

**File:** [Template](https://www.figma.com/design/uCeHd1JWmdSrVaqIBSr0Pn/Template) · `fileKey=uCeHd1JWmdSrVaqIBSr0Pn`

| Page | Node | Purpose |
|---|---|---|
| [00 Capture](https://www.figma.com/design/uCeHd1JWmdSrVaqIBSr0Pn/Template?node-id=0-1) | `0:1` | Pixel captures of Midnight Elegant (viewport crop, full tall scroll, desktop ~1440 hero) |
| [Motion Boards](https://www.figma.com/design/uCeHd1JWmdSrVaqIBSr0Pn/Template?node-id=7-4) | `7:4` | All 5 theme scroll-motion languages (Starter plan = 3 pages max — themes share this page) |
| [99 Refs](https://www.figma.com/design/uCeHd1JWmdSrVaqIBSr0Pn/Template?node-id=7-5) | `7:5` | Pinterest / Magnific / Google Flow / Stitch drop slots + seeded links |

**Note:** Figma Starter allows only 3 pages, so the planned per-theme pages were consolidated onto **Motion Boards**.

---

## Shared spine (all themes)

Hero(+countdown) · Unlock · Announcement · Our Story · Schedule · Venue & Travel · Wedding Party · Gallery · Q&A · RSVP · Footer

Stack (when building HTML later): **Lenis + GSAP ScrollTrigger (+ SplitText) + Three.js** where the theme brief calls for WebGL — vendored locally, `prefers-reduced-motion` fallback required.

---

## Theme motion languages

### 01 · Midnight Elegant (flagship — live)

- **HTML:** `designs/pages/website/guest-site/midnight-elegant/`
- **Live:** https://evenzi-official.github.io/Evenzi/pages/website/guest-site/midnight-elegant/
- **Tokens:** bg `#0B0E14` · gold `#C9A24B` · ink `#F4EFE6` · Cormorant Garamond + Poppins
- **Hero:** Three.js gold particles / diya glow; SplitText char reveal on names
- **Set-pieces:** (1) Story image parallax scrub (±8% y) (2) Schedule card slide-in desktop (3) Gallery horizontal pin scrub ≥1024
- **Unlock:** Bottom-sheet → private tier; `localStorage`
- **Reduced motion:** Disable Lenis + heavy GSAP + WebGL; static elegant layout; unlock/countdown/RSVP still work
- **Figma:** 10 keyframe cards + brief on Motion Boards (top of page)

### 02 · Bold Festive

- **Character:** Faster beats, scale pops, warm maroon/gold
- **Hero:** Scale-punch title; tasteful gold flecks (not party-app confetti)
- **Set-pieces:** Hero scale-settle · Schedule pop-scale stagger · Gallery snap/bounce scrub
- **Gallery:** Punchy horizontal or snap sections; high-contrast borders
- **Unlock:** Sheet scale 0.96→1 + gold hairline flash
- **Reduced motion:** No pops/particles; static maroon/gold

### 03 · Classic Editorial

- **Character:** Magazine scroll — slow fades, sticky type, hairline rules
- **Hero:** Serif names fade+blur settle; rule draws under names
- **Set-pieces:** Sticky editorial column · Timeline rules draw · Pull-quote pin
- **Gallery:** Editorial grid, slow opacity stagger (no aggressive pin)
- **Unlock:** Soft fade overlay dismiss
- **Reduced motion:** No sticky/pin; simple fade

### 04 · Minimal Modern

- **Character:** Apple-quiet — long ease, large type morph, almost no ornament
- **Hero:** Massive type opacity morph; single accent underline grows
- **Set-pieces:** Image mask wipe · Letter-spacing tighten on titles · RSVP focus glow only
- **Gallery:** Quiet masonry fade; optional slow horizontal without pin theatrics
- **Unlock:** Minimal sheet; instant content swap
- **Reduced motion:** Disable any remaining scrub

### 05 · Blush Romantic

- **Character:** Soft parallax florals, gentle float, cream/pink washes
- **Hero:** Soft float petals; names rise gently
- **Set-pieces:** Dual-portrait soft parallax · Schedule float-in · Gallery ken-burns
- **Gallery:** Soft ken-burns + fade; rounded frames
- **Unlock:** Blurred cream scrim
- **Reduced motion:** No float/parallax/kenburns; static soft stills

---

## Reference intake

Slots live on **99 Refs**. Founder drops:

| Tool | Target |
|---|---|
| Pinterest | 8–12 pins per theme |
| Magnific | 2–3 upscaled stills per theme |
| Google Flow | 1–2 motion clips (or stills) per theme — hero / pin / gallery |
| Stitch | Alt hero/story comps — [project 3859360114226566614](https://stitch.withgoogle.com/projects/3859360114226566614) |

**Already seeded on Refs page:** ME live + local URLs, Azurio sandbox path, Stitch project, Evenzi locked Figma (`LjoTKwL7pkpYVnAW6hr4s8`).

Refs inform motion language only — not shippable assets (see build plan §6 licensing).

---

## Sign-off gate

- [ ] Founder reviews Motion Boards (all 5 briefs)
- [ ] Founder fills or links refs in 99 Refs (or accepts seeded defaults for ME)
- [ ] Motion verbs locked → then HTML builds for themes 02–05 may start under Cursor

**Out of scope until sign-off:** new GSAP/Lenis on non-ME themes · host `templates/` gallery motion · React `/e/[slug]` port
