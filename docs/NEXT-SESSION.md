# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## ▶ START HERE NEXT — V0 green-up + WhatsApp invites shipped (2026-08-26)

**Shipped to prod** (`Dev-Vibe` `307a9b72` → `Dev-Vibe-Testing` `0fedcab7`, Vercel deploy triggered). 7 commits. Full detail: [`docs/session-reports/2026-08-26-session-report.md`](session-reports/2026-08-26-session-report.md).

**Done this session (nothing to re-do):**
1. **V0 Batch A+B** — the 2026-08-22 audit chart was stale; most reds were already fixed by drift. Six genuinely-open items fixed: deleted orphaned `/api/auth/verify`, delete-copy honesty, single-add duplicate-phone guard, **RSVP-rate hub tile now real** (via `event_hub_summary` new `guest_responded`/`rsvp_percent` cols), bulk-complete RPC scoped by `event_id`. 2 DB migrations applied.
2. **V0 readiness artifact** re-audited → all stub/dead = 0, republished in place (`8fbeab2b-…`).
3. **WhatsApp invites (Path A)** — Guest Management "Send invites" is live: click-to-chat from the host's OWN WhatsApp, per-row Open WhatsApp + guided queue, `/e/[slug]` OG link-preview, `mark-invited` API, undo + reversal. Council-reviewed. **Live-verified end-to-end** (invited persists to DB). Spec: [`docs/superpowers/specs/2026-08-26-whatsapp-invites-path-a-design.md`](superpowers/specs/2026-08-26-whatsapp-invites-path-a-design.md).
4. **Invitation pre-fill** (couple = partner names + formatted date) + send-queue modal surface fix (`lg-glass-card`).

**Open / next:**
1. **Confirm prod deploy READY** on `evenzi.vercel.app`.
2. **Manual QA (founder):** invitation photo-BG / upload-own-card persistence; B7 push-toast on a subscribed device; eyeball invite pre-fill + WhatsApp queue on own events.
3. **Pre-existing failing test** `__tests__/api/events/route.test.ts` ("returns mapped events list") — fails on clean HEAD, unrelated; spawned task to fix (suite is 296/297).
4. **WhatsApp Path B** (Business API — real bulk + card-image attachment) — future, needs budget + Meta verification.
5. **Pending founder decision:** "conversation transcript, hard rule on all sessions" — raw transcript auto-save vs the existing session report — not yet wired.

---

## Digital Invitations persistence merged (2026-08-24)

**Shipped to `Dev-Vibe`** (merge `f4f27b09`, **not yet pushed / not yet on prod**): the invitation card designer now persists — template, 7 text slots, per-line sizes (`inv_07` `slot_sizes` column), + R2 images (public bucket). 3 owner-only API routes + debounced autosave + resume-editor-if-personalized. Live-verified scenarios 1/2/5 (text+size+template-swap persist across reload). A P0 the click-through caught (Zod v4 exhaustive `z.record` broke ALL saves) is fixed. Report: `docs/session-reports/2026-08-24-invitations-persistence-session-report.md`.

**Open on this feature:**
1. **Push `Dev-Vibe` to origin** (preview) — not yet done.
2. **Deploy decision:** merge onward to `Dev-Vibe-Testing` for prod — not yet done (needs founder ok).
3. **Manual click-through of photo-BG + upload-own-card image persistence** (scenarios 3/4) — automated browser can't drive the OS file-picker; code path reviewed sound.
4. v0-readiness artifact row still says the old "nothing persists" state — update it.

Then resume the broader "partial/not-started screen-by-screen" sweep (next: Digital Presence template gallery gap; Admin Module deferred out of V0).

---

## After the 08-23 fix sweep + two rebuilds (2026-08-23 b)

**Shipped 2026-08-23 (b)** — all 11 findings from the founder's live sweep actioned and **live in prod** (`Dev-Vibe-Testing` `3019f38e`, Vercel READY). Commits `050af62b` (7 V0 fixes) → `5848c842` (CTA gating) → `dfb99d60` (Our Journey rebuild), merged `Dev-Vibe` `9d0dd0a0` → prod `3019f38e`; back-merge `955b3abf` recovered the prod-only bee-mascot commit so Dev-Vibe is the superset. Full detail: `docs/session-reports/2026-08-23b-fix-sweep-and-rebuilds-session-report.md`.

**Done this session (nothing to re-do):**

- 6 sweep bugs fixed inline (dashboard guest count → actual; guest double `+91`; cover placeholder tag; 2FA copy; up-next excludes cancelled; busy-overlay hang).
- `/help` was **not** a bug — categories are DB-driven (6 app / 4 public is correct). Seeded **18 sample articles** into `config.faq_articles` (the real gap).
- **CTA gating** (Cursor, Claude-reviewed) — 17 forms disable submit until required fields valid. Live.
- **Our Journey 1:1 rebuild** (Cursor, Claude-reviewed + pixel-parity) — full sub-event manager + POST/PATCH/DELETE APIs. Live.

**Fix next (open):**

1. **#7 Connect a 2nd sign-in method** (Google↔Phone) — ✅ **BUILT + live** (2026-08-23c, `feature/connect-signin-method` → prod). Both link directions + disconnect with last-method guard; client-side, no new API routes; callback honors a guarded `next`. Design: `docs/superpowers/specs/2026-08-23-connect-signin-method-design.md`; report: `docs/session-reports/2026-08-23c-connect-signin-session-report.md`. **Two gates remain:** (a) founder toggles Supabase **Auth → Allow manual linking** ON (Google-link degrades to "temporarily unavailable" until then; phone-link works now); (b) live click-through QA of both link flows + disconnect on a real session (automated browser can't drive the OTP input / Google OAuth).
2. **Help Centre launch gates** — articles now seeded ✅; remaining are `support@evenzii.com` mailbox live + ticket watching.
3. **Un-merged Stage-2 audit branch** `feature/platform-truth-audit` — video playback + security batches + billing-hide are NOT on the deployed app yet; decide merge/deploy.
4. **Repo cleanup A/B/C** + **fixture cleanup** — delete `e2e-truth-audit` (`f990d6d7-…`) + Account B `e2e.collab.b@evenzi.test` when ready.

**Also queued (not blocking):**

- **Q4** Digital Invitations **persist** — planning ongoing (separate feature build)  
- **Q5** Hide Billing Upgrade CTA until payment gateway planned (interim disabled "Coming soon")  
- Optional: Website Photos ↔ Media bridge UX  
- Optional: PR-3 logged-in R2 smoke on `evenzi.vercel.app`  
- Note: a 6-function demo fixture was seeded onto test event *A & B's Wedding* (`7353ca9d…`) for parity testing — left as demo data.  

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
