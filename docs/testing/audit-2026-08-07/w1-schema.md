# W1 — Schema truth audit (Stage 1)

| | |
|---|---|
| **Date** | 2026-08-07 |
| **Role** | data_modeller |
| **Scope** | AUDIT ONLY — no schema changes, no commits |
| **Supabase** | `smjkbmkxweevqpvygabe` (ap-northeast-1) |
| **Doc baseline** | `docs/data-model/DATA-MODEL.md` version header `2026-08-06.1` |
| **SQL plans reviewed** | `docs/superpowers/plans/sql/collab_invite_01`–`03`, `notifications_01`–`04` |

---

## 1. Live inventory (MVP-relevant)

### 1.1 `public` tables (RLS on for all)

| Area | Tables (row counts at audit) |
|---|---|
| Auth extension | `user_profiles` (3), `user_preferences` (3) |
| Core events | `events` (8), `event_sub_events` (39), `event_collaborators` (1) |
| Settings sidecars | `event_general_settings`, `event_website_settings`, `event_guest_settings` (8 each) |
| Planning | `event_tasks` (279), `event_task_assignees` (0), `event_budgets` (8), `event_expense_types` (230), `event_expenses` (8) |
| Guests | `event_guests` (32), `event_guest_sub_events` (12), `event_guest_tags` (48), `event_guest_tag_links` (6) |
| Media | `event_media` (8), `event_albums` (49), `event_media_albums` (4), `event_media_tags` (0), `event_media_tag_links` (0) |
| Invitations | `event_invitation_cards` (8) |
| Website content | `event_website_design` (4), `event_website_pages` (80), `event_website_sections` (0), `event_story_blocks` (5), `event_wedding_party_members` (2), `event_qa_items` (2), `event_travel_points` (2), `event_stays` (1) |
| Website guest/gate | `guest_tokens` (2), `guest_lookup_attempts` (9), `event_website_password_sessions` (0) |
| Notifications / push | `notifications` (4), `push_subscriptions` (2), `push_dispatch_log` (0) |

### 1.2 `config` catalogs (RLS on)

`user_types`, `event_types`, `event_sub_types`, `event_checklists`, `task_priorities`, `task_statuses`, `expense_types`, `rsvp_statuses`, `guest_tags`, `album_presets`, `invitation_card_styles`, `invitation_templates`, `plans`, `website_fonts` (9), `website_palettes` (8), `website_templates` (1 — `cinematic-scroll`), `website_pages` (10), `website_section_types` (11).

### 1.3 Key RPCs / predicates (live grants)

| Function | DEFINER | EXECUTE |
|---|---|---|
| `can_read_event(uuid, text)` / `can_write_event(uuid, text)` | yes | `authenticated`, `service_role` |
| `notify_recipients` / `notify_user_by_email` | yes | `authenticated`, `service_role` |
| `_notify_event_recipients` / `mark_collab_invite_notifications_read` | yes | `service_role` only |
| `list_my_pending_invites` / `decline_event_invite` / `accept_event_invite` | yes | `authenticated`, `service_role` (`accept` anon revoked — `collab_invite_03`) |
| `get_pending_invite` | yes | **`anon`**, `authenticated`, `service_role` |
| `get_push_delivery_targets` | yes | `service_role` only |
| Website guest surface | yes | `anon`+`authenticated` (intentional): `get_public_website_payload`, `is_website_gate_open`, `resolve_guest_by_lookup`, `resolve_guest_session`, `get_guest_website_payload`, `submit_rsvp`, `verify_website_password`, `is_website_password_verified` |
| `hash_website_password` | no (SQL) | **`anon`**, `authenticated`, `service_role` |
| `create_guest_token` / `_website_page_content` | yes | `service_role` only |
| `enforce_plan_event_limit` (trigger fn) | yes | **`anon`** + `authenticated` still hold EXECUTE |
| `gen_random_bytes(int)` wrapper | yes | **`anon`** + `authenticated` |

### 1.4 Collaborator RLS (`collab_access_01`–`09`) — live truth

`can_read_event` / `can_write_event` policies are live on: `events`, settings sidecars, `event_collaborators`, Planning (5), Guests (4), Media albums/media/links (3), Website-content (8), plus `event_sub_events` **SELECT-only** for collabs.

**Still owner-only (deliberate deferral, matches D57 text):** `event_invitation_cards`, `event_media_tags`, `event_media_tag_links`.

Role CHECK live: `('co-host','planner','photographer','viewer')` + partial index `idx_event_collaborators_user_event` where `status='active'`.

### 1.5 Recent migrations present in live DB (post–Wave 2)

`notifications_01`–`04`, `rsvp_guest_settings_enforcement`, `collab_access_01`–`09`, `collab_invite_01`–`03`, plus 2026-08-05 website password cluster (`add_website_password_protection`, gate/offline fixes, font/palette seeds).

---

## 2. Findings

### P0-1 — `get_pending_invite` remains anon-executable (invite PII leak)

- **Severity:** P0
- **Title:** Unauthenticated `get_pending_invite` returns invitee email + event name
- **Evidence:** Live `has_function_privilege('anon', 'public.get_pending_invite(uuid)', 'EXECUTE') = true`. Function body (no `auth.uid()` check) returns `invited_email`, `event_name`, `role`, `status` for any `event_collaborators.id`. `collab_invite_03` revoked `accept_event_invite` from `anon` but left `get_pending_invite` open. Advisor: `anon_security_definer_function_executable` WARN.
- **Suggested fix (note only):** Revoke `EXECUTE` from `anon` (and optionally `public`); gate behind authenticated email match, or return a redacted preview (`event_name` + `role` only, never `invited_email`) if a logged-out landing page still needs a preview. Add rate limiting if any public surface remains.

### P0-2 — Doc Security section still claims Planning/Guests/Media/Website-content are owner-only

- **Severity:** P0
- **Title:** `DATA-MODEL.md` Security status contradicts live collaborator RLS (D57)
- **Evidence:** Security header still says **“COLLABORATOR LAYER PARTIAL (D56)”** and table row *“Planning / Guests / Media / Website-content … still owner-only (Task 16)”* (`DATA-MODEL.md` ~1477–1489). Live `pg_policies` shows `collab_*` policies using `can_read_event`/`can_write_event` on those tables (migrations `collab_access_06`–`09`). Decision log D57 already records the conversion. Anyone using the doc as an authz source of truth will under-estimate collab access (or “fix” policies that are already correct).
- **Suggested fix (note only):** Rewrite Security status to **COLLABORATOR LAYER LIVE (D56+D57)**; replace the Task-16 owner-only row with the live capability matrix; keep the explicit deferral table for invitations cards / media tags. Bump version header.

---

### P1-1 — Version / scope header stale vs decision log (D55–D59 collision)

- **Severity:** P1
- **Title:** Version header still `2026-08-06.1` / “notifications D55”; decision log already has D56–D59
- **Evidence:** Header: Version `2026-08-06.1`, Last updated cites **“In-app notifications … D55”**. Decision log: **D55** = unused `show_on_dashboard`/`discoverable`; **D58** = notifications+push; **D59** = collab invite. Scope / Live DB status narratives omit collab_access + collab_invite + push table inventory and still read as pre-D56 in places.
- **Suggested fix (note only):** Bump to `2026-08-07.x`; retarget Last updated to D59; refresh Scope + Live DB status for `collab_access_*`, `collab_invite_*`, `notifications_04`, password-session migrations. Fix D55 numbering narrative in header.

### P1-2 — `notifications.type` CHECK in Tables DDL missing `collab_invite_received`

- **Severity:** P1
- **Title:** Tables section DDL omits live notification type from `collab_invite_01`
- **Evidence:** Live constraint: `type IN (…, 'collab_invite_received')`. Doc Tables DDL (`public.notifications`) still lists only four types; Notes cite **Rationale (D55)** instead of D58/D59. D58 decision text also lists the pre-invite type set.
- **Suggested fix (note only):** Update CHECK + notes to include `collab_invite_received`; cross-ref D59; note fan-out allowlist still excludes this type (direct `notify_user_by_email` only).

### P1-3 — Push tables live but undocumented as first-class Tables

- **Severity:** P1
- **Title:** `push_subscriptions` / `push_dispatch_log` / `get_push_delivery_targets` missing from Tables & Functions
- **Evidence:** Live tables + RLS (`push_subscriptions_own` for authenticated; `push_dispatch_log` RLS on, zero policies — service/DEFINER only). RPC `get_push_delivery_targets` service_role-only, gates on `user_preferences.push_notifications`. Present in `notifications_04_push_subscriptions.sql` and briefly named in D58; **no** `### public.push_*` sections; Functions table omits `get_push_delivery_targets`.
- **Suggested fix (note only):** Add table DDL + RLS + RPC rows under Tables/Functions; extend D58 or add a short D60 clarifying idempotent dispatch log PK = `notification_id`.

### P1-4 — Website password sessions + password RPCs lack decision-log / Tables DDL

- **Severity:** P1
- **Title:** `event_website_password_sessions` and password RPCs live without a Decision-log entry or table section
- **Evidence:** Live table `(token PK, event_id FK→events CASCADE, created_at)`; RLS enabled, **no policies** (deny-all client — advisor INFO). Live RPCs: `hash_website_password`, `verify_website_password`, `is_website_password_verified`. Migrations `add_website_password_protection`, `website_gate_offline_only_not_password`, etc. (2026-08-05). Table is only named in Security deferrals (~1499); Wave 2a `is_website_gate_open` doc still describes password-as-hard-close semantics that were later changed. No Dxx for the password-protection feature.
- **Suggested fix (note only):** Append decision-log entry (e.g. D60) covering sessions table, bcrypt hash RPC, verify/rate-limit, and gate semantics change (offline-only vs password). Add Tables + Functions DDL. Align Wave 2a gate prose with live behavior.

### P1-5 — Functions section still lists `can_access_event` [PLANNED]; omits live predicates + invite RPCs

- **Severity:** P1
- **Title:** Access-predicate and collab-invite RPCs not reflected in Functions catalog
- **Evidence:** Functions table still has `can_access_event` **[PLANNED]** and `event_collaborators` notes still say “seam a future `can_access_event()` reads”. Live predicates are `can_read_event` / `can_write_event` (D56). Missing from Functions: `notify_user_by_email`, `list_my_pending_invites`, `decline_event_invite`, `mark_collab_invite_notifications_read`, accept-invite extensions, password RPCs, `get_push_delivery_targets`.
- **Suggested fix (note only):** Mark `can_access_event` superseded/cancelled; document the two live predicates + capability matrix; add collab-invite / push / password RPC rows.

### P1-6 — `event_collaborators.role` still documented as open-ended

- **Severity:** P1
- **Title:** Collaborator role DDL in doc lacks live CHECK + partial index
- **Evidence:** Doc: `role text not null default 'co-host' -- open-ended`. Live: `ck_event_collaborators_role CHECK (role IN ('co-host','planner','photographer','viewer'))` + `idx_event_collaborators_user_event` partial on active pairs (D56).
- **Suggested fix (note only):** Update table DDL + notes to match D56; remove “open-ended”.

### P1-7 — `hash_website_password` executable by `anon`

- **Severity:** P1
- **Title:** Anon can invoke bcrypt hashing RPC (CPU DoS / oracle)
- **Evidence:** `has_function_privilege('anon', 'public.hash_website_password(text)', 'EXECUTE') = true`. Function is plain SQL calling `extensions.crypt(..., gen_salt('bf'))` with no auth gate. Host save path should run as authenticated/service only.
- **Suggested fix (note only):** `REVOKE EXECUTE … FROM anon, public`; `GRANT` to `authenticated` and/or `service_role` only. Prefer hashing in a server route if clients must never mint hashes.

### P1-8 — Residual orphan risk: `guest_tokens.guest_id` has no FK

- **Severity:** P1
- **Title:** Guest delete can orphan session tokens (by design, still a lifecycle gap)
- **Evidence:** Live columns: `guest_id uuid NOT NULL` with **no** FK to `event_guests` (D51 / no-cross-module-FK). `event_id` cascades with events. Audit count of orphan tokens vs current guests: 0 today. No ON DELETE cleanup trigger/RPC for guest purge.
- **Suggested fix (note only):** Document lifecycle explicitly (who deletes tokens when a guest is removed); add a DEFINER cleanup in the guest DELETE API path, or a periodic sweep. Do not add a cross-module FK without revisiting D51.

### P1-9 — Module RLS subsections still describe pre-collab owner-only policies

- **Severity:** P1
- **Title:** Planning / Guests / Media RLS prose still teaches owner-only `FOR ALL` pattern as current
- **Evidence:** Sections ~1502–1535 still say Planning/Guests/Media get one owner-only policy and “not `can_write_event()` yet (D26 → Task 16)”. Live policies are split owner + collab. Same class of drift as P0-2, scoped to module subsections (misleading for implementers).
- **Suggested fix (note only):** Rewrite those subsections to cite `collab_access_06`–`09` and the capability keys (`planning` / `guests` / `media` / `website`).

---

### P2-1 — Advisor: SECURITY DEFINER views (`invitation_card_guest_view`, `config.plans_public`)

- **Severity:** P2
- **Title:** `get_advisors` ERROR on intentional SECURITY DEFINER views
- **Evidence:** Advisor `security_definer_view` ERROR for `public.invitation_card_guest_view` and `config.plans_public`. Doc already intends guest view as service_role-only (D38) and plans_public as anon-safe strip (D40). Confirm grants remain locked; treat as accepted or convert to `security_invoker` + tighter grants if still DEFINER-by-accident.
- **Suggested fix (note only):** Verify `information_schema.role_table_grants`; if intentional, record as accepted advisor notice in Maintenance rules (same pattern as Planning cold-start indexes).

### P2-2 — Advisor INFO: RLS enabled, no policies (deny-all ledgers)

- **Severity:** P2
- **Title:** Zero-policy RLS on ledgers (expected deny-all)
- **Evidence:** Advisor INFO on `guest_tokens`, `guest_lookup_attempts`, `event_website_password_sessions`, `push_dispatch_log`. Matches documented deny-all pattern.
- **Suggested fix (note only):** No change required; optionally silence/document as accepted in Maintenance rules.

### P2-3 — Trigger function `enforce_plan_event_limit` still EXECUTE-able by anon

- **Severity:** P2
- **Title:** Plan-limit trigger function callable via PostgREST RPC surface
- **Evidence:** Advisor WARN + `has_function_privilege('anon', …) = true`. Function `RETURNS trigger` — direct RPC call should fail functionally, but grant hygiene violates D50 revoke rule.
- **Suggested fix (note only):** Revoke EXECUTE from `anon`/`authenticated`/`public`; leave for trigger owner / `service_role` only.

### P2-4 — `gen_random_bytes` public wrapper executable by anon

- **Severity:** P2
- **Title:** `public.gen_random_bytes` DEFINER wrapper open to anon
- **Evidence:** Advisor WARN; privilege check true for anon. Used by share-token / password-session defaults.
- **Suggested fix (note only):** Revoke from `anon`/`authenticated` if only needed internally; or leave documented if required for client-side token generation (prefer server-side).

### P2-5 — Intentional owner-only deferrals (invitations cards, media tags)

- **Severity:** P2
- **Title:** Collab cannot manage invitation cards / media tags via RLS
- **Evidence:** Live policies still `*_owner` only. Matches D57 deferral table. Product impact: co-host cannot persist cards/tags until converted.
- **Suggested fix (note only):** Track as known gap; convert under `'invitations'` / `'media'` when those routes ship (not a Stage-1 schema fix).

### P2-6 — ERD companion lag

- **Severity:** P2
- **Title:** `ERD.md` header still v2026-08-06.1 / notifications-only
- **Evidence:** `docs/data-model/ERD.md` claims coverage through D55 notifications; omits collab predicates / push / password sessions from the visual companion mandate (Maintenance rule 8).
- **Suggested fix (note only):** Refresh ERD in same doc PR as DATA-MODEL bump.

---

## 3. Diff summary — live but under-documented

| Live artifact | In decision log? | In Tables/Functions DDL? |
|---|---|---|
| `collab_invite_01`–`03` RPCs + type | Yes (D59) | Partial (type CHECK stale; Functions incomplete) |
| `can_read_event` / `can_write_event` + tiered policies | Yes (D56–D57) | Security prose **stale**; Functions still PLANNED `can_access_event` |
| `push_subscriptions` / `push_dispatch_log` | Brief in D58 | **No** dedicated sections |
| `event_website_password_sessions` + password RPCs | **No Dxx** | Named only in deferrals |
| `notifications.type = collab_invite_received` | D59 | Tables DDL **stale** |
| Gate offline-only (password not hard-close) | Session report / plan only | Wave 2a prose **stale** |

---

## 4. Counts

| Severity | Count |
|---|---|
| **P0** | **2** |
| **P1** | **9** |
| **P2** | **6** |

---

## 5. Suggested doc-sync order (Stage 2 notes — do not implement in Stage 1)

1. Fix P0-2 Security section + P1-9 module RLS prose (stops wrong authz assumptions immediately).
2. Revoke/harden P0-1 `get_pending_invite` + P1-7 `hash_website_password` (schema/security).
3. Backfill Tables/Functions for push + password sessions + collab invite RPCs; bump version; add missing decision-log for password feature; sync ERD.
