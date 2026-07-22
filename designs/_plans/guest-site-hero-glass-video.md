# Hero boarding pass — glass + full-section looping video

> **Status:** Plan locked for bake · 2026-07-22 evening  
> **Live target:** `sapphire-mivon/` `#sp-hero` + `.sp-ticket`  
> **Sandbox:** `sapphire-sandbox.html#demo-pass-glass` (bake first)  
> **Source:** `/Users/xcalider/Downloads/IMG_6490.mov` (iPhone 16, 4K HEVC, ~50.6s, ~85MB)  
> **UI/UX plan:** [UI/UX agent](9d42a68c-061b-4166-bc30-7d63fa289cb3) + ui-ux-pro-max  
> **Related:** [`guest-site-boarding-pass-countdown-card.md`](guest-site-boarding-pass-countdown-card.md) · [`guest-site-runway-takeoff-his-hers.md`](guest-site-runway-takeoff-his-hers.md)

---

## Video content (founder asset review)

In-flight cabin-window B-roll: deep blue sky, dense white cloud deck, aircraft winglet top-right. Bright daylight, slow cloud drift. Ideal aviation hero; wing anchors “on board.”

| Call from footage | Decision |
|-------------------|----------|
| Bright clouds under ticket | Light frosted glass + **dark ink** (not translucent type) |
| Blue sky / white clouds | Dual scrim: soft top wash for nav + gentle bottom navy under ticket |
| Wing top-right | Ticket stays centered/left-weighted; do not fight wing |
| 50s @ 4K / 85MB | **Never ship raw.** Trim loop + ladder encode |

---

## Founder locks

| # | Decision |
|---|----------|
| **G1** | Video = **full `#sp-hero` section** background |
| **G2** | Asset = `IMG_6490.mov` (optimized derivatives only) |
| **G3** | Agent-optimized ladder (below) |
| **G5** | Recommended Liquid Glass strength — **final after live review** |
| Content | Keep countdown, names, progress, Check In |

---

## Agent calls (locked for bake)

| # | Call |
|---|------|
| **G4 Poster** | Still shown **before** video decodes, on **`prefers-reduced-motion`**, on **Save-Data**, and if autoplay fails. Frame ~15s → `poster.webp` + `poster.jpg`. |
| **G6 Chrome** | Frosted Liquid Glass panel + **solid high-contrast type**; keep perforation; rim/inset replaces heavy opaque white fill. |
| **G8 Mobile perf** | Muted `playsinline` loop; **pause** when hero &lt;10% visible or tab hidden; **720p** &lt;768 / **1080p** ≥768; Save-Data + reduced-motion → **poster only**. |
| **G9 Theme** | Same video both modes. Light: white wash glass + dark ink. Dark: dark glass + light type + cooler/navy scrim bias. |

**Prior “card stays white”** — overridden by glass-over-video.

---

## Layer stack (`#sp-hero`)

```
#sp-hero (relative, min-height 100dvh, overflow hidden)
├── .sp-hero-media          z:0
│   ├── img.sp-hero-poster  (LCP)
│   └── video.sp-hero-video (cover, muted, loop, playsinline)
├── .sp-hero-scrim          z:1
├── .sp-page-grid           z:2 (dimmed or off over video)
└── .sp-hero-inner          z:3  → .sp-ticket + .sp-depart
```

---

## Glass recipe (bake defaults — tune live)

| Token / prop | Light | Dark |
|--------------|-------|------|
| Backdrop | `blur(30px) saturate(180%)` (`--lg-blur`) | same |
| Wash | `rgba(255,255,255,0.58)` over `--lg-bg-grad` | dark `--lg-bg-grad` + slight navy |
| Rim / insets | Liquid Glass rim + inset highlights | same |
| Type | Dark ink / muted labels | Light ink / muted |
| Fallback | `@supports not (backdrop-filter)` → solid ≈94% cream/navy | |

Max **2** blurred surfaces visible (ticket + nav chips).

---

## Encode ladder (shipped assets)

Dir: `sapphire-mivon/media/hero-bg/` (+ copy under lab for sandbox)

| File | Spec |
|------|------|
| `poster.webp` / `poster.jpg` | 1080-wide from **t≈36s** |
| `hero-720.mp4` | **36s → end** (~14.5s), 1280×720, H.264, 24fps, ~2.5Mbps, **no audio**, `+faststart` |
| `hero-1080.mp4` | same trim, 1920×1080, ~4Mbps |
| Optional `hero.webm` | VP9 if size wins; else H.264-only v1 |

**Loop trim (bake):** **36.0s → end** of source. Display: `object-fit: contain` (full frame, no cover zoom/crop).

---

## Motion / a11y

| Signal | Behavior |
|--------|----------|
| Default | Autoplay muted loop over poster fade-in |
| `prefers-reduced-motion` | Poster only; no play |
| Save-Data / 2g | Poster only |
| Offscreen / hidden | `pause()` |
| Unlock sheet open | Pause hero video |

Countdown math / progress bar **unchanged**. Ticket ripples still respect reduced-motion (existing).

---

## Acceptance

- [ ] Full-bleed video behind ticket on mivon + sandbox demo
- [ ] Glass ticket readable on brightest cloud frames and blue sky
- [ ] Poster paints before decode; reduced-motion = static
- [ ] Mobile 360–414: no H-scroll; Check In ≥44px; video cover
- [ ] Desktop 768–1440: ticket max-width intact; wing not covering names
- [ ] Pause when scrolled past hero
- [ ] Raw 85MB MOV **not** committed

---

## Open (founder after live)

- Exact glass wash % (55–65)
- Scrim strength
- Loop in/out if seam noticeable
- Dark-mode ticket grade over this daylight footage

---

## Built · 2026-07-22

Shipped to `sapphire-mivon/` hero + sandbox `#demo-pass-glass`:

- Encoded `media/hero-bg/` — `poster.jpg`/`webp`, `hero-720.mp4` (~3.6MB), `hero-1080.mp4` (~5.8MB); loop trim 12–24s of `IMG_6490.mov`
- Full-section video + scrim + Liquid Glass `.sp-ticket` (light/dark)
- Pause offscreen / Save-Data / reduced-motion → poster
- Sandbox bake: `#demo-pass-glass`
- Verified: desktop + 390 mobile hero readable; glass blur active

**Still open for founder:** G5 wash %, R3 reverse feel (runway), dark vs light preference on this B-roll
