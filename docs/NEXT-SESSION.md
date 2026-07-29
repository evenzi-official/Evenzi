# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## ▶ START HERE NEXT — Plan runway takeoff + glass boarding pass (2026-07-22 evening)

Session report: [`docs/session-reports/2026-07-22b-session-report.md`](session-reports/2026-07-22b-session-report.md)

**Mode:** clarify → **plan** → implement (do not jump straight to build).

### 1. Runway takeoff — plan where it lives

Sandbox bake already exists: `sapphire-lab/sapphire-sandbox.html#demo-a` (“A Runway” — taxi → climb + tangent nose). Floaters kit notes it as Demo A.

**Next session job:** plan (not build yet) where/how to **incorporate runway takeoff into the live guest spine** (`sapphire-mivon/`). Candidate beats to discuss:

| Candidate | Why it might fit |
|-----------|------------------|
| Hero unlock → “Proceed to gate” | First motion after check-in |
| After boarding-pass card / before Story | Continuity with flight metaphor |
| Manifest → Party handoff | After paper-plane dodge parks |
| Party / gallery transition | Secondary soar |

Lock: trigger (scroll vs click), one-shot vs scrub, reduced-motion fallback, whether it replaces or coexists with `#sp-mf-flight`.

### 2. Front boarding-pass card — glass + looping video

Target: hero ticket in `sapphire-mivon/` (`.sp-ticket`).

| Change | Intent |
|--------|--------|
| Background **video** behind the card (or inside card plane) | Atmosphere; **loop** forever |
| **Glassmorphic** card | Frosted / translucent over video |
| Keep countdown + names + progress | Content stays; material changes |

Open questions for planning: video asset source + size, poster fallback, `prefers-reduced-motion` (static poster?), dark/light, performance on mobile.

### Already shipped this evening (context)

- Manifest paper-plane dodge → mivon (`#sp-mf-track` / `#schedule`+`#party`); path locked; guide UI stripped; scroll stutter tuned
- Boarding-pass name wrap fix (`SREELEKSHMY` nowrap + smaller clamp)
- Plans: [`guest-site-manifest-paper-plane-dodge.md`](../designs/_plans/guest-site-manifest-paper-plane-dodge.md) · [`guest-site-boarding-pass-countdown-card.md`](../designs/_plans/guest-site-boarding-pass-countdown-card.md)

### Quick commands

```bash
npm run design
# Live:  http://localhost:4000/pages/website/guest-site/sapphire-mivon/index.html
# Bake:  http://localhost:4000/pages/website/guest-site/sapphire-lab/sapphire-sandbox.html#demo-a
# Pass:  http://localhost:4000/pages/website/guest-site/sapphire-lab/sapphire-sandbox.html#demo-pass-stitch
```

---

## ▶ PREVIOUSLY QUEUED — Sapphire × Mivon corrections + playground merge (2026-07-22)

Session report: [`docs/session-reports/2026-07-22-session-report.md`](session-reports/2026-07-22-session-report.md)

- Manifest floaters merge largely **done** (see evening report). Remaining: founder visual polish; venue / sticky RSVP / party grid still on hold until designed.
- Stable sapphire + lab still available for section upgrades.

---

## ▶ PREVIOUSLY QUEUED — Finish Sapphire lab → Classic Editorial (2026-07-21)

Session report: [`docs/session-reports/2026-07-21-session-report.md`](session-reports/2026-07-21-session-report.md)

- Classic Editorial / 4.zip plan still in [`guest-site-classic-editorial-mivon.md`](../designs/_plans/guest-site-classic-editorial-mivon.md) — paused while mivon lab is active

---

## ▶ PREVIOUSLY QUEUED — Guest website templates review (2026-07-20)

**Midnight Elegant** live but not signed off. Creative mandate: maximally immersive guest site.

Full context: [`designs/_plans/guest-website-templates-build-plan.md`](../designs/_plans/guest-website-templates-build-plan.md)
