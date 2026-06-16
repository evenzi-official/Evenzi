# Media & Memories Data Model — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Checkbox steps. **Supabase migration build, teaching mode** — narrate each statement before applying.

**Goal:** Build the Media & Memories module's database layer (photo/video gallery + albums, R2-backed) on the dev Supabase project.

**Architecture:** 5 forward-only migrations (`media_01`–`media_05`) via the Supabase MCP `apply_migration`, each verified by `execute_sql` + `get_advisors`. Then regenerate types + sync docs. Migrations recorded on the remote; committed artifacts are the docs.

**Tech Stack:** Supabase Postgres (`smjkbmkxweevqpvygabe`), MCP `apply_migration`/`execute_sql`/`get_advisors`/`generate_typescript_types`. Files in Cloudflare R2 (DB stores keys only).

**Source of truth:** [`docs/superpowers/specs/2026-06-16-media-memories-data-model-design.md`](../specs/2026-06-16-media-memories-data-model-design.md) (council-reviewed, all fixes folded). Resolved: single `event_media`+`kind`; M:N albums; derive storage; catalog album presets; `kind` CHECK; `published` flag now; cover guard; keyset index; server-route storage ops deferred.

**Teaching-mode rule:** narrate each statement in plain SQL terms before applying; show verification after.

> **Council-reviewed:** 2026-06-16 (data_modeller/backend/security/tech_lead), 🟡 ADDRESS-THEN-PROCEED — all fixes folded into the spec this plan builds.

---

## Object map

| Migration | Creates / changes |
|---|---|
| `media_01` | `config.album_presets` (+ seed, `updated_at` trigger, RLS select-only, tight grants) |
| `media_02` | `event_media` → `event_albums` → `event_media_albums` + indexes + `updated_at`/guard/cover/stamp triggers + **RLS enabled** |
| `media_03` | views `event_media_storage`, `event_album_counts` (`security_invoker`, authenticated-only) |
| `media_04` | RLS policies (owner-only; `event_albums` split — INSERT `is_custom=true`) |
| `media_05` | extend `create_event_with_details` (+ album-preset seed block) |
| docs | `DATA-MODEL.md`, `FE-INTEGRATION.md`, `lib/supabase/database.types.ts` |

---

### Task 1: `media_01` — catalog + seed + RLS + grants

- [ ] **Step 1: Narrate** — one `config` catalog of 6 album-preset defaults that seed each event's albums (chips until they hold a photo). Same shape as `guest_tags`. RLS select-only; writes only via `service_role`; explicitly revoke DML from `authenticated`/`anon` (council — tight grants like `config.guest_tags`).

- [ ] **Step 2: Apply** `apply_migration` name `media_01_catalog`:

```sql
create table config.album_presets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null, description text,
  display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger trg_album_presets_updated before update on config.album_presets
  for each row execute function public.set_updated_at();
insert into config.album_presets (slug, name, display_order) values
  ('ceremony','Ceremony',1), ('reception','Reception',2), ('mehendi','Mehendi',3),
  ('sangeet','Sangeet',4), ('candids','Candids',5), ('prewedding','Pre-Wedding',6);
alter table config.album_presets enable row level security;
create policy album_presets_read on config.album_presets for select to anon, authenticated using (true);
revoke insert, update, delete on config.album_presets from anon, authenticated;
grant select on config.album_presets to anon, authenticated;
```

- [ ] **Step 3: Verify** `execute_sql`: `select count(*) from config.album_presets;` → expect `6`.
- [ ] **Step 4: Advisor** `get_advisors` security — no new errors on the catalog.

---

### Task 2: `media_02` — 3 live tables + triggers + RLS-enable

- [ ] **Step 1: Narrate** — `event_media` (one table for photos+videos, `kind` discriminator) is created **first** because `event_albums.cover_media_id` FKs it. The `storage_key` CHECK pins every key under `events/{event_id}/…` (a client can't paste another event's key). `event_media_albums` is the M:N join with a guard trigger (derive `event_id` from the media, **RAISE** if the media is missing, reject a cross-event album). `album_cover_before` rejects a cross-event cover. Stamps: media always; album only when `is_custom=true` (seeded presets keep `created_by=null`). All trigger fns `SECURITY DEFINER`, `search_path=''`, anon-revoked, BEFORE-only. RLS enabled here (fail-safe); policies in `media_04`.

- [ ] **Step 2: Apply** `apply_migration` name `media_02_live_tables`:

```sql
create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('photo','video')),
  storage_key text not null,
  thumbnail_key text,
  name text, original_filename text, content_type text,
  byte_size bigint not null default 0 check (byte_size >= 0),
  width int, height int,
  duration_sec int check (duration_sec is null or kind = 'video'),
  sub_event_id uuid references public.event_sub_events(id) on delete set null,
  taken_at timestamptz,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (storage_key like 'events/' || event_id::text || '/%')
);
create index idx_event_media_event_new on public.event_media(event_id, created_at desc, id desc);
create index idx_event_media_event_kind on public.event_media(event_id, kind);
create index idx_event_media_event_subevent on public.event_media(event_id, sub_event_id);
create index idx_event_media_event_taken on public.event_media(event_id, taken_at);
create index idx_event_media_published on public.event_media(event_id) where published;

create table public.event_albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  is_custom boolean not null default false, source_slug text,
  cover_media_id uuid references public.event_media(id) on delete set null,
  display_order int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index uq_event_albums_name on public.event_albums(event_id, lower(name));
create index idx_event_albums_event on public.event_albums(event_id, display_order);

create table public.event_media_albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  media_id uuid not null references public.event_media(id) on delete cascade,
  album_id uuid not null references public.event_albums(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (media_id, album_id)
);
create index idx_media_albums_album on public.event_media_albums(event_id, album_id);
create index idx_media_albums_media on public.event_media_albums(media_id);

-- updated_at (entity tables only)
create trigger trg_event_media_updated  before update on public.event_media  for each row execute function public.set_updated_at();
create trigger trg_event_albums_updated before update on public.event_albums for each row execute function public.set_updated_at();

-- stamp created_by: media always; album only when host-added (is_custom)
create or replace function public.stamp_media_created_by()
returns trigger language plpgsql security definer set search_path = '' as $$
begin new.created_by = auth.uid(); return new; end; $$;
revoke execute on function public.stamp_media_created_by() from public, anon, authenticated;
create trigger trg_event_media_creator before insert on public.event_media
  for each row execute function public.stamp_media_created_by();

create or replace function public.stamp_album_created_by()
returns trigger language plpgsql security definer set search_path = '' as $$
begin if new.is_custom then new.created_by = auth.uid(); end if; return new; end; $$;
revoke execute on function public.stamp_album_created_by() from public, anon, authenticated;
create trigger trg_event_albums_creator before insert on public.event_albums
  for each row execute function public.stamp_album_created_by();

-- album cover must belong to the same event
create or replace function public.album_cover_before()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_cov_ev uuid;
begin
  if new.cover_media_id is not null then
    select event_id into v_cov_ev from public.event_media where id = new.cover_media_id;
    if v_cov_ev is distinct from new.event_id then
      raise exception 'cover media % not in album event %', new.cover_media_id, new.event_id;
    end if;
  end if;
  return new;
end; $$;
revoke execute on function public.album_cover_before() from public, anon, authenticated;
create trigger trg_album_cover_before before insert or update on public.event_albums
  for each row execute function public.album_cover_before();

-- M:N guard: derive event_id from the media; reject cross-event album
create or replace function public.media_album_before()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_ev uuid; v_alb_ev uuid;
begin
  select event_id into v_ev from public.event_media where id = new.media_id;
  if v_ev is null then raise exception 'media % not found', new.media_id; end if;
  select event_id into v_alb_ev from public.event_albums where id = new.album_id;
  if v_alb_ev is distinct from v_ev then raise exception 'album % not in media event %', new.album_id, v_ev; end if;
  new.event_id = v_ev; return new;
end; $$;
revoke execute on function public.media_album_before() from public, anon, authenticated;
create trigger trg_media_album_before before insert or update on public.event_media_albums
  for each row execute function public.media_album_before();

alter table public.event_media        enable row level security;
alter table public.event_albums       enable row level security;
alter table public.event_media_albums enable row level security;
```

- [ ] **Step 3: Verify** tables + RLS:
```sql
select c.relname, c.relrowsecurity rls from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('event_media','event_albums','event_media_albums') order by 1;
```
Expected: 3 rows, `rls=true`.
- [ ] **Step 4: Verify** the storage_key CHECK rejects a bad prefix (negative test, rolled back):
```sql
begin;
-- a key NOT under events/<this event>/ must fail the CHECK:
insert into public.event_media (event_id, kind, storage_key)
  values ((select id from public.events limit 1), 'photo', 'events/00000000-0000-0000-0000-000000000000/x.jpg');
rollback;
```
Expected: ERROR (check constraint violated) — confirms the prefix guard. (If `events` is empty, skip and note.)

---

### Task 3: `media_03` — derived views

- [ ] **Step 1: Narrate** — `event_media_storage` (used_bytes + photo/video counts; limit/tier come from entitlements later) and `event_album_counts` (drives card-vs-chip). Both `security_invoker = on`, `authenticated`-only grant. Storage view returns no row for a media-less event (FE coalesces to 0).

- [ ] **Step 2: Apply** `apply_migration` name `media_03_views`:
```sql
create view public.event_media_storage as
select event_id,
       coalesce(sum(byte_size),0) as used_bytes,
       count(*) filter (where kind='photo') as photo_count,
       count(*) filter (where kind='video') as video_count
from public.event_media group by event_id;
alter view public.event_media_storage set (security_invoker = on);
revoke all on public.event_media_storage from anon, public;
grant select on public.event_media_storage to authenticated;

create view public.event_album_counts as
select event_id, album_id, count(*) as media_count
from public.event_media_albums group by event_id, album_id;
alter view public.event_album_counts set (security_invoker = on);
revoke all on public.event_album_counts from anon, public;
grant select on public.event_album_counts to authenticated;
```
- [ ] **Step 3: Verify** `security_invoker`:
```sql
select c.relname, (select option_value from pg_options_to_table(c.reloptions) where option_name='security_invoker') si
from pg_class c where c.relname in ('event_media_storage','event_album_counts') order by 1;
```
Expected: 2 rows, `si=true`.

---

### Task 4: `media_04` — RLS policies

- [ ] **Step 1: Narrate** — owner-only inlined (not `can_access_event()`). `event_media` + `event_media_albums` get one `FOR ALL` policy on their `event_id`. `event_albums` **split**: SELECT/UPDATE/DELETE owner-only (rename/delete seeded albums OK); INSERT additionally requires `is_custom=true` (clients can't forge a preset; the DEFINER seed bypasses RLS).

- [ ] **Step 2: Apply** `apply_migration` name `media_04_rls`:
```sql
create policy event_media_owner on public.event_media for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_media.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_media.event_id and e.user_id = (select auth.uid())));

create policy media_albums_owner on public.event_media_albums for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_media_albums.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_media_albums.event_id and e.user_id = (select auth.uid())));

create policy event_albums_select on public.event_albums for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_albums.event_id and e.user_id = (select auth.uid())));
create policy event_albums_update on public.event_albums for update to authenticated
  using     (exists (select 1 from public.events e where e.id = event_albums.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_albums.event_id and e.user_id = (select auth.uid())));
create policy event_albums_delete on public.event_albums for delete to authenticated
  using (exists (select 1 from public.events e where e.id = event_albums.event_id and e.user_id = (select auth.uid())));
create policy event_albums_insert on public.event_albums for insert to authenticated
  with check (exists (select 1 from public.events e where e.id = event_albums.event_id and e.user_id = (select auth.uid())) and is_custom = true);
```
- [ ] **Step 3: Verify** policy counts:
```sql
select tablename, count(*) from pg_policies where schemaname='public' and tablename in
 ('event_media','event_albums','event_media_albums') group by tablename order by 1;
```
Expected: `event_albums=4`, `event_media=1`, `event_media_albums=1`.
- [ ] **Step 4: Advisor** `get_advisors` security — no RLS-disabled / security-definer-view errors on the new objects.

---

### Task 5: `media_05` — extend `create_event_with_details` (album-preset seed)

- [ ] **Step 1: Inspect** the current function (extended in `guests_05`):
```sql
select pg_get_functiondef(oid) from pg_proc where proname='create_event_with_details' and pronamespace='public'::regnamespace;
```
- [ ] **Step 2: Narrate** — append a 6th seed block copying `config.album_presets` (enabled) → `event_albums` (`is_custom=false`, `created_by=null`, `cover_media_id=null`), carrying `display_order`, `on conflict (event_id, lower(name)) do nothing`. DEFINER bypasses RLS to write the `is_custom=false` presets. Same 8-param signature + return → live caller unaffected (D36: monolithic for now).
- [ ] **Step 3: Apply** `apply_migration` name `media_05_create_event_albums` — `create or replace function public.create_event_with_details(...)` preserving the `guests_05` body verbatim and inserting before the `return`:
```sql
insert into public.event_albums (event_id, name, is_custom, source_slug, created_by, display_order)
select v_event_id, ap.name, false, ap.slug, null, ap.display_order
from config.album_presets ap
where ap.enabled
order by ap.display_order
on conflict (event_id, lower(name)) do nothing;
```
Keep `security definer`, `set search_path=''`, schema-qualified refs; re-assert `revoke execute … from public, anon; grant execute … to authenticated` on the 8-arg signature.
- [ ] **Step 4: Verify**:
```sql
select prosecdef, position('album_presets' in pg_get_functiondef(oid))>0 as has_album_seed,
       has_function_privilege('anon','public.create_event_with_details(uuid,uuid,text,date,text,int,jsonb,jsonb)','execute') as anon_exec
from pg_proc where proname='create_event_with_details' and pronamespace='public'::regnamespace;
```
Expected: `prosecdef=true`, `has_album_seed=true`, `anon_exec=false`.
- [ ] **Step 5: Smoke test (RLS-on, as owner, rolled back)** — create a throwaway event via the RPC (simulate `auth.uid()` with `set_config('request.jwt.claims', …, true)`), then in a SEPARATE statement (fresh snapshot — use a temp table to capture the event_id) count `event_albums` for it. Expected: **6** seeded albums, all `is_custom=false` + `created_by is null`. Roll back.

---

### Task 6: types + advisor sweep

- [ ] **Step 1** `generate_typescript_types` → merge into `lib/supabase/database.types.ts` (preserve the hand-maintained `config` block; add `config.album_presets`). `tsc --noEmit --skipLibCheck` the file → clean.
- [ ] **Step 2** `get_advisors` `security` + `performance`. Expected: only the pre-existing/by-design WARNs (definer RPC) + INFO unindexed-FK noise (consistent with CORE/Planning/Guests). Record.
- [ ] **Step 3: Commit**
```bash
git add lib/supabase/database.types.ts
git commit -m "chore(db): regenerate Supabase types after media_01-05"
```

---

### Task 7: update `DATA-MODEL.md` + `FE-INTEGRATION.md`

- [ ] **Step 1** Apply the spec §13 checklist: `config.album_presets` + 3 tables (DDL + Notes + Rationale, `[NOW]`); the 2 views; the `create_event_with_details` album-preset seed note; the 4 triggers (stamps + `album_cover_before` + `media_album_before`); the Media RLS subsection (split policy + private-R2/signed-URL + server-route dependency); ER diagram; decision log **D31–D36**; derived rows (storage used + counts, album counts); account-deletion cascade tree (+3 media tables; `created_by`/`cover_media_id` SET NULL); version bump + scope.
- [ ] **Step 2** FE-INTEGRATION.md: cache `config.album_presets`; upload-commit + single-delete + batch signed-URL via **server routes** (server-stamped `byte_size`, key-prefix validation, object purge); add/remove-album upsert-ignore; album-card LEFT JOIN counts; storage meter coalesce; Newest = `created_at desc` keyset on `(created_at,id)`; the storage-serving-routes dependency note.
- [ ] **Step 3: Commit**
```bash
git add docs/data-model/DATA-MODEL.md docs/data-model/FE-INTEGRATION.md
git commit -m "docs(data-model): add Media & Memories module (tables, views, RLS, D31-D36)"
```

---

## Self-review

**Spec coverage:** every spec object maps to a task — catalog (T1), 3 tables + all triggers + RLS-enable + storage_key CHECK (T2), 2 views (T3), policies incl. albums-split (T4), create_event album seed (T5), types (T6), docs incl. D31–D36 + FE (T7). ✔
**Placeholder scan:** the only deferred body is `create_event_with_details` (T5) — rewritten after inspecting the `guests_05` definition, exact seed block given. No vague steps. ✔
**Type consistency:** names match the spec and across tasks (`kind`, `storage_key`, `cover_media_id`, `is_custom`, `media_album_before`, `album_cover_before`, `event_media_storage`, `event_album_counts`, `uq_event_albums_name`). `lower(name)` uniqueness is a unique INDEX (planning_03 lesson). Create-order media→albums→links is pinned in T2. ✔
