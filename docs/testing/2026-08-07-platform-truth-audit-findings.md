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

### Docs
| ID | Fix |
|----|-----|
| P1-13 | `DATA-MODEL.md` Security status → COLLABORATOR LAYER LIVE |

Migrations: `security_batch_a_01_revoke_anon_pii_rpcs`, `security_batch_bcd_01_sub_events_rsvp_enforce`

---

## Still open (not in fix batches)

| ID | Notes |
|----|-------|
| P1-11 | Vitest mock/env harness (52 fails) — test infra, not product |
| P1-12 | No GET `/admins` JSON list |
| P1-14 | Spoofable `x-forwarded-for` rate-limit key |
| P2-* | Auth ToS `#`, stubs, template Q&A, Admin/Chatbot not started |
| Design Q&A Q1–Q5 | Template catalog, sapphire refs, journey product depth, invitations persist, billing UX |
| Prod-risk PR-1–PR-6 | Test on evenzi.vercel.app / main later |

---

## Wave status

| Wave | Status |
|------|--------|
| W0–W6 audit | done (W3 initially thin API smoke — superseded) |
| **W3 full UI click-through** | **PASS** — `w3-full-clickthrough.spec.ts` (host + 4 roles Accept UI + decline + forbidden writes) |
| Stage 2 Batches A–D | **done** (code + live SQL) |
| Prod-risk pass | pending founder schedule |
| Commits | pending (this branch) |
| Fixture cleanup | pending founder go-ahead |
