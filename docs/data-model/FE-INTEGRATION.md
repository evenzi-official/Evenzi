# Evenzi — Frontend ↔ Supabase Integration Guide

> **Dheeraj's companion for wiring the Next.js frontend to the Supabase backend.** Practical, code-first. The *shape* of every table (columns, why, relationships) lives in [DATA-MODEL.md](DATA-MODEL.md) — read that for "what is the data." Read **this** for "how do I query it from the app."
>
> **Rolling document** — kept in sync as the schema/queries evolve. See [Maintenance](#maintenance).

| | |
|---|---|
| **Version** | `2026-06-14.1` |
| **Backend status** | New model is **live on the dev project** (`smjkbmkxweevqpvygabe`). Catalogs seeded, 4 logins backfilled, RLS on (owner-only baseline). **Planning module live** (`planning_01`–`planning_07`): task priority/status/expense-type catalogs, budget + expenses tables, 3 derived views, helper RPCs. **Guest Management live** (`guests_01`–`guests_05`): rsvp-status + guest-tag catalogs, guest list + function/tag link tables, 2 derived views, guard/default triggers. **Media & Memories live** (`media_01`–`media_05`): album-preset catalog, `event_media` (photo+video) + `event_albums` + M:N link, 2 derived views, R2-keys (storage routes pending). |
| **Types** | `lib/supabase/database.types.ts` |
| **Heads-up** | The current deployed app queries the **old** shapes — this guide + the [old → new map](#old--new-change-map) is what you use to update it. |

---

## Maintenance

- Schema changed? **Regenerate types** (below) and update the affected [recipe](#query-recipes).
- Add a recipe whenever a screen needs a query pattern not already here.
- Bump the version. This doc and the app's data access change together.

---

## 1. Setup

Env vars (already in `.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://smjkbmkxweevqpvygabe.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_…   # safe in the browser BECAUSE RLS is on
# secret key (sb_secret_…) = server/service only, NEVER in the bundle
```

Type the client with the generated `Database` (keep the existing `@supabase/ssr` helpers, just add the generic):
```ts
// lib/supabase/client.ts (browser)
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  )
```
Now every query is typed and autocompletes. Handy helpers from the types file:
```ts
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/database.types'
type EventRow    = Tables<'events'>
type EventInsert = TablesInsert<'events'>
type EventType   = Tables<{ schema: 'config' }, 'event_types'>   // config tables need the {schema} form
```

**Regenerate types (after ANY schema change — note `--schema public,config`, the default only emits public):**
```bash
npx supabase gen types typescript --project-id smjkbmkxweevqpvygabe --schema public,config > lib/supabase/database.types.ts
```

---

## 2. The golden rule — `config` tables need `.schema('config')`

Catalog tables (`event_types`, `event_sub_types`, `user_types`, `event_checklists`, the 3 Planning catalogs `task_priorities`/`task_statuses`/`expense_types`, and the 2 Guest catalogs `rsvp_statuses`/`guest_tags`, the Media catalog `album_presets`) live in the **`config`** schema, not `public`. supabase-js defaults to `public`, so:

```ts
// ❌ WRONG — looks in public, returns "relation does not exist"
supabase.from('event_types').select('*')

// ✅ RIGHT — config tables
supabase.schema('config').from('event_types').select('*')
```

Live/app tables (`events`, `event_sub_events`, `event_collaborators`, `event_tasks`, `user_profiles`, `user_preferences`) are in `public` → query them the normal way (no `.schema()`).

> If a `config` query 404s, the schema isn't exposed — confirm `config` is in *Dashboard → Data API → Settings → Exposed schemas*.

---

## 3. What RLS does for you

RLS is **on**. The database auto-filters rows to the logged-in user, so:

- **Reads are auto-scoped.** `supabase.from('events').select('*')` already returns *only this user's events* — you do **not** need `.eq('user_id', me)`. (Adding it is harmless but redundant.)
- **Writes must satisfy ownership.** On insert you **must** set `user_id` to the logged-in user, or the row is rejected:
  ```ts
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('events').insert({ user_id: user!.id, /* … */ })
  ```
- **Catalogs are readable by everyone** (even logged-out) — that's intended.
- **Today access = owner only.** Collaborator access (someone added to your event) isn't wired yet — see [Not built yet](#not-built-yet).

---

## 4. Query recipes

> Catalogs change rarely — **load them once and cache** (Context / SWR / a server fetch). Don't refetch event types on every render.

**Catalogs — enabled event types, a type's sub-types, its checklist:**
```ts
const cfg = supabase.schema('config')
const { data: eventTypes } = await cfg.from('event_types')
  .select('*').eq('enabled', true).order('display_order')

const { data: subTypes } = await cfg.from('event_sub_types')
  .select('*').eq('event_type_id', typeId).eq('enabled', true).order('display_order')

const { data: checklist } = await cfg.from('event_checklists')
  .select('id,title,display_order').eq('event_type_id', typeId).eq('enabled', true).order('display_order')
```

**Create an event** — prefer the now-built one-shot RPC `create_event_with_details` (atomic: event + sub-events + seeded tasks **with `status_id`/`priority_id`** + seeded `event_expense_types` + an empty budget row, in one transaction). It takes the owner from `auth.uid()` and **ignores any passed-in user id**. The plain-insert flow below still works but no longer seeds tasks correctly on its own (tasks need `status_id`+`priority_id`):
```ts
const { data: { user } } = await supabase.auth.getUser()

// 1) the event — variable per-type fields go into event_details (jsonb), NOT separate rows
const { data: ev } = await supabase.from('events').insert({
  user_id: user!.id,
  created_by: user!.id,                 // self-created
  event_type_id: typeId,
  name: "Aarav & Ishani's Wedding",
  primary_date: '2026-12-22',
  primary_venue: 'Rajasthan Heritage Palace',
  event_details: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
  status: 'active',
}).select('id').single()

// 2) chosen sub-events
await supabase.from('event_sub_events').insert(
  chosenSubTypeIds.map((id, i) => ({ event_id: ev!.id, event_sub_type_id: id, display_order: i + 1 }))
)

// 3) seed the checklist from the template
const { data: tmpl } = await supabase.schema('config').from('event_checklists')
  .select('id,title,display_order').eq('event_type_id', typeId).eq('enabled', true)
await supabase.from('event_tasks').insert(
  (tmpl ?? []).map(t => ({ event_id: ev!.id, template_id: t.id, title: t.title, display_order: t.display_order }))
)
```

**Read one event + its sub-events + tasks** (embed same-schema children; resolve type/sub-type names from the cached catalogs):
```ts
const { data: event } = await supabase.from('events')
  .select('*, event_sub_events(*), event_tasks(*)')
  .eq('id', eventId).is('deleted_at', null).single()

// partner names from the jsonb:
const partner1 = (event!.event_details as any).partner_1_name
// type/sub-type label: map event!.event_type_id / sub.event_sub_type_id against your cached config catalogs
```
> Cross-schema embedding (pulling `config.event_types` inside a `public.events` select) can work, but the robust pattern is: cache the small catalogs and map by id client-side.

**"Your Events" dashboard list** (RLS already scopes to you; just hide soft-deleted):
```ts
const { data: events } = await supabase.from('events')
  .select('*, event_sub_events(count), event_tasks(count)')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
```

**Planning progress "12 of 18 / 68%"** (derived — count, never stored). `is_done` is **gone**; completion is now `status.category = 'done'`. Easiest path is the `event_task_progress` view:
```ts
// preferred — one row, already computed by the security_invoker view
const { data: prog } = await supabase.from('event_task_progress')
  .select('done,total,percent').eq('event_id', eventId).maybeSingle()
// prog?.done, prog?.total, prog?.percent  (null if the event has no tasks)
```
Or count client-side via the status join (needs the cached `task_statuses` catalog to know which ids are `category='done'`):
```ts
const doneIds = taskStatuses.filter(s => s.category === 'done').map(s => s.id)
const { count: total } = await supabase.from('event_tasks')
  .select('*', { count: 'exact', head: true }).eq('event_id', eventId)
const { count: done } = await supabase.from('event_tasks')
  .select('*', { count: 'exact', head: true }).eq('event_id', eventId).in('status_id', doneIds)
const percent = total ? Math.round((done! / total) * 100) : 0
```

**Planning catalogs — cache the 3 new `config` lists once, map by id:**
```ts
const cfg = supabase.schema('config')
const [{ data: taskPriorities }, { data: taskStatuses }, { data: expenseTypes }] = await Promise.all([
  cfg.from('task_priorities').select('*').eq('enabled', true).order('display_order'),
  cfg.from('task_statuses').select('*').eq('enabled', true).order('display_order'),
  cfg.from('expense_types').select('*').eq('enabled', true).order('display_order'),
])
// build slug→id and id→row maps client-side (same pattern as event_types)
const statusIdBySlug = new Map(taskStatuses!.map(s => [s.slug, s.id]))
const priorityIdBySlug = new Map(taskPriorities!.map(p => [p.slug, p.id]))
```

**Add a task** — `status_id` + `priority_id` are **required NOT NULL** now (no more `is_done`). Resolve by slug from the cached catalogs:
```ts
await supabase.from('event_tasks').insert({
  event_id: eventId,
  title: 'Book caterer',
  status_id:   statusIdBySlug.get('pending'),   // default new-task status
  priority_id: priorityIdBySlug.get('med'),
  sub_event_id: subEventId ?? null,             // null = "Whole event"
  due_date: '2026-11-01',                        // null = undated
})
```

**Toolbar counts (total / todo / done / overdue)** — one RPC, not 4 round-trips:
```ts
const { data } = await supabase.rpc('event_task_counts', { p_event_id: eventId })
// data → [{ total, todo, done, overdue }]
```

**Bulk complete/reopen** from the bulk bar:
```ts
await supabase.rpc('bulk_set_task_status', { p_task_ids: selectedIds, p_status_slug: 'completed' })
// raises if the slug is unknown; RLS still scopes the update to your tasks
```

**Set / update the budget** — `event_budgets` is 1:1 per event and may not pre-exist, so **upsert** on `event_id`:
```ts
await supabase.from('event_budgets')
  .upsert({ event_id: eventId, total_amount: 500000 }, { onConflict: 'event_id' })
// modified_by is stamped server-side by a trigger — don't set it
```

**Budget summary + breakdown** — read the `security_invoker` views (already RLS-scoped to your events):
```ts
const { data: summary } = await supabase.from('event_budget_summary')
  .select('total_amount,spent,remaining,currency').eq('event_id', eventId).maybeSingle()

const { data: breakdown } = await supabase.from('event_expense_breakdown')
  .select('expense_type_id,name,icon_name,spent,item_count').eq('event_id', eventId)
```

**Add an expense** — group under a per-event `event_expense_types` row; `vendor_name` is free text:
```ts
await supabase.from('event_expenses').insert({
  event_id: eventId,
  expense_type_id: expenseTypeId,        // from event_expense_types (per-event), NOT the config catalog
  amount: 120000,
  vendor_name: 'Royal Caterers',
  sub_event_id: subEventId ?? null,
  receipt_key: null,                     // R2 OBJECT KEY (set after upload); never a URL
})
// created_by is stamped server-side by a trigger
```
> **Expense types are per-event.** Read the host's types from `public.event_expense_types` (seeded at event creation from `config.expense_types`); `event_expenses.expense_type_id` FKs that per-event table, not the catalog.

> **Assignee names/avatars** must come from a **restricted same-event source** (a future same-event view or `security definer` RPC returning `display_name`/`avatar_url` only) — **never widen `user_profiles` RLS, never expose email/phone**.

**Profile + role-select + preferences:**
```ts
// profile (RLS = own row)
const { data: profile } = await supabase.from('user_profiles').select('*').single()

// role-select page sets the role (role_slug starts null at signup; immutable once set)
await supabase.from('user_profiles')
  .update({ role_slug: 'host', onboarding_completed: true })
  .eq('id', user!.id)

// notification toggles
await supabase.from('user_preferences').update({ sms_alerts: true }).eq('user_id', user!.id)
```
> The profile + preferences rows are auto-created by the **signup trigger** — you don't insert them on signup.

**Account deletion** — *not a client call.* It needs the secret key (delete `auth.users` + purge storage), so it's a server action / route handler ([planned](#not-built-yet)).

### Guest Management (live — `guests_01`–`guests_05`)

```ts
// add a guest — name only is enough; rsvp defaults to 'pending' via trigger, party_size to 1
await supabase.from('event_guests').insert({ event_id, name: 'Aarav', phone: '…', party_size: 2 })
// (you MAY set rsvp_status_id explicitly by slug; cache config.rsvp_statuses and map by id)

// assign functions / tags — bulk-safe: use upsert+ignoreDuplicates (re-assign won't abort the batch).
// event_id is filled by the guard trigger; never send it.
await supabase.from('event_guest_sub_events')
  .upsert(subEventIds.map(sid => ({ guest_id, sub_event_id: sid })), { onConflict: 'guest_id,sub_event_id', ignoreDuplicates: true })
await supabase.from('event_guest_tag_links')
  .upsert(tagIds.map(tid => ({ guest_id, tag_id: tid })), { onConflict: 'guest_id,tag_id', ignoreDuplicates: true })

// adding a tag from the client ALWAYS lands is_custom:true (the INSERT policy enforces it)
await supabase.from('event_guest_tags').insert({ event_id, name: 'Table 5', is_custom: true })

// stats cards — coalesce a MISSING row (zero-guest event) to all-zeros
const { data } = await supabase.from('event_guest_stats').select('*').eq('event_id', eventId).maybeSingle()
const stats = data ?? { total:0, attending:0, pending:0, declined:0, maybe:0, attending_headcount:0, zero_assigned:0 }

// per-function counts for the sidebar
await supabase.from('event_sub_event_guest_counts').select('*').eq('event_id', eventId)
```
Cache `config.rsvp_statuses` + `config.guest_tags` like the other catalogs (need `.schema('config')`). Tag manager: rename = one `update` on `event_guest_tags`; delete cascades the links.

### Media & Memories (live — `media_01`–`media_05`)

> **Storage ops go through server routes, not raw client calls** — the production `/api/storage/*` routes are still pending, so the grid is non-functional until they land:
```ts
// upload: presigned R2 PUT, then a SERVER commit route inserts the event_media row
//   (server re-derives the key under events/{eventId}/, stamps byte_size from the R2 HEAD).
// display: a BATCH sign route returns signed URLs for an array of keys (authorizes each key's
//   event scope). Sign thumbnail_key for grid tiles; sign storage_key lazily on lightbox open.
// single delete: a SERVER route purges storage_key + thumbnail_key from R2, then deletes the row.

// add/remove media to album (client-safe; the guard fills event_id):
await supabase.from('event_media_albums')
  .upsert(mediaIds.map(m => ({ media_id: m, album_id })), { onConflict: 'media_id,album_id', ignoreDuplicates: true })
// create album from the client ALWAYS lands is_custom:true; set cover = update event_albums.cover_media_id
// album cards: LEFT JOIN albums -> event_album_counts (missing row = 0 -> render preset as a chip)
// storage meter: event_media_storage.used_bytes (coalesce no-row -> 0); limit/tier hardcoded (free 5GB) until entitlements
// Newest = order by created_at desc, id desc (keyset cursor (created_at,id)); date filter = taken_at; website = where published
```
Cache `config.album_presets` like the other catalogs (`.schema('config')`).

---

## 5. Old → new change map

What changed vs the shapes the current app code uses:

| Old (current app) | New | FE change |
|---|---|---|
| `from('event_types')` | `config.event_types` | add `.schema('config')` |
| `from('sub_event_types')` | `config.event_sub_types` | `.schema('config')` + renamed |
| `event_metadata` (key/value rows) | `events.event_details` (jsonb) | read `event.event_details.partner_1_name`; write the whole object |
| `user_profiles.role` (text) | `user_profiles.role_slug` | rename; it's nullable until role-select |
| `events` (no creator) | `events.created_by` added | set `created_by` on insert (= user for self-serve) |
| `rpc('create_event_with_details', …)` | **built** (Planning) | call it again — atomic create incl. seeded tasks (status/priority) + expense types + empty budget; ignores passed-in user id |
| `event_tasks.is_done` (boolean) | **dropped** → `status_id` (+ `config.task_statuses.category`) | progress = count `category='done'` (or the `event_task_progress` view); inserts need `status_id`+`priority_id` resolved by slug |
| manual `.eq('user_id', me)` on reads | RLS auto-scopes | can drop it (harmless to keep) |
| — | new: `user_preferences`, `event_collaborators`, `event_tasks`, `config.event_checklists` | use as needed |
| — | new (Planning): `config.task_priorities`, `config.task_statuses`, `config.expense_types`; `public.event_task_assignees`, `event_budgets`, `event_expense_types`, `event_expenses`; views `event_budget_summary`, `event_expense_breakdown`, `event_task_progress`; RPCs `event_task_counts`, `bulk_set_task_status` | see the Planning recipes in §4 |
| — | new (Guests): `config.rsvp_statuses`, `config.guest_tags`; `public.event_guests`, `event_guest_sub_events`, `event_guest_tags`, `event_guest_tag_links`; views `event_guest_stats`, `event_sub_event_guest_counts` | see the Guest recipes in §4; `create_event_with_details` now also seeds default guest tags |
| — | new (Media): `config.album_presets`; `public.event_media`, `event_albums`, `event_media_albums`; views `event_media_storage`, `event_album_counts` | see the Media recipes in §4; storage ops via server routes (pending); `create_event_with_details` also seeds album presets |

---

## 6. Not built yet

Don't wire these — they're [PLANNED] in DATA-MODEL.md and will arrive with their pages:

- **Collaborator access** — only the event **owner** can read/write today. Adding someone to `event_collaborators` does **not** yet grant them access (the `can_access_event()` RLS layer is pending). Build owner-only flows for now. The same applies to `event_task_assignees` — the table is built (avoids a later live-table migration) but there's **no assignee FE this pass**.
- **Assignee identity source** — the restricted same-event view / RPC that returns assignee `display_name`/`avatar_url` (without email/phone) isn't built yet; don't read names off `user_profiles` directly.
- **Account-deletion server action** (`delete_user_account`) — its storage purge must include the expense-receipt key prefix.
- **Receipt upload** — `event_expenses.receipt_key` exists, but the R2 upload + signed-URL serving route is a backend follow-up (UI stub for now).
- **Enablement & entitlements** (`config.modules`, `plans`, feature toggles) — not created yet; don't gate UI on them.

---

## 7. Gotchas checklist

- [ ] `config.*` query? → `.schema('config')`.
- [ ] Inserting a `public` row? → set `user_id` (and `created_by` on events) to the logged-in user.
- [ ] Reading lists? → RLS scopes them; also add `.is('deleted_at', null)` for events.
- [ ] Need partner names? → `events.event_details` jsonb, not a separate table.
- [ ] Progress/counts/badges? → compute with `count`, don't store.
- [ ] Catalogs? → fetch once and cache (now includes `task_priorities`, `task_statuses`, `expense_types` — `config` must stay in *Exposed schemas*).
- [ ] Task done/progress? → `status.category='done'` (or the `event_task_progress` view), **never** `is_done` (dropped).
- [ ] Inserting a task? → set `status_id` + `priority_id` (resolve by slug from the cached catalogs).
- [ ] Setting a budget? → `upsert` on `event_budgets` with `onConflict: 'event_id'`.
- [ ] Toolbar counts? → `rpc('event_task_counts', { p_event_id })`, not 4 queries.
- [ ] Expense type? → use a `public.event_expense_types` (per-event) id, not the `config` catalog id.
- [ ] Assignee names? → restricted same-event source only; never widen `user_profiles` RLS or expose email/phone.
- [ ] Regenerated types? → use `--schema public,config`.
