# Evenzi — Guest Management Data Model (Design Spec)

> Design spec for the **Guest Management** module's database layer (host-side guest list, RSVP, functions, tags). Companion to [`docs/data-model/DATA-MODEL.md`](../../data-model/DATA-MODEL.md). Agreed design; runnable migrations + the DATA-MODEL.md update land in the build PR (same PR — "DB + doc change together").

| | |
|---|---|
| **Date** | 2026-06-16 |
| **Author** | Abhijith (+ Claude) |
| **Module** | Guest Management & RSVP (host-side) |
| **Status** | Design approved — pending spec review → plan → council → build |
| **Builds on** | CORE + Planning slices; references `public.events`, `public.event_sub_events`; extends `create_event_with_details` |
| **Prototype** | `designs/pages/guests/` (built + merged) |

---

## 1. Goal

Give the host-side Guests page a real backend: a per-event guest list with contact, single (guest-level) RSVP status, party size, the functions each guest is invited to, and host-managed tags. Stats (totals, attending headcount) are **derived**, never stored.

**Out of scope (deferred):** per-function RSVP, WhatsApp invitation send-log + delivery/read tracking, the public guest-facing RSVP page, postal address, a CSV-import RPC (app-side bulk insert works under RLS).

---

## 2. What already exists (and changes)

| Object | State | Change |
|---|---|---|
| `public.events`, `public.event_sub_events` | live | referenced (guest `event_id`; function assignments) — no change |
| `create_event_with_details` RPC | live (`planning_07`) | **extend** — seed `event_guest_tags` from `config.guest_tags` at event creation (mirrors the expense-type seed) |

Everything else is new.

---

## 3. Decision log additions (D27–D30)

To append to DATA-MODEL.md's decision log (newest first):

| # | Decision | Why |
|---|---|---|
| **D30** | **Provenance = `is_custom` + `created_by`.** Catalog-seeded `event_guest_tags` rows get `is_custom=false` + `created_by=NULL` ("we made it"); host-added rows get `is_custom=true` + `created_by=auth.uid()` ("user made it"). `event_guests.created_by` records who added each guest. `created_by` is stamped server-side, never client-trusted. | Founder wants to distinguish system-seeded vs user-created rows and audit who. `is_custom` is the fast boolean; `created_by` is the "who" (and the NULL marks a system seed). |
| **D29** | **Guest tags = catalog → per-event copy** (same as expense types, D25). `config.guest_tags` (admin defaults) seeds `public.event_guest_tags` per event (`is_custom`, `source_slug` text provenance, not an FK); `event_guest_tag_links` is the guest↔tag M:N. | The tag manager (rename/delete) needs tags as per-event entities, not strings; seeding gives sensible starters; a global catalog would force all hosts to share one tag list. |
| **D28** | **RSVP is guest-level, single-valued** (`event_guests.rsvp_status_id` → `config.rsvp_statuses`), with a `category` column (`pending`/`attending`/`declined`/`tentative`) driving derived headcount. Per-function RSVP deferred. | Matches the built prototype (one status per guest); `category` keeps headcount math off hardcoded slugs (same lesson as `task_statuses`, D21). Per-function RSVP would move status onto the guest↔function join later. |
| **D27** | **Guest M:N relationships are link tables, never columns/arrays.** Functions = `event_guest_sub_events`; tags = `event_guest_tag_links`. Both carry a trigger-guarded `event_id` for single-hop RLS (like `event_task_assignees`, D23). | Columns/arrays fight the tag manager (rename), filtering, and are the drift D7 forbids. Denormalized `event_id` keeps RLS single-hop and consistent across all event-children. |

---

## 4. Tables (DDL)

### 4.1 New catalogs (`config.*`) — admin-seeded, public-read

```sql
create table config.rsvp_statuses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                          -- pending | confirmed | declined | maybe
  name text not null, description text, icon_name text,
  category text not null check (category in ('pending','attending','declined','tentative')),
  display_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table config.guest_tags (                       -- default tag suggestions; seed per-event copies
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null, description text,
  display_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
```

### 4.2 `public.event_guests`

```sql
create table public.event_guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null, email text, phone text,
  rsvp_status_id uuid not null references config.rsvp_statuses(id) on delete restrict,  -- app resolves 'pending' by slug
  invited boolean not null default false,
  party_size int not null default 1 check (party_size >= 1),                            -- total incl. primary
  notes text,
  created_by uuid references auth.users(id) on delete set null,                         -- who added (stamped server-side)
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_event_guests_event       on public.event_guests(event_id, display_order);
create index idx_event_guests_event_rsvp  on public.event_guests(event_id, rsvp_status_id);
create index idx_event_guests_event_name  on public.event_guests(event_id, lower(name));   -- default name-sort/search
```
> `email`/`phone` are intentionally **un-unique and un-indexed**: guest contact is free-text host-entered, the same person can legitimately recur, and search is per-event + client-side (`guests.js`). Don't "fix" this with a unique constraint. `rsvp_status_id` is NOT NULL but a `before insert` trigger defaults it to `pending` when omitted (§8) — so CSV/bulk inserts need only name (+ contact).

### 4.3 `public.event_guest_sub_events` (which functions a guest is invited to)

```sql
create table public.event_guest_sub_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,                -- trigger-guarded == guest's event_id
  guest_id uuid not null references public.event_guests(id) on delete cascade,
  sub_event_id uuid not null references public.event_sub_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (guest_id, sub_event_id)
);
create index idx_guest_sub_events_guest    on public.event_guest_sub_events(guest_id);
create index idx_guest_sub_events_subevent on public.event_guest_sub_events(event_id, sub_event_id);
```

### 4.4 `public.event_guest_tags` (per-event tag entities; catalog-seeded)

```sql
create table public.event_guest_tags (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  is_custom boolean not null default false,            -- false = seeded default ("we made"), true = host-added ("user made")
  source_slug text,                                    -- provenance → config.guest_tags.slug; NOT an FK; null for custom
  created_by uuid references auth.users(id) on delete set null,  -- null for system seed; uid for host-added
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index uq_event_guest_tags_name on public.event_guest_tags(event_id, lower(name));
create index idx_event_guest_tags_event on public.event_guest_tags(event_id);
```

### 4.5 `public.event_guest_tag_links` (guest ↔ tag)

```sql
create table public.event_guest_tag_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,                -- trigger-guarded == guest's event_id
  guest_id uuid not null references public.event_guests(id) on delete cascade,
  tag_id uuid not null references public.event_guest_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (guest_id, tag_id)
);
create index idx_guest_tag_links_guest on public.event_guest_tag_links(guest_id);
create index idx_guest_tag_links_tag   on public.event_guest_tag_links(event_id, tag_id);
```

---

## 5. Seeds

```sql
-- config.rsvp_statuses
insert into config.rsvp_statuses (slug, name, category, icon_name, display_order) values
  ('pending','Pending','pending','schedule',1),
  ('confirmed','Confirmed','attending','check_circle',2),
  ('declined','Declined','declined','cancel',3),
  ('maybe','Maybe','tentative','help',4);

-- config.guest_tags (default suggestions; host adds more per event)
insert into config.guest_tags (slug, name, display_order) values
  ('family','Family',1), ('friends','Friends',2), ('brides-side','Bride''s side',3),
  ('grooms-side','Groom''s side',4), ('out-of-town','Out-of-town',5), ('colleagues','Colleagues',6);
```

---

## 6. Derived read views (`security_invoker = on`)

```sql
-- Stats cards: totals by RSVP category + attending headcount + zero-assigned count
create view public.event_guest_stats as
select g.event_id,
       count(*)                                              as total,
       count(*) filter (where s.category = 'attending')      as attending,   -- tracks category, not the 'confirmed' slug
       count(*) filter (where s.category = 'pending')         as pending,
       count(*) filter (where s.category = 'declined')        as declined,
       count(*) filter (where s.category = 'tentative')       as maybe,
       coalesce(sum(g.party_size) filter (where s.category = 'attending'), 0) as attending_headcount,
       count(*) filter (where not exists (
         select 1 from public.event_guest_sub_events se where se.guest_id = g.id)) as zero_assigned
from public.event_guests g
join config.rsvp_statuses s on s.id = g.rsvp_status_id
group by g.event_id;
alter view public.event_guest_stats set (security_invoker = on);
revoke all on public.event_guest_stats from anon, public;
grant select on public.event_guest_stats to authenticated;

-- Sidebar per-function counts ("Sangeet 42, Reception 88")
create view public.event_sub_event_guest_counts as
select event_id, sub_event_id, count(*) as guest_count
from public.event_guest_sub_events
group by event_id, sub_event_id;
alter view public.event_sub_event_guest_counts set (security_invoker = on);
revoke all on public.event_sub_event_guest_counts from anon, public;
grant select on public.event_sub_event_guest_counts to authenticated;
```

> ⚠️ `security_invoker = on` is load-bearing — a plain `public` view bypasses RLS; combined with the `authenticated`-only grant, even aggregate headcounts stay owner-private.
> **Empty-row behavior:** `event_guest_stats` returns **no row** for an event with zero guests (it's the default state of a new event). The FE **must coalesce a missing row to all-zeros** — documented in §11. "Attending per function" (vs invited count) is derivable by joining `event_guest_sub_events` → guests → rsvp category; not pre-materialized.

---

## 7. Functions

| Function | Status | Purpose |
|---|---|---|
| `create_event_with_details(...)` | **extend** | add a seed block: copy `config.guest_tags` (enabled) → `public.event_guest_tags` (`is_custom=false`, `source_slug=slug`, `created_by=null`) in the same transaction as the existing task/expense-type seeds. |
| `set_updated_at()` | live | attach to the 3 tables with `updated_at` (`event_guests`, `event_guest_tags`, the 2 catalogs); NOT the insert/delete-only join tables. |
| bulk ops / CSV import | app-side | bulk insert/assign via supabase-js `.insert([...])` / `.in()` under RLS; a dedicated import RPC is deferred. |

`create_event_with_details` stays `SECURITY DEFINER`, `set search_path=''`, schema-qualified refs, `revoke execute from public, anon`. The new seed block (same transaction as the task/expense seeds), explicit SQL:

```sql
insert into public.event_guest_tags (event_id, name, is_custom, source_slug, created_by, display_order)
select v_event_id, gt.name, false, gt.slug, null, gt.display_order
from config.guest_tags gt
where gt.enabled
order by gt.display_order
on conflict (event_id, lower(name)) do nothing;   -- idempotent; can't roll back event creation on re-entry
```
The DEFINER function runs as the table owner → **bypasses RLS**, so it can write `is_custom=false` rows the client INSERT policy (§9) forbids. `auth.uid()` is unchanged inside DEFINER, but the row sets `created_by=null` explicitly (system provenance), and the attribution trigger only fires for `is_custom=true` (§8), so it won't overwrite it.

---

## 8. Triggers

| Trigger | On | When | Does |
|---|---|---|---|
| `trg_<table>_updated` | `event_guests`, `event_guest_tags`, catalogs | before update | `set_updated_at()` |
| `guest_sub_event_before` | `event_guest_sub_events` | before insert/update | derive `event_id` from the guest; **verify `sub_event_id` belongs to that same event** (reject cross-event) — `SECURITY DEFINER`, pinned `search_path` |
| `guest_tag_link_before` | `event_guest_tag_links` | before insert/update | derive `event_id` from the guest; **verify `tag_id` belongs to that same event** (reject cross-event) — `SECURITY DEFINER`, pinned `search_path` |
| `default_guest_rsvp` | `event_guests` | before insert | if `new.rsvp_status_id is null`, set it to the `pending` status id (resolved by slug) — makes CSV/bulk insert need only name; column stays NOT NULL |
| `stamp_guest_created_by` | `event_guests` | before insert | always stamp `created_by = auth.uid()` (every guest is user-added) |
| `stamp_guest_tag_created_by` | `event_guest_tags` | before insert | stamp `created_by = auth.uid()` **only when `new.is_custom = true`**; seeded rows (`is_custom=false`) keep the inserted `created_by` (the `create_event_with_details` seed passes `null`) |

> **DEFINER hardening (all guard/default/stamp trigger functions):** `language plpgsql security definer set search_path = ''`, all table refs schema-qualified (`public.*`, `config.*`), and `revoke execute on function … from public, anon, authenticated`. The guard/default/stamp triggers are **BEFORE row triggers that only mutate `NEW` (or `RAISE`) and `return new`** — they never perform the write themselves, so the row still passes through the caller's RLS `with_check`. `default_guest_rsvp` needs DEFINER only to read `config.rsvp_statuses`; the two link guards need it to read parent tables the caller can't `SELECT` under RLS.

> **Why the integrity check (not just `event_id` derivation):** RLS `with_check` validates the derived `event_id` is the caller's event — but a caller could pass a `guest_id` from their own event and a `sub_event_id`/`tag_id` from a *different* event; the derived `event_id` (from the guest) would still be theirs, so RLS passes while the link points at a foreign function/tag. The guard trigger rejecting a cross-event `sub_event_id`/`tag_id` closes that hole.
>
> **Why the per-table attribution split:** `event_guests` has no `is_custom` (all guests are user-made → always stamp). `event_guest_tags` must NOT stamp seeded rows, or every default tag would look host-created; gating on `is_custom=true` keeps `created_by=NULL` for system seeds (D30).

---

## 9. Security (RLS) — owner-only, inlined (consistent with D26)

Enable RLS on all 5 new `public.*` tables in their creating migration (fail-safe). Owner-only inlined predicate, converging on `can_access_event()` with the other event-children later.

```sql
-- event_guests (direct event_id); event_guest_sub_events / event_guest_tag_links identical FOR ALL on their event_id
create policy event_guests_owner on public.event_guests for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_guests.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_guests.event_id and e.user_id = (select auth.uid())));
```

**`event_guest_tags` — split policy to close the provenance forge:** clients may read/update/delete any of their event's tags (incl. seeded ones — the tag manager renames them), but may only **INSERT custom** tags (`is_custom=true`). The DEFINER seed bypasses RLS, so it alone writes the `is_custom=false` defaults.
```sql
create policy event_guest_tags_rw on public.event_guest_tags for select to authenticated using (<owner predicate>);
create policy event_guest_tags_upd on public.event_guest_tags for update to authenticated using (<owner>) with check (<owner>);
create policy event_guest_tags_del on public.event_guest_tags for delete to authenticated using (<owner>);
create policy event_guest_tags_ins on public.event_guest_tags for insert to authenticated
  with check (<owner predicate> and is_custom = true);   -- clients can't forge a system-seeded (is_custom=false) tag
```

> **`can_access_event()` cutover** is a single coordinated migration across **all 6 event-children** (these 5 + the existing CORE/Planning ones); until then guest PII is strictly owner-only by design.

**Catalogs** (`config.rsvp_statuses`, `config.guest_tags`) — RLS on, one `SELECT` policy `using (true)` for `{anon, authenticated}`, no write policy (admin via `service_role`), `grant select`, `config` stays in Exposed Schemas.

**PII note:** `event_guests` holds guest contact (name/email/phone) — owner-only `authenticated`, no anon path. Same posture as the other event-children.

---

## 10. Migration order (build PR)

| # | Migration | Contents |
|---|---|---|
| `guests_01` | catalogs + seeds | `config.rsvp_statuses`, `config.guest_tags` + seeds + `updated_at` triggers + RLS select-only + grants |
| `guests_02` | live tables | the 5 `public.*` tables + indexes + `updated_at`/guard/attribution/`default_guest_rsvp` triggers + **RLS enabled here** |
| `guests_03` | views | `event_guest_stats` + `event_sub_event_guest_counts` (`security_invoker`, grant authenticated only) |
| `guests_04` | RLS policies | owner-only inlined on the 5 tables; `event_guest_tags` **split** (INSERT requires `is_custom=true`) |
| `guests_05` | function | extend `create_event_with_details` (+ guest-tag seed block) |

After build: `npx supabase gen types` → refresh `lib/supabase/database.types.ts`; `get_advisors` (security + performance) reviewed.

---

## 11. FE-INTEGRATION.md impact

- Cache `config.rsvp_statuses` + `config.guest_tags` client-side (map by id), same as the other catalogs; `config` must stay in Exposed Schemas.
- Add a guest = insert `event_guests` with just name (+ contact); `rsvp_status_id` defaults to `pending` via trigger, `party_size` defaults 1. (Client may still set `rsvp_status_id` explicitly by slug.)
- Functions/tags = insert/delete rows in `event_guest_sub_events` / `event_guest_tag_links`; the guard trigger fills `event_id`. **Bulk-assign must use `.upsert([...], { onConflict: 'guest_id,sub_event_id', ignoreDuplicates: true })`** (and the `guest_id,tag_id` equivalent) — re-assigning an already-linked function/tag would otherwise abort the whole batch on the unique violation.
- **Adding a tag from the client always lands `is_custom=true`** (the INSERT policy enforces it); seeded defaults come only from event creation.
- Stats via the `event_guest_stats` view — **coalesce a missing row (zero-guest event) to all-zeros**; `zero_assigned` is a column on the view now. Sidebar per-function counts via `event_sub_event_guest_counts`.
- Tag manager edits `event_guest_tags` (rename = one update; delete cascades links).

---

## 12. Deferred / out of scope

- Per-function RSVP (status on `event_guest_sub_events`).
- WhatsApp invitation send-log + delivery/read tracking (`event_guest_invites`) — the Invitations module's send half.
- Public guest-facing RSVP page.
- Postal address (re-add structured columns when physical invites are in scope).
- CSV-import / bulk-assign RPCs (app-side for MVP).
- `can_access_event()` cutover (all event-children together later).

---

## 13. DATA-MODEL.md update checklist (same PR)

1. Add the 2 catalogs + 5 live tables (DDL + Notes + Rationale), `[NOW]`. In the `config.rsvp_statuses` Notes, **explicitly contrast its `category` set (`pending/attending/declined/tentative`) against `task_statuses` (`open/done/dropped`)** — intentionally independent vocabularies, so a future reader doesn't "harmonize" them.
2. Add the `event_guest_stats` + `event_sub_event_guest_counts` views to the Views (derived) section (note `security_invoker` + authenticated-only grant).
3. Note the `create_event_with_details` extension (guest-tag seed) in Functions.
4. Add the guest-link guard trigger + the (conditional) attribution trigger to Triggers.
5. Extend the Security section with the Guest Management RLS subsection.
6. Update the ER diagram (event_guests→events/rsvp_statuses; guest_sub_events→guests/sub_events; guest_tags→events; tag_links→guests/tags).
7. Append decision log **D27–D30**.
8. Add derived rows (guest stats, attending headcount, zero-assigned).
9. Update the account-deletion cascade tree (new tables cascade from events; `created_by` SET NULL).
10. Bump Version + Last updated + "Scope covered so far".
11. Mirror FE changes into `FE-INTEGRATION.md`.

---

## 14. Resolved decisions (were open items)

1. **`created_by` omitted on the two join tables** — resolved: omit (assignments are always user actions; parent `created_by` covers provenance; consistent with `event_task_assignees`). Approved.
2. **`config.guest_tags` seed = 6 defaults** (Family, Friends, Bride's side, Groom's side, Out-of-town, Colleagues) — approved. Event-specific tags (Table 5, A-list) are host-added per event.
3. **Provenance rule hardened** — attribution trigger stamps `created_by` only when `is_custom=true`; the client INSERT policy (§9) forbids `is_custom=false`, so a host can't forge a system-seeded tag. Confirmed.

---

**Council reviewed:** 2026-06-16 by data_modeller, backend_engineer, security_expert, tech_lead. Verdict 🟡 ADDRESS-THEN-PROCEED → all fixes folded in (provenance-forge INSERT policy, DEFINER hardening, stats-view zero-row + `zero_assigned` + authenticated-only grant, explicit idempotent seed SQL, `default_guest_rsvp` trigger, `event_sub_event_guest_counts` view, name index, bulk-upsert FE note). Approved by Abhijith.
