# Digital Invitations — Persistence Design

> **Owner:** Abhijith · **Date:** 2026-08-23 · **Status:** Approved-pending-review
> **Scope:** Make the host's personalized invitation card persist (survive reload/navigation) with full fidelity — template, text, per-line sizes, photo-layout background photo, and uploaded-card image. Closes the P3 gap recorded in `CLAUDE.md` ("Nothing persists — no fetch, no localStorage, no API route; the 'Saved' indicator is cosmetic").

---

## 1. Problem (verified)

`app/events/[id]/invitations/` renders a full gallery → editor flow (`InvitationsClient.tsx`, 583 lines). The server page (`page.tsx`) reads only the event's name/date/venue and passes computed `defaultData`; the client edits `contenteditable` slots entirely in memory. There is **no fetch on load, no save handler, and no invitation-card API route anywhere in `app/api/`**. Per-line sizes live only as CSS classes (`is-sz-s` / `is-sz-l`) on DOM nodes — never in React state. Uploaded/background images use ephemeral `URL.createObjectURL` blob URLs.

**Live click-through confirmation (2026-08-23, dev, event `f990d6d7…`):** edited the couple slot to `PERSIST_TEST_123`, reloaded the page → returned to the gallery with every card showing the default `e2e-truth-audit`. The edit was fully lost. Finding is real.

The autosave indicator in the editor header (`cloud_done` icon + "Draft only — not saved") is present but cosmetic — this design makes it real.

## 2. What already exists (do NOT rebuild)

The **database layer is done** (migrations `inv_01`–`inv_06`, applied 2026-06-17 — see `docs/data-model/DATA-MODEL.md` §Invitations module):

- `config.invitation_card_styles` — 5 filter-chip styles (slugs: minimal/royal/floral/modern/photo). Public read.
- `config.invitation_templates` — 7 locked templates (slugs: eternal/saffron/eucalyptus/noir/rosewater/bloom/moments), each with `style_id`, `layout` (`classic`|`photo`). Public read. **This is the slug↔uuid source of truth.**
- `public.event_invitation_cards` — one row per card. **Dual-mode** enforced by a check constraint: template mode (`template_id` set, `card_upload_key` null) OR upload mode (`template_id` null, `card_upload_key` set). Columns already present: `slot_eyebrow`, `slot_couple`, `slot_invite`, `slot_date`, `slot_time`, `slot_venue`, `slot_message`, `template_id`, `card_upload_key`, `photo_bg_key`, `is_custom`, `is_default`, `sub_event_id`, `share_token`, `share_enabled`, `render_status`, owner/audit columns. **Owner-only RLS** (`FOR ALL to authenticated` on `events.user_id = auth.uid()`).
- **Seeding:** `create_event_with_details` already seeds one default main-event card per event (`sub_event_id = null`, `is_default = true`, `template = eternal`, `render_status = draft`).

The R2 upload/read pipeline is done and reused verbatim (see §5): `lib/storage/r2` (`getSignedUploadUrl`, `R2_BUCKET_PRIVATE`), `lib/storage/keys`, and the `app/api/media/[...key]/route.ts` signed-read proxy.

## 3. Scope decisions (locked with founder, 2026-08-23)

| Decision | Choice |
|---|---|
| Card cardinality | **One card per event** — the seeded default main-event card (`is_default=true, sub_event_id=null`). Sub-event cards deferred (I5). |
| Persist per-line sizes | **Yes** — full fidelity. Requires one new column (§4). |
| Persist images | **Yes** — full. Photo-layout BG photo (`photo_bg_key`) and uploaded card (`card_upload_key`) go to R2. |
| Save mechanism | **Debounced autosave** — matches the existing indicator affordance. No explicit Save button added. |
| Initial view on load | **Resume editor if personalized** — if the saved card is personalized (`is_custom=true`), open straight into the editor on it; otherwise show the gallery. |

## 4. Schema change (one migration)

`event_invitation_cards` has no column for per-line text sizes. Add one:

```sql
alter table public.event_invitation_cards
  add column slot_sizes jsonb not null default '{}'::jsonb;
```

- Shape: `{"couple":"l","message":"s", …}` — only slots whose size differs from default need appear; absent slot = default (`m`).
- No new RLS (inherits the table's owner-only policy). No new index (read only via the owner-filtered card fetch).
- Regenerate TypeScript types after applying.

Nothing else in the table changes. `is_custom` flips to `true` the first time the host edits any slot or picks a non-seed template.

## 5. API — three routes (mirror existing patterns exactly)

All under `app/events/[id]/…` → `app/api/events/[id]/invitation-card/`. Auth pattern identical to `website-design/route.ts`: `supabase.auth.getUser()` → `requireEventRead`/`requireEventWrite`. Because invitation cards are **owner-only** (collab access explicitly deferred per D57), the write path is owner-scoped; RLS is the backstop regardless of the module capability string chosen.

### 5.1 `GET /api/events/[id]/invitation-card`
Returns the default card for the event (the `is_default=true, sub_event_id IS NULL` row), or `null` if somehow unseeded.
```
select id, template_id, is_custom, slot_eyebrow, slot_couple, slot_invite,
       slot_date, slot_time, slot_venue, slot_message, slot_sizes,
       card_upload_key, photo_bg_key, share_token, share_enabled
from event_invitation_cards
where event_id = :id and is_default = true and sub_event_id is null
```
Server also resolves `template_id` (uuid) → template slug for the client (see §6).

### 5.2 `PATCH /api/events/[id]/invitation-card`
Zod `.strict()` body (all optional, mirrors `website-design`):
```ts
{
  template_id?: string | null,      // uuid of a config.invitation_templates row (null = upload mode)
  card_upload_key?: string | null,  // R2 private key (set ⇒ upload mode; mutually exclusive with template_id)
  photo_bg_key?: string | null,     // R2 private key, photo-layout only
  slots?: { eyebrow?, couple?, invite?, date?, time?, venue?, message? },  // each string, max 280
  slot_sizes?: Record<slotKey, 's'|'m'|'l'>,
  is_custom?: boolean,
}
```
- Maps `slots.*` → `slot_*` columns; passes `slot_sizes` through as jsonb.
- **Mode integrity:** the handler enforces the dual-mode invariant before write — setting `card_upload_key` nulls `template_id` and vice-versa — so the DB check constraint can never reject a valid user action. Reject a body that sets both to non-null (400).
- Update by the default-card filter (not `upsert on event_id` — the row already exists and multiple cards per event are possible in the schema). Stamp `updated_by`, `updated_at`.
- Validate `template_id`, when present, is a real `config.invitation_templates.id` (defensive; FK is the backstop).

### 5.3 `POST /api/events/[id]/invitation-card/upload-url`
Presigned R2 PUT, copied from `media/upload-url/route.ts`. Body: `{ part: 'photo_bg' | 'card_upload', contentType: 'image/jpeg'|'image/png' }`. Returns `{ url, key }`. Key namespace via a new helper in `lib/storage/keys` (e.g. `invitationBgKey(eventId, uuid, ext)`, `invitationUploadKey(eventId, uuid, ext)`) following the `mediaKey` convention. Bucket = `R2_BUCKET_PRIVATE`; images read back through the existing `media/[...key]` signed-read proxy.

## 6. Client changes (`page.tsx` + `InvitationsClient.tsx`)

**`page.tsx` (server):**
- Fetch the saved card (§5.1) and the template catalog (`config.invitation_templates`: `id, slug`) in parallel with the existing event read.
- Build a `slug→uuid` / `uuid→slug` map; pass the saved card (with template resolved to slug) + the map to the client. Keep passing `defaultData` for slot fallbacks and for a still-pristine card.

**`InvitationsClient.tsx`:**
1. **Hydrate from saved state.** New props: `savedCard`, `templateIdBySlug`. On mount: if `savedCard.is_custom` → open the editor on it (template resolved, slots hydrated, sizes applied, image keys → signed read URLs); else → gallery (current first-run behavior).
2. **Lift sizes into state.** Replace the DOM-classList-only size model with a `slotSizes: Record<SlotKey, SlotSize>` state object. `bumpSize` updates state (and still toggles the class for immediate visual feedback); `EditableSlot` applies the size class from the hydrated size on mount. This makes sizes both saveable and restorable.
3. **Autosave.** A `useSaveCard` hook: debounce (800ms) a PATCH of the current `{template_id, slots, slot_sizes, is_custom}`. Indicator states drive the existing header element: `Saving…` (in-flight) → `Saved · HH:MM` (200) → `Not saved — retry` (error, with the last payload retried on next edit). Autosave fires on: slot text input, size bump, template selection, image key change. Selecting a template immediately persists `template_id` and marks `is_custom=true`.
4. **Images.** On file pick: request an upload URL (§5.3) → PUT the file to R2 → PATCH the returned key (`photo_bg_key` or `card_upload_key`) → render via the signed read URL. Replaces `URL.createObjectURL` for persisted rendering (a local object URL may still be used for instant optimistic preview while the upload completes). Upload mode sets `card_upload_key` and nulls `template_id`; picking a template afterwards reverses it.
5. **Template swap semantics.** Preserve the current confirm modal ("Your edits on this card will be cleared") — on confirm, reset slots to `defaultData`, set the new `template_id`, and autosave. Confirm this copy at click-through before shipping.

No changes to `shell.css` or `designs/components.html` — this is behavior/persistence only, reusing existing `.inv-*` primitives.

## 7. Error handling

- GET/PATCH failures → the indicator shows `Not saved — retry`; the editor stays usable (never blocks typing). Reuse the app's `BusyOverlay`/toast conventions only for hard failures (e.g. image upload failed), not for transient autosave retries.
- Upload failure → toast "Couldn't upload that image — try again", revert to the prior key/preview.
- Unauthorized/not-owner → 401/403 from the route (RLS backstop); client shows a generic error.
- Missing default card (unseeded legacy event) → GET returns null; client falls back to gallery and the first template selection creates state via PATCH against the default filter (PATCH must handle the no-row case by inserting the default card, or the server GET lazily seeds — decide in the plan; simplest is a lazy `ensureDefaultCard` on GET).

## 8. Testing

**Unit (Vitest):**
- slug↔uuid template resolution (both directions, unknown slug → null).
- PATCH body validation: dual-mode invariant (both set → 400), slot length caps, `slot_sizes` value enum.
- Autosave debounce: N rapid edits → 1 PATCH after idle; error → retry payload retained.

**Founder-assisted browser click-through (the finding's before/after):**
1. Edit couple text + bump a line to Large → wait for `Saved` → reload → **card reopens in the editor with identical text and size** (the exact scenario that failed in §1).
2. Swap template → text resets per the modal → reload → new template persists.
3. Photo-layout: add a BG photo → reload → photo persists (served via signed URL).
4. Upload-your-own-card → reload → uploaded card persists.
5. Pristine (never-edited) event → still lands on gallery.

## 9. Out of scope (explicit)

- Sub-event invitation cards (multiple cards per event) — schema supports it; deferred (I5).
- Server-side card render to PNG/PDF (`rendered_card_key`, `rendered_pdf_key`, `render_status` transitions) — future slice; `download` button stays disabled ("Download soon").
- WhatsApp send + read tracking — lives in Guest Management, not here.
- Collaborator (co-host) write access to cards — owner-only stays, per D57's explicit deferral.
- Share-link page (`/invite/[token]`) behavior changes — unchanged by this work.

## 10. Definition of done

- [ ] Migration applied (`slot_sizes` column) + types regenerated + `get_advisors` clean.
- [ ] 3 API routes live, mirroring existing auth/R2 patterns; owner-only enforced.
- [ ] Client hydrates saved card, autosaves text/template/size/images, resumes editor when personalized.
- [ ] Sizes lifted into React state and restored on load.
- [ ] Unit tests green; `tsc` + `eslint` clean.
- [ ] Founder-assisted click-through: all 5 scenarios in §8 pass on a real session.
- [ ] `CLAUDE.md` MVP table row updated (Digital Invitations ⚠️ → ✅ persist), `v0-readiness` artifact updated, session report written.
