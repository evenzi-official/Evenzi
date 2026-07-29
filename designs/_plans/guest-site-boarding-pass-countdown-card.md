# Boarding-pass hero — one-card countdown (sandbox bake)

> **Status:** Ported to mivon · 2026-07-22  
> **Sandbox:** `sapphire-sandbox.html#demo-pass-stitch` (Stitch bake)  
> **Live:** `sapphire-mivon/` hero — Stitch layout (label/value, watermark, progress + ripple)  
> **UI/UX review:** GO-WITH-CHANGES ([agent](1569a6ac-829a-4793-b7c1-b9ee323a1f22))

---

## Founder locks

| # | Decision |
|---|----------|
| Progress | Live bar toward **wedding day** (26 Jan 2027, IST) |
| ETA / Status | Label/value: `ETA 26 JAN` · `STATUS Nd left` |
| Route | **HIS** / **HERS →** |
| Layout | **Stitch bake** (supersedes hybrid perforation) |
| CTA | Text **Check In** under card (≥44px) → unlock sheet |
| Theme | Card stays white; page light/dark via Mivon theme |
| Origin | Placeholder `2026-06-01` until publish / first-invite locked |

---

## Agent verdict (summary)

Absorbing countdown tiles into the ticket is right for WhatsApp guests. Required changes before build:

1. Lock **0% origin** date (progress math needs a start).
2. Bar color = aviation green token — **not** neon lime, **not** gold (gold stays brand/CTA chrome).
3. CTA = text-styled **button**, ≥44px hit area.
4. Update ≤1/min; no second tick; reduced-motion = static fill.
5. Drop whole-card `role="img"` once progress is live.

---

## Card anatomy

### Mobile (360) — stack top → bottom

1. Groom: label + name  
2. Route: `HIS —→ HERS`  
3. **Progress strip** (full width inside card): track + fill + plane at fill tip · ETA under strip  
4. Horizontal perforation + notches  
5. Bride: label + name + seat meta  
6. **Outside card:** Check In (text button)

### Desktop (≥768) — hybrid columns

```
┌──────────────────┬──┬──────────────────┐
│ PASSENGER GROOM  │▓▓│ PASSENGER BRIDE  │
│ Brindo           │▓▓│ Sreelekshmy      │
│ HIS → HERS       │▓▓│ SEAT · CLASS     │
├──────────────────┴──┴──────────────────┤
│ ████████░░░░  ✈   ETA 26 JAN · 187d left │  ← full-bleed strip under both sides
└────────────────────────────────────────┘
         Check In  (text, below card)
```

- Perforation = ticket grammar only.  
- Progress = time status only. **Do not** merge into one dashed+green line.

---

## Progress semantics

| | |
|---|---|
| **0%** | `COUNTDOWN_ORIGIN` — site publish / first invite send (founder must lock; sandbox uses placeholder until then) |
| **100%** | `2027-01-26T00:00:00+05:30` |
| **Formula** | `clamp(0,1, (now − origin) / (wedding − origin))` |
| **After wedding** | Cap 100%; copy → `ARRIVED · 26 JAN`; stop ticking |
| **Plane** | Inline SVG on leading edge of fill; decorative; no continuous motion |
| **Reduced motion** | Instant width; no glow/pulse |
| **Tick** | On load + every 60s + on `visibilitychange` when shown |

**A11y:** `role="progressbar"` + `aria-valuenow/min/max` + visible ETA. Ticket is **not** a single `role="img"`.

---

## Tokens (sandbox)

| Token | Light | Dark |
|---|---|---|
| `--sp-progress` | `#2F6B4F` | `#3D9B6A` |
| `--sp-progress-track` | navy @ ~12% | white @ ~12% |
| Gold | Reserved for other chrome — **not** the bar | |

Solid fill only — no blur / neon glow (WhatsApp WebView).

---

## Sandbox scope

**In**

- New demo section in `sapphire-sandbox.html` (e.g. `#demo-pass`) with light/dark toggle if sandbox lacks one  
- Page CSS/JS for card + progress math  
- Placeholder `COUNTDOWN_ORIGIN` documented in plan + code comment  

**Out**

- Port to `sapphire-mivon/`  
- Changing intro / nav / story  
- Real unlock sheet wiring (sandbox can stub Check In → announce only)

---

## Open (need founder before / during bake)

- [ ] Exact **`COUNTDOWN_ORIGIN`** date (publish or first invite). Until then: sandbox placeholder `2026-06-01T00:00:00+05:30`.

---

## Acceptance (sandbox)

- [ ] One card; no external countdown tiles  
- [ ] HIS → HERS + perforation retained  
- [ ] Progress strip + ETA `ETA 26 JAN · Nd left`  
- [ ] Origin → mid → wedding → day-after math verified  
- [ ] Light + dark; aviation green tokens; no lime; gold off the bar  
- [ ] Check In text button ≥44px  
- [ ] Progressbar semantics; tick ≤1/min; reduced-motion OK  
- [ ] 360 / 768 / 1024: no overflow; notches don’t clip plane tip  

---

## Next after sign-off

1. ~~Build `#demo-pass` in sapphire-sandbox~~ ✅  
2. Founder visual pass  
3. Only then port into mivon `sapphire-overlay` / hero markup  

---

## Built (2026-07-22)

Shipped in `sapphire-lab/sapphire-sandbox.html#demo-pass`:

| Piece | Notes |
|---|---|
| Hybrid card | Groom \| perforation \| bride + full-width progress strip |
| Progress | Origin placeholder `2026-06-01` → wedding `2027-01-26`; ~22% today; ETA `ETA 26 JAN · Nd left` |
| Plane | Inline SVG on fill tip (green badge) |
| CTA | Text **Check In** ≥44px (sandbox stub announce) |
| Theme | Light/dark toggle in sandbox header (`body.is-dark`) |
| A11y | `role="progressbar"` + visible ETA; tick 60s |

**Still open:** real `COUNTDOWN_ORIGIN` (publish / first invite).  

**Also (2026-07-22 evening):** Ported Stitch-style pass into mivon hero (`.sp-ticket`). Name wrap fix — `SREELEKSHMY` nowrap + smaller clamp in `sapphire-overlay.css`. **Queued next:** glassmorphic card + looping background video (plan first).  
**Not ported** to `sapphire-mivon/` yet.  
