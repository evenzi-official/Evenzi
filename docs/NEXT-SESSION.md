# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## ▶ START HERE NEXT — Repo cleanup A/B/C (2026-08-08)

**Parked — pick up next:**

1. **Repo cleanup A/B/C** — separate cleanup pass (as deferred earlier)  
2. **Fixture cleanup** (with cleanup pass) — delete `e2e-truth-audit` (`f990d6d7-…`) + Account B `e2e.collab.b@evenzi.test` only when ready  

**Also queued (not blocking cleanup):**

- **Q4** Digital Invitations **persist** — planning ongoing (separate feature build)  
- **Q5** Hide Billing Upgrade CTA until payment gateway planned (honesty “Coming soon” may already be on branch — final = hide)  
- Optional: Website Photos ↔ Media bridge UX  
- Optional: PR-3 logged-in R2 smoke on `evenzi.vercel.app`  
- Support Chatbot — continues on `feature/support-chatbot-plan` (main folder); do not mix into cleanup worktree  
- Replace interim **E** app icon when final logo mark ships (`public/brand/mark.svg` + `app/icon.png` / `public/icons/*`)

**Authoritative docs from last session:**

- Findings: [`docs/testing/2026-08-07-platform-truth-audit-findings.md`](testing/2026-08-07-platform-truth-audit-findings.md)  
- Prod-risk: [`docs/testing/audit-2026-08-07/prod-risk.md`](testing/audit-2026-08-07/prod-risk.md)  
- V0 readiness brief (for Claude artifact): [`docs/ops/2026-08-07-v0-readiness-update-brief.md`](ops/2026-08-07-v0-readiness-update-brief.md)  
- Local readiness HTML: [`docs/ops/v0-readiness.html`](ops/v0-readiness.html)  
- ENH-icons plan: [`docs/superpowers/plans/2026-08-08-enh-icons-sitewide.md`](superpowers/plans/2026-08-08-enh-icons-sitewide.md)

**Domains (locked):** UAT = `evenzi.vercel.app` → later `app.evenzii.com`; marketing stays `evenzii.com`.

### Paste this to start

```
Next session parked items:
(1) Repo cleanup A/B/C
(2) Fixture cleanup e2e-truth-audit + Account B when we say go
ENH-icons shipped (interim E mark) — see plan 2026-08-08-enh-icons-sitewide.md
Keep chatbot work on feature/support-chatbot-plan isolated.
Ledger: docs/testing/2026-08-07-platform-truth-audit-findings.md
```

---

## ▶ PAST — ENH-icons site-wide (2026-08-08)

Shipped on `cursor/enh-icons-next-session-note-581f`: interim brand **E** favicon / Apple touch / PWA icons, root `metadata` + `viewport` theme-color, `app/manifest.ts`, public `/icons/*`, middleware allowlist for `manifest.webmanifest`, designs assets synced. Plan: `docs/superpowers/plans/2026-08-08-enh-icons-sitewide.md`.

---

## ▶ PAST — Platform truth audit + Stage 2 fixes + prod-risk PR-1 (2026-08-07)

Merged via `feature/platform-truth-audit` → `Dev-Vibe` → `Dev-Vibe-Testing`.  
Session report: [`docs/session-reports/2026-08-07-platform-truth-audit-session-report.md`](session-reports/2026-08-07-platform-truth-audit-session-report.md)

Highlights: P0 security (invite PII, lookup password gate), honesty UI, media video play, Vitest 201 green, push webhook HMAC fixed live, Design Q&A Q1–Q5 locked, W3 full UI + Chrome deep click PASS.

---

## ▶ PAST — Collab invite + Event Settings cleanup + Push (2026-08-06/07)

See prior reports under `docs/session-reports/` and plans under `docs/superpowers/plans/`.
