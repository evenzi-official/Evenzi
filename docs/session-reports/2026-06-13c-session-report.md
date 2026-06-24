# Session Report — 2026-06-13c · Data Model Foundation + Supabase Backend

**User:** Abhijith · **Path:** Supabase data model + backend (SP-A) · **Mode:** teaching (founder learning Supabase via the live work) · **Branch:** `claude/vigorous-dewdney-a168ad` · **ClickUp:** [86d3bay3j](https://app.clickup.com/t/86d3bay3j) (under Infra: Platform & DevOps)

## Summary

Designed the Evenzi **CORE data model** page-by-page from the `designs/` prototypes, cross-validated it with four expert agents + Supabase advisors, captured everything in a rolling architecture doc, then **rebuilt the dev Supabase database** to match (7 tracked migrations) and produced a **frontend integration kit** for Dheeraj. Done as a teaching session — every Supabase concept (auth.users vs profile, RLS, schemas, functions, migrations) was explained against the founder's SQL background.

## What landed

**Rolling docs (the deliverables):**
- `docs/data-model/DATA-MODEL.md` (`2026-06-13.5`) — one-and-all architecture reference: every table's DDL + column metadata + rationale, functions, triggers, RLS plan, auth/storage/account-deletion, decision log D1–D20, Mermaid ER diagrams, plain-words key.
- `docs/data-model/FE-INTEGRATION.md` (`2026-06-13.1`) — Dheeraj's frontend kit: supabase-js query recipes, the `config`-schema `.schema('config')` gotcha, RLS behavior, old→new change map, gotchas checklist.
- `lib/supabase/database.types.ts` — generated TypeScript types (public + config).
- `docs/data-model/_backups/2026-06-13-pre-rebuild.json` — pre-rebuild data backup.

**Dev database rebuilt (migrations `core_01`–`core_07`):**
- Schema layout: `config.*` (catalogs) · `public.*` (live) · `auth.*` (Supabase).
- Catalogs seeded: `user_types` (3), `event_types` (6, only wedding enabled, with `field_schema`), `event_sub_types` (7 wedding), `event_checklists` (12 wedding tasks).
- Live tables: `user_profiles`, `user_preferences`, `events`, `event_sub_events`, `event_collaborators`, `event_tasks` — indexes + `updated_at` triggers.
- Functions/triggers: `set_updated_at`, `handle_new_user` (signup → profile + prefs), `prevent_role_change`, `prevent_owner_as_collaborator`.
- RLS on every table (owner-only baseline); catalogs public-read.
- 4 existing logins backfilled with profiles + preferences; old 6 test tables dropped (backed up); `auth.users` untouched.
- Security advisor went from ~10 warnings to clean (pinned `search_path` on all functions, revoked RPC `EXECUTE` on trigger functions). Leaked-password toggle remains (irrelevant — no passwords).

## Key model decisions (full detail = DATA-MODEL.md decision log)
- No app users table — Supabase `auth.users` + `user_profiles` 1:1.
- EAV `event_metadata` killed → `events.event_details` jsonb, paired with `event_types.field_schema`.
- Owner vs creator split (`user_id` transferable, `created_by` immutable) for event-management-company "register on behalf" flow.
- Schema = table type (`config`/`public`/`auth`); plural snake_case; plug-and-play modules via prefix-in-`public` (not schema-per-module); "module FKs only to core" is a checked rule.
- Module-enablement (type supports module) + entitlements (plan unlocks feature) modeled as two ANDed data layers — shape recorded as **[PLANNED]**.
- Account deletion = secure admin-key delete → cascade + storage purge; `created_by` → `SET NULL` so deletion is never blocked.

## Agent cross-validation
- **Existing 6-table schema audit:** data-modeller, security, backend, tech-lead + Supabase advisors — converged on `can_access_event()` seam, SECURITY DEFINER `search_path`, RPC `COALESCE` forgery, RLS-perf wrapping. Findings folded into the rebuild.
- **New decisions validation:** data-modeller pressure-tested the vendor cross-access, per-type module gating, entitlements, and prefix-vs-schema choices; recommendations applied (`created_by`, verified-only auto-link, owner-exclusion guard, config catalog tables for modules/features/plans).

## Issues / corrections surfaced during the build
- `role_slug` must be **nullable** — a user signs up before the role-select step (would have broken the signup trigger). Fixed.
- `created_by RESTRICT` would block account deletion → changed to `SET NULL`.

## Open / next
- ⚠️ **Expose `config` schema** — Dashboard → Data API → Settings → Exposed schemas (the one non-SQL step; DB-level access verified working).
- ⚠️ **Deployed app queries old shapes** → Dheeraj updates the Next.js queries per `FE-INTEGRATION.md`.
- Finalize the two TBD names (`config.event_checklists` / `public.event_tasks`) when the Planning page is scoped.
- Continue the page-by-page walk: create-event wizard → Planning → Guests/Media/etc.

## Memory updated
- `user_supabase_sql_background`, `feedback_supabase_teaching_mode` (Supabase = teaching mode), `project_data_model_doc` (canonical rolling doc + FE companion).

## Notes
- No sprint folder exists (`docs/sprint/README.md` = "none yet") — no sprint digest/log to update.
- Branching unavailable (free tier, Pro-only) and no PITR — mitigated with a manual data export before the destructive step. Dev env, so fresh rebuild chosen.
