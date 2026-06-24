# Build-Doc — Fix Event Hub index page (Overview + Quick Actions)

**Author:** Claude (review gate, 2026-06-22) · **Executor:** Cursor · **Reviewer:** Claude (Playwright re-test before done)
**Blocks ClickUp:** `86d2k1nrm` / `86d2k1nrc` (Overview Tab BE/FE), `86d2k1nu1` / `86d2k1ntq` (Quick Actions BE/FE)
**Bug:** see QA & Bugs — "Event Hub index page redirects to /home"

---

## Symptom (reproduced live on `77f0385`, :3001)

Navigating to `/events/<id>` (the event's primary **Dashboard** tab) **always redirects to `/home`**. Server log shows `GET /events/<id> 307`. The event hub Overview + Quick Actions are therefore completely unreachable. Every other sub-route (`/settings`, `/guests`, etc.) loads fine — it is **only** the index `page.tsx` that bounces.

## Root cause (confirmed)

`app/events/[id]/page.tsx` is a server component that runs:

```ts
const { data } = await supabase
  .from('events')
  .select(`
    id, name, primary_date, primary_venue, guest_capacity, status, cover_image_url,
    event_types ( name, slug ),
    event_sub_events ( id, custom_name, event_sub_types ( name, icon_name ) )
  `)
  .eq('id', id)
  .is('deleted_at', null)
  .single()

if (!data) redirect('/home')   // <-- silently fires on ANY query error
```

Two problems:

1. **Cross-schema PostgREST embed is unsupported here.** `event_types` and `event_sub_types` live in the **`config`** schema; `events`/`event_sub_events` live in `public`. PostgREST embedding only resolves relationships **within the request schema (`public`)**. The query returns:
   ```
   PGRST200: Could not find a relationship between 'event_sub_events' and 'event_sub_types' in the schema cache
   (Searched ... in the schema 'public', but no matches were found)
   ```
   Verified by direct REST call — even the single-level `events → event_types(...)` embed fails the same way. `.schema('config').from('event_types')` (direct table access) **works** (the create wizard + `/api/event-types` prove it); it is only the **embed/join syntax across schemas** that fails.

2. **The error is swallowed.** `const { data } =` ignores `error`, so a query failure is indistinguishable from "event not found" → `redirect('/home')`. This masked the bug end-to-end.

## The fix

There is a purpose-built view for exactly this surface: **`public.event_hub_summary`** (security_invoker, created in `hub_01–03`, D39). It already aggregates everything the hero needs — `event_name, primary_date, primary_venue, guest_total, task_percent, task_done, task_total, budget_total, budget_spent, budget_percent, sub_event_count, default_card_share_token`. It lives in `public`, so **no cross-schema embed**.

### Step 1 — Hero / Overview data → query the view
Replace the hand-rolled `events` query with a query against `public.event_hub_summary` for the aggregate hero stats (countdown, guest total, task %, budget %, sub-event count). This is a plain `public` select — no embed, no error.

### Step 2 — Sub-event list (names + icons) → resolve `config` separately
The hero's milestone strip needs each sub-event's display name + icon. Don't embed. Instead:
- Query `public.event_sub_events` for this event (`id, custom_name, event_sub_type_id, display_order`, order by `display_order`).
- Query `config.event_sub_types` via `.schema('config').from('event_sub_types').select('id, name, icon_name')` (small catalog — fetch all, or filter by the ids you got).
- Join in JS: `name = custom_name ?? typesById[event_sub_type_id]?.name ?? 'Sub-event'`, `icon = ICON_MAP[typesById[...]?.icon_name] ?? 'celebration'`.
- Keep the existing `ICON_MAP` and the `sub_event_type_id` (snake) → note the column is `event_sub_type_id`.

### Step 3 — Surface real errors, never silently redirect
- Destructure `error` from **every** query: `const { data, error } = ...`.
- If `error` is non-null → `console.error('[event-hub] <which> query failed:', error)` and render a proper error state (or `notFound()`), **not** `redirect('/home')`.
- Only redirect/`notFound()` when the event genuinely doesn't exist (data is null **and** no error) or is soft-deleted.

### Step 4 — Quick Actions
Quick Actions render on this same index page. Once Steps 1–3 land and the page renders, verify each quick-action links/handlers work (they were never reachable). Wire any that are static.

## Also fix the same latent bug in the API route (do it in this pass)
`app/api/events/[id]/route.ts` (GET) has the **identical cross-schema embed** (`event_sub_events ( ... event_sub_types ( name, icon_name ) )`). It will 500 if ever called. Apply the same Step 2 pattern (separate `config` query + JS join). Also confirm whether `app/api/events/route.ts` (dashboard GET) embeds `event_types(...)` — if so it has the same latent issue; switch it to a `config` lookup or confirm it currently returns the type name (it rendered, but the type label showed generic "Event" — likely silently null).

## Acceptance criteria (Claude re-tests with Playwright)
1. `/events/<id>` loads (HTTP 200, no 307) and shows the hero with correct countdown, guest total, task %, sub-event count for a real event.
2. Sub-event milestone strip shows correct **names + icons** (e.g. "Wedding Ceremony", "Reception") sourced from `config.event_sub_types`.
3. The event's top **Dashboard** tab (currently dead) navigates correctly from `/settings` and the dashboard card "Manage event" link.
4. A non-existent / soft-deleted event id → `notFound()` (or a clean not-found state), **not** a silent redirect to /home.
5. Zero new console errors. Quick Actions all fire.
6. `app/api/events/[id]/route.ts` GET returns 200 with sub-event names (no PGRST200).

## Files
- `app/events/[id]/page.tsx` (primary)
- `app/api/events/[id]/route.ts` (same embed fix)
- `app/api/events/route.ts` (verify dashboard embed)
- Reference: `public.event_hub_summary` view, `config.event_sub_types` catalog, `lib/supabase/database.types.ts`
