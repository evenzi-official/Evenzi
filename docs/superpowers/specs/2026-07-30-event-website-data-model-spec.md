# Event Website (Digital Presence) — Data Model Spec

> **Status:** **Wave 1 is LIVE** on the dev DB (`smjkbmkxweevqpvygabe`) — migrations `website_01`–`website_10` applied 2026-07-30, `get_advisors` (security) clean after one fix (`website_10` locked down the guard-trigger's anon-exec gap), TypeScript types regenerated. See [`DATA-MODEL.md` D49](../../data-model/DATA-MODEL.md#decision-log) for the canonical record. Wave 2 (public site, guest lookup, `anon` RLS) remains spec-only, gated behind its own council pass — **not migrated**.
>
> **Council reviewed:** 2026-07-30 by Tech Lead, Data Modeller, Security Expert, Backend Engineer (Critique + Debate + Arbiter). **Original verdict: 🔴 RE-PLAN.** This is the revised spec addressing every critical + important finding — see [§0 Changelog](#0-changelog-from-council-review) for what changed and why.
>
> **Owner:** Abhijith (spec/data modeling) · **Opened:** 2026-07-30
>
> **Supersedes-by-resolving:** [`docs/data-model/event-website-gaps.md`](../../data-model/event-website-gaps.md) G1, G2, G3, G4, G5, G6, G9, G12, G13. G7, G10, G11 remain product decisions, not schema.
>
> **Follows conventions in:** [`docs/data-model/DATA-MODEL.md`](../../data-model/DATA-MODEL.md).

---

## 0. Changelog from council review

The original single-pass spec drew 5 critical + 9 important findings. Fixes below, each traced to the finding that caused it:

| Change | Why |
|---|---|
| Split into **Wave 1** (host editor, owner-only RLS) and **Wave 2** (public site, first-ever `anon` RLS surface) — two separate migration/council slices | Tech Lead: bundling a new security posture with deferrable features dilutes review. Endorsed unanimously. |
| §7's RLS design rebuilt around a `SECURITY DEFINER` gate function (`is_website_gate_open`) instead of anon policies referencing `event_website_settings` directly | Security Expert: the original design either silently breaks (no anon policy on the referenced table) or leaks `website_password_hash` via a naive fix. |
| Password gate (`tier='private'`) now has an explicit open decision recorded, not silently unmodeled | Security Expert: private content was anon-readable via direct REST regardless of password state. |
| **Gallery (`event_media`/`event_albums`) removed from the anon-read surface entirely** | Tech Lead: contradicts existing decision **D35** in `DATA-MODEL.md`, which already rejected `anon SELECT using(published)` on this exact mixed table. Unanimous in debate — nobody had cross-checked the decision log. |
| `submit_rsvp` signature changed to `(token, sub_event_id, response_status, dietary_notes)` — never accepts `guest_id` from the caller | Backend Engineer: original signature couldn't handle re-submission or per-sub-event response, and referenced a `dietary_notes` field with no column. |
| **`guest_tokens.guest_id → event_guests` FK dropped entirely.** `guest_tokens` keeps `event_id` only; resolution happens exclusively through `resolve_guest_token()` | Arbiter ruling (contested: Tech Lead/Data Modeller called it a rule-7 violation, Security Expert called it safe). **UPHELD-WITH-MODIFICATION**, severity important: real rule-7 violation, converges on dropping the FK rather than keeping it as a sanctioned exception. Recorded as a new `DATA-MODEL.md` decision-log entry (§10). |
| Guard triggers added for every denormalized `event_id` (`event_website_sections`, `guest_tokens`) | Data Modeller: every existing denormalized-`event_id` table in the live schema pairs it with a guard trigger deriving `event_id` from the parent row. Missing here would let a mismatched `event_id` slip past RLS. Tech Lead: this is a **Wave 1** blocker (silent cross-event corruption risk even under owner-only RLS), not a Wave 2 concern. |
| `config.website_pages`/`website_section_types`/`website_fonts` changed from `slug text primary key` to `id uuid primary key` + `slug text unique` | Data Modeller: original rationale cited `config.task_priorities` as precedent for a text PK — that table actually has a uuid PK. All 10 existing catalogs use uuid PK + unique slug; no precedent for the deviation. |
| Explicit Zod-validation requirement added for `event_website_sections.data` (11 discriminated schemas) | Backend Engineer: jsonb with no enforced shape and no assigned schema owner. |
| Aggregate read RPC (`get_public_website_payload`) added, explicitly scoped to Wave 1 tables (no gallery) | Backend Engineer + Tech Lead: avoids 4-6 round trips per public page load; must not silently join a table that's been pulled from the anon surface. |
| New unauthenticated route family explicitly named | Backend Engineer: `resolve_guest_token`/`submit_rsvp` need a route family with no `getUser()` check — a first for this codebase, must be scoped, not discovered mid-build. |
| Token entropy + rate limiting made hard requirements, not prose suggestions | Security Expert: `guest_tokens` was `text unique` with entropy only "e.g. nanoid(24)" in prose, no rate limiting anywhere. |
| PII-in-jsonb risk documented explicitly (not schema-fixable) | Security Expert: free-text section types (Wedding Party, Q&A) are a real, permanent public-PII leak path once the site is anon-readable by design. |
| Build order fixed — RLS ships in the same migration batch as its table | Tech Lead: original order deferred RLS to step 8 of 9, a 7-batch window with unprotected tables, unlike every prior module. |
| G12 (card-templates catalog seed data) moved out to Digital Invitations' own backlog | Tech Lead: module-boundary blur — the *decision* to reuse `config.invitation_templates` stays here, the seed-data execution doesn't. |
| Missing indexes, `created_by`/`updated_by`, explicit `on delete restrict` added to `event_travel_points`/`event_stays` and new catalog FKs | Data Modeller, suggestion-severity, folded in since they're free. |

**Post-council founder input (2026-07-30, after the revision above):** the "password gate" framing in the original council pass was wrong — Abhijith clarified the actual guest-facing access model is **self-serve guest lookup**, not a shared password. A guest enters their phone number + name on the public site; the system matches them against `event_guests`/`event_guest_sub_events`, shows them only the sub-events they're tagged to, and lets them RSVP per sub-event (confirming **G7 = per-sub-event response is needed**, not blanket). This replaces §6's original token-link/password design. See revised §1 and §6 below — Wave 2's RPCs are rewritten around this lookup flow. OTP verification of the phone number was considered and explicitly deferred to a fast-follow enhancement (reusing the Twilio/Supabase phone-OTP infra already live for host auth); V0 ships with a plain phone+name match, which raises the enumeration-risk bar on rate limiting (§6.4) from "important" to load-bearing for V0's actual security posture.

**Further founder input, same session:** `website_password_enabled` (existing column) repurposed as a second pre-launch visibility toggle alongside `site_offline`, not an actual password mechanism — `website_password_hash` stays unused (§6.1). Separately, Story/Wedding-Party/Q&A (G11) each get a dedicated typed table (§4.5 — `event_story_blocks`, `event_wedding_party_members`, `event_qa_items`) instead of the generic `event_website_sections` jsonb blob, matching the `event_travel_points`/`event_stays` pattern. `event_website_sections` narrows to backing only Registry, Video, and host-added free-form extras.

---

## 1. Decisions locked before drafting this shape

Asked via `AskUserQuestion` on 2026-07-30, all recommended defaults accepted:

| Decision | Chosen |
|---|---|
| Section/page model | **Hybrid** — fixed 10-page spine (seeded per event, same as every template), host can toggle visibility/reorder pages and add optional extra sections within the free-form pages. |
| Theme customization depth | **Template + overrides** — host picks 1 of N templates, can override palette/font/cover image on top of the template's defaults. |
| Guest-site access model | **Public URL, tier-based** — `tier='public'` pages (e.g. Home) are visible to any visitor once the site isn't offline. `tier='private'` pages (Schedule, RSVP, Wedding Party, etc.) require the guest to identify themselves first — see the lookup mechanism below. Not a shared site-wide password. |
| Card-templates catalog (G12) | **Reuse `config.invitation_templates`/`config.invitation_card_styles`** — decision stays here; seed-data execution moves to Digital Invitations' backlog (see changelog). |
| **Guest identification mechanism** | **Self-serve phone + name lookup** (founder input, 2026-07-30) — guest enters phone number + name on the public site; system matches against `event_guests`, returns only their tagged sub-events (`event_guest_sub_events`) + lets them RSVP per sub-event. **Plain match for V0, no OTP** — OTP is an explicit fast-follow enhancement, not built now. |
| **Guest session persistence** | **Signed session cookie** after a successful lookup — guest doesn't re-enter phone/name on repeat visits. Implemented via the same `guest_tokens` table originally designed for a link-based model, just created by a successful *lookup* instead of a host-generated link (§6.3). |
| G7 (was open, now resolved) | **Per-sub-event RSVP response is needed** — a guest can say yes to the sangeet, no to the reception. Confirmed by the founder alongside the lookup-flow answer. `event_guest_sub_events.response_status`/`plus_one_count`/`dietary_notes`/`responded_at` (§5.6) are wired from day one, not left unused. |

**Still open, not schema-blocking (flagged for product/founder call, defaults proposed):**

| # | Question | Proposed default |
|---|---|---|
| G10 | "Travel & Stay" own Settings sub-page, or Website host-editor only? | New Settings sub-page, standard pattern. |
| G11 (UI-placement half still open) | Story/Wedding-Party/Q&A content: Edit-Pages editor or Event Settings? | Edit-Pages owns it (tracker's own recommendation). **Schema half resolved 2026-07-30** — each gets its own dedicated table (§4.5), not the generic `event_website_sections` jsonb. |
| **`website_password_enabled`** (resolved, founder input 2026-07-30) | **Repurposed as a second host-controlled pre-launch visibility toggle** — not a password/secret gate. Same semantic category as `site_offline` ("is the site publicly reachable yet"), just a second independent switch the host can flip. `website_password_hash` is **unused/vestigial** — no password verification logic is built; nothing ever reads or writes it in Wave 2. `is_website_gate_open()` (§6.1) checks both flags. |

---

## 2. What this spec does NOT cover

- The guest-site template *build* itself (React port, `app/e/[slug]/`) — `designs/_plans/guest-website-templates-build-plan.md`, untouched.
- Licensing resolution for theme-derived assets.
- RSVP submission UX, unlock-gate UX — app-layer.
- Media & Memories' upload endpoint / signed-URL public route — that module's own backlog; this spec depends on it for Wave 2's gallery page (§6) but does not build it.

---

## 3. Build phasing — Wave 1 / Wave 2

**Wave 1 — Host editor foundation.** Everything the host needs to design and preview their site. Owner-only RLS throughout (same posture as every module shipped so far — Planning, Guests, Media, Invitations, Event Settings). No `anon` grants. Resolves G1, G5, G9's host-editor half.

**Wave 2 — Public site + guest personalization.** The actual public `/e/[slug]` surface: `anon` read access, guest tokens, RSVP submission. This is the codebase's first `anon` RLS surface and gets its own dedicated council pass before migration, per the arbiter/Tech Lead ruling. Resolves G2, G3, G6, G9's guest-facing half.

Each wave ships RLS in the same migration batch as its tables — no cross-wave gap where a table exists without a policy.

---

## 4. Wave 1 — Host editor foundation

### 4.1 New `config.*` catalogs

```sql
-- config.website_templates
create table config.website_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  default_palette_id uuid,   -- FK added after website_palettes exists (below)
  default_font_id uuid,      -- FK added after website_fonts exists (below)
  thumbnail_key text,
  display_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- config.website_palettes
create table config.website_palettes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  swatch_hex text[] not null,
  css_tokens jsonb not null default '{}',
  display_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- config.website_fonts (uuid PK per council fix — not slug PK)
create table config.website_fonts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  role text not null check (role in ('heading', 'body', 'both')),
  enabled boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table config.website_templates
  add constraint website_templates_default_palette_fkey
  foreign key (default_palette_id) references config.website_palettes(id) on delete restrict,
  add constraint website_templates_default_font_fkey
  foreign key (default_font_id) references config.website_fonts(id) on delete restrict;

-- config.website_pages (uuid PK per council fix — not slug PK)
create table config.website_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,   -- 'home','story','schedule','venue-travel','wedding-party','gallery','qa','rsvp','registry','video'
  name text not null,
  icon_name text,
  tier text not null check (tier in ('public', 'private')),
  is_removable boolean not null default true,   -- false on 'home' and 'rsvp'
  default_visible boolean not null default true,
  display_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- config.website_section_types (uuid PK per council fix — not slug PK)
create table config.website_section_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,   -- 'heading','photo','photogrid','schedule','person','hotel','qa','divider','map','countdown','video'
  name text not null,
  icon_name text,
  field_schema jsonb not null default '[]',
  display_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Wave 1 RLS: catalogs are reference data, readable by any authenticated user, writable by service_role only
alter table config.website_templates enable row level security;
alter table config.website_palettes enable row level security;
alter table config.website_fonts enable row level security;
alter table config.website_pages enable row level security;
alter table config.website_section_types enable row level security;

create policy "authenticated_read" on config.website_templates for select to authenticated using (true);
create policy "authenticated_read" on config.website_palettes for select to authenticated using (true);
create policy "authenticated_read" on config.website_fonts for select to authenticated using (true);
create policy "authenticated_read" on config.website_pages for select to authenticated using (true);
create policy "authenticated_read" on config.website_section_types for select to authenticated using (true);
```

### 4.2 `public.event_website_design` (1:1 sidecar)

```sql
create table public.event_website_design (
  event_id uuid primary key references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  template_id uuid not null references config.website_templates(id) on delete restrict,
  palette_id uuid references config.website_palettes(id) on delete restrict,   -- null = use template default
  heading_font_id uuid references config.website_fonts(id) on delete restrict,
  body_font_id uuid references config.website_fonts(id) on delete restrict,
  cover_image_key text,
  og_image_key text,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_event_website_design_updated before update on public.event_website_design
  for each row execute function public.set_updated_at();

alter table public.event_website_design enable row level security;
create policy "owner_all" on public.event_website_design for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
```
Resolves **G5** (theme persistence) and the theme-name mismatch found between the design prototype and the React mock.

### 4.3 `public.event_website_pages`

```sql
create table public.event_website_pages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  page_id uuid not null references config.website_pages(id) on delete restrict,
  is_visible boolean not null default true,
  custom_title text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, page_id)
);

create index idx_event_website_pages_event on public.event_website_pages(event_id, display_order);

create trigger trg_event_website_pages_updated before update on public.event_website_pages
  for each row execute function public.set_updated_at();

alter table public.event_website_pages enable row level security;
create policy "owner_all" on public.event_website_pages for all to authenticated
  using (event_id in (select id from public.events where user_id = (select auth.uid())))
  with check (event_id in (select id from public.events where user_id = (select auth.uid())));
```

### 4.4 `public.event_website_sections`

```sql
create table public.event_website_sections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,  -- denormalized for RLS
  page_id uuid not null references public.event_website_pages(id) on delete cascade,
  section_type_id uuid not null references config.website_section_types(id) on delete restrict,
  data jsonb not null default '{}',
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_event_website_sections_page on public.event_website_sections(page_id, display_order);
create index idx_event_website_sections_event on public.event_website_sections(event_id) where is_visible;

create trigger trg_event_website_sections_updated before update on public.event_website_sections
  for each row execute function public.set_updated_at();

-- Guard trigger: event_id must match the parent page's event_id (council fix — Data Modeller finding #1)
create or replace function public.event_website_section_before()
returns trigger security definer set search_path = public
language plpgsql as $$
begin
  select event_id into new.event_id from public.event_website_pages where id = new.page_id;
  if new.event_id is null then
    raise exception 'event_website_sections: page_id % has no matching event', new.page_id;
  end if;
  return new;
end; $$;

create trigger trg_event_website_section_before before insert or update
  on public.event_website_sections for each row execute function public.event_website_section_before();

alter table public.event_website_sections enable row level security;
create policy "owner_all" on public.event_website_sections for all to authenticated
  using (event_id in (select id from public.events where user_id = (select auth.uid())))
  with check (event_id in (select id from public.events where user_id = (select auth.uid())));
```

**Validation requirement (not schema-enforceable, must be built alongside):** every write to `event_website_sections.data` must pass a per-`section_type_id` Zod schema at the API boundary — a `sectionDataSchemas: Record<sectionTypeSlug, ZodSchema>` map maintained alongside `config.website_section_types`, matching the `.strict()` pattern already used in `app/api/events/[id]/website-settings/route.ts`. Postgres jsonb has no native shape enforcement; this is an application-layer requirement, not optional.

### 4.5 Dedicated content tables — Story, Wedding Party, Q&A

**Founder input (2026-07-30):** these three pages get real typed tables, not the generic `event_website_sections` jsonb blob — matching the pattern `event_travel_points`/`event_stays` already use, rather than the "documented, not enforced" jsonb approach. `event_website_sections` (§4.4) narrows to backing only the **Registry** and **Video** pages, plus any host-added free-form extras on any page (per the Hybrid decision, §1) — it doesn't disappear, it stops being the catch-all for content that's naturally tabular.

```sql
-- Story page: ordered narrative blocks (heading+body, or a standalone photo)
create table public.event_story_blocks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  block_type text not null check (block_type in ('heading', 'photo')),
  heading text,
  body text,
  twocol boolean not null default false,
  photo_key text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_event_story_blocks_event on public.event_story_blocks(event_id, display_order);
create trigger trg_event_story_blocks_updated before update on public.event_story_blocks
  for each row execute function public.set_updated_at();
alter table public.event_story_blocks enable row level security;
create policy "owner_all" on public.event_story_blocks for all to authenticated
  using (event_id in (select id from public.events where user_id = (select auth.uid())))
  with check (event_id in (select id from public.events where user_id = (select auth.uid())));

-- Wedding Party page: person cards, bride's side / groom's side
create table public.event_wedding_party_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  relation text,
  side text not null check (side in ('bride', 'groom')),
  photo_key text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_event_wedding_party_members_event on public.event_wedding_party_members(event_id, side, display_order);
create trigger trg_event_wedding_party_members_updated before update on public.event_wedding_party_members
  for each row execute function public.set_updated_at();
alter table public.event_wedding_party_members enable row level security;
create policy "owner_all" on public.event_wedding_party_members for all to authenticated
  using (event_id in (select id from public.events where user_id = (select auth.uid())))
  with check (event_id in (select id from public.events where user_id = (select auth.uid())));

-- Q&A page: question/answer pairs
create table public.event_qa_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_event_qa_items_event on public.event_qa_items(event_id, display_order);
create trigger trg_event_qa_items_updated before update on public.event_qa_items
  for each row execute function public.set_updated_at();
alter table public.event_qa_items enable row level security;
create policy "owner_all" on public.event_qa_items for all to authenticated
  using (event_id in (select id from public.events where user_id = (select auth.uid())))
  with check (event_id in (select id from public.events where user_id = (select auth.uid())));
```

No guard trigger needed on any of these three — `event_id` is a direct FK to `public.events`, not denormalized through a parent row (unlike `event_website_sections.event_id`, which derives from `page_id`).

### 4.6 Pages backed by existing tables (no `event_website_sections` rows)

| Page | Backing (already live or added in this spec) |
|---|---|
| Schedule | `event_sub_events` + `show_on_website` |
| Story | `event_story_blocks` (§4.5) |
| Wedding Party | `event_wedding_party_members` (§4.5) |
| Q&A | `event_qa_items` (§4.5) |
| Venue & Travel | `event_travel_points` + `event_stays` (§5.2/5.3) + `map_link` |
| RSVP | `event_guests`, `event_guest_settings`, `event_guest_sub_events` |
| Gallery | **Deferred to Wave 2 — see §6.** No anon backing exists yet (D35); `event_website_pages` still gets a row for ordering, but ships with no working public data source until Media's signed-URL route lands. |

`event_website_sections` (§4.4) backs only **Registry** and **Video**, plus any host-added extra sections on top of the above.

### 4.7 Wave 1 aggregate read (host preview)

```sql
create or replace view public.event_website_summary
with (security_invoker = true) as
select
  ewp.event_id,
  jsonb_agg(
    jsonb_build_object(
      'page_id', ewp.page_id, 'slug', cp.slug, 'name', coalesce(ewp.custom_title, cp.name),
      'tier', cp.tier, 'is_visible', ewp.is_visible, 'display_order', ewp.display_order
    ) order by ewp.display_order
  ) as pages
from public.event_website_pages ewp
join config.website_pages cp on cp.id = ewp.page_id
group by ewp.event_id;
```
Matches the `event_hub_summary` convention already established for the Event Hub module. This is the **authenticated host-preview** read — the Wave 2 public equivalent (§6.6 `get_public_website_payload`) is a separate, anon-safe RPC, not this view.

### 4.8 Seed extension

Extend the existing `create_event_with_details` → `_seed_event_settings()` pattern (per `DATA-MODEL.md`'s Event Settings entry) with one more step:

```sql
insert into public.event_website_design (event_id, user_id, template_id)
select p_event_id, p_user_id, id from config.website_templates where enabled = true order by display_order limit 1;

insert into public.event_website_pages (event_id, page_id, is_visible, display_order)
select p_event_id, id, default_visible, display_order from config.website_pages where enabled = true;
```
Bulk `INSERT ... SELECT`, not a per-row loop (council fix — Backend Engineer suggestion).

---

## 5. Wave 1 — additive content tables (travel, stays)

These are purely additive content, no new security posture — safe to ship alongside Wave 1's owner-only RLS.

### 5.1 Venue geo — ALTER, not a new table (G4, MVP default)
```sql
alter table public.events add column map_link text;
alter table public.event_sub_events add column map_link text;
```

### 5.2 `public.event_travel_points` (G2)
```sql
create table public.event_travel_points (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('airport', 'railway', 'bus')),
  name text not null,
  distance_text text,
  travel_time_text text,
  map_link text,
  note text,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_event_travel_points_event on public.event_travel_points(event_id, display_order);
create trigger trg_event_travel_points_updated before update on public.event_travel_points
  for each row execute function public.set_updated_at();
alter table public.event_travel_points enable row level security;
create policy "owner_all" on public.event_travel_points for all to authenticated
  using (event_id in (select id from public.events where user_id = (select auth.uid())))
  with check (event_id in (select id from public.events where user_id = (select auth.uid())));
```

### 5.3 `public.event_stays` (G3)
```sql
create table public.event_stays (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  address text,
  distance_text text,
  price_band text,
  booking_url text,
  phone text,
  map_link text,
  note text,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_event_stays_event on public.event_stays(event_id, display_order);
create trigger trg_event_stays_updated before update on public.event_stays
  for each row execute function public.set_updated_at();
alter table public.event_stays enable row level security;
create policy "owner_all" on public.event_stays for all to authenticated
  using (event_id in (select id from public.events where user_id = (select auth.uid())))
  with check (event_id in (select id from public.events where user_id = (select auth.uid())));
```
(Council fix: both tables now carry `created_by`/`updated_by`, an `event_id` index, and explicit `on delete restrict`-equivalent care is n/a here since these have no catalog FKs.)

### 5.4 `public.events.slug` (G13, new)
```sql
alter table public.events add column slug text unique;
```
Generation strategy (app-layer) deferred to implementation.

### 5.5 New catalog FKs — explicit `on delete restrict`
All catalog FKs added in §4.1/§4.2/§4.3/§4.4 above already state `on delete restrict` explicitly (council fix — Data Modeller finding).

### 5.6 `public.event_guest_sub_events` — ALTER (G7, confirmed needed per §1)
```sql
alter table public.event_guest_sub_events
  add column response_status text check (response_status in ('yes', 'no', 'maybe')),
  add column plus_one_count integer check (plus_one_count >= 0),
  add column dietary_notes text,
  add column responded_at timestamptz,
  add constraint event_guest_sub_events_guest_sub_event_unique unique (guest_id, sub_event_id);
```
Confirmed by the founder as a real requirement (guest RSVPs per sub-event, not once per event) — these columns are wired from day one in Wave 2's `submit_rsvp`, not left unused. `dietary_notes` added here (council fix — Backend Engineer flagged the original RPC referenced a column with no home). The `unique` constraint is required for `submit_rsvp`'s `on conflict` upsert (§6.5) — add only if this link table doesn't already have one (verify at migration time).

---

## 6. Wave 2 — Public site + guest personalization

**Ships as its own migration batch + its own council checkpoint**, after Wave 1 is live. This is the codebase's first `anon`-readable surface. **Redesigned post-council** around the founder's clarification (§0): access is **guest self-lookup by phone+name**, not a shared site password — see below. Because there's no site-wide anon SELECT model anymore (everything funnels through `SECURITY DEFINER` RPCs), this design is *simpler and more defensible* than the original raw-RLS-policy draft: `anon` never gets a direct `SELECT` grant on any live `event_website_*`/`event_guests`-adjacent table — only `EXECUTE` on the functions below, each of which does its own tier/session check internally.

### 6.1 Gate function — site-wide reachability only

```sql
create or replace function public.is_website_gate_open(p_event_id uuid)
returns boolean
security definer set search_path = public
language sql stable as $$
  select coalesce(
    (select (not site_offline) and (not website_password_enabled)
     from public.event_website_settings where event_id = p_event_id),
    false
  );
$$;
revoke all on function public.is_website_gate_open(uuid) from public;
grant execute on function public.is_website_gate_open(uuid) to anon, authenticated;
```
Returns a boolean only — never the row, never `website_password_hash`. Scope: **"is the site published at all"** — two independent host-controlled toggles (`site_offline`, `website_password_enabled`), both must be off for the site to be publicly reachable (§1, resolved). Despite its name, `website_password_enabled` is **not a password/secret gate** — no password verification logic exists in Wave 2; it's a second pre-launch visibility switch, same category as `site_offline`. `website_password_hash` stays unused/vestigial — never read or written here. The actual privacy mechanism for `tier='private'` content is guest identification (§6.3–6.5), not a shared password.

### 6.2 No raw `anon` SELECT on live tables

Unlike the original draft, **no `event_website_*`/`event_travel_points`/`event_stays`/`event_sub_events` table gets a direct `anon` SELECT policy.** All public reads go through `get_public_website_payload()` (§6.6), which internally branches on page `tier` and an optional guest session — this makes the "tier not modeled in RLS" class of bug (Security Expert's original finding) structurally impossible, since anon has no table-level read path to bypass. `config.website_templates`/`website_palettes`/`website_fonts`/`website_pages`/`website_section_types` are the one exception — pure reference data, no privacy concern, safe as simple `anon` reads:

```sql
create policy "anon_read" on config.website_templates for select to anon using (enabled = true);
create policy "anon_read" on config.website_palettes for select to anon using (enabled = true);
create policy "anon_read" on config.website_fonts for select to anon using (enabled = true);
create policy "anon_read" on config.website_pages for select to anon using (enabled = true);
create policy "anon_read" on config.website_section_types for select to anon using (enabled = true);
```

**`event_media`/`event_albums` (Gallery) stays out of Wave 2 entirely — see D35 in `DATA-MODEL.md`.** Ships in a later, separate slice once Media & Memories builds the signed-URL public route D35 already specifies, or that decision is explicitly revisited and superseded with a new dated entry.

### 6.3 `public.guest_tokens` (G6) — session created by lookup, not a host-generated link

```sql
create table public.guest_tokens (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null,   -- no FK — see below and §10's decision-log entry
  token text not null unique,   -- server-generated, 122-bit-class entropy minimum (e.g. nanoid(21)) — enforced at generation time, not in the DB
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_guest_tokens_event on public.guest_tokens(event_id);

alter table public.guest_tokens enable row level security;
-- No anon or authenticated SELECT/INSERT/UPDATE/DELETE policies at all.
-- Only service_role (via SECURITY DEFINER functions below) touches this table.
```

**Why no FK to `event_guests`:** arbiter-ruled (§10) — a direct `guest_tokens.guest_id → event_guests(id)` FK would violate the "module tables FK only to core/config" rule, same shape D23 already rejected for a different module pair. `guest_id` is a plain column, validated at write time by `resolve_guest_by_lookup()` below, never a standing referential constraint.

```sql
create or replace function public.create_guest_token(p_event_id uuid, p_guest_id uuid, p_token text, p_expires_at timestamptz default null)
returns uuid
security definer set search_path = public
language plpgsql as $$
declare v_id uuid;
begin
  if not exists (select 1 from public.event_guests where id = p_guest_id and event_id = p_event_id) then
    raise exception 'guest % does not belong to event %', p_guest_id, p_event_id;
  end if;
  insert into public.guest_tokens (event_id, guest_id, token, expires_at)
  values (p_event_id, p_guest_id, p_token, p_expires_at)
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.create_guest_token(uuid, uuid, text, timestamptz) from public;
-- Internal helper, called only from resolve_guest_by_lookup() below — not directly exposed to anon.
```

### 6.4 Guest lookup — phone + name, plain match (V0)

```sql
-- Matches on normalized phone (digits only) + case-insensitive trimmed name.
-- Single generic failure for "no match" — no distinction from a malformed request (enumeration-safety).
create or replace function public.resolve_guest_by_lookup(p_slug text, p_phone text, p_name text)
returns text  -- returns a new session token on success, raises on failure
security definer set search_path = public
language plpgsql as $$
declare
  v_event_id uuid;
  v_guest_id uuid;
  v_token text;
begin
  select id into v_event_id from public.events where slug = p_slug;
  if v_event_id is null or not public.is_website_gate_open(v_event_id) then
    raise exception 'lookup failed';   -- generic — do not reveal event-not-found vs offline vs no-match
  end if;

  select id into v_guest_id
    from public.event_guests
    where event_id = v_event_id
      and regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
      and lower(trim(name)) = lower(trim(p_name));

  if v_guest_id is null then
    raise exception 'lookup failed';   -- same generic message as above — do not confirm/deny existence
  end if;

  v_token := encode(gen_random_bytes(18), 'base64');  -- ~144 bits, url-safe encoding applied at the app layer
  perform public.create_guest_token(v_event_id, v_guest_id, v_token);
  return v_token;
end; $$;
revoke all on function public.resolve_guest_by_lookup(text, text, text) from public;
grant execute on function public.resolve_guest_by_lookup(text, text, text) to anon;
```

**V0 accepted risk, explicit (not silent):** no OTP verification — a plain phone+name match means anyone who knows (or correctly guesses) a guest's phone number and name can view that guest's tagged sub-events and RSVP on their behalf. This is a real, founder-accepted tradeoff for V0 (§0), not an oversight. It raises rate limiting (§6.7) from "should have" to **load-bearing** — without it, this endpoint is a guest-directory brute-force oracle. **Fast-follow enhancement, not built now:** require OTP verification of the phone number before minting a session token, reusing the Twilio/Supabase phone-OTP infrastructure already live for host auth — this is a drop-in upgrade to this one function, no schema change needed (the `guest_tokens` table and everything downstream of it is unaffected).

### 6.5 Session resolution + RSVP

```sql
-- Called on every subsequent visit with the session cookie's token.
-- Returns the guest's own identity + their tagged sub-events + current RSVP state. No other guest's data reachable.
create or replace function public.resolve_guest_session(p_token text)
returns jsonb
security definer set search_path = public
language plpgsql as $$
declare v_guest_id uuid; v_result jsonb;
begin
  select gt.guest_id into v_guest_id from public.guest_tokens gt
    where gt.token = p_token and (gt.expires_at is null or gt.expires_at > now());
  if v_guest_id is null then raise exception 'invalid session'; end if;

  select jsonb_build_object(
    'guest_name', g.name, 'party_size', g.party_size,
    'sub_events', (
      select jsonb_agg(jsonb_build_object(
        'sub_event_id', se.id, 'name', coalesce(se.custom_name, cst.name), 'date', se.event_date,
        'response_status', ges.response_status, 'plus_one_count', ges.plus_one_count,
        'dietary_notes', ges.dietary_notes
      ))
      from public.event_guest_sub_events ges
      join public.event_sub_events se on se.id = ges.sub_event_id
      left join config.event_sub_types cst on cst.id = se.event_sub_type_id
      where ges.guest_id = v_guest_id
    )
  ) into v_result
  from public.event_guests g where g.id = v_guest_id;

  return v_result;
end; $$;
revoke all on function public.resolve_guest_session(text) from public;
grant execute on function public.resolve_guest_session(text) to anon;

-- Takes token, never guest_id — guest_id is resolved server-side inside the transaction.
create or replace function public.submit_rsvp(
  p_token text, p_sub_event_id uuid,
  p_response_status text, p_plus_one_count integer default null, p_dietary_notes text default null
) returns void
security definer set search_path = public
language plpgsql as $$
declare v_guest_id uuid; v_event_id uuid;
begin
  select gt.guest_id, gt.event_id into v_guest_id, v_event_id from public.guest_tokens gt
    where gt.token = p_token and (gt.expires_at is null or gt.expires_at > now());
  if v_guest_id is null then raise exception 'invalid session'; end if;

  if not exists (select 1 from public.event_guest_sub_events where guest_id = v_guest_id and sub_event_id = p_sub_event_id) then
    raise exception 'guest is not tagged to this sub-event';
  end if;

  update public.event_guest_sub_events
    set response_status = p_response_status, plus_one_count = p_plus_one_count,
        dietary_notes = p_dietary_notes, responded_at = now()
    where guest_id = v_guest_id and sub_event_id = p_sub_event_id;
end; $$;
revoke all on function public.submit_rsvp(text, uuid, text, integer, text) from public;
grant execute on function public.submit_rsvp(text, uuid, text, integer, text) to anon;
```
Per-sub-event only (G7 confirmed, §1/§5.6) — no blanket-response path, since the founder confirmed guests RSVP per sub-event they're tagged to, not once per event.

### 6.6 Public aggregate read RPC

```sql
create or replace function public.get_public_website_payload(p_slug text, p_session_token text default null)
returns jsonb
security definer set search_path = public
language plpgsql as $$
declare v_event_id uuid; v_result jsonb;
begin
  select id into v_event_id from public.events where slug = p_slug;
  if v_event_id is null or not public.is_website_gate_open(v_event_id) then
    return null;   -- single shape for "not found" and "offline" — do not distinguish
  end if;

  select jsonb_build_object(
    'design', (select to_jsonb(d) from public.event_website_design d where d.event_id = v_event_id),
    'public_pages', (
      select jsonb_agg(to_jsonb(p)) from public.event_website_pages p
      join config.website_pages cp on cp.id = p.page_id
      where p.event_id = v_event_id and p.is_visible and cp.tier = 'public'
    ),
    'private_pages', case when p_session_token is not null then (
      -- only returned if the caller is a resolved, valid guest of this event
      select jsonb_agg(to_jsonb(p)) from public.event_website_pages p
      join config.website_pages cp on cp.id = p.page_id
      where p.event_id = v_event_id and p.is_visible and cp.tier = 'private'
        and exists (select 1 from public.guest_tokens gt where gt.token = p_session_token and gt.event_id = v_event_id
                     and (gt.expires_at is null or gt.expires_at > now()))
    ) else null end
    -- gallery intentionally omitted — see §6.2. Added as a versioned addition once Media's signed-URL route exists.
  ) into v_result;
  return v_result;
end; $$;
revoke all on function public.get_public_website_payload(text, text) from public;
grant execute on function public.get_public_website_payload(text, text) to anon;
```
`tier='public'` pages return regardless of session; `tier='private'` pages (and, via `resolve_guest_session`, the guest's own sub-event/RSVP data) only return once the frontend has a valid session token from `resolve_guest_by_lookup()`. This is the mechanism that replaces the password-gate design entirely.

**Implementation note (Backend Engineer, at Wave 2 build time):** the sketch above returns page *metadata* only. The full version needs to also join in each page's actual content, keyed by `config.website_pages.slug`: Story → `event_story_blocks`, Wedding Party → `event_wedding_party_members`, Q&A → `event_qa_items`, Schedule → `event_sub_events`, Venue & Travel → `event_travel_points`/`event_stays`, Registry/Video → `event_website_sections`. Not fully spelled out here to keep this spec's SQL from ballooning — the shape (one jsonb key per page slug, each a typed array from its backing table, filtered by `is_visible`) follows directly from §4.5/§4.6/§5's table definitions.

### 6.7 Rate limiting — load-bearing, not optional

**`resolve_guest_by_lookup` is a brute-force oracle without it** (§6.4) — per-IP and per-event limits are required before this ships, not a nice-to-have. Supabase's built-in throttling or an app-side counter keyed by `(ip, event_slug)`. Not expressible in SQL alone; must be enforced at the edge/middleware layer wrapping this RPC. `submit_rsvp`/`resolve_guest_session` need lighter limits (they require a valid session token already, much smaller attack surface) but should still be covered.

### 6.8 New unauthenticated route family

`resolve_guest_by_lookup`/`resolve_guest_session`/`submit_rsvp`/`get_public_website_payload` are called from a **new route family with no `getUser()` check** — unlike every existing route under `app/api/events/[id]/*`. Proposed shape: `app/api/e/[slug]/*` (e.g. `lookup`, `session`, `rsvp`), keyed by `events.slug` (§5.4), not `event_id`. The lookup route sets the session token as a signed httpOnly cookie on success; subsequent routes read the cookie, don't require the client to manage the token directly. This is genuinely new surface for this codebase and should be built as its own reviewed slice.

---

## 7. Seed data (blocks G12/G5 usability, not schema)

- `config.invitation_card_styles`/`config.invitation_templates` seed data (G12: 6 styles, 18 templates from `card-templates.html`) — **moved to Digital Invitations' own backlog item**, cross-referenced from here. This spec only records the "reuse the same catalog" decision (§1).
- `config.website_templates`/`website_palettes`/`website_fonts` — seed once the final template lineup is locked (build-plan §0).
- `config.website_pages` — seed the 10-page spine, `is_removable=false` on home/rsvp.
- `config.website_section_types` — seed the 11 types from `edit-page.js`.

---

## 8. Compliance check against `DATA-MODEL.md` conventions

- ✅ Module tables FK only to `public.events`/`auth.users` (core) or `config.*` — the one prior exception (`guest_tokens.guest_id → event_guests`) is **resolved by dropping the FK** (§6.3), not by requesting a new sanctioned exception. No open rule-7 violation remains.
- ✅ Naming: plural, `snake_case`, module-prefixed, catalogs drop template/master suffixes.
- ✅ 1:1 sidecar pattern for `event_website_design` (FK is the PK).
- ✅ `updated_at` via the shared `set_updated_at()` trigger.
- ✅ Denormalized `event_id` columns now paired with guard triggers, matching the 5 existing precedents.
- ✅ Catalogs use uuid PK + unique slug, matching all 10 existing catalogs (was a deviation in the original draft, now fixed).
- ✅ `anon` grants are scoped via a `SECURITY DEFINER` boolean gate function, never a direct policy on a table holding secrets (`event_website_settings.website_password_hash`) or mixed private/public rows (`event_media`, explicitly excluded per D35).

---

## 9. Build order

Each wave ships RLS in the same migration batch as its tables — no gap.

**Wave 1:**
1. Catalogs (`website_fonts` → `website_palettes` → `website_templates` → `website_pages` → `website_section_types`) + owner-read RLS + seed data.
2. `event_website_design` + owner RLS + seed-function extension.
3. `event_website_pages` + `event_website_sections` (+ guard trigger) + owner RLS.
4. `event_story_blocks` + `event_wedding_party_members` + `event_qa_items` + owner RLS (§4.5 — no guard trigger needed, direct FK to `events`).
5. `event_travel_points` + `event_stays` (+ `map_link` ALTERs) + owner RLS.
6. `events.slug` + generator.
7. `event_guest_sub_events` response columns + `dietary_notes` + `unique(guest_id, sub_event_id)` (G7 confirmed).
8. Wave 1 host-preview view (`event_website_summary`).

**Wave 2 (separate council checkpoint before this batch):**
8. `is_website_gate_open()` + `anon` read policies on the `config.website_*` catalogs only (no raw `anon` policy on any live table — see §6.2).
9. `guest_tokens` (no FK) + `create_guest_token`/`resolve_guest_by_lookup`/`resolve_guest_session`/`submit_rsvp` + rate limiting (§6.7).
10. `get_public_website_payload()`.
11. New `app/api/e/[slug]/*` unauthenticated route family (app-layer, not a migration) — `lookup`, `session`, `rsvp` routes + signed httpOnly session cookie.

---

## 10. `DATA-MODEL.md` decision-log entry to add on merge

```
D<next> — 2026-07-30 — guest_tokens has no FK to event_guests, unlike a typical child table.
Guest personalization for the public event website (Digital Presence) needs a token → guest
mapping, but a direct guest_tokens.guest_id → event_guests(id) FK would violate rule 7 (module
tables FK only to core/config, never another module's tables) — the same shape D23 already
rejected for event_task_assignees → event_collaborators. Resolution: guest_id is a plain
uuid column, application-validated at write time by create_guest_token() (SECURITY DEFINER,
confirms the guest belongs to the event before inserting), never enforced as a standing FK.
All reads/writes go through resolve_guest_by_lookup() / resolve_guest_session() / submit_rsvp()
(also SECURITY DEFINER, scoped to one guest's own fields). Guest access itself is a self-serve
phone+name lookup (plain match for V0, OTP verification deferred as a fast-follow), not a
host-generated link or shared site password — session persistence is a cookie backed by this
same guest_tokens table, just created by a successful lookup instead of pre-generated. This
keeps Guest Management's module boundary intact while letting Digital Presence personalize the
public site. Second sanctioned instance of the no-cross-module-FK pattern, alongside D23.
```

---

## 11. Next step

Wave 1 is **live** (migrations `website_01`–`website_11`, applied 2026-07-30, `get_advisors` clean). Wave 2's design (guest lookup mechanism, session persistence, G7) went through its own dedicated council pass on 2026-07-30 — see §12 below. **Verdict: 🔴 RE-PLAN.** §6 needs a revision pass addressing every finding in §12 before any Wave 2 migration is authored. This is the next session's starting point.

---

## 12. Wave 2 council verdict (2026-07-30, fresh review post-redesign)

**Mode:** plan · **Roster:** Tech Lead, Data Modeller, Security Expert, Backend Engineer · **Artifact:** §6 (as redesigned around phone+name self-lookup, cookie session, per-sub-event RSVP) · **Phases:** Critique only — Phase 1 findings converged with no direct contradictions, so debate/arbiter were skipped as low-value (nothing contested).

### 🔴 Critical — must fix before Wave 2 migrates
1. **Rate limiting is structurally unenforceable as designed** — `anon` gets direct `EXECUTE` on `resolve_guest_by_lookup`, so PostgREST exposes it at `/rest/v1/rpc/...` regardless of any Next.js middleware wrapping it. "Supabase's built-in throttling" doesn't cover custom RPCs. This isn't a sequencing gap, it's a structural one — the DB grant and the app-layer limiter are two independently-bypassable things. *Security Expert, reinforced by Tech Lead's release-order framing of the same root cause.*
2. **`get_public_website_payload` has no route at all** in §6.8's sketch — only 3 of the 4 Wave 2 functions got one. *Backend Engineer.*
3. ~~Duplicate `UNIQUE` constraint already shipped to the live DB~~ — **fixed**, `website_11` dropped the redundant constraint. Caught during this review, resolved same session. *Data Modeller.*
4. **§6.2's "new" anon catalog policy does nothing** — Wave 1 already granted unconditional `anon`+`authenticated` SELECT on `config.website_*`; adding an `enabled=true`-scoped policy on top is a no-op unless the old one is explicitly dropped (RLS policies OR together). *Data Modeller.*

### 🟡 Important
- `submit_rsvp` has no independent cross-event check — currently safe only as an uncited side effect of a Wave 1 guard trigger on a *different* table. *Security Expert.*
- Rate-limiting's threat-model framing is off — it stops brute-force campaigns, not one targeted lookup (realistic risk for a small guest list + commonplace reverse-phone-lookup in India). *Security Expert.*
- `(ip, event_slug)` rate-limit key has no per-event ceiling — defeated by IP rotation. *Security Expert.*
- `resolve_guest_by_lookup` has no `LIMIT 1` — a phone+name collision throws an unhandled multi-row error instead of the intended generic failure. *Data Modeller.*
- Private-page load composition unspecified — `resolve_guest_session` + `get_public_website_payload` both needed, no stated composition. *Backend Engineer.*
- Inconsistent bad-token handling — one raises, the other silently returns `null` for the same condition. *Backend Engineer.*
- §5.6's "on conflict upsert" prose doesn't match `submit_rsvp`'s actual plain-`UPDATE` code. *Backend Engineer.*
- Wave 2 may deserve a sub-split — 2a (public payload, no identity risk) vs. 2b (lookup/session/RSVP, the actual enumeration surface). *Tech Lead.*
- `get_public_website_payload`'s real per-page-type joins are deferred to a "follows directly from..." note despite being the sole anon-exposed render path. *Tech Lead.*

### 💡 Suggestions
Timing side-channel leaks event existence · `submit_rsvp` breaks the single-generic-error convention elsewhere in the spec · no index on the phone-lookup predicate · `guest_tokens` guard-trigger claimed in §0 changelog but not actually in §6.3's SQL · §9 build-order step numbers collide between waves.

### Verdict
🔴 **RE-PLAN.** Wave 2 needs another revision pass before migration — same as Wave 1's first draft did.

### What next session should do
1. Revise §6 addressing all 4 critical + 9 important findings above (mirror how §0's changelog documented the Wave 1 fix pass).
2. Decide on the 2a/2b sub-split suggestion before rewriting — it changes how much of §6 gets touched.
3. Re-run `/council plan` on the revised §6 (lighter confirm-the-fixes pass, not full re-critique — same pattern as Wave 1's second pass).
4. Only then author and apply the Wave 2 migration(s).
