# Event Website Wave 2 — public site API wiring, for Dheeraj

Pull latest `Dev-Vibe` first. No Supabase migration work needed from you — Wave 2's entire DB layer (Wave 2a + Wave 2b, migrations `website_12`–`website_20`) is already live on the dev project (`smjkbmkxweevqpvygabe`), applied and council-reviewed this session (4 full review rounds — see `docs/superpowers/specs/2026-07-30-event-website-data-model-spec.md` §12–§17 if you want the full trail, but you shouldn't need it for this task).

## Objective & context

Wave 1 (host editor) is what you're wiring in `handoff-website-wave1.md` — the private, logged-in side where a host designs their site. **Wave 2 is the other half: the actual public site a guest visits.** No login. A guest opens a link, sees the public pages immediately, and can identify themselves (phone + name — no password, no account) to unlock private pages and RSVP.

Your job here is **the API route layer only** — `app/api/e/[slug]/*`. This is genuinely new surface for this codebase: every other route under `app/api/` requires a signed-in session (`getUser()` + 401 if missing). These four routes have **no such check, by design** — they're called by anonymous visitors. Don't add a `getUser()` check to them; that would break the entire feature.

**Not your scope in this doc:** the actual visual template a guest sees (`app/e/[slug]/page.tsx` and friends) — that's tracked separately in `designs/_plans/guest-website-templates-build-plan.md`. This doc covers the API layer those pages will call. **Don't touch the database schema** — it's done and reviewed; if you hit a real gap, flag it back to Abhijith rather than migrating around it.

## Research — what's already true

- Canonical schema doc: `docs/data-model/DATA-MODEL.md`, decisions **D50** (Wave 2a) and **D51** (Wave 2b) — full DDL for every function you're calling.
- Full spec with every RPC signature spelled out: `docs/superpowers/specs/2026-07-30-event-website-data-model-spec.md` §6a/§6b (the SQL), §6.8 (the route table + error mapping — this is your primary reference, copy the table below).
- TypeScript types already regenerated in `lib/supabase/database.types.ts` — all 6 RPCs (`is_website_gate_open`, `get_public_website_payload`, `resolve_guest_by_lookup`, `resolve_guest_session`, `get_guest_website_payload`, `submit_rsvp`) are typed under `Functions`.
- Existing wired-route pattern to copy the *shape* of (auth check, zod validation, `NextResponse.json()`) but **not the auth part** — `app/api/events/[id]/website-settings/route.ts`. Every route in this Wave 2 family skips the `getUser()`/ownership-check step that route has.

## ⚠️ Blocking prerequisite: `events.slug` has no generator yet

`public.events.slug` (unique, nullable) has existed since Wave 1 but **nothing populates it** — grepped the whole codebase, zero slug-generation code exists. Every route in this doc is keyed by slug, not `event_id`. **You need a slug-generation strategy before any of this is testable end-to-end** — e.g. couple-names + short random suffix, checked for uniqueness before insert, probably wired into the Overview page's "Site URL" field (also flagged, unresolved, in the Wave 1 handoff doc — same gap, now blocking two things instead of one). Confirm with Abhijith whether this is your build or already in flight elsewhere before you start; don't duplicate work.

## Dev spec — the 4 routes

| Route | Method | Calls | Cookie |
|---|---|---|---|
| `/api/e/[slug]` | `GET` | `get_public_website_payload(slug)` | None needed |
| `/api/e/[slug]/lookup` | `POST` | `resolve_guest_by_lookup(slug, phone, name)` | **Sets** the session cookie on success |
| `/api/e/[slug]/guest` | `GET` | `resolve_guest_session(token)` **+** `get_guest_website_payload(token)` | **Reads** the cookie |
| `/api/e/[slug]/rsvp` | `POST` | `submit_rsvp(token, sub_event_id, response_status, plus_one_count?, dietary_notes?)` | **Reads** the cookie |

### Non-negotiables — each one caused a real bug in the design/review process, don't reintroduce them

1. **Use `createClient()` from `lib/supabase/server.ts`** (the standard cookie-forwarding client) on all 4 routes — **not** a fresh publishable-key client with no cookie forwarding. This matters more than it looks: the RPCs are granted to both `anon` and `authenticated` specifically so a logged-in host previewing their own just-published site doesn't get "permission denied." If you build a separate no-cookie client "to keep it clean," you reopen a bug that was already caught and fixed during review.
2. **The client never sends the session token directly.** `/lookup` sets it as a signed httpOnly cookie; `/guest` and `/rsvp` read it from the cookie, never from a request body/query param the client could tamper with or that could leak into logs.
3. **`get_public_website_payload` returns `null`** (not an error) for both "event doesn't exist" and "site is offline" — these deliberately share one response shape (don't try to distinguish them, that's intentional — prevents leaking which slugs exist). Your route must map `null` → **`404`**, not pass a `null` body through.
4. **`/guest` composes two RPC calls into one response.** If *either* `resolve_guest_session` or `get_guest_website_payload` raises `invalid session` (e.g. the token expired in the gap between the two calls), return `401` and **clear the session cookie** — never return a half-populated payload from just the one call that succeeded.
5. **Rate limiting is already fully handled server-side inside `resolve_guest_by_lookup`** — you don't need to build any throttling logic in the route. A blocked caller (whether from hitting the per-IP/per-event ceiling, or from concurrent-request lock contention — both are the same error, deliberately) raises `'too many attempts, try again later'`. Just map it to `429` per the table below; nothing else to build.

### Error → HTTP status mapping (exact — copy this)

`supabase-js` `.rpc()` returns `{ data: null, error }` on a `RAISE EXCEPTION`, not a thrown JS error — check `error.message` against these exact strings on every route:

| `error.message` | Status | Client-facing behavior |
|---|---|---|
| `lookup failed` | `401` | Generic "no match" message — don't distinguish "wrong phone" from "wrong name" from "event doesn't exist," that's deliberate (enumeration-safety). |
| `too many attempts, try again later` | `429` | Cooldown message. |
| `invalid session` | `401` | Clear the session cookie, bounce back to the lookup form. |
| `guest is not tagged to this sub-event` | `403` | Should be unreachable from the UI (RSVP form only ever renders sub-events the guest is actually tagged to) — if you see this in practice, it's a bug upstream, not a real user state. |
| anything else (e.g. a raw Postgres error) | `500` | Log server-side with full detail. **Never** forward the raw error string to the client. |
| `get_public_website_payload` returns `null` | `404` | See non-negotiable #3 above. |

## Testing

- Every route: no `getUser()` check (verify you *didn't* add one — that's the correct state, not an oversight).
- `/lookup` with a matching phone+name → 200 + cookie set. With a non-matching pair → 401, generic message, cookie not set.
- `/lookup` hammered past the threshold (5 requests for one IP+event within 15 min, or 30 for one event) → 429.
- `/guest` with no cookie → should fail cleanly (no crash) — decide and document what "no cookie at all" returns (likely also 401, same as an invalid token, since the route can't tell the difference between "never looked up" and "token expired/cleared").
- `/rsvp` for a sub-event the guest isn't tagged to → 403 (shouldn't be reachable from the UI, but the route must still handle it if it happens).
- `events.slug` that doesn't exist at all vs. a real slug with `site_offline = true` → both must return the same `404`, not distinguishable responses.

## Visual testing

Not applicable to this doc directly (no UI here) — but once the guest template consumes these routes, screenshot the public homepage (public tier), the lookup form, and the post-lookup private view, each at least once populated and once in an error/empty state (site offline, no match found).

## UI/UX testing

- Rate-limit cooldown (429) needs a real, calm message — this is a real user who forgot their invite details, not necessarily an attacker; don't word it like a security warning.
- Session-expiry (401 from `/guest` or `/rsvp`) should drop the guest back to the lookup form without losing their place entirely — re-lookup should feel like "sign in again," not "start over."

## Responsiveness testing

Same standard breakpoint set as every other page: 360 / 390 / 414 / 768 / 1024 / 1440. This only matters once a guest-facing page is built on top of these routes — flag it here so it's not forgotten when that work starts.

## Data testing

- Empty states: event has zero private pages configured, zero sub-events the guest is tagged to.
- The `x-forwarded-for` open question (see below) affects whether the per-IP rate-limit ceiling actually does anything in practice — worth a real test, see next section.

## Open items that aren't yours to close, but affect what you're building

1. **Story/Q&A page tier isn't founder-confirmed yet** — spec §1 proposes Story=public, Q&A=private as defaults, but this needs Abhijith's sign-off before `config.website_pages` gets (re-)seeded with final tiers. Don't hardcode an assumption about which tier either page is in; read it from `config.website_pages.tier` via the payload, whatever it ends up being.
2. **`x-forwarded-for` gateway-trust hasn't been live-tested.** `resolve_guest_by_lookup`'s per-IP rate-limit ceiling depends on the first hop of that header actually being the real client IP as set by Supabase's Kong gateway, not something a caller can spoof. **You're in a good position to help verify this** while building/testing `/lookup`: fire a few requests from different real clients (or with a manually-crafted `x-forwarded-for` header via curl/Postman) and check what lands in `public.guest_lookup_attempts.ip_hash` — if spoofed values change the hash, the per-IP ceiling isn't trustworthy as designed and needs to be flagged back to Abhijith (the spec already has a documented fallback plan for this — passing the IP explicitly from Vercel's edge instead of reading the header inside Postgres).

## Definition of done

- [ ] All 4 routes built, `createClient()` (cookie-forwarding) used throughout, no `getUser()` check anywhere in this family
- [ ] Session cookie: signed, httpOnly, set only by `/lookup`, read only by `/guest`/`/rsvp`, cleared on any `invalid session`
- [ ] Error → status mapping matches the table above exactly, including the `null`→404 case
- [ ] `/guest`'s two-call composition never returns a partial payload on failure
- [ ] Rate-limit 429 verified by actually triggering it (both the per-IP and per-event ceilings)
- [ ] `x-forwarded-for` trust spot-checked against real `guest_lookup_attempts` rows, findings reported back
- [ ] `events.slug` generation resolved (built here, or confirmed as someone else's in-flight work) before calling this done
- [ ] Typecheck + lint clean
