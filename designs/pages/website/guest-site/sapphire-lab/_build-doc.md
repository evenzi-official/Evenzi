# Cursor Build-Doc — Guest Wedding Website · Template #6 "Sapphire / Royal Aviation"

> **Paste this whole file into Cursor.** Self-contained — the receiving tool has no access to the planning chat.

---

## 1. Routing header

- **Tool:** Cursor · **Mode:** auto
- **Rules:** `.cursor/rules/evenzi-design.mdc` — no inline CSS/JS, mobile-first, reuse-before-create, catalog in `designs/components.html`, **vendor deps locally (no CDN)**
- **Pure design work:** static HTML/CSS/JS in `designs/`. Preview: `npm run design` (:4000).
- **Plan:** [`designs/_plans/guest-site-sapphire-boarding-pass.md`](../../../../_plans/guest-site-sapphire-boarding-pass.md) — **6th template, locked 2026-07-21**. Sibling to Midnight Elegant — do **not** merge.

## 2. Objective

Build the **Royal Aviation / Sapphire** guest wedding site — boarding-pass motif (navy grid, cream ticket, gold CHECK IN). Sixth mood in the lineup.

- **Source to mine:** Lovable extract `sandbox/templates-intake/lovable-kerala/` — specifically `HeroSapphire`, `StorySapphire`, `ScheduleSapphire`, `themes.ts` sapphire tokens. Mine layout/motif/tokens — rebuild clean HTML (no TanStack/shadcn runtime).
- **Intro video:** click-to-play `media/intro.mp4` → on `ended` (or Skip) → hero. Same pattern as Midnight Elegant.
- **Motion:** Lenis + GSAP ScrollTrigger — **no Three.js** unless later requested. Boarding-pass UI carries identity.
- **Content:** Brindo & Sreelekshmy, Kochi, 26 Jan 2027 — from Lovable `weddingData` / Kerala prompt.

## 3. Tokens (`--sp-*`)

```
--sp-navy:       #112250;
--sp-navy-dark:  #081428;
--sp-gold:       #C9A24E;
--sp-gold-soft:  #E7CE94;
--sp-cream:      #F5F0E9;
--sp-ink:        #0B1A33;
--sp-muted:      #6B7A93;
--sp-blush:      #E4DDD1;
```

Type: Cormorant Garamond (vendored) for passenger names; Poppins / system mono for flight chrome. (Playfair not vendored — Cormorant stands in.)

## 4. Section spine

Intro video · Hero (boarding pass + countdown + CHECK IN) · Unlock sheet · Announcement · Story · Schedule (boarding-pass cards) · Venue & Travel · Wedding Party · Gallery · Q&A · RSVP · Footer.

## 5. Files

`designs/pages/website/guest-site/sapphire/`:
- `index.html` · `sapphire.css` · `sapphire.js` · `media/intro.mp4` · `_build-doc.md`

## 6. Acceptance (Phase 2 — hero pass)

- [ ] Intro: tap to play → ended → hero; Skip works; reduced-motion skips cinematic
- [ ] Hero matches Lovable Sapphire: flight topline, cream ticket (Groom | perforation | Bride), DEPARTURE IN countdown, gold CHECK IN
- [ ] Mobile: ticket stacks; ≥44px targets; no horizontal overflow
- [ ] Unlock sheet mock (any submit/skip → reveal private stub); `localStorage`
- [ ] No CDN; no inline CSS/JS; `node --check sapphire.js` clean
