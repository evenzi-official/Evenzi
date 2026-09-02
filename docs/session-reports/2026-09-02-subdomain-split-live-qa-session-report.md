# Session Report — 2026-09-02

## Work Accomplished

- **Feature/Task:** Subdomain split (marketing/app/admin) — manual QA + merge to production + live-deploy bugfixes
- **Phases completed:** manual QA (local) → bug found + fixed → merge (`feature/subdomain-split` → `Dev-Vibe` → `Dev-Vibe-Testing`) → live production deploy → live QA on `evenzi.vercel.app` → second bug found + fixed → redeploy → full live QA pass
- **ClickUp tasks updated:** none (ClickUp dormant since 2026-08-01, per standing founder decision)

Session picked up the subdomain-split branch that was built and held for QA in the 2026-08-30 session. Completed all three outstanding manual-QA legs from `NEXT-SESSION.md` (OTP verify, admin allowlisted-success, auth-form OTP-code render), then — at the founder's explicit direction — merged the branch into `Dev-Vibe-Testing`, putting the 3-surface split live on `evenzi.vercel.app` for the first time. Two real bugs were caught and fixed live (not test artifacts): the `?surface=` preview override was dead on every real Vercel deployment, and `evenzi.vercel.app` defaulted to the wrong surface, breaking login for anyone clicking through by hand. Both fixed, tested, and backported across all three branches before the session ended with a full live QA pass confirming all six test legs green on production.

## Deliverables

| Type | Count | Details |
|------|-------|---------|
| Files modified | 3 | `lib/surface.ts`, `__tests__/lib/surface.test.ts`, `docs/sprint/sprint-1/abhijith-log.md` |
| Bugs found + fixed | 2 | Preview-override dead on real deploys; `evenzi.vercel.app` wrong default surface |
| Regression tests added | 5 | Covering both fixes + the staging-alias carve-out |
| Branches merged | 2 | `feature/subdomain-split` → `Dev-Vibe` → `Dev-Vibe-Testing` (production) |
| Production deploys shipped | 2 | Initial split cutover, then the surface-default hotfix |
| Live QA legs verified | 6 | Marketing load, app signed-out redirect, app fresh-OTP login, app deep-nav, admin allowlisted-success, admin signed-out 403 — all on `evenzi.vercel.app` |
| Env vars documented/added | 4 | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL`, `NEXT_PUBLIC_ADMIN_URL` (Vercel), `ADMIN_USER_IDS` (Vercel + local) |
| ClickUp tasks updated | 0 | Dormant |
| WhatsApp draft | 1 | Heads-up to Dheeraj on the `app/` folder reorg + live test URLs |

## Token Usage Estimate

| Phase | Input Tokens | Output Tokens | Est. Cost |
|-------|-------------|---------------|-----------|
| Session start (context + briefing) | 8,000 | 1,500 | $0.05 |
| Manual QA — local (OTP, admin, browser automation) | 15,000 | 4,000 | $0.11 |
| Vercel/domain investigation (screenshots, MCP calls) | 20,000 | 5,000 | $0.14 |
| Bug 1 diagnosis + fix + verification (build/curl round-trips) | 25,000 | 6,000 | $0.17 |
| Merge orchestration (3 branches, gate checks) | 12,000 | 3,000 | $0.08 |
| Deploy monitoring (polling Vercel MCP) | 10,000 | 2,000 | $0.06 |
| Bug 2 diagnosis + fix + live re-verification | 15,000 | 4,000 | $0.10 |
| Full live QA browser pass | 12,000 | 3,000 | $0.08 |
| WhatsApp draft + end-session | 6,000 | 2,000 | $0.05 |
| **Total** | **~123,000** | **~30,500** | **~$0.84** |

## Issues Discovered

| Issue | Type | Task Created | Priority |
|-------|------|-------------|----------|
| `?surface=` preview override dead on every real Vercel deployment (`NODE_ENV` always `production` post-build) | Bug | Fixed this session (`fdddb639`) | P0 — blocked all deployed testing |
| `evenzi.vercel.app` defaulted to `marketing` surface, breaking post-OTP client-side redirects | Bug | Fixed this session (`ce93819a`) | P0 — broke live login |
| Production build 404s the static `/marketing` page on **any** query string (reproduces with `?foo=bar`; doesn't happen in `npm run dev`) | Bug, unrelated to split | Not fixed — flagged only | P1 — will break real UTM/ad-campaign links once `evenzii.com` goes live |
| `apex evenzii.com` domain status unknown — not attached to either Vercel project, actual DNS/registrar state unverified | Gap | Not fixed — flagged only | Needed before real domain cutover |

## Optimization Suggestions

- **Vercel deployment polling was expensive.** ~8 rounds of `get_project`/`get_deployment` calls plus background `sleep` waits to watch two separate builds land. A `Monitor` with a poll-until-ready loop (single tool call, one notification) would have replaced ~10 round-trips with one.
- **The production-build verification method (local `next build && next start` + curl) was the right call** — it caught the `NODE_ENV` bug that vitest's test environment silently masked (vitest's own `NODE_ENV` differs from a real Next.js production build). Worth keeping as a standing technique for any future middleware/env-gated logic change, not just this session.
- **Two consecutive hotfixes to the same file (`lib/surface.ts`) after "done" was declared** — the first merge should have included a live-deploy smoke test *before* declaring the branch complete, not after. For future host-routing/middleware work, add "verify on an actual deployed URL, not just curl-simulated" as an explicit gate before merge, since client-side navigation behavior (dropped query params) only surfaces in a real browser session.

## Next Session

- **Founder decision pending:** when to attach real `evenzii.com`/`app.evenzii.com`/`admin.evenzii.com` domains — deliberately deferred this session per explicit founder instruction ("forget evenzii.com domain for now").
- **Before that cutover:** verify what `evenzii.com` apex is currently pointed at (not visible in either Vercel project's domain list — needs a registrar/DNS check, not just Vercel dashboard).
- **Fix when convenient (not blocking):** the query-string 404 on the static `/marketing` page in production builds — will bite real marketing links (UTM params, social shares) once the apex goes live.
- **Housekeeping:** `feature/subdomain-split` is now fully merged into both `Dev-Vibe` and `Dev-Vibe-Testing` — safe to delete once founder confirms no further QA needed on it.
- **Dheeraj:** WhatsApp heads-up drafted (not yet sent) about the `app/` folder reorg on `Dev-Vibe` — he should pull before his next session.
