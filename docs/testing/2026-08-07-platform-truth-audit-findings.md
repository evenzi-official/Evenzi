# Platform Truth Audit — Findings Ledger

> Stage 1 audit + Stage 2 Batches A–D fixes + W3 full UI click-through (2026-08-07).
> Fixtures kept until founder says clean.
> Branch: `feature/platform-truth-audit` · worktree `.worktrees/platform-truth-audit` (isolated from chatbot).

## Fixture notes

| Key | Value |
|-----|-------|
| Account A | phone `919999999999` / OTP `123456` |
| Account B | `e2e.collab.b@evenzi.test` |
| E2E event | `e2e-truth-audit` · `f990d6d7-6fd1-49db-82bf-b848974a85a2` · **keep** |
| Wave reports | `docs/testing/audit-2026-08-07/` |

---

## Fixed this session

### Batch A — security
| ID | Fix |
|----|-----|
| P0-1 | Revoked anon `get_pending_invite`; accept-invite service preview, no email shown logged-out |
| P0-2 | Lookup API password gate |
| P1-9 | Revoked anon `hash_website_password` |
| P1-4 | Retired open `/api/events/[id]/rsvp` → 410 |

### Batch B — media
| ID | Fix |
|----|-----|
| P1-1 | Video lightbox plays via `<video>` + Play button |
| P1-6 | `POST …/media/urls` uses `requireEventRead` (viewers work) |

### Batch C — truth UI
| ID | Fix |
|----|-----|
| P1-2 | Invitations: honest “Draft only — not saved”; Download disabled “soon” |
| P1-8 | RSVP share URL uses `getAppBaseUrl()` + slug |
| P1-3 | Billing Upgrade → disabled “Coming soon”; perks no longer invent guest/photo caps |
| P1-15 | Storage meter copy clarifies temporary 5 GB soft limit |
| P1-10 | Journey lists real sub-events; CTAs link to event hub (no dead buttons) |

### Batch D — authz / guest settings
| ID | Fix |
|----|-----|
| P1-5 | Sub-events PATCH: session + `requireEventWrite(...,'website')` + RLS `collab_update_sub_events_website` |
| P1-7 | `submit_rsvp` enforces `rsvp_enabled` + `max_plus_ones_per_invite` (+ mapRpcError) |
| P1-14 | Trusted client IP helper — no spoofable leftmost XFF for rate-limit buckets |
| P1-11 | Vitest harness — mock `@/lib/supabase/server` + setup env + lib assertion drift; `npm run test:run` **201/201 green** |

### Docs
| ID | Fix |
|----|-----|
| P1-13 | `DATA-MODEL.md` Security status → COLLABORATOR LAYER LIVE |

Migrations: `security_batch_a_01_revoke_anon_pii_rpcs`, `security_batch_bcd_01_sub_events_rsvp_enforce`

---

## Still open (not in fix batches)

| ID | Notes |
|----|-------|
| P2-* | Auth ToS `#`, stubs, template Q&A, Admin/Chatbot not started |
| Design Q&A Q1–Q5 | **Locked 2026-08-07** — see section below |
| Prod-risk PR-1–PR-6 | **PR-1 FIXED live** (HMAC trigger; dispatch log + 200). See `prod-risk.md`. PR-2 intentional domains. PR-5 PASS. PR-3 partial. Code: `dispatch-push` shared-secret accept + vitest (uncommitted). |
| Repo cleanup A/B/C | Deferred to a separate session |

---

## Design Q&A — locked (founder 2026-08-07)

| # | Topic | Decision |
|---|-------|----------|
| **Q1** | Website **theme** catalog (5 designs vs 1 React template) | **C — Hybrid:** keep **1 live** (`cinematic-scroll`); other theme tiles stay honest “coming soon” (no fake selectable cards). *Not the same as Media & Memories — see note below.* |
| **Q2** | Guest-site sapphire / midnight-elegant HTML | **A — Design refs / workshop only** until templated in React |
| **Q3** | Journey page depth | **A — Read-only timeline** of sub-events for V0 (current wiring is enough) |
| **Q4** | Invitations FE persist | **Next build** — planning in progress; track in Digital Invitations scope (not V0 blocker) |
| **Q5** | Billing Upgrade CTA | **B — Hide** Upgrade until payment gateway is planned/wired |

**Q1 clarification (Media vs website themes):** **Media & Memories is fully wired** (R2 upload, albums, signed URLs, meter). Q1 is only the **Digital Presence → Design** *website theme* picker (`WebsiteDesignClient` — extra themes show “Soon”). Separate stub: **Website → Photos** tab still says “use Media for now” for *which photos appear on the guest site* — that bridge is not built yet; photos live in Media either way.

**Follow-up builds (not this audit branch unless asked):** Q4 invitations persist · Q5 hide billing Upgrade · optional Website Photos → Media bridge copy/UX

---

| ID | Notes |
|----|-------|
| P1-12 | No `GET /api/events/[id]/admins` JSON list — SSR Admins page + invite/remove APIs cover product UI; E2E uses service-role workaround. Revisit if SPA refresh / mobile client needs JSON list. |
| ENH-icons | **Favicon + Apple/Android home-screen meta icons** — so “Add to Home Screen” / bookmarks show Evenzi branding (not browser default). Take after current session wrap-up. |

---

## Wave status

| Wave | Status |
|------|--------|
| W0–W6 audit | done (W3 initially thin API smoke — superseded) |
| **W3 full UI click-through** | **PASS** — `w3-full-clickthrough.spec.ts` (host + 4 roles Accept UI + decline + forbidden writes) |
| **W3 headed Chrome deep click** | **PASS** — `w3-chrome-deep-click.spec.ts` (host 45 steps + collab Accept/Decline; see `w3-chrome-deep-click.md`) |
| Stage 2 Batches A–D | **done** (code + live SQL) |
| Prod-risk pass | **done** — PR-1 live-fixed (HMAC trigger verified 200 + dispatch log) |
| Commits | merged to Dev-Vibe → Dev-Vibe-Testing (end of session) |
| Fixture cleanup | **next session** with repo cleanup A/B/C |
