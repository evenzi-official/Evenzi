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
```

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

## 6. Derived read view (`security_invoker = on`)

```sql
create view public.event_guest_stats as
select g.event_id,
       count(*)                                              as total,
       count(*) filter (where s.category = 'attending')      as confirmed,
       count(*) filter (where s.category = 'pending')         as pending,
       count(*) filter (where s.category = 'declined')        as declined,
       count(*) filter (where s.category = 'tentative')       as maybe,
       coalesce(sum(g.party_size) filter (where s.category = 'attending'), 0) as attending_headcount
from public.event_guests g
join config.rsvp_statuses s on s.id = g.rsvp_status_id
group by g.event_id;
alter view public.event_guest_stats set (security_invoker = on);
```

> ⚠️ `security_invoker = on` is load-bearing — a plain `public` view bypasses RLS. Per-function attending counts and "zero-assigned guests" (guests with no `event_guest_sub_events` row) are derivable on demand; not pre-materialized.

---

## 7. Functions

| Function | Status | Purpose |
|---|---|---|
| `create_event_with_details(...)` | **extend** | add a seed block: copy `config.guest_tags` (enabled) → `public.event_guest_tags` (`is_custom=false`, `source_slug=slug`, `created_by=null`) in the same transaction as the existing task/expense-type seeds. |
| `set_updated_at()` | live | attach to the 3 tables with `updated_at` (`event_guests`, `event_guest_tags`, the 2 catalogs); NOT the insert/delete-only join tables. |
| bulk ops / CSV import | app-side | bulk insert/assign via supabase-js `.insert([...])` / `.in()` under RLS; a dedicated import RPC is deferred. |

`create_event_with_details` stays `SECURITY DEFINER` + pinned `search_path` + `revoke anon`; the new seed sets `created_by=null` (system provenance).

---

## 8. Triggers

| Trigger | On | When | Does |
|---|---|---|---|
| `trg_<table>_updated` | `event_guests`, `event_guest_tags`, catalogs | before update | `set_updated_at()` |
| `guest_sub_event_before` | `event_guest_sub_events` | before insert/update | derive `event_id` from the guest; **verify `sub_event_id` belongs to that same event** (reject cross-event) — `SECURITY DEFINER`, pinned `search_path` |
| `guest_tag_link_before` | `event_guest_tag_links` | before insert/update | derive `event_id` from the guest; **verify `tag_id` belongs to that same event** (reject cross-event) — `SECURITY DEFINER`, pinned `search_path` |
| `stamp_guest_created_by` | `event_guests` | before insert | always stamp `created_by = auth.uid()` (every guest is user-added) |
| `stamp_guest_tag_created_by` | `event_guest_tags` | before insert | stamp `created_by = auth.uid()` **only when `new.is_custom = true`**; seeded rows (`is_custom=false`) keep the inserted `created_by` (the `create_event_with_details` seed passes `null`) |

> **Why the integrity check (not just `event_id` derivation):** RLS `with_check` validates the derived `event_id` is the caller's event — but a caller could pass a `guest_id` from their own event and a `sub_event_id`/`tag_id` from a *different* event; the derived `event_id` (from the guest) would still be theirs, so RLS passes while the link points at a foreign function/tag. The guard trigger rejecting a cross-event `sub_event_id`/`tag_id` closes that hole.
>
> **Why the per-table attribution split:** `event_guests` has no `is_custom` (all guests are user-made → always stamp). `event_guest_tags` must NOT stamp seeded rows, or every default tag would look host-created; gating on `is_custom=true` keeps `created_by=NULL` for system seeds (D30).

---

## 9. Security (RLS) — owner-only, inlined (consistent with D26)

Enable RLS on all 5 new `public.*` tables in their creating migration (fail-safe). Owner-only inlined predicate, converging on `can_access_event()` with the other event-children later.

```sql
-- event_guests (direct event_id); event_guest_sub_events / event_guest_tags / event_guest_tag_links identical on their event_id
create policy event_guests_owner on public.event_guests for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_guests.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_guests.event_id and e.user_id = (select auth.uid())));
```

**Catalogs** (`config.rsvp_statuses`, `config.guest_tags`) — RLS on, one `SELECT` policy `using (true)` for `{anon, authenticated}`, no write policy (admin via `service_role`), `grant select`, `config` stays in Exposed Schemas.

**PII note:** `event_guests` holds guest contact (name/email/phone) — owner-only `authenticated`, no anon path. Same posture as the other event-children.

---

## 10. Migration order (build PR)

| # | Migration | Contents |
|---|---|---|
| `guests_01` | catalogs + seeds | `config.rsvp_statuses`, `config.guest_tags` + seeds + `updated_at` triggers + RLS select-only + grants |
| `guests_02` | live tables | the 5 `public.*` tables + indexes + `updated_at`/guard/attribution triggers + **RLS enabled here** |
| `guests_03` | view | `event_guest_stats` (`security_invoker`) |
| `guests_04` | RLS policies | owner-only inlined on the 5 new tables |
| `guests_05` | function | extend `create_event_with_details` (+ guest-tag seed block) |

After build: `npx supabase gen types` → refresh `lib/supabase/database.types.ts`; `get_advisors` (security + performance) reviewed.

---

## 11. FE-INTEGRATION.md impact

- Cache `config.rsvp_statuses` + `config.guest_tags` client-side (map by id), same as the other catalogs; `config` must stay in Exposed Schemas.
- Add a guest = insert `event_guests` with `rsvp_status_id` resolved by slug (`pending` default); `party_size` default 1.
- Functions/tags = insert/delete rows in `event_guest_sub_events` / `event_guest_tag_links` (bulk via `.insert([...])`); the trigger fills `event_id`.
- Stats via the `event_guest_stats` view; zero-assigned = guests with no `event_guest_sub_events` row.
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

1. Add the 2 catalogs + 5 live tables (DDL + Notes + Rationale), `[NOW]`.
2. Add the `event_guest_stats` view to the Views (derived) section.
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

## 14. Open items for spec review

1. `created_by` on the two **join** tables — intentionally omitted (assignments are always user actions; parent `created_by` covers provenance). OK, or add for symmetry?
2. `config.guest_tags` seed list (6 defaults: Family, Friends, Bride's side, Groom's side, Out-of-town, Colleagues) — good set, or adjust?
3. Attribution trigger stamps `created_by` only when `is_custom=true` (so seeds stay `null`) — confirm this provenance rule reads right.
