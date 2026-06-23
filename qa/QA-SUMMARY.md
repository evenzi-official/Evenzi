# Evenzi QA — Rolling Summary

> Plain-English status of QA on the in-scope screens. **Rolling doc** — append new rounds at the top of "Rounds", keep the "Open / next" list current. For Abhijith (founder) + Dheeraj (continuing the build).
>
> Detail lives in: `qa/manual-findings.md` (founder manual pass, M#), `qa/in-scope-screens-findings.md` (multi-agent audit, D#), `qa/FIX-PLAN.md` (the prioritized plan), `qa/EVENZI-TEST-PLAYBOOK.md` (reusable test prompt). Screenshots in `qa/_shots/`.

## What's in scope
Host-only MVP, 4 screens: **Login/Registration**, **Event creation (4-step wizard)**, **User dashboard (`/home`)**, **Event dashboard (`/events/<id>`)**. Everything else (guests, invitations, planning, media, website, settings sub-tabs) is **not worked on yet** — smoke only.

## How QA was run
1. **Multi-agent audit** (test/code-review/data-model/security/design personas) + a partial Antigravity static pass → `qa/in-scope-screens-findings.md`.
2. **Founder manual pass** (Abhijith) → `qa/manual-findings.md` (M1–M10).
3. **Cross-referenced into one plan** → `qa/FIX-PLAN.md`.
4. **Fixed in 4 parallel workstreams + a server/DB fix**, then **verified live** (Playwright + DB).

---

## Status — what's fixed (2026-06-23)

**Legend:** ✅ fixed + verified live · 🟦 fixed, code-verified (tsc/agent, not live-walked) · ⏳ open

### Create wizard
| # | Item | Status |
|---|---|---|
| M1 | Event-type "Loading…" spinner removed — now server-rendered (instant) | ✅ |
| M2 | Cover photo: white box → dark `.dp-dropzone` | ✅ |
| M3 | Step 2: added **Event Title**, fixed labels + grid order to match design; title persists | ✅ |
| M4 | Event date: dark branded **calendar**; **validation** = no past dates, max today+5y (client + server) | ✅ |
| M5 | Step 3: **Set time** (date + wheel time picker), **Set venue**, **Add custom ceremony** modals built; **date/time/venue persist to DB** | ✅ |
| M6 | Step 3 search shows a "no results" message | 🟦 |
| — | Custom-ceremony list now uses stable keys; dead `WizardProgress` removed | 🟦 |

### User dashboard (`/home`)
| # | Item | Status |
|---|---|---|
| M7 | New event now shows without a manual refresh (`force-dynamic`) | ✅ |
| M8 | Skeleton loading added (`loading.tsx`) | 🟦 |
| M9 | Active/Past filter aligned 50/50 with the left filter (dead space removed) | 🟦 |
| — | Nav "Settings" button relabeled **"Sign out"** (it signs out); `/home` no longer swallows query errors | ✅ |

### Login / Registration
| Item | Status |
|---|---|
| "OTP SENT" toast was invisible (`is-active` → `is-show`) — now shows | 🟦 |

### Event dashboard + settings + success
| Item | Status |
|---|---|
| **Success page** was redirecting to /home (cross-schema embed bug) — fixed + rebuilt on the design system | ✅ |
| Delete-confirm modal now closes on **Esc** + returns focus | 🟦 |

### Design system / components (shared)
| Item | Status |
|---|---|
| **Toggle switch** was visually dead (wrong classes) — rebuilt to shell | 🟦 |
| **StatusBadge** variants mapped to real shell classes | 🟦 |
| **Button** `ghost`/`sm` variants added to shell + cataloged in `components.html` | 🟦 |

### Platform
| Item | Status |
|---|---|
| **M10 Brand preloader** (EVENZI splash + loading bar) built, shows on load, fades out | ✅ |

### API / security / quality
| Item | Status |
|---|---|
| Media proxy: added key-prefix allowlist + traversal guard | 🟦 |
| `/api/auth/verify` trimmed to minimal fields | 🟦 |
| event-types routes log before 500; removed dead `EventMetadataRow` type | 🟦 |
| **Server gap closed:** create RPC + `/api/events` now persist event title + sub-event date/time/venue | ✅ |

---

## Open / next (for whoever continues — Dheeraj)
1. **Success page chrome duplication** — it's nested in the event `[id]` layout, so the nav-bar + tool-rail sidebar wrap it *and* it has its own header. Move it out of that layout to a clean standalone screen. Low urgency (off the main path).
2. **Live-walk the 🟦 items** — they're code-verified but worth a quick manual check on real screens: M6 search empty-state, M8 skeleton, M9 alignment, OTP toast, Esc-closes-modal, ToggleSwitch/StatusBadge (these last two live on out-of-scope settings pages).
3. **Cover image + media** still can't be runtime-tested locally (no R2 keys) — verify once R2 env is available.

## Pre-existing tech debt (separate tickets — NOT from this work)
- **13 unit tests failing** — stale mocks (`role→role_slug`, `field→key` renames). Refresh the suite.
- **Lint debt** — 104 errors / 1878 warnings (mostly `any` / unused vars).
- Hub hero SVG `transform-origin` → should be `transformOrigin` (console warning).
- `<html>` "Extra attributes from server: class" — benign theme-script hydration warning.

## Round 2 status (2026-06-23) — create-wizard refinements
| # | Item | Status |
|---|---|---|
| M11 | Date picker month-view `<` `>` arrows now step the **year** (clamped) | ✅ |
| M12 | Guest count clamped to ≤100k + live **witty helper** below the field | ✅ |
| M13 | Sub-event date capped at the **Event Date** (days after disabled; client + schema) | ✅ |
| M14 | Celebrations (Step 3) **server-rendered** — no load delay | ✅ |
| M15 | End time only offers times **after** Start time (earlier options disabled) | ✅ |
| M16 | Skeleton primitive **polished** (contrast + brand shimmer + definition); event-dashboard `loading.tsx` added | 🟦 |

## Rounds
- **2026-06-23 (R2)** — Founder round-2 manual pass (M11–M16) → 1-agent create-wizard fix + skeleton polish. M11–M15 verified live (Playwright); M16 skeleton improved + wired. App-code `tsc`: 0 errors.
- **2026-06-23 (R1)** — Multi-agent audit + founder manual pass (M1–M10) + 4-workstream fix + server/DB persistence fix + preloader. All ✅ items verified live (Playwright + DB). App-code `tsc`: 0 errors.
