# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## ▶ START HERE NEXT — Finish Sapphire, then first intake design from Mivon/4.zip (2026-07-21)

Session report: [`docs/session-reports/2026-07-21-session-report.md`](session-reports/2026-07-21-session-report.md)

### Context (this session)

- **Sapphire / Royal Aviation** guest site built (full spine from Lovable): intro video → boarding-pass hero → unlock → story/manifest/venue/party/gallery/Q&A/RSVP.
  - Stable: `designs/pages/website/guest-site/sapphire/`
  - Lab clone: `designs/pages/website/guest-site/sapphire-lab/` (upgrade one section at a time)
  - Plans: [`guest-site-sapphire-boarding-pass.md`](../designs/_plans/guest-site-sapphire-boarding-pass.md) · [`guest-site-sapphire-lab-upgrade.md`](../designs/_plans/guest-site-sapphire-lab-upgrade.md)
  - Preview: `npm run design` → `/pages/website/guest-site/sapphire/` (or `sapphire-lab/`)
- **Midnight Elegant** got intro video gate (same pattern as Sapphire).
- **Figma Template** (`uCeHd1JWmdSrVaqIBSr0Pn`): ME + Sapphire captures on `00 Capture`.
- **Mivon plan** drafted for Classic Editorial: [`guest-site-classic-editorial-mivon.md`](../designs/_plans/guest-site-classic-editorial-mivon.md)
- Lineup now includes **Sapphire as 6th** mood; intake zips: **4=Mivon · 5=Azurio(ME) · 6=Xfolio · 7=Cunnet** (already in `sandbox/templates-intake/`).

### Do next, in order

1. **Complete Sapphire** — work in `sapphire-lab/`, one section per pass (see lab-upgrade plan). Promote approved sections back to `sapphire/`. Re-capture Figma when polish lands.
2. **First design from ThemeForest intake** — take Sapphire’s quality bar + Kerala content into **4.zip / Mivon** → build `designs/pages/website/guest-site/classic-editorial/` (magazine/editorial, not boarding-pass). Mine `sandbox/templates-intake/mivon/…/onepage-creative-agency.html` + live [Mivon onepage](https://uithemez.com/i/mivon_html/onepage-creative-agency.html). **Do not** redo Azurio (5) — that’s already Midnight Elegant.
3. Later: Xfolio (6) Minimal Modern · Cunnet (7) Blush Romantic · Bold Festive React port · ThemeForest licensing · ClickUp reconnect (`86d2jwzge`).

### Quick commands

```bash
npm run design
# http://localhost:4000/pages/website/guest-site/sapphire-lab/
# http://localhost:4000/pages/website/guest-site/sapphire/?capture=1  # Figma capture helper
```

---

## ▶ PREVIOUSLY QUEUED — Guest website templates review (2026-07-20)

**Template #2 "Midnight Elegant" is BUILT and LIVE** — but **not yet signed off**.
Live: https://evenzi-official.github.io/Evenzi/pages/website/guest-site/midnight-elegant/

Full context: [`designs/_plans/guest-website-templates-build-plan.md`](../designs/_plans/guest-website-templates-build-plan.md) · report: [`docs/session-reports/2026-07-20-session-report.md`](session-reports/2026-07-20-session-report.md)

**⭐ Creative mandate:** guest website = primary marketing surface; maximally immersive; "heavy done well."

Still owed on ME: Claude code/spec review + Antigravity responsive/a11y/perf; revise Minimal Modern build-doc immersive framing.

---

## ✅ DONE — Full E2E QA pass + P0 auth-dep fix + onboarding-gate spec · 2026-06-30

Session report: `docs/session-reports/2026-06-30-session-report.md`. Full QA: `qa/2026-06-30-full-test-pass.md`. Spec: `docs/superpowers/specs/2026-06-30-profile-completion-onboarding-gate-design.md`.

**P0 FIXED — `@supabase/ssr` stale install** — see prior report. Bugs to triage into ClickUp remain in that report / QA doc.

---

## ▶ PREVIOUSLY QUEUED — User Settings data model (brainstorm in progress · 2026-06-25)

Brainstorm for User Settings data-model (`86d2k1myh`). Decisions locked on ClickUp comment; email/phone open question still pending. Spec/council/migrations not started.
