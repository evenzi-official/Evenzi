# Evenzi — Framer Motion Landing Page Design Spec

**Date:** 2026-06-28
**Route:** `/website-theme-framer`
**Status:** Approved — building

---

## Overview

A scroll-driven landing page showcasing Evenzi's brand through a 3D invitation envelope animation. Built with Framer Motion v12 inside the existing Next.js app. The 3D envelope is the narrative spine: it enters, opens, and the invitation card slides out and spins as the user scrolls.

---

## Route & Files

```
app/website-theme-framer/
  page.tsx                      ← Server Component (root)
  components/
    NavBar.tsx                  ← Fixed nav: Evenzi wordmark + CTA
    HeroSection.tsx             ← Headline, sub, CTA, scroll hint
    StickyEnvelope.tsx          ← 300vh sticky animation zone
    FeaturesSection.tsx         ← 3 glass cards (whileInView)
    HowItWorks.tsx              ← 3-step timeline
    CTASection.tsx              ← Final sign-up CTA
```

---

## Brand Tokens Used

| Token | Value | Usage |
|---|---|---|
| `--brand` | `#BB0020` | Logo, CTAs, accents, card header |
| `--bg` dark | `#0d0d0d` | Page background |
| `--bg` light | `#f9fafb` | How It Works section |
| `--ink` | `#111827` | Body text (light sections) |
| `--muted` | `#a8a8a8` | Secondary text (dark sections) |
| Poppins 800 | `var(--font-poppins)` | Logo, headings, invitation card |

---

## Sticky Envelope Animation

Container: `300vh` tall, sticky inner frame `100vh`.
Driven by `useScroll({ target: containerRef, offset: ['start start', 'end end'] })`.

| `scrollYProgress` | Transform |
|---|---|
| `0.00 → 0.08` | Envelope fades in |
| `0.00 → 0.15` | Envelope rises from y=80 → y=0, scale 0.88 → 1 |
| `0.15 → 0.42` | Flap rotates open: `rotateX` 0° → -172° (origin: top) |
| `0.33 → 0.42` | Card fades in |
| `0.36 → 0.65` | Card slides up: y=50 → y=-150 |
| `0.62 → 0.86` | Card spins: `rotateY` 0° → 360° (front → back → front) |
| `0.86 → 0.96` | Envelope fades out |

**Text panels** (each fades in/out at its own window, centered below envelope):
1. `0.05–0.40` — "One invitation. / A thousand guests."
2. `0.33–0.62` — "Send via WhatsApp / in seconds."
3. `0.55–0.82` — "Track every RSVP, / live."
4. `0.76–1.00` — "Your day. / Your story."

---

## 3D Envelope Construction

- **Container:** `perspective: 1200px`, `perspectiveOrigin: 50% 30%`
- **Envelope body:** `340×240px`, cream gradient `#fefcf7→#fdf6ec`, `border-radius: 16px`, fold lines via `clip-path`, wax seal (38px brand-red circle, "E" monogram)
- **Invitation card:** `300×216px` (inset 20px from envelope edges), z-index 5 above envelope, `transformStyle: preserve-3d`
  - *Front:* brand-red header strip, "Priya & Raj" in Poppins 800, date + venue + RSVP pill, decorative frame border
  - *Back:* cream gradient, Evenzi wordmark at 25% opacity (watermark)
  - `backfaceVisibility: hidden` on both faces — standard CSS card flip
- **Flap:** top 55% of envelope, `clip-path: polygon(0 0, 50% 100%, 100% 0)` (downward triangle), `transformOrigin: top center`, `rotateX` animates 0° → -172°, `z-index: 6` (always above card until it opens)

---

## Section Summary

| Section | Background | Key animation |
|---|---|---|
| NavBar | Frosted `rgba(13,13,13,0.8)` | Slide in on mount |
| HeroSection | `#0d0d0d` + brand red glow | Staggered entrance (0.2s, 0.4s, 0.6s, 0.8s) |
| StickyEnvelope | `#0d0d0d` | Scroll-driven (see above) |
| FeaturesSection | `#111` dark | `whileInView` stagger, 3 glass cards |
| HowItWorks | `#f9fafb` light | `whileInView` stagger, step circles |
| CTASection | `#0d0d0d` | `whileInView` entrance + hover on button |
