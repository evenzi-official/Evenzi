# Evenzi — Frontend ↔ Supabase Integration Guide

> **Dheeraj's companion for wiring the Next.js frontend to the Supabase backend.** Practical, code-first. The *shape* of every table (columns, why, relationships) lives in [DATA-MODEL.md](DATA-MODEL.md) — read that for "what is the data." Read **this** for "how do I query it from the app."
>
> **Rolling document** — kept in sync as the schema/queries evolve. See [Maintenance](#maintenance).

| | |
|---|---|
| **Version** | `2026-06-13.1` |
| **Backend status** | New model is **live on the dev project** (`smjkbmkxweevqpvygabe`). Catalogs seeded, 4 logins backfilled, RLS on (owner-only baseline). |
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

Catalog tables (`event_types`, `event_sub_types`, `user_types`, `event_checklists`) live in the **`config`** schema, not `public`. supabase-js defaults to `public`, so:

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

**Create an event** (plain inserts under RLS — the one-shot RPC is [planned](#not-built-yet); not atomic yet, fine for now):
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

**Planning progress "12 of 18 / 68%"** (derived — count, never stored):
```ts
const { count: total } = await supabase.from('event_tasks')
  .select('*', { count: 'exact', head: true }).eq('event_id', eventId)
const { count: done } = await supabase.from('event_tasks')
  .select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('is_done', true)
const percent = total ? Math.round((done! / total) * 100) : 0
```

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
| `rpc('create_event_with_details', …)` | removed | do the 3 plain inserts above (one-shot RPC returns later) |
| manual `.eq('user_id', me)` on reads | RLS auto-scopes | can drop it (harmless to keep) |
| — | new: `user_preferences`, `event_collaborators`, `event_tasks`, `config.event_checklists` | use as needed |

---

## 6. Not built yet

Don't wire these — they're [PLANNED] in DATA-MODEL.md and will arrive with their pages:

- **Collaborator access** — only the event **owner** can read/write today. Adding someone to `event_collaborators` does **not** yet grant them access (the `can_access_event()` RLS layer is pending). Build owner-only flows for now.
- **One-shot create RPC** (`create_event_with_details`) — use the plain-insert flow above.
- **Account-deletion server action** (`delete_user_account`).
- **Enablement & entitlements** (`config.modules`, `plans`, feature toggles) — not created yet; don't gate UI on them.
- **Names TBD:** `config.event_checklists` / `public.event_tasks` may be renamed when the Planning page is scoped.

---

## 7. Gotchas checklist

- [ ] `config.*` query? → `.schema('config')`.
- [ ] Inserting a `public` row? → set `user_id` (and `created_by` on events) to the logged-in user.
- [ ] Reading lists? → RLS scopes them; also add `.is('deleted_at', null)` for events.
- [ ] Need partner names? → `events.event_details` jsonb, not a separate table.
- [ ] Progress/counts/badges? → compute with `count`, don't store.
- [ ] Catalogs? → fetch once and cache.
- [ ] Regenerated types? → use `--schema public,config`.
