# Event Website Wave 1 backend wiring — for Dheeraj

Pull latest `Dev-Vibe` first — commit `7be94fa` has everything you need (schema docs + regenerated Supabase types). No Supabase migration work needed from you — the schema is already live on the dev project (`smjkbmkxweevqpvygabe`), applied and council-reviewed this session.

## Objective & context

Evenzi's Event Website ("Digital Presence") host-editor has a full design prototype (`designs/pages/website/`) and a React shell (`app/events/[id]/website/*`), but the React pages are static mocks with zero Supabase calls. The data model that was missing has now been designed, council-reviewed, and migrated (migrations `website_01`–`website_11`). Your job is to wire the existing React pages to this real schema — same shape as the Planning Tools and Guest Management builds that already shipped this way.

**Don't touch the database schema.** It's done and reviewed — read/write to it, don't change it. If you hit a real gap in the schema while building, flag it back to Abhijith rather than migrating around it yourself (Wave 2, the public guest-facing site, is a separate not-yet-migrated piece — not your scope here).

## Research — what's already true

- Canonical schema doc: `docs/data-model/DATA-MODEL.md`, decision **D49** — read this first, it has the full DDL for every new table.
- Design reference (wireframe-level, not binding on pixels): `designs/pages/website/overview.html`, `design.html`, `edit-page.html`, `photos.html`.
- Current React mocks to replace: `app/events/[id]/website/page.tsx` (Overview — partially wired, only reads `events.name`), `design/page.tsx`, `edit/page.tsx`, `photos/page.tsx` (all fully static, zero Supabase calls).
- Existing wired-route pattern to copy: `app/api/events/[id]/website-settings/route.ts` — `createClient()` + `auth.getUser()` + zod `.strict()` validation + `NextResponse.json()`.
- TypeScript types are already regenerated in `lib/supabase/database.types.ts` — the new tables are typed and ready.

## Dev spec

New tables live (all owner-only RLS, `authenticated` + `user_id = auth.uid()` on the parent event):

| Table | Purpose |
|---|---|
| `config.website_templates`/`website_palettes`/`website_fonts` | Theme catalogs — currently **empty**, seed later once the template lineup locks. Design/UI should handle an empty catalog gracefully (no templates to pick yet). |
| `config.website_pages` (10 rows, seeded) | The fixed page spine: home, story, schedule, venue-travel, wedding-party, gallery, qa, rsvp, registry, video |
| `config.website_section_types` (11 rows, seeded) | heading, photo, photogrid, schedule, person, hotel, qa, divider, map, countdown, video |
| `public.event_website_design` | 1:1 per event — template/palette/font choice + cover/OG image keys. `template_id` is nullable (catalog is empty). |
| `public.event_website_pages` | One row per event per page — `is_visible`, `custom_title`, `display_order`. Auto-seeded for every new event via `create_event_with_details`. |
| `public.event_website_sections` | Generic jsonb sections — backs **only** the Registry and Video pages, plus any host-added free-form extras. |
| `public.event_story_blocks` | Story page — ordered heading/photo blocks, dedicated table (not generic sections) |
| `public.event_wedding_party_members` | Wedding Party page — name/relation/side(bride,groom)/photo, dedicated table |
| `public.event_qa_items` | Q&A page — question/answer pairs, dedicated table |
| `public.event_travel_points` | Venue & Travel page — airport/railway/bus points |
| `public.event_stays` | Venue & Travel page — suggested hotels |
| `public.events.slug` | New unique column — not generated yet, no generator built. If your scope includes the Overview page's "Site URL" field, you'll need a slug-generation strategy (e.g. couple-names + short random suffix), checked for uniqueness before insert. |
| `public.event_guest_sub_events` | Gained `response_status`/`plus_one_count`/`dietary_notes`/`responded_at` + a unique constraint — **not your scope**, this backs Wave 2 (RSVP), not this pass. |
| `public.event_website_summary` (view) | Authenticated host-preview aggregate — one query for "all pages + visibility + tier for this event," matches the `event_hub_summary` pattern already used on the Event Hub page. |

**What to build (map to the 4 React pages):**

1. **Overview page** (`app/events/[id]/website/page.tsx`) — read `event_website_summary` view for the page list, `events.slug` for the site URL (show "not published yet" state if null), `event_website_design.template_id` for whether a template's been picked.
2. **Design page** (`design/page.tsx`) — CRUD against `event_website_design`: template picker (handle empty catalog — show "coming soon" state, don't crash), palette/font override, cover/OG image upload (reuse whatever R2 upload pattern Media & Memories already uses for `cover_image_key`/`og_image_key`).
3. **Edit/Pages page** (`edit/page.tsx`) — list from `event_website_pages` joined to `config.website_pages` (name/tier/icon), toggle `is_visible`, reorder `display_order`, rename via `custom_title`. Clicking into a page should open the actual content editor for that page's type:
   - Story → CRUD on `event_story_blocks` (heading/photo blocks, reorder, add/remove)
   - Wedding Party → CRUD on `event_wedding_party_members` (bride's side / groom's side)
   - Q&A → CRUD on `event_qa_items`
   - Venue & Travel → CRUD on `event_travel_points` + `event_stays` + the new `map_link` columns on `events`/`event_sub_events`
   - Schedule → this already has data via `event_sub_events`/`show_on_website` — just needs a read view here, not new CRUD
   - Registry/Video → CRUD on `event_website_sections` (generic jsonb) — **you'll need per-section-type Zod validation here**, one schema per `section_type` slug from `config.website_section_types`, matching the `.strict()` pattern in the existing website-settings route. Don't let arbitrary jsonb reach the DB unvalidated.
4. **Photos page** (`photos/page.tsx`) — **do not build this yet.** It depends on Media & Memories' signed-URL public route, which doesn't exist. Leave it as-is or add a "coming soon" state; this is explicitly out of scope per the data-model spec (§4.5 in the spec doc — Gallery is deferred to a later slice).

**Also fix while you're in `design/page.tsx`:** the current mock hardcodes 6 theme names (classic/modern/garden/golden/midnight/heritage) that don't match anything real. Delete the hardcoded list entirely — it should read from `config.website_templates` (currently empty, so the picker should show an empty/coming-soon state, not the old fake list).

## Testing

- Every new route: session check (`getUser()`, 401 if missing), ownership check (event belongs to the caller), Zod validation on writes, proper error status codes.
- CRUD round-trip test for each of: `event_website_design`, `event_website_pages`, `event_story_blocks`, `event_wedding_party_members`, `event_qa_items`, `event_travel_points`, `event_stays`, `event_website_sections`.

## Visual testing

Screenshot each of the 4 pages before/after wiring, at least one populated state and one empty state (no template picked yet, no story blocks yet, etc.) — empty states matter here since most catalogs/tables start with zero rows.

## UI/UX testing

- Toggling page visibility on Edit/Pages should be reflected immediately (optimistic update, matches the pattern already used in Planning Tools' task toggles).
- Reordering (drag or up/down buttons) should persist `display_order` correctly.
- Template/palette/font pickers must not crash on an empty catalog — this is the current real state, not a hypothetical edge case.

## Responsiveness testing

360px / 390px / 414px / 768px / 1024px / 1440px, matching the project's standard breakpoint set. No horizontal scroll, touch targets ≥44px on mobile widths.

## Data testing

- Empty states: no template chosen, zero story blocks, zero wedding party members, zero Q&A items, zero travel points/stays.
- Loading states while fetching.
- Error states: failed writes, invalid section data rejected by Zod before it reaches Postgres.

## Definition of done

- [ ] Overview, Design, Edit/Pages wired to real Supabase data — zero hardcoded arrays left in any of these files
- [ ] Photos page left alone (out of scope) or given an explicit "coming soon" state
- [ ] Story/Wedding Party/Q&A/Venue&Travel each have working CRUD against their dedicated tables
- [ ] Registry/Video sections write through Zod-validated jsonb, not raw pass-through
- [ ] All new API routes follow the existing auth+ownership+zod pattern (`website-settings/route.ts` is your reference)
- [ ] Typecheck + lint clean
- [ ] Screenshots at all 6 breakpoints, empty + populated states
