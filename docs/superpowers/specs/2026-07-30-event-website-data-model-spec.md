# Event Website (Digital Presence) — Data Model Spec

> **Status:** **Wave 1, Wave 2a, AND Wave 2b are all LIVE** on the dev DB (`smjkbmkxweevqpvygabe`) — the entire Event Website / Digital Presence DB layer is now shipped. Wave 1: `website_01`–`website_11` (2026-07-30). Wave 2a: `website_12`–`website_16` (2026-07-31, public payload — no guest identity). Wave 2b: `website_17`–`website_20` (2026-07-31, guest lookup/session/RSVP — the actual `anon`-identity surface). `get_advisors` (security) clean throughout, after two same-session fixes caught only by applying migrations and checking live state — not by any of the 4 council rounds — see [§16](#16-wave-2a--live-2026-07-31-and-one-finding-no-council-round-caught) (a `revoke` that silently didn't revoke) and [§17](#17-wave-2b--live-2026-07-31-and-a-second-live-only-finding) (a `pgcrypto` call that wouldn't have resolved at runtime). TypeScript types regenerated. See [`DATA-MODEL.md` D49–D51](../../data-model/DATA-MODEL.md#decision-log) for the canonical record. **Remaining work is app-layer only** — the `app/api/e/[slug]/*` route family — plus two founder decisions still open (§17's closing section).
>
> **Council reviewed four times before any Wave 2 migration, same 4-agent roster throughout (Tech Lead, Data Modeller, Security Expert, Backend Engineer):** 2026-07-30, Wave 1's original single-pass draft (verdict 🔴 RE-PLAN, fixed via [§0 Changelog](#0-changelog-from-council-review), now live). 2026-07-30, Wave 2's redesigned §6 (verdict 🔴 RE-PLAN — see [§12](#12-wave-2-council-verdict-2026-07-30-fresh-review-post-redesign)), fixed via [§13 Changelog](#13-wave-2-revision-changelog-addressing-12-findings). 2026-07-31, first confirm-the-fixes pass on §13 — every §13 fix verified correct, but 3 new critical + several important findings turned up in the new material itself; fixed via [§14 Changelog](#14-confirm-the-fixes-council-pass-2026-07-31--new-findings-and-the-fixes-applied). 2026-07-31, second confirm-the-fixes pass on §14 — both criticals confirmed CLOSED, one new important + minor doc gaps found and fixed; see [§15](#15-second-confirm-the-fixes-pass-2026-07-31--both-criticals-closed-one-new-important-fixed). Founder then approved proceeding straight to Wave 2a's migration — see §16 for what shipped and the one gap that only live application surfaced.
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
| Guard trigger added for the denormalized `event_id` on `event_website_sections` | Data Modeller: every existing denormalized-`event_id` table in the live schema pairs it with a guard trigger deriving `event_id` from the parent row. Missing here would let a mismatched `event_id` slip past RLS. Tech Lead: this is a **Wave 1** blocker (silent cross-event corruption risk even under owner-only RLS), not a Wave 2 concern. (`guest_tokens`, also denormalized-`event_id`, is a **Wave 2** table — see §13 for why it's validated at insert time instead of via trigger, not a Wave 1 item; an earlier draft of this row incorrectly bundled it in here.) |
| `config.website_pages`/`website_section_types`/`website_fonts` changed from `slug text primary key` to `id uuid primary key` + `slug text unique` | Data Modeller: original rationale cited `config.task_priorities` as precedent for a text PK — that table actually has a uuid PK. All 10 existing catalogs use uuid PK + unique slug; no precedent for the deviation. |
| Explicit Zod-validation requirement added for `event_website_sections.data` (11 discriminated schemas) | Backend Engineer: jsonb with no enforced shape and no assigned schema owner. |
| Aggregate read RPC (`get_public_website_payload`) added, explicitly scoped to Wave 1 tables (no gallery) | Backend Engineer + Tech Lead: avoids 4-6 round trips per public page load; must not silently join a table that's been pulled from the anon surface. |
| New unauthenticated route family explicitly named | Backend Engineer: `resolve_guest_token`/`submit_rsvp` need a route family with no `getUser()` check — a first for this codebase, must be scoped, not discovered mid-build. |
| Token entropy + rate limiting made hard requirements, not prose suggestions | Security Expert: `guest_tokens` was `text unique` with entropy only "e.g. nanoid(24)" in prose, no rate limiting anywhere. |
| PII-in-jsonb risk documented explicitly (not schema-fixable) | Security Expert: free-text section types (Wedding Party, Q&A) are a real, permanent public-PII leak path once the site is anon-readable by design. |
| Build order fixed — RLS ships in the same migration batch as its table | Tech Lead: original order deferred RLS to step 8 of 9, a 7-batch window with unprotected tables, unlike every prior module. |
| G12 (card-templates catalog seed data) moved out to Digital Invitations' own backlog | Tech Lead: module-boundary blur — the *decision* to reuse `config.invitation_templates` stays here, the seed-data execution doesn't. |
| Missing indexes, `created_by`/`updated_by`, explicit `on delete restrict` added to `event_travel_points`/`event_stays` and new catalog FKs | Data Modeller, suggestion-severity, folded in since they're free. |

**Post-council founder input (2026-07-30, after the revision above):** the "password gate" framing in the original council pass was wrong — Abhijith clarified the actual guest-facing access model is **self-serve guest lookup**, not a shared password. A guest enters their phone number + name on the public site; the system matches them against `event_guests`/`event_guest_sub_events`, shows them only the sub-events they're tagged to, and lets them RSVP per sub-event (confirming **G7 = per-sub-event response is needed**, not blanket). This replaces §6's original token-link/password design. See revised §1 and §6 below — Wave 2's RPCs are rewritten around this lookup flow. OTP verification of the phone number was considered and explicitly deferred to a fast-follow enhancement (reusing the Twilio/Supabase phone-OTP infra already live for host auth); V0 ships with a plain phone+name match, which raises the enumeration-risk bar on rate limiting (§6b.3) from "important" to load-bearing for V0's actual security posture.

**Further founder input, same session:** `website_password_enabled` (existing column) repurposed as a second pre-launch visibility toggle alongside `site_offline`, not an actual password mechanism — `website_password_hash` stays unused (§6a.1). Separately, Story/Wedding-Party/Q&A (G11) each get a dedicated typed table (§4.5 — `event_story_blocks`, `event_wedding_party_members`, `event_qa_items`) instead of the generic `event_website_sections` jsonb blob, matching the `event_travel_points`/`event_stays` pattern. `event_website_sections` narrows to backing only Registry, Video, and host-added free-form extras.

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
| **Guest session persistence** | **Signed session cookie** after a successful lookup — guest doesn't re-enter phone/name on repeat visits. Implemented via the same `guest_tokens` table originally designed for a link-based model, just created by a successful *lookup* instead of a host-generated link (§6b.1). |
| G7 (was open, now resolved) | **Per-sub-event RSVP response is needed** — a guest can say yes to the sangeet, no to the reception. Confirmed by the founder alongside the lookup-flow answer. `event_guest_sub_events.response_status`/`plus_one_count`/`dietary_notes`/`responded_at` (§5.6) are wired from day one, not left unused. |

**Still open, not schema-blocking (flagged for product/founder call, defaults proposed):**

| # | Question | Proposed default |
|---|---|---|
| G10 | "Travel & Stay" own Settings sub-page, or Website host-editor only? | New Settings sub-page, standard pattern. |
| G11 (UI-placement half still open) | Story/Wedding-Party/Q&A content: Edit-Pages editor or Event Settings? | Edit-Pages owns it (tracker's own recommendation). **Schema half resolved 2026-07-30** — each gets its own dedicated table (§4.5), not the generic `event_website_sections` jsonb. |
| **`website_password_enabled`** (resolved, founder input 2026-07-30) | **Repurposed as a second host-controlled pre-launch visibility toggle** — not a password/secret gate. Same semantic category as `site_offline` ("is the site publicly reachable yet"), just a second independent switch the host can flip. `website_password_hash` is **unused/vestigial** — no password verification logic is built; nothing ever reads or writes it in Wave 2. `is_website_gate_open()` (§6a.1) checks both flags. |
| **Page tier for Story and Q&A** (flagged 2026-07-31, §14 — council caught this was never pinned down) — **RESOLVED 2026-08-02** | **Founder-confirmed: Story = `public`, Q&A = `private`.** Rationale: a couple's "Our Story" is typically written to be shared broadly (often posted publicly elsewhere), so public-tier exposure isn't a new risk; Q&A commonly answers logistics questions (dress code, parking, gift preferences) that skew more event-specific/less meant for open sharing, so it stays private alongside Wedding Party. `config.website_pages` was seeded with `story` defaulted to `private` (the pre-decision fallback) — flipped live to `public` via `website_22` (`qa` already matched at `private`, no change needed). |
| **`events.slug` generation strategy** (G13, flagged in Wave 2 handoff doc) — **RESOLVED 2026-08-02** | **Founder-confirmed: auto-generate on event create**, format = slugify(name) + wedding date (`YYYYMMDD`), random-suffix fallback only on collision, one-time backfill for pre-existing events. Shipped as `generate_event_slug()` + `create_event_with_details` wiring + backfill (`website_21`, DATA-MODEL.md D52). All 19 existing events now have a slug; unblocks `/api/e/[slug]/*` testing. |

---

## 2. What this spec does NOT cover

- The guest-site template *build* itself (React port, `app/e/[slug]/`) — `designs/_plans/guest-website-templates-build-plan.md`, untouched.
- Licensing resolution for theme-derived assets.
- RSVP submission UX, unlock-gate UX — app-layer.
- Media & Memories' upload endpoint / signed-URL public route — that module's own backlog; this spec depends on it for Wave 2's gallery page (§6) but does not build it.

---

## 3. Build phasing — Wave 1 / Wave 2

**Wave 1 — Host editor foundation.** Everything the host needs to design and preview their site. Owner-only RLS throughout (same posture as every module shipped so far — Planning, Guests, Media, Invitations, Event Settings). No `anon` grants. Resolves G1, G5, G9's host-editor half.

**Wave 2 — Public site + guest personalization.** The actual public `/e/[slug]` surface: `anon` read access, guest tokens, RSVP submission. Resolves G2, G3, G6, G9's guest-facing half. Split into two migration batches per the Wave 2 council's Tech Lead suggestion (§13):

- **Wave 2a — public payload, no identity risk.** The gate function, the (corrected) catalog anon-read policies, and the public-pages half of `get_public_website_payload`. No guest-identifying data, no enumeration surface — same risk class as what Wave 1 already shipped (see correction below).
- **Wave 2b — guest lookup, session, RSVP.** `guest_tokens`, the rate-limit table, `resolve_guest_by_lookup`/`resolve_guest_session`/`submit_rsvp`, and the private-pages half of the payload RPC. This is the actual enumeration-risk surface and is where the council's critical findings concentrate — it gets the harder review.

**Correction to the original framing:** this spec previously called Wave 2 "the codebase's first `anon` RLS surface." That's no longer accurate — Wave 1's catalog tables (§4.1) already shipped `anon`+`authenticated` SELECT on the live DB (verified 2026-07-31: `read_website_*` policies on all 5 `config.website_*` tables grant `{anon,authenticated}`, `qual: true`). It's low-risk reference data, not a defect, but the claim was wrong and it's what caused §6a.2's original no-op (§13, critical #4). Wave 2b remains the first surface exposing guest-identifying/PII-adjacent data to `anon` — that framing is what actually matters and stays true.

Each wave ships RLS in the same migration batch as its tables — no cross-wave gap where a table exists without a policy. **One stated exception (§14):** Wave 2a's migration includes an `ALTER POLICY` tightening two Wave-1 catalog policies (§6a.2) — this touches Wave-1-owned RLS from a Wave-2 batch, but only because Wave 2 is what surfaced the no-op; it isn't new table/policy surface, just a correction to existing surface, and doesn't reopen Wave 1 for other changes.

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
Matches the `event_hub_summary` convention already established for the Event Hub module. This is the **authenticated host-preview** read — the Wave 2 public equivalent (§6a.4 `get_public_website_payload`) is a separate, anon-safe RPC, not this view.

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
Confirmed by the founder as a real requirement (guest RSVPs per sub-event, not once per event) — these columns are wired from day one in Wave 2's `submit_rsvp`, not left unused. `dietary_notes` added here (council fix — Backend Engineer flagged the original RPC referenced a column with no home). **Live and correct as of 2026-07-31:** the `unique(guest_id, sub_event_id)` constraint is already on the DB. `submit_rsvp` (§6b.4) is a plain `UPDATE`, not an `on conflict` upsert — the row always pre-exists because Guest Management creates it when the guest is tagged to the sub-event, before the website's `submit_rsvp` ever runs. An earlier draft of this line described it as backing an upsert; corrected (§13, important).

---

## 6. Wave 2 — Public site + guest personalization

**Ships as two migration batches (2a, 2b) + its own council checkpoint**, after Wave 1 is live. **Redesigned post-council** around the founder's clarification (§0): access is **guest self-lookup by phone+name**, not a shared site password. Revised again after the Wave 2 council's RE-PLAN verdict (§12) — see §13 for the full list of what changed and why. `anon` never gets a direct `SELECT` grant on any table holding guest-identifying or PII-adjacent data — only `EXECUTE` on the `SECURITY DEFINER` functions below, each scoped to exactly what it needs.

The 2a/2b split (Tech Lead suggestion, §12, adopted in §13) is enforced at the SQL dependency level, not just organizationally: `get_public_website_payload` (2a) takes no session-token parameter at all and has zero dependency on `guest_tokens` — it structurally cannot touch guest identity, now or later. Everything that can — `guest_tokens`, the rate-limit ledger, lookup/session/RSVP — lives in 2b.

### 6a. Wave 2a — public payload (no identity risk)

#### 6a.1 Gate function — site-wide reachability only

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
Returns a boolean only — never the row, never `website_password_hash`. Scope: **"is the site published at all"** — two independent host-controlled toggles (`site_offline`, `website_password_enabled`), both must be off for the site to be publicly reachable (§1, resolved). Despite its name, `website_password_enabled` is **not a password/secret gate** — no password verification logic exists in Wave 2; it's a second pre-launch visibility switch, same category as `site_offline`. `website_password_hash` stays unused/vestigial — never read or written here. The actual privacy mechanism for `tier='private'` content is guest identification (§6b), not a shared password.

**Accepted residual risk (suggestion-level, §13 and reconfirmed §14):** this function short-circuits on `v_event_id is null`, so "event doesn't exist" (one query) and "event exists but is offline" (two queries) are a **structural** code-path difference, not a subtle statistical signal requiring many samples. Still accepted as-is — the only information disclosed is "does a slug exist," which is low-value for a wedding-guestlist app at this scale — but described accurately here rather than downplayed as merely theoretical.

#### 6a.2 Catalog anon-read — fixing the Wave 1 no-op

**Wave 1 already granted `anon`+`authenticated` SELECT unconditionally** on all 5 `config.website_*` tables (verified live, 2026-07-31: policies `read_website_templates`/`read_website_palettes`/`read_website_fonts`/`read_website_pages`/`read_website_section_types`, roles `{anon,authenticated}`, `qual: true`). The original Wave 2 draft added a second, narrower `enabled = true`-scoped policy on top — a no-op, since Postgres RLS policies for the same command are OR'd together, so the pre-existing unconditional `true` policy already permits everything the new one would restrict (§12 critical #4). Fix: tighten the existing policy in place instead of adding a redundant one.

```sql
alter policy "read_website_templates" on config.website_templates using (enabled = true);
alter policy "read_website_palettes" on config.website_palettes using (enabled = true);
alter policy "read_website_fonts" on config.website_fonts using (enabled = true);
alter policy "read_website_pages" on config.website_pages using (enabled = true);
alter policy "read_website_section_types" on config.website_section_types using (enabled = true);
```

**No other table gets a direct `anon` SELECT policy.** All public/guest reads go through the RPCs below, each of which does its own tier/session check internally — this makes the "tier not modeled in RLS" class of bug (Security Expert's original finding) structurally impossible, since anon has no table-level read path to bypass.

**`event_media`/`event_albums` (Gallery) stays out of Wave 2 entirely — see D35 in `DATA-MODEL.md`.** Ships in a later, separate slice once Media & Memories builds the signed-URL public route D35 already specifies, or that decision is explicitly revisited and superseded with a new dated entry.

#### 6a.3 Shared page-content helper (internal, not exposed)

**Spelled out in full (§12 important: "sole anon-exposed render path deferred to a hand-wave")** — both the public and guest payload RPCs need the same per-page-slug content join, so it's factored into one internal helper rather than duplicated. **Every branch is an explicit `jsonb_build_object` allow-list, not `to_jsonb(row)`** (§14, fixing §12's important finding: wildcard serialization leaked `created_by`/`updated_by` host UUIDs and would've auto-exposed any future column added to these tables with zero review gate). The schedule branch also now excludes cancelled sub-events, matching the existing `event_hub_summary` convention (`status != 'cancelled'`, per D39/`event_hub_summary` in `DATA-MODEL.md`) — the prior version didn't filter status at all, an unrelated gap caught while rewriting this block:

```sql
-- Internal only. Revoked from public entirely — reachable exclusively through the two SECURITY
-- DEFINER wrappers below, which still call it successfully because SECURITY DEFINER functions run
-- as their owner, and revoking from `public` doesn't revoke from the owner.
create or replace function public._website_page_content(p_event_id uuid, p_tier text)
returns jsonb
security definer set search_path = public
language sql stable as $$
  select coalesce(jsonb_agg(page_obj order by ewp.display_order), '[]'::jsonb)
  from public.event_website_pages ewp
  join config.website_pages cp on cp.id = ewp.page_id
  cross join lateral (
    select jsonb_build_object(
      'page_id', ewp.page_id,
      'slug', cp.slug,
      'name', coalesce(ewp.custom_title, cp.name),
      'tier', cp.tier,
      'display_order', ewp.display_order,
      'content', case cp.slug
        when 'story' then (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', b.id, 'block_type', b.block_type, 'heading', b.heading, 'body', b.body,
            'twocol', b.twocol, 'photo_key', b.photo_key, 'display_order', b.display_order
          ) order by b.display_order), '[]'::jsonb)
          from public.event_story_blocks b where b.event_id = p_event_id and b.is_visible)
        when 'wedding-party' then (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', m.id, 'name', m.name, 'relation', m.relation, 'side', m.side,
            'photo_key', m.photo_key, 'display_order', m.display_order
          ) order by m.side, m.display_order), '[]'::jsonb)
          from public.event_wedding_party_members m where m.event_id = p_event_id and m.is_visible)
        when 'qa' then (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', q.id, 'question', q.question, 'answer', q.answer, 'display_order', q.display_order
          ) order by q.display_order), '[]'::jsonb)
          from public.event_qa_items q where q.event_id = p_event_id and q.is_visible)
        when 'schedule' then (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', se.id, 'event_sub_type_id', se.event_sub_type_id, 'custom_name', se.custom_name,
            'event_date', se.event_date, 'start_time', se.start_time, 'end_time', se.end_time,
            'venue', se.venue, 'display_order', se.display_order
          ) order by se.event_date), '[]'::jsonb)
          from public.event_sub_events se
          where se.event_id = p_event_id and se.show_on_website and se.status != 'cancelled')
        when 'venue-travel' then (
          jsonb_build_object(
            'travel_points', (select coalesce(jsonb_agg(jsonb_build_object(
                'id', tp.id, 'kind', tp.kind, 'name', tp.name, 'distance_text', tp.distance_text,
                'travel_time_text', tp.travel_time_text, 'map_link', tp.map_link, 'note', tp.note,
                'display_order', tp.display_order
              ) order by tp.display_order), '[]'::jsonb)
              from public.event_travel_points tp where tp.event_id = p_event_id),
            'stays', (select coalesce(jsonb_agg(jsonb_build_object(
                'id', s.id, 'name', s.name, 'address', s.address, 'distance_text', s.distance_text,
                'price_band', s.price_band, 'booking_url', s.booking_url, 'phone', s.phone,
                'map_link', s.map_link, 'note', s.note, 'display_order', s.display_order
              ) order by s.display_order), '[]'::jsonb)
              from public.event_stays s where s.event_id = p_event_id)))
        when 'rsvp' then '[]'::jsonb   -- static form; the guest's own RSVP state comes from resolve_guest_session (§6b), not here
        when 'gallery' then '[]'::jsonb   -- deferred, D35 — no anon backing yet (§6a.2)
        else (
          -- registry, video, and any host-added free-form sections on any page
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', s.id, 'section_type_id', s.section_type_id, 'data', s.data, 'display_order', s.display_order
          ) order by s.display_order), '[]'::jsonb)
          from public.event_website_sections s where s.page_id = ewp.id and s.is_visible)
      end
    ) as page_obj
  ) x
  where ewp.event_id = p_event_id and ewp.is_visible and cp.tier = p_tier;
$$;
revoke all on function public._website_page_content(uuid, text) from public, anon, authenticated;
-- Explicit anon/authenticated, not just public (§16) — see the note on create_guest_token's revoke
-- in §6b.1 for why "from public" alone isn't sufficient on this project.
```

#### 6a.4 Public payload RPC — no session parameter, no `guest_tokens` dependency

```sql
create or replace function public.get_public_website_payload(p_slug text)
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
    'design', (
      select jsonb_build_object(
        'template_id', d.template_id, 'palette_id', d.palette_id,
        'heading_font_id', d.heading_font_id, 'body_font_id', d.body_font_id,
        'cover_image_key', d.cover_image_key, 'og_image_key', d.og_image_key
      ) from public.event_website_design d where d.event_id = v_event_id
    ),   -- explicit allow-list (§14) — excludes user_id/updated_by, the host's own auth.users UUIDs
    'pages', public._website_page_content(v_event_id, 'public')
  ) into v_result;
  return v_result;
end; $$;
revoke all on function public.get_public_website_payload(text) from public;
grant execute on function public.get_public_website_payload(text) to anon, authenticated;
```
Ships in **2a**. No token parameter to accept means no code path here can ever touch guest identity — the wave boundary is enforced by the function signature, not just by build-order discipline. Granted to `authenticated` as well as `anon` (§14, fixing §12's grant-gap finding) — see §6b.6 for why this matters and why it's granted to both on every Wave 2 RPC.

### 6b. Wave 2b — guest lookup, session, RSVP (the actual enumeration surface)

#### 6b.1 `public.guest_tokens` (G6) — session created by lookup, not a host-generated link

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
-- Only the SECURITY DEFINER functions below (running as their owner) touch this table.
```

**Why no FK to `event_guests`:** arbiter-ruled (§10) — a direct `guest_tokens.guest_id → event_guests(id)` FK would violate the "module tables FK only to core/config" rule, same shape D23 already rejected for a different module pair. `guest_id` is a plain column, validated at write time by `create_guest_token()` below, never a standing referential constraint. **No guard trigger either** — unlike `event_website_sections.event_id` (§4.4), which derives from a parent row and needs a trigger to stay honest, `guest_tokens` has no client-writable path at all (RLS denies every role outright); the only insert path is `create_guest_token()`, which validates the guest/event pair inline before inserting. A trigger would be redundant enforcement of the same invariant the function already guarantees. (An earlier version of §0's changelog table incorrectly implied a guard trigger existed here — corrected.)

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
revoke all on function public.create_guest_token(uuid, uuid, text, timestamptz) from public, anon, authenticated;
-- Internal helper, called only from resolve_guest_by_lookup() below — not directly exposed to anon.
-- Explicit anon/authenticated in the revoke, not just public (§16 — Wave 2a's migration discovered
-- that Supabase grants EXECUTE on new public-schema functions directly to anon/authenticated via
-- default privileges, not via the PUBLIC pseudo-role, so "revoke ... from public" alone leaves them
-- callable. Caught live when _website_page_content was accidentally anon-callable post-migration —
-- fixed there, applied preemptively here so create_guest_token doesn't repeat it at Wave 2b build time.
```

#### 6b.2 Rate-limit ledger — structural, not app-layer (§12 critical #1)

**The original design put rate limiting in Next.js middleware wrapping the route.** That's bypassable by design: `anon` has direct `EXECUTE` on `resolve_guest_by_lookup`, so PostgREST serves it at `/rest/v1/rpc/resolve_guest_by_lookup` regardless of what any app route does — a caller who skips the app entirely and hits PostgREST directly is never rate-limited. Fix: enforce inside the function itself, against a ledger table, so the grant and the limiter are the same trust boundary instead of two independently-bypassable ones.

```sql
-- bigint identity PK, not uuid, deliberately: this table is an append-only, high-write, short-retention
-- ledger with nothing ever FK-referencing into it — no cross-module identity concern uuid otherwise
-- exists to solve here. Every other table in this spec uses uuid because something references it or
-- it's client-addressable; this one is neither (§14, documenting a suggestion-level finding).
create table public.guest_lookup_attempts (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  ip_hash text not null,   -- sha256(first hop of x-forwarded-for) — never the raw IP, see §6b.3
  attempted_at timestamptz not null default now()
);
create index idx_guest_lookup_attempts_scope on public.guest_lookup_attempts(event_id, ip_hash, attempted_at);
create index idx_guest_lookup_attempts_event on public.guest_lookup_attempts(event_id, attempted_at);
alter table public.guest_lookup_attempts enable row level security;
-- Zero policies for every role, including authenticated — default-deny for everyone, no exceptions.
-- This is stronger than "scoped to the event owner": a host can't read even their own event's attempt
-- log (it's an audit trail of phone/name guesses, including failed ones — real PII fragments belonging
-- to whoever tried the lookup, not the host). Confirmed in debate (§14) that nothing bypasses this —
-- SECURITY DEFINER functions read/write it as the owner regardless of RLS, but no client-facing role
-- (anon, authenticated, or otherwise) has a policy path to it at all.
```
**Not schema-blocking, noted so it isn't lost:** this ledger grows forever without a prune step — a daily cron (`delete from public.guest_lookup_attempts where attempted_at < now() - interval '1 day'`) is an app-layer/ops task at Wave 2b build time, not a migration requirement.

#### 6b.3 Guest lookup — phone + name, plain match (V0), rate-limited inline and atomically

**Two fixes to the rate-limit logic itself, both from §14 (confirm-the-fixes pass caught these — not in the original §12 list):**

1. **IP-hash was hashing the entire raw `x-forwarded-for` header, not one trusted hop** — a caller could vary the string per request (e.g. by prepending fake hops) and get a fresh identity every time, making the per-IP ceiling a no-op regardless of what Supabase's gateway does upstream. Fixed below by taking only the first comma-separated value. **This does not fully resolve the deeper question of whether that first value is itself trustworthy** — that depends on whether Supabase's Kong gateway overwrites/sanitizes `x-forwarded-for` for untrusted connections or passes a client-supplied value through untouched, which needs live verification against the actual project's gateway config at Wave 2b build time (not something a spec can settle by itself). **Decision tree, stated explicitly instead of left open:** if build-time testing shows the first hop is trustworthy, ship as-is. If it isn't, switch to computing the IP in the trusted Next.js/Vercel layer (Vercel's edge reliably sets `x-forwarded-for`/`x-real-ip` from the actual TCP connection) and pass it as an explicit `p_ip_hash` parameter instead of reading `request.headers` — accepting the tradeoff that a caller hitting PostgREST directly (bypassing the Next.js route) could then claim any IP they want, degrading the per-IP ceiling to a no-op for that bypass path specifically. **Either way, the per-event ceiling (§14 point 2 below) is identity-independent and holds regardless of which IP-trust outcome build-time testing finds** — it's the backstop, not a nice-to-have.
2. **The check-then-insert wasn't atomic** — under READ COMMITTED, concurrent calls could all pass both count checks before any of their inserts committed, letting a burst of concurrent requests sail past both thresholds in one shot (no header-spoofing needed at all). Fixed below with `pg_advisory_xact_lock`, serializing the whole check-and-insert per event for the duration of the transaction. A per-`(event_id, ip_hash)` lock was considered instead but rejected — it wouldn't serialize the per-event ceiling check across different IPs, leaving that ceiling still racy. Locking on `event_id` alone closes both ceilings at once; the guest-lookup RPC is a single small transaction, so serializing it per event has no meaningful throughput cost at this app's realistic concurrency (a wedding guest list, not a flash sale).

```sql
create index idx_event_guests_phone_normalized on public.event_guests (event_id, (regexp_replace(phone, '\D', '', 'g')));

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
  v_ip_hash text;
  v_ip_attempts int;
  v_event_attempts int;
begin
  select id into v_event_id from public.events where slug = p_slug;
  if v_event_id is null or not public.is_website_gate_open(v_event_id) then
    raise exception 'lookup failed';   -- generic — do not reveal event-not-found vs offline vs no-match
  end if;

  -- First hop only, not the whole header (§14 fix #1 above). extensions.digest — schema-qualified,
  -- not bare digest() — because this function's search_path is 'public' only and pgcrypto lives in
  -- the extensions schema (§17: confirmed live that bare digest() raises "function does not exist"
  -- under search_path=public; caught by actually running it, not by reading the SQL).
  v_ip_hash := encode(extensions.digest(trim(split_part(
    coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'), ',', 1
  )), 'sha256'), 'hex');

  -- Serializes the check-and-insert below, per event, for this transaction's duration — closes the
  -- TOCTOU race (§14 fix #2) for both ceilings at once. Non-blocking (_try_): a concurrent request
  -- for the SAME event that can't acquire the lock immediately fails fast into the existing
  -- rate-limit error rather than queuing — a burst of concurrent requests for one event is exactly
  -- the pattern the rate limit exists to catch, so contention on this lock is itself a rate-limit
  -- signal, not a separate failure mode needing its own timeout/503 path (§15, fixing a round-2
  -- finding: the earlier blocking pg_advisory_xact_lock had no timeout and could queue callers
  -- indefinitely, risking connection-pool exhaustion under a deliberate flood).
  if not pg_try_advisory_xact_lock(hashtext('guest_lookup:' || v_event_id::text)::bigint) then
    raise exception 'too many attempts, try again later';
  end if;

  select count(*) into v_ip_attempts from public.guest_lookup_attempts
    where event_id = v_event_id and ip_hash = v_ip_hash and attempted_at > now() - interval '15 minutes';
  select count(*) into v_event_attempts from public.guest_lookup_attempts
    where event_id = v_event_id and attempted_at > now() - interval '15 minutes';

  -- Thresholds are deliberately low, not tuned for anti-botnet volume: the realistic threat here is
  -- one targeted guess against a small guest list (reverse-phone-lookup is commonplace in India),
  -- not a distributed campaign (§12 important: threat-model framing was off). Per-IP AND per-event
  -- ceilings both apply so simple IP rotation alone doesn't defeat the limit (§12 important). Tunable
  -- constants, not schema — revisit at Wave 2b build time with real usage data.
  if v_ip_attempts >= 5 or v_event_attempts >= 30 then
    raise exception 'too many attempts, try again later';
  end if;

  insert into public.guest_lookup_attempts (event_id, ip_hash) values (v_event_id, v_ip_hash);

  select id into v_guest_id
    from public.event_guests
    where event_id = v_event_id
      and regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
      and lower(trim(name)) = lower(trim(p_name))
    order by id
    limit 1;   -- deterministic pick on a phone+name collision, never an arbitrary row (§12 important)

  if v_guest_id is null then
    raise exception 'lookup failed';   -- same generic message as above — do not confirm/deny existence
  end if;

  v_token := encode(gen_random_bytes(18), 'base64');  -- ~144 bits, url-safe encoding applied at the app layer
  perform public.create_guest_token(v_event_id, v_guest_id, v_token);
  return v_token;
end; $$;
revoke all on function public.resolve_guest_by_lookup(text, text, text) from public;
grant execute on function public.resolve_guest_by_lookup(text, text, text) to anon, authenticated;
```

**V0 accepted risk, explicit (not silent):** no OTP verification — a plain phone+name match means anyone who knows (or correctly guesses) a guest's phone number and name can view that guest's tagged sub-events and RSVP on their behalf. This is a real, founder-accepted tradeoff for V0 (§0), not an oversight — the rate limiting above is what keeps it bounded. **Fast-follow enhancement, not built now:** require OTP verification of the phone number before minting a session token, reusing the Twilio/Supabase phone-OTP infrastructure already live for host auth — this is a drop-in upgrade to this one function, no schema change needed (`guest_tokens` and everything downstream of it is unaffected).

#### 6b.4 Session resolution, guest payload, RSVP

**Token-validity convention, stated once here (§12 important — was inconsistent):** every function in this subsection *requires* a token as its entire reason for being called — an invalid/expired one is a real error state, so all three `raise exception 'invalid session'`. This is different from `get_public_website_payload` (§6a.4), which never takes a token at all and never errors on that account — absence of guest identity is its normal case, not a failure. The two behaviors look inconsistent side by side only if you don't know which functions are token-mandatory; they're not accidental.

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
grant execute on function public.resolve_guest_session(text) to anon, authenticated;

-- Private-tier page content, mirroring get_public_website_payload but gated on a valid guest session
-- and scoped to that session's own event — never accepts an event_id directly from the caller.
create or replace function public.get_guest_website_payload(p_session_token text)
returns jsonb
security definer set search_path = public
language plpgsql as $$
declare v_event_id uuid; v_result jsonb;
begin
  select gt.event_id into v_event_id from public.guest_tokens gt
    where gt.token = p_session_token and (gt.expires_at is null or gt.expires_at > now());
  if v_event_id is null then raise exception 'invalid session'; end if;

  select jsonb_build_object('pages', public._website_page_content(v_event_id, 'private')) into v_result;
  return v_result;
end; $$;
revoke all on function public.get_guest_website_payload(text) from public;
grant execute on function public.get_guest_website_payload(text) to anon, authenticated;

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

  -- Explicit cross-event check (§12 important) — don't rely on Guest Management's own guard trigger
  -- on event_guest_sub_events as an uncited side effect; verify directly using that table's own
  -- denormalized event_id column (confirmed live, 2026-07-31).
  if not exists (
    select 1 from public.event_guest_sub_events
    where guest_id = v_guest_id and sub_event_id = p_sub_event_id and event_id = v_event_id
  ) then
    raise exception 'guest is not tagged to this sub-event';
  end if;

  update public.event_guest_sub_events
    set response_status = p_response_status, plus_one_count = p_plus_one_count,
        dietary_notes = p_dietary_notes, responded_at = now()
    where guest_id = v_guest_id and sub_event_id = p_sub_event_id;
end; $$;
revoke all on function public.submit_rsvp(text, uuid, text, integer, text) from public;
grant execute on function public.submit_rsvp(text, uuid, text, integer, text) to anon, authenticated;
```
Per-sub-event only (G7 confirmed, §1/§5.6) — no blanket-response path, since the founder confirmed guests RSVP per sub-event they're tagged to, not once per event. `submit_rsvp` is a plain `UPDATE` against a row that Guest Management already created when the guest was tagged to the sub-event — never an upsert (§5.6 corrected to match).

#### 6b.5 Private-page load composition (§12 important — was unspecified)

The client never calls `resolve_guest_session` and `get_guest_website_payload` separately. One route composes both server-side (§6.8) into a single response: `resolve_guest_session` for the guest's own identity + RSVP state (used to prefill the RSVP form), `get_guest_website_payload` for the private-tier page content itself (Schedule, Wedding Party, Q&A, etc.). They stay two separate SQL functions — one guest-scoped, one event-scoped-via-token — because they answer different questions and either could be cached differently later; the composition point is the Next.js route, not the database.

**Divergent-call behavior, specified (§14 — Backend Engineer's Phase 1 finding: this was left undefined):** the two calls share the same token and the same expiry check, so the only realistic divergence is the token expiring in the (sub-millisecond, same-request) gap between them. If either call raises `invalid session`, the route returns `401` and clears the session cookie, discarding any partial success from the other call — it never returns a half-populated payload. The client's response to a `401` here is the same as to a `401` from any other route in this family: drop back to the lookup form.

#### 6b.6 Rate limiting summary

`resolve_guest_by_lookup` (§6b.3) is the load-bearing case — enforced inside the function against `guest_lookup_attempts` (§6b.2) with an advisory-lock-serialized check-and-insert, not app middleware, so it can't be bypassed by calling PostgREST directly and can't be raced by concurrent requests (§14, fixing §12's critical #1 more completely than the confirm-the-fixes pass initially claimed — see §14 for what was still broken). `submit_rsvp`/`resolve_guest_session`/`get_guest_website_payload` require a valid session token already (a much smaller attack surface — the token itself is the rate limit, at ~144 bits of entropy) but should still get a light app-layer ceiling at build time as a defense-in-depth measure, not a schema requirement.

**All 5 Wave 2 RPCs grant `EXECUTE` to both `anon` and `authenticated`** (§14, fixing §12's grant-gap finding), matching the zero-exception convention every Wave 1 guest-facing catalog already uses. Without this, a logged-in host previewing their own just-published site, or any logged-in Evenzi user who follows a guest link, would get "permission denied for function" — because this codebase's standard `createClient()` (`lib/supabase/server.ts`) authenticates as `authenticated` whenever the request carries a valid session cookie, not `anon`. **Chosen over the alternative fix** (mandate the 4 new routes always use the publishable key with no cookie forwarding, so every call is `anon` regardless of the visitor's login state) — the reasoning is simpler than it first sounds: `guest_lookup_attempts`' buckets are keyed by `event_id`/`ip_hash`, not Postgres role, so a host's own lookup calls hit the *same* per-event bucket as public guest traffic **under either fix** — widening the grant doesn't change that, and an earlier draft of this paragraph incorrectly claimed it did (caught in round-2 review, §15). The actual reason to prefer the grant fix is simpler and sufficient on its own: it directly closes the permission-denied bug and matches this codebase's existing zero-exception convention (§14), with no new routing-layer special case to build or maintain. If host-preview traffic sharing a rate-limit bucket with public traffic ever becomes a real problem, the fix is to exclude the event's own host from its own lookup-attempt count (a `v_guest_id`/`auth.uid()` check inside `resolve_guest_by_lookup`), not a client-construction choice — noted here so it isn't rediscovered as a mystery later.

### 6.8 New unauthenticated route family

`resolve_guest_by_lookup`/`resolve_guest_session`/`get_guest_website_payload`/`submit_rsvp`/`get_public_website_payload` are called from a **new route family with no `getUser()` check** — unlike every existing route under `app/api/events/[id]/*`. Shape, keyed by `events.slug` (§5.4), not `event_id`. **All 4 routes use the standard `createClient()` from `lib/supabase/server.ts`** (cookie-forwarding, the same client every other route in this codebase uses) — **not** a fresh publishable-key client with no cookie forwarding (§15, restated here because §6b.6 is where that decision and its rationale live, but §6.8 is what an implementer actually builds routes from — a cross-reference so the decision doesn't get silently reversed by someone working from this table alone):

| Route | Wave | Calls | Notes |
|---|---|---|---|
| `GET /api/e/[slug]` | 2a | `get_public_website_payload(slug)` | No cookie needed — the site's public page load. Returns `null` on not-found/offline (§6a.4) — the route must map that to `404`, not pass through a `null` body. |
| `POST /api/e/[slug]/lookup` | 2b | `resolve_guest_by_lookup(slug, phone, name)` | Sets the returned token as a signed httpOnly cookie on success. |
| `GET /api/e/[slug]/guest` | 2b | `resolve_guest_session(token)` + `get_guest_website_payload(token)` | Reads the cookie; composes both calls server-side into one response (§6b.5), including the divergent-call behavior specified there. This is the route that resolves the "no route" critical finding (§12 #2) for `get_public_website_payload`'s private-side counterpart. |
| `POST /api/e/[slug]/rsvp` | 2b | `submit_rsvp(token, ...)` | Reads the cookie; client never sends the token directly. |

All 5 RPCs now have an explicit route (§12 critical #2 — the original sketch covered only 3 of 4). This is genuinely new surface for this codebase and should be built as its own reviewed slice.

**Error → HTTP status mapping (§14 — Backend Engineer's suggestion, added so it isn't reinvented four different ways):** via `supabase-js` `.rpc()`, a `RAISE EXCEPTION` surfaces as `{ data: null, error }`, not a thrown JS error — every route in this family should map `error.message` the same way rather than each inventing its own:

| RPC error message | HTTP status | Client action |
|---|---|---|
| `lookup failed` | `401` | Show a generic "no match" message — don't distinguish from a malformed request. |
| `too many attempts, try again later` (including lock contention on a concurrent burst, §15 — `pg_try_advisory_xact_lock` failing to acquire raises this same message, deliberately, not a separate error) | `429` | Show a cooldown message. |
| `invalid session` | `401` | Clear the session cookie, drop back to the lookup form. |
| `guest is not tagged to this sub-event` | `403` | Should be unreachable from the UI (the RSVP form only ever renders tagged sub-events) — treat as a bug signal, not a user-facing state. |
| `get_public_website_payload` returns `null` (not an error) | `404` | Not-found and offline share one response shape by design (§6a.4) — don't try to distinguish them. |
| anything else (e.g. `permission denied for function`, a Postgres-level error) | `500` | Log server-side with full detail; never forward the raw Postgres error string to the client. |

---

## 7. Seed data (blocks G12/G5 usability, not schema)

- `config.invitation_card_styles`/`config.invitation_templates` seed data (G12: 6 styles, 18 templates from `card-templates.html`) — **moved to Digital Invitations' own backlog item**, cross-referenced from here. This spec only records the "reuse the same catalog" decision (§1).
- `config.website_templates`/`website_palettes`/`website_fonts` — seed once the final template lineup is locked (build-plan §0).
- `config.website_pages` — seed the 10-page spine, `is_removable=false` on home/rsvp.
- `config.website_section_types` — seed the 11 types from `edit-page.js`.

---

## 8. Compliance check against `DATA-MODEL.md` conventions

- ✅ Module tables FK only to `public.events`/`auth.users` (core) or `config.*` — the one prior exception (`guest_tokens.guest_id → event_guests`) is **resolved by dropping the FK** (§6b.1), not by requesting a new sanctioned exception. No open rule-7 violation remains.
- ✅ Naming: plural, `snake_case`, module-prefixed, catalogs drop template/master suffixes.
- ✅ 1:1 sidecar pattern for `event_website_design` (FK is the PK).
- ✅ `updated_at` via the shared `set_updated_at()` trigger.
- ✅ Denormalized `event_id` columns now paired with guard triggers, matching the 5 existing precedents.
- ✅ Catalogs use uuid PK + unique slug, matching all 10 existing catalogs (was a deviation in the original draft, now fixed).
- ✅ `anon` grants on identity/PII-adjacent data are scoped via `SECURITY DEFINER` functions (§6b), never a direct policy on a table holding secrets (`event_website_settings.website_password_hash`) or mixed private/public rows (`event_media`, explicitly excluded per D35). The 5 `config.website_*` catalogs do carry direct `anon` SELECT policies (shipped in Wave 1, tightened in §6a.2) — that's fine, they're pure reference data with no privacy dimension; the rule that matters is no direct `anon` policy on anything guest-identifying, and none exists.

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

**Wave 2a (separate council checkpoint before this batch — §13):**
1. `is_website_gate_open()` (§6a.1).
2. `ALTER POLICY` on the 5 `config.website_*` catalogs, tightening Wave 1's existing unconditional policy to `enabled = true` (§6a.2) — not a new policy, see §12 critical #4.
3. `_website_page_content()` internal helper (§6a.3).
4. `get_public_website_payload(p_slug)` (§6a.4) — no session-token parameter.
5. `GET /api/e/[slug]` route (app-layer, not a migration).

**Wave 2b (own council pass — genuinely the enumeration-risk surface, gets the harder review). Depends on Wave 2a being live first** (§14 — stated explicitly, wasn't before): `resolve_guest_by_lookup` calls `is_website_gate_open` (2a step 1) and `get_guest_website_payload` calls `_website_page_content` (2a step 3). Safe as long as 2a ships as a whole batch before 2b starts, which is already the intended order — this note exists so a future reorder or partial rollback doesn't silently break it.
1. `guest_tokens` (no FK, no guard trigger — §6b.1).
2. `guest_lookup_attempts` rate-limit ledger (§6b.2).
3. Functional index on normalized phone (§6b.3) + `create_guest_token`/`resolve_guest_by_lookup` (rate-limit check inline).
4. `resolve_guest_session`/`get_guest_website_payload`/`submit_rsvp` (§6b.4).
5. `app/api/e/[slug]/lookup`, `/guest`, `/rsvp` routes (app-layer, not a migration) — signed httpOnly session cookie set by `/lookup`, read by the other two.

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

Wave 1, Wave 2a, and Wave 2b are all **live** (migrations `website_01`–`website_20`, `get_advisors` clean). The entire DB layer for Event Website / Digital Presence is done. Remaining work is app-layer, not schema: the `app/api/e/[slug]/*` route family (§6.8's 4-route table), which needs two open decisions resolved first — Story/Q&A page tier (§1, proposed default not yet founder-confirmed) and the `x-forwarded-for` Kong-trust question (§6b.3's decision tree — needs a live request test against this project's actual gateway before the rate-limit design's per-IP ceiling can be trusted). See §16 and §17 for the two gaps only live migration application surfaced (neither caught by 4 rounds of council review) — both fixed, and both distilled into standing process rules that still need writing down in `ai/system/agent_rules.md`.

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

---

## 13. Wave 2 revision changelog (addressing §12 findings)

Every §12 critical + important finding, fixed below, same format as §0's Wave 1 fix pass. Verified against the live DB (`smjkbmkxweevqpvygabe`, 2026-07-31) where the fix depended on current state.

**Adopted: the 2a/2b sub-split** (§12 suggestion, Tech Lead). §6 is now §6a (public payload, no identity risk) + §6b (guest lookup/session/RSVP, the actual enumeration surface), each its own migration batch with its own build-order list (§9). The split is enforced structurally, not just organizationally: `get_public_website_payload` (2a) takes no session-token parameter and has no dependency on `guest_tokens` at all — it cannot touch guest identity by construction, not by discipline.

| # | Change | Finding addressed |
|---|---|---|
| 🔴 1 | Rate limiting moved from "Next.js middleware wrapping the route" (bypassable — PostgREST serves the RPC directly regardless) to a `guest_lookup_attempts` ledger table (§6b.2) checked and written *inside* `resolve_guest_by_lookup` itself (§6b.3). The grant and the limiter are now the same trust boundary. | Critical #1 — structurally unenforceable rate limiting. |
| 🔴 2 | `get_public_website_payload` split into two functions so both halves get a route: `get_public_website_payload(slug)` (2a, public) and `get_guest_website_payload(token)` (2b, private) — both wired into §6.8's route table (`GET /api/e/[slug]`, `GET /api/e/[slug]/guest`). All 5 Wave 2 RPCs now have an explicit caller. | Critical #2 — missing route. |
| 🔴 3 | No action needed — already fixed live in `website_11` before this review cycle. Noted, not re-touched. | Critical #3 — duplicate constraint (pre-resolved). |
| 🔴 4 | §6a.2 rewritten: the "new" `enabled=true` anon policy was a no-op on top of Wave 1's existing unconditional `{anon,authenticated}` policy (RLS policies OR together). Fix is `ALTER POLICY ... USING (enabled = true)` on the 5 live policies, tightening in place instead of adding a redundant one. Also corrected §3's "Wave 2 is the first anon surface" framing, since Wave 1 already shipped anon reads on these 5 catalogs. | Critical #4 — anon catalog policy no-op. |
| 🟡 5 | `submit_rsvp` now explicitly checks `event_guest_sub_events.event_id = v_event_id` (that column is denormalized and live) instead of relying on an uncited guard trigger on a different table. | Cross-event check on `submit_rsvp`. |
| 🟡 6 | Rate-limit rationale in §6b.3 rewritten: thresholds (5/IP+event/15min, 30/event/15min) are framed around one targeted guess against a small guest list, not botnet-scale traffic. | Threat-model framing was off. |
| 🟡 7 | Per-event ceiling (`v_event_attempts >= 30`) added alongside the per-IP ceiling — both must be under threshold, so IP rotation alone doesn't bypass the limit. | `(ip, event_slug)` key had no per-event ceiling. |
| 🟡 8 | `resolve_guest_by_lookup`'s match query now has explicit `order by id limit 1`, so a phone+name collision picks a deterministic row instead of an unspecified one. | Missing `LIMIT 1`. |
| 🟡 9 | §6b.5 added: the client calls one route (`GET /api/e/[slug]/guest`), which composes `resolve_guest_session` + `get_guest_website_payload` server-side into one response. Documented explicitly, not left implicit. | Private-page load composition unspecified. |
| 🟡 10 | §6b.4 opens with an explicit "token-validity convention" note: every function that requires a token as its sole reason for being called (`resolve_guest_session`, `get_guest_website_payload`, `submit_rsvp`) raises on invalid/expired; `get_public_website_payload` never takes a token and never errors on that account, since absence of guest identity is its normal case. Stated as a principled distinction, not left as an apparent inconsistency. | Inconsistent bad-token handling. |
| 🟡 11 | §5.6's "on conflict upsert" line rewritten to match the actual code — `submit_rsvp` is a plain `UPDATE` against a row Guest Management already created; the `unique(guest_id, sub_event_id)` constraint is confirmed live, not conditional. | §5.6 prose/code mismatch. |
| 🟡 12 | Adopted — see the 2a/2b split note above. | Wave 2 sub-split suggestion. |
| 🟡 13 | §6a.3 added: a shared internal `_website_page_content(event_id, tier)` helper with the full per-page-slug join (story/wedding-party/qa/schedule/venue-travel/registry+video/rsvp/gallery all spelled out), called by both the public and guest payload functions instead of a "follows directly from..." hand-wave. | Per-page-type joins deferred. |
| 💡 | Timing side-channel on `is_website_gate_open` — documented as an accepted low-severity residual risk in §6a.1, not fixed (a constant-time rewrite isn't worth the complexity at this threat level). | Suggestion. |
| 💡 | `submit_rsvp`'s error wording — left as is; both its errors relate only to the caller's own token/tag state, not another guest's existence, so they don't actually violate the enumeration-safety intent even though the wording differs from `resolve_guest_by_lookup`'s. | Suggestion. |
| 💡 | Functional index added: `idx_event_guests_phone_normalized` on `(event_id, regexp_replace(phone, '\D', '', 'g'))` (§6b.3). | No index on phone-lookup predicate. |
| 💡 | §0's changelog table corrected — it had claimed a guard trigger on `guest_tokens`, which never existed and isn't needed (no client-writable path exists to guard; `create_guest_token()` already validates the guest/event pair inline). §6b.1 also carries this explanation. | Guard-trigger claim didn't match §6.3's SQL. |
| 💡 | §9 build order restructured into two independently-numbered lists (Wave 2a steps 1–5, Wave 2b steps 1–5) instead of two lists both starting mid-sequence at "8." | Build-order step numbers collided. |

**Not itemized above but touched in passing:** §8's compliance checklist updated to state the anon-grant rule precisely (no direct anon policy on identity-adjacent data; the 5 reference catalogs are a stated, reasoned exception, not an oversight).

---

## 14. Confirm-the-fixes council pass (2026-07-31) — new findings, and the fixes applied

Council was re-run on §13's revision as a lighter confirm-the-fixes pass (Tech Lead, Data Modeller, Security Expert, Backend Engineer — Critique + Debate + Arbiter). Every §13 fix verified correct against its §12 finding. But the panel independently caught **3 new critical-severity bugs in the new material itself** — not re-litigating §12, genuinely new implementation issues the first pass didn't (and structurally couldn't have) covered, since they're in code that didn't exist until §13 wrote it. Fixed below; not yet re-reviewed.

### 🔴 Critical (fixed)
1. **Rate-limit IP was a spoofable raw string.** `resolve_guest_by_lookup` hashed the *entire* `x-forwarded-for` header — any caller could vary a prefix per request and defeat the per-IP ceiling entirely. *Security Expert, unanimous.* **Fixed (§6b.3):** parse only the first comma-separated hop, not the whole header. The deeper question — whether that first hop is itself trustworthy against Supabase's specific Kong gateway config — can't be settled by a spec; §6b.3 now states an explicit decision tree (ship as-is if build-time testing confirms the hop is trustworthy; otherwise move IP-determination to the trusted Vercel/Next.js layer and pass it as an explicit parameter, accepting a stated tradeoff) instead of a bare "verify later" deferral.
2. **Rate-limit check-then-insert wasn't atomic.** Concurrent requests could all pass both count checks before any insert committed — a burst of ~50 concurrent requests defeats both ceilings in one shot, no header-spoofing required. *Security Expert (critical) → Data Modeller (independently found the same issue, initially rated important, escalated to critical in debate after examining the schema — no natural `ON CONFLICT` target exists on an append-only log, so the "cheap" atomic-upsert fix would've actually required a schema redesign) → Tech Lead (endorsed the escalation).* **Fixed (§6b.3):** `pg_advisory_xact_lock`, scoped per-event, serializing the whole check-and-insert — closes both the per-IP and per-event ceiling races in one lock rather than needing two.
3. **5 of 6 Wave 2 RPCs granted `EXECUTE` to `anon` only** — including `get_public_website_payload`, which is **Wave 2a**, not just 2b. This codebase's standard `createClient()` authenticates as `authenticated` (not `anon`) for any visitor with a session cookie, so a logged-in host previewing their own site, or any logged-in user clicking a guest link, would get "permission denied for function." Confirmed against live Wave 1 data: every existing guest-facing grant in this codebase is `{anon, authenticated}`, zero exceptions — this broke that convention. *Backend Engineer, confirmed by Data Modeller against live DB.* **Fixed:** `authenticated` added to all 5 grants (§6a.4, §6b.3, §6b.4 ×3). Considered and rejected the alternative fix (routes always use the publishable key, no cookie forwarding) because it would put a logged-in host's site-preview traffic through the same public rate-limit bucket as anonymous guest traffic — a self-DoS risk raised in debate (§6b.6).

### 🟡 Important (fixed) — arbiter-ruled item first
- **`to_jsonb(row)` wildcard serialization** in `_website_page_content()` and `get_public_website_payload`'s `design` key leaked `created_by`/`updated_by`/`user_id` host UUIDs and would've auto-exposed any future column added to 7 different tables with zero review gate. *Tech Lead (Phase 1: critical) vs. Security Expert (Phase 2 debate: important — a bare UUID isn't directly actionable under this app's RLS+JWT model, though the unbounded-future-exposure angle is real and high-severity on its own).* **Arbiter ruling: UPHELD-WITH-MODIFICATION → important, high confidence** — doesn't block Wave 2a's migration on its own, but must land in the same PR since it's what makes Wave 2a's "low-risk" framing actually true. **Fixed (§6a.3, §6a.4):** every branch rewritten as an explicit `jsonb_build_object` allow-list. While rewriting, also added a `status != 'cancelled'` filter to the schedule branch (matching the existing `event_hub_summary` convention, D39) — an unrelated gap noticed in passing, not in any prior finding list.
- **§6b.5's two-RPC composition had no defined behavior when the calls disagree** (e.g. token expires between them). *Backend Engineer.* **Fixed (§6b.5):** either call raising `invalid session` returns `401` and clears the cookie, discarding any partial success.
- **Story/Q&A page tier was never pinned down**, despite §0 flagging free-text sections as a permanent PII-leak risk whose actual exposure depends entirely on tier. *Security Expert.* **Fixed (§1):** proposed defaults added (Story=public, Q&A=private) with rationale, flagged for the same founder sign-off the rest of §1 already got — not silently decided.
- **No error→HTTP-status mapping specified** across the 4 new routes, risking inconsistent handling (or a leaked raw Postgres error string) per route. *Backend Engineer.* **Fixed (§6.8):** mapping table added.
- **Wave 2b's build order didn't state its dependency on Wave 2a artifacts.** *Tech Lead.* **Fixed (§9):** one-line prerequisite note added.
- `guest_lookup_attempts`'s missing count-query index and unverified RLS posture — **both false positives**, already present in §13's original text (composite indexes on `(event_id, ip_hash, attempted_at)` and `(event_id, attempted_at)`; RLS enabled with zero policies for every role). Comments strengthened in §6b.2 to make both unambiguous on re-review, no schema change needed.

### 💡 Suggestions (fixed, cheap)
- `guest_lookup_attempts`'s `bigint` PK deviates from this spec's uuid convention everywhere else — **fixed:** one-line rationale added (§6b.2) — append-only ledger, nothing FK-references into it, no uuid-worthy identity concern.
- §6a.2's `ALTER POLICY` touches Wave-1-owned RLS from a Wave-2 migration batch, crossing §3's stated wave-boundary principle without an acknowledged exception — **fixed:** one-clause carve-out added to §3.
- Timing side-channel on `is_website_gate_open` was described as "subtle" when it's actually a structural code-path difference (1 query vs. 2) — **fixed:** §6a.1 reworded to describe it accurately; the accept-the-risk decision itself is unchanged.

### Not itemized as a fix — a debate-round observation worth keeping
Tech Lead flagged that the two rate-limit criticals (spoofable IP, TOCTOU race) **compound each other**: fixing the race alone still leaves the per-IP ceiling keyed on a spoofable identity; fixing the IP-hash alone still leaves the count non-atomic. Both are fixed together above, but future changes to either `resolve_guest_by_lookup`'s IP-derivation or its locking should be reviewed as a pair, not independently.

### Next step
Re-run `/council plan` on this revision as another confirm-the-fixes pass before Wave 2a's migration is authored. Given this round's fixes were narrow (4 technical corrections + documentation), expect this to be the last pass before migration barring new findings.

---

## 15. Second confirm-the-fixes pass (2026-07-31) — both criticals CLOSED, one new important fixed

Same 4-agent roster re-reviewed §14's fixes. Result is materially cleaner than round 1: **both original criticals confirmed CLOSED** (not just "fixed, pending verification"), every §14 item verified correct — the Data Modeller went column-by-column through all 6 `jsonb_build_object` allow-lists and the `event_sub_events`/`event_website_design` schemas (live DB, not just this doc) and found zero mismatches. No debate/arbiter phase was needed — nothing found in Phase 1 was contested between agents; two agents (Security Expert, Backend Engineer) independently converged on the same new issue from different lenses, which is corroboration, not a contest.

### Verified CLOSED
- **Spoofable IP-hash (§12→§13 critical, escalated by §14):** parsing only the first `x-forwarded-for` hop is correct; the residual Kong-trust question is no longer a bare deferral — it has a concrete decision tree with a fallback design. *Security Expert: CLOSED.*
- **TOCTOU race:** `pg_advisory_xact_lock` scoped to `event_id` alone correctly closes both the per-IP and per-event ceiling races in one lock (confirmed independently by Tech Lead's and Data Modeller's own reasoning, and Data Modeller verified the `hashtext()::bigint` cast against live Postgres — no truncation, correct overload, auto-releases at transaction end). *Security Expert: CLOSED for the race; flagged a new issue in what replaces it, below.*

### 🟡 New — found and fixed this round
- **The blocking advisory lock had no timeout, creating a contention-DoS vector:** a flood of concurrent lookup requests for one event would all queue on the same lock instead of failing fast, risking connection-pool exhaustion (a worse failure mode than the race it replaced). *Security Expert and Backend Engineer, independently, from threat-model and implementation-feasibility lenses respectively — converging without contradiction.* **Fixed (§6b.3):** switched from blocking `pg_advisory_xact_lock` to non-blocking `pg_try_advisory_xact_lock` — a caller that can't acquire the lock immediately fails straight into the existing `'too many attempts, try again later'` error (429) instead of queuing. Reframes lock contention as itself a rate-limit signal rather than a separate failure mode needing its own timeout/503 path.
- **§6b.6's stated rationale for the grant-fix choice was self-contradictory** — it claimed granting `authenticated` "avoids" the host's traffic sharing a rate-limit bucket with public traffic, then in the same paragraph conceded the bucket is keyed by `event_id`/`ip_hash`, not role, meaning it's shared either way. *Tech Lead.* **Fixed (§6b.6):** rewritten to justify the grant on its actual merits (fixes the permission-denied bug, matches the existing zero-exception convention) and to note the real fix for host-self-DoS, if it's ever needed, is excluding the host's own calls from their own event's attempt count — not a client-construction choice.

### 💡 Suggestions (fixed, cheap)
- §6.8 didn't restate the "cookie-forwarding client, not a fresh anon-key client" requirement that §6b.6 establishes — an implementer working from the route table alone could silently reverse it. *Backend Engineer.* **Fixed:** cross-reference added to §6.8's intro.
- `get_public_website_payload` returning bare `null` for not-found/offline was never mapped to an HTTP status. *Backend Engineer.* **Fixed:** row added to §6.8's error-mapping table.
- `hashtext()::bigint` uses a 32-bit hash in a 64-bit lock namespace, a theoretical cross-event lock collision — **not fixed**, per Data Modeller's own assessment ("not worth the complexity at this scale") and Tech Lead's suggestion-level confidence; documented here, not silently dropped.

### Next step
Both criticals from §14 are confirmed closed; this round's fixes were one logic change (blocking→non-blocking lock) plus two documentation additions and one rationale rewrite — no schema or RPC-signature changes. No new findings are expected from a third pass on material this narrow, but the call on whether to run one more confirm pass or proceed straight to authoring Wave 2a's migration is the founder's, not assumed here.

---

## 16. Wave 2a — LIVE (2026-07-31), and one finding no council round caught

Founder chose to proceed straight to migration (skip a 3rd confirm pass, given §15's fixes were narrow). **Wave 2a is now live** on `smjkbmkxweevqpvygabe`: migrations `website_12_gate_function`, `website_13_catalog_policy_fix`, `website_14_page_content_helper`, `website_15_public_payload_rpc`, plus a same-session fix `website_16_lock_internal_helper`. TypeScript types regenerated (`lib/supabase/database.types.ts`). `get_advisors` (performance) — only pre-existing Wave 1 unindexed-FK/unused-index notices at cold start, same accepted precedent as every prior module, nothing new from these migrations (no new tables in Wave 2a).

### One real finding, caught only by applying the migration and checking live state

**`_website_page_content` — meant to be internal-only, callable exclusively by `get_public_website_payload`/`get_guest_website_payload` — was actually `EXECUTE`-able by `anon` and `authenticated` directly**, despite `revoke all on function ... from public` in the migration exactly as spec'd through 4 council rounds. `get_advisors` (security) flagged it immediately after `website_14` applied; a direct `information_schema.routine_privileges` query confirmed it.

**Root cause:** Supabase grants `EXECUTE` on new `public`-schema functions directly to the `anon`/`authenticated` roles via `ALTER DEFAULT PRIVILEGES`, not through the `PUBLIC` pseudo-role — so `revoke ... from public` (which every function in this spec used, including Wave 1's) does nothing to remove it. This is the same category of gap `website_10` fixed once already for a guard-trigger function (noted in `DATA-MODEL.md`'s Wave 1 entry) — evidently not generalized into a rule anywhere, so it recurred.

**Why this matters beyond this one function:** if `_website_page_content` had shipped genuinely anon-callable, any caller could invoke `_website_page_content(any_event_id, 'private')` directly via `/rest/v1/rpc/_website_page_content` and get full private-tier page content for **any event**, with **no gate check and no guest session at all** — a complete bypass of both `is_website_gate_open` and the entire guest-lookup mechanism §6b exists to build. None of the 4 council rounds caught this, across Tech Lead/Data Modeller/Security Expert/Backend Engineer, because reviewing SQL text for a `revoke` statement reads as correct — the gap only exists in Supabase's actual runtime privilege model, which no amount of reading the migration text surfaces. Only applying it and running `get_advisors` (or manually querying `information_schema.routine_privileges`) would.

**Fixed:** `website_16_lock_internal_helper` — `revoke execute on function public._website_page_content(uuid, text) from public, anon, authenticated;`. Verified live: only `postgres`/`service_role` retain `EXECUTE`. **Also fixed pre-emptively in the spec** (§6b.1, §6a.3) for Wave 2b's `create_guest_token`, which has the identical pattern and would have shipped with the identical gap if built as originally spec'd.

**Process takeaway, not yet acted on:** every future `SECURITY DEFINER` function in this codebase meant to be internal-only needs `revoke ... from public, anon, authenticated` as the pattern, not `from public` alone — and `get_advisors` (security) should run immediately after every migration that adds a function, not just at wave boundaries, specifically to catch this class of gap while it's cheap to fix. Worth adding to `ai/agents/data_modeller.md` or `ai/system/agent_rules.md` as a standing rule (`agent-evolve` candidate) rather than relying on it being remembered.

### Wave 2b — not yet migrated
Spec is council-approved through §15, with the two preemptive `create_guest_token`/pattern fixes above already folded in. Next session's work: author and apply Wave 2b's migration (`guest_tokens`, `guest_lookup_attempts`, the 4 guest-facing RPCs), run `get_advisors` immediately after each function-adding step (not just at the end), regenerate types, then build the `app/api/e/[slug]/*` route family.

---

## 17. Wave 2b — LIVE (2026-07-31), and a second live-only finding

**Wave 2b is now live** on `smjkbmkxweevqpvygabe`: migrations `website_17_guest_tokens`, `website_18_guest_lookup_attempts`, `website_19_create_token_and_lookup`, `website_20_session_payload_rsvp`. `get_advisors` (security) clean — `create_guest_token` correctly absent from the anon/authenticated-executable warnings (the §16 fix pattern held), all 5 guest-facing RPCs correctly present in those warnings (by design), `guest_tokens`/`guest_lookup_attempts` show only the expected INFO-level "RLS enabled, no policy" notice — the deliberate default-deny design, not a gap. `get_advisors` (performance) — only cold-start unused-index noise on the 2 new empty tables, same accepted precedent as every prior module. TypeScript types regenerated.

### A second thing only live application caught — this one before it ever shipped

**`resolve_guest_by_lookup`'s IP-hash line calls `digest(...)`, and every function in this spec declares `security definer set search_path = public`.** `pgcrypto` (which provides `digest()`, `gen_random_bytes()`, `gen_random_uuid()`) is installed in the `extensions` schema on this project, not `public`, and not `pg_catalog` (which is the only schema implicitly searched regardless of `search_path`). A bare `digest(...)` call inside a function scoped to `search_path = public` cannot resolve — confirmed by directly executing the exact expression before migrating: `ERROR: 42883: function digest(unknown, unknown) does not exist`. Had this shipped as originally spec'd, **`resolve_guest_by_lookup` would have raised an unhandled Postgres error on every single call** — not a security gap this time, a total outage of the guest-lookup RPC, the one function this entire wave exists to ship.

**Why `gen_random_bytes(18)` in the same function was fine:** a `public.gen_random_bytes` wrapper already exists in this codebase (`SECURITY DEFINER`, `SET search_path TO 'extensions'`) — evidently created to solve this exact class of problem once before, for some earlier module, but never generalized into a written rule or extended to cover `digest`. No equivalent `public.digest` wrapper exists.

**Fixed before migrating** (not after, this time — caught during pre-flight verification, not by `get_advisors` post-migration): the call site changed to `extensions.digest(...)`, schema-qualified inline, rather than adding a third wrapper function to the `public` schema (fewer functions to grant/revoke/review correctly — each new wrapper is itself a fresh instance of the §16 class of bug waiting to happen). Verified live before applying: `extensions.digest('test', 'sha256')` succeeds under `search_path = public`.

### Process takeaway — now two instances of "the SQL text was correct-looking but the runtime behavior wasn't"

§16 (a `revoke` that didn't revoke) and §17 (a function call that doesn't resolve under a restricted `search_path`) are two different failure classes, but the same root lesson: **this codebase's `SECURITY DEFINER` + `SET search_path = public` pattern has sharp edges that only show up when the SQL actually runs**, not when it's read. Concrete standing rules worth writing down (not yet done — `ai/system/agent_rules.md` or `ai/agents/data_modeller.md`, `agent-evolve` candidate):
1. Every internal-only `SECURITY DEFINER` function: `revoke ... from public, anon, authenticated`, not `from public` alone (§16).
2. Every `SECURITY DEFINER` function with `search_path = public` that needs a `pgcrypto` function: schema-qualify (`extensions.digest(...)`, `extensions.gen_random_uuid()`, etc.) rather than relying on a wrapper existing or being remembered — `gen_random_bytes` has a `public` wrapper only by historical accident, and that's not a pattern to depend on going forward, it's a pattern to phase out in favor of qualifying at the call site (§17).
3. Run `get_advisors` (security) immediately after any migration that adds a function — and, per §17, also do a direct pre-flight execution test of any new function body containing a call to a non-`pg_catalog` extension function, before migrating, not after.

### Next: `app/api/e/[slug]/*` route family
DB side of both waves is complete. Remaining work is app-layer, not schema: the 4 routes from §6.8's table, the Story/Q&A tier decision from §1 (still needs founder sign-off), and the `x-forwarded-for` Kong-trust verification from §6b.3's decision tree (needs a live request test against this project's actual gateway, can't be resolved from SQL alone).
