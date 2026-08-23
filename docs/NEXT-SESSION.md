# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## ▶ START HERE NEXT — After busy-overlay rollout + live sweep (2026-08-23)

**Shipped 2026-08-23** (commit `0c930c77` on `Dev-Vibe`, merged to `Dev-Vibe-Testing` = production, `002bc2e6`): platform-wide screen-freeze (`BusyProvider`/`useBusy` + one global overlay) and destructive-confirm (`ConfirmDialog`) across 21 mutation sites; two `window.confirm()` upgraded to themed dialogs. Also confirmed Dheeraj's 08-22 push live and did a full authenticated click-through sweep of all 17 V0 features. Full detail: session report + sweep-findings below.

**Fix next — bugs found in the 08-23 live sweep (all small, localized FE edits; none fixed yet):**

1. Dashboard event card shows "10 expected" guests vs actual 1 — `app/home` card (hub `events/[id]/page.tsx` is correct)
2. Guest row double country prefix "+91 +91987 6543210" — guests list rendering
3. Setup progress bar hint "Upload a cover photo" while a cover is shown — dashboard
4. User-Settings 2FA copy references a "password" — app is OTP/Google only
5. `/help` shows 6 curated topics vs 10 enabled `config.faq_categories` — curated-list vs data drift
6. Up-next hub panel excludes only `completed`, not `cancelled` — `app/events/[id]/page.tsx:184` (Dheeraj push nit)

**Launch gates still open:**

1. **Help Centre content** — `config.faq_articles` = 0 rows; seed (≥3/category) or disable empty categories; then `support@evenzii.com` env flip + ticket watching
2. **Un-merged Stage-2 audit branch** `feature/platform-truth-audit` — video playback + security batches + billing-hide are NOT on the deployed app yet; decide merge/deploy
3. **Repo cleanup A/B/C** + **fixture cleanup** — delete `e2e-truth-audit` (`f990d6d7-…`) + Account B `e2e.collab.b@evenzi.test` when ready

**Also queued (not blocking):**

- **Q4** Digital Invitations **persist** — planning ongoing (separate feature build)  
- **Q5** Hide Billing Upgrade CTA until payment gateway planned (interim disabled "Coming soon")  
- Verify production Vercel deploy off `Dev-Vibe-Testing` (`002bc2e6`) reaches READY  
- Optional: Website Photos ↔ Media bridge UX  
- Optional: PR-3 logged-in R2 smoke on `evenzi.vercel.app`  

**Authoritative docs from last session:**

- Help close-out: [`docs/session-reports/2026-08-08-help-centre-closeout-session-report.md`](session-reports/2026-08-08-help-centre-closeout-session-report.md)  
- Help CONTEXT: [`docs/superpowers/plans/help-centre-stages/CONTEXT.md`](superpowers/plans/help-centre-stages/CONTEXT.md)  
- Findings: [`docs/testing/2026-08-07-platform-truth-audit-findings.md`](testing/2026-08-07-platform-truth-audit-findings.md)  
- ENH-icons plan: [`docs/superpowers/plans/2026-08-08-enh-icons-sitewide.md`](superpowers/plans/2026-08-08-enh-icons-sitewide.md)

**Domains (locked):** UAT = `evenzi.vercel.app` → later `app.evenzii.com`; marketing stays `evenzii.com`.

### Paste this to start

```
Next session parked items:
(1) Repo cleanup A/B/C
(2) Fixture cleanup e2e-truth-audit + Account B when we say go
(3) Help Centre launch gates — content + support mailbox + ticket watching
Help Centre code is on Dev-Vibe/Testing; ENH-icons intact (Safari favicon = cache).
Ledger: docs/testing/2026-08-07-platform-truth-audit-findings.md
```
