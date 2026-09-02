# Session Report — Subdomain Split (Pass 1 + 2) + Repo Cleanup

**Date:** 2026-08-30 (wrapped 2026-08-31)
**User:** Abhijith
**Branch:** `feature/subdomain-split` (off `Dev-Vibe` `13f44807`)
**ClickUp:** dormant — no task updates (standing founder decision since 2026-08-01).

---

## Goal

Split the Evenzi platform into three host-routed surfaces — marketing (`evenzii.com`), app (`app.evenzii.com`), admin (`admin.evenzii.com`) — inside **one Next.js app and one Vercel project**, and clean up the repo in the same push. No schema changes.

## What shipped (all on `feature/subdomain-split`, not yet merged to `Dev-Vibe`)

### Design + review
- Architecture decided (R1): one app, three surface folders under the routing root (`app/{app,marketing,admin}/`), `middleware.ts` rewrites by `Host` header. Rejected the monorepo (3 projects) and the asymmetric app-at-root layouts.
- Design spec written and **council-reviewed at the design checkpoint** (Tech Lead, Security, DevOps) — verdict ADDRESS-THEN-PROCEED; findings folded into the spec (`docs/superpowers/specs/2026-08-30-subdomain-split-design.md`, §14).
- Cursor build-doc authored (`docs/sprint/sprint-1/handoff-subdomain-split.md`), 2-pass, with the founder DNS/env cutover runbook.

### Pass 1 — structural move (`881d8a94`)
- Root `app/layout.tsx` slimmed to the document shell; app chrome moved into a nested `app/app/layout.tsx`; new nested `marketing`/`admin` layouts (only the root layout owns `<html>/<body>`).
- Route folders `git mv`-ed into `app/app/` (home, events, settings, auth, help); landing + legal into `app/marketing/`.
- Live components extracted before deleting the dead pages the original list wrongly flagged: `FlyCanvas` → `components/ui/`, `WeddingTemplate1Client` → `components/templates/`. Only the `website-theme-framer` remainder was deleted; `wedding-invitation-temp-1` (a live template-preview route) and the `dev/` playground were kept.
- Temporary path-only middleware kept the pre-split URLs working. **Claude review gate: independently re-ran tsc (0), tests (296/297, the 1 known route.test.ts failure), build (ok).**

### Pass 2 — host routing + auth hardening (`a4986e3d`)
- `lib/surface.ts`: exact-host allowlist resolution (unknown host → marketing, least privilege), `x-forwarded-host` ignored, preview `?surface=`/`x-evenzi-surface` override double-gated to non-production, `normalizePathname` (decode + `..`/`.` collapse) before prefix-rejection.
- `middleware.ts`: host → surface rewrite via `x-middleware-rewrite` (Supabase cookies preserved), `/e/[slug]` pinned to the app host, per-surface security headers (admin strict CSP + `frame-ancestors 'none'` + DENY), app-scoped manifest/icons, tombstone `sw.js`.
- `lib/supabase/middleware.ts`: surface-scoped auth; admin gate fails **closed** on empty/missing `ADMIN_USER_IDS` (parsed to a trimmed, lowercased Set), after a real `getUser()`; app-root `/` → `/home` or `/auth`; host-scoped cookies (no `Domain=.evenzii.com`).
- `lib/url.ts` extended (`getMarketingBaseUrl`, `getAdminBaseUrl`); `sys-check` env assertion; comprehensive middleware/surface/auth unit tests.
- Council-code review (Security + Tech Lead): **no critical, boundary sound.** Three latent hardenings applied by Cursor (over-broad `isStaticAsset` removed, `isPublicPath` prefixes anchored, `/dev` gated to non-production).

### Live QA + a bug found and fixed (`8167ec45`)
- Full functional pass via Host-header curl + a visual browser pass on all three surfaces.
- **Bug found in live QA:** the admin gate's terminal 403 was still getting the surface rewrite appended, so admin `/` returned 403 **but rendered the `/admin` route body** (a content leak once the real panel ships) and `/home` turned the 403 into a 404. Root cause: the rewrite-skip guard only caught 3xx. Fixed (skip rewrite for any ≥300), regression test added, re-verified live: clean `403 Forbidden` with no rewrite header.
- Login flow: OTP **send** leg verified on the app host (status "OTP SENT", no server errors). OTP **verify** + admin allowlisted-success were **not** driven to completion — browser-pane instability (a tooling issue, not an app defect); left for a founder manual check.

### Vercel + Supabase change set added (`870fe185`)
- Spec §15/§16: the complete external-config delta with current live state (verified via Vercel MCP — none of the `evenzii.com` hosts attached yet, 4 env vars unset), **including the previously-missing Supabase Auth redirect-URL allowlist change** (`app.evenzii.com/auth/callback`) required for OAuth/OTP on the new host, plus a full end-of-split click-through QA matrix.
- Founder-executable checklist artifact published (Cutover & QA).

### Repo cleanup (on `Dev-Vibe`, `456c2185` → `13f44807`)
- Rescued unique unmerged docs (`docs/architecture/*`, `AGENTS.md`) from abandoned branches, then deleted 6 dead branches (local + remote).
- Removed orphaned `landing-page/` (a 2nd Next app nothing deploys — coming-soon builds from a separate repo, verified via Vercel) + ignored nested `.next`.
- Published two decision-aid artifacts (Repo Cleanup Map, Split Cutover & QA).

## Verification (independently re-run by Claude)
- `tsc --noEmit`: 0.
- `npm run test:run`: 352/353 (the 1 failure is the pre-existing `__tests__/api/events/route.test.ts`).
- `npm run build`: passed; route manifest shows `/app/*`, `/marketing/*`, `/e/[slug]`, `/dev/r2-test` correctly.
- Middleware unit tests: 20/20 (incl. the new admin-403 regression + host/spoof/preview/cookie cases).
- Live host-header matrix + browser pass: all surfaces route correctly.

## Open / next
1. **Founder decision: merge `feature/subdomain-split` → `Dev-Vibe`** (preview). Held this session pending the manual QA legs.
2. **Founder manual QA legs:** OTP verify → `/home`; admin allowlisted-success (put a real UUID in `ADMIN_USER_IDS`); the auth-form OTP-code-step render (unconfirmed — pre-existing logic, not split-touched).
3. **Cutover (founder, gated on green preview):** attach the 4 domains, move apex off `evenzi-coming-soon`, set the 4 env vars (Production + Preview), add the Supabase redirect allowlist, flip Allow-manual-linking ON, repoint the push webhook. Runbook: spec §15 + the Cutover & QA artifact.
4. Parked cleanup: `qa/` 19 MB history purge; DB fixtures (`e2e-truth-audit` + Account B).

## Notes
- A fresh dev server was left running on `:3000` (I stopped Cursor's stomped one and wiped `.next` to recover from a self-inflicted `npm run build` over the live dev `.next`).
- Cursor executed both build passes + the hardenings + the local test pass under Claude review gates throughout.
