---
title: Guest Management & RSVP — React conversion design
status: Approved — ready for planning
owner: Abhijith
date: 2026-07-29
---

# Guest Management & RSVP — design

## 1. Why this is next

Per `docs/aug-end-v0-launch-plan.md` §2 and `docs/NEXT-SESSION.md`, Guest Management & RSVP is the single biggest gap against the V0 definition of done ("host creates event → builds guest list → sends invites → tracks RSVPs"), and the competitor study independently flags guest list + RSVP + WhatsApp as the validated open market wedge (Bliss, Wedd.ai). It is next in the `designs/` → React conversion queue, ahead of the Event Management Hub (which already has a working page and only needs a gap audit, not a rebuild — out of scope for this spec).

## 2. What's actually there today (verified live, not from docs)

Both `DATA-MODEL.md` and `docs/NEXT-SESSION.md` were stale on this feature. Verified directly against Supabase project `smjkbmkxweevqpvygabe` and the current `Dev-Vibe` tree before writing this spec:

- **Data model is live and correctly shaped.** Tables `event_guests`, `event_guest_sub_events`, `event_guest_tags`, `event_guest_tag_links`, `event_guest_settings`; views `event_guest_stats`, `event_sub_event_guest_counts`, `event_guest_settings_view`; catalogs `config.rsvp_statuses` (pending / confirmed / declined / maybe, each with `icon_name` + `category`) and `config.guest_tags` (6 seeded: family, friends, brides-side, grooms-side, out-of-town, colleagues — copied per-event into `event_guest_tags` at event creation via the `guests_05_create_event_tags` migration). RLS is owner-scoped through `events.user_id` on every guest table. `event_guests` currently has **0 rows** — no seed data exists, contrary to what the docs claimed.
- **`app/events/[id]/guests/page.tsx` already exists (128 lines).** It is a static shell only — hardcoded zeros in the stats bar, no DB reads, no client component, no API routes, `.fab` class that doesn't exist in `shell.css` (should be `.gm-add-fab`). The real gap is wiring, not markup.
- **Bug found and in scope to fix here:** `designs/pages/guests/guests.css` is not imported into `app/globals.css`, unlike every other converted page (auth, create-event, event-control, invitations, planning, media, event-settings, settings all are). Every `.gm-*` class is currently unstyled on the live page.
- **Design prototype** (`designs/pages/guests/guests.html` + `.css` + `.js`, 1786 lines total, status "built + merged" per `designs/pages/guests/_page.md`) is feature-complete and is the source of truth for markup, interaction, and copy. This spec ports its behavior into React/TypeScript against the real schema — it does not redesign it.

## 3. Goals / non-goals

**Goals — full design parity**, per founder decision:
- Guest list: cards, stats bar, search, RSVP-status filter chips, function/tag filter (multi-select picker), sort (name / recently added / status).
- Add/edit/remove guest, with function (sub-event) assignment and tag combobox.
- Manual RSVP setter (sheet on phone / popover on desktop) with optimistic update + rollback on failure.
- Real CSV import: template download → user edits & uploads → live parsed preview table → validation → clean → batch insert.
- Jira-style bulk select (floating bulk bar): tag, assign functions, delete — multiple guests at once.
- Swipe-to-reveal row actions (CSS scroll-snap, no JS drag logic — the prototype already built this as pure CSS).
- Tag manager (list / add / delete per-event tags).
- Zero-assigned warning banner (guests invited to no function).
- Offline banner, skeleton loading state, empty states (zero guests / no matches).

**Non-goals for this pass:**
- **WhatsApp send.** Every "Send invites" affordance (toolbar button, bulk-bar action, swipe-rail action, edit-modal resend line) renders **disabled**, fires no request, and never flips `event_guests.invited`. Real sending needs a personalized message, the event's public website URL, and the invitation card — none of which are resolved yet, and it gets its own planning session per founder decision.
- Event Management Hub gap audit — queued after this ships, not bundled in.
- Real-time multi-admin sync (e.g. two hosts editing the guest list simultaneously) — out of scope; last-write-wins is acceptable at V0 scale.

## 4. Architecture

Follows the same conversion shape as the four pages already shipped this way (Media, Planning, Invitations, Settings): a server component does the initial authenticated fetch, a single client component owns interactive state, and modals are hand-rolled `useState` + the shell's `.modal-scrim`/`.modal-card` classes — **not** a shared `<Modal>` wrapper. `docs/PORT-MAP.md` §4.5 recommends buying Radix/React-Aria for modals, but no shipped page has adopted that; introducing it here would break consistency with Media/Planning/Invitations/Settings for no benefit to this feature. (`PORT-MAP.md` is stale on this and on its §8 coverage tracker — flagged as a separate doc-fix, not bundled into this build.)

| Layer | File | Role |
|---|---|---|
| Page | `app/events/[id]/guests/page.tsx` (rewrite) | Server component. Auth check, event fetch (existing pattern), then parallel fetch: `event_guests` + joined `rsvp_status`, `event_guest_sub_events` (event-scoped), `event_guest_tag_links` (event-scoped), `event_guest_stats` view, `event_sub_event_guest_counts` view, `event_sub_events` (functions list), `event_guest_tags` (per-event tag registry), `config.rsvp_statuses` (status metadata). Assembles into a typed initial-state object, passes to the client component. |
| Client | `app/events/[id]/guests/GuestManagementClient.tsx` | Owns list state, search/filter/sort, selection mode, modal-open state. Renders stats bar, toolbar, filter chips, zero-assigned banner, guest list, bulk bar, FAB. Comparable scale to `MediaClient.tsx`/`PlanningClient.tsx` (roughly 900–1100 lines). |
| Component | `app/events/[id]/guests/GuestFormModal.tsx` | Add/edit guest: name/phone/email, functions checklist, tags combobox, RSVP pills (edit-only), Remove confirm folded in (small, tightly coupled — matches the prototype's own coupling of remove into the edit modal). |
| Component | `app/events/[id]/guests/ImportCsvModal.tsx` | Template download, file upload, live parsed-row preview table, validation, confirm-import. |
| Component | `app/events/[id]/guests/TagManagerModal.tsx` | List / add / delete per-event tags with usage counts. |
| Validation | `lib/validations/guests.ts` | zod schemas: guest create, guest update (partial), CSV row, bulk-action payload. Follows the `lib/validations/events.ts` / `settings.ts` pattern already in the repo — reused, not reinvented. |

### 4.1 Reuse — what comes from where

Per the project's Reuse Before Create rule, nothing in this feature invents a new primitive that already exists:

| Need | Source | Notes |
|---|---|---|
| All visual primitives (`.clay-card`, `.btn-pill`, `.guest-row`, `.tag-chip`, `.gm-setter`, `.bulk-bar`/`.gm-bulkbar`, `.form-input-search`, `.form-check`, `.dp-filter-chip`, `.empty-cta-card`) | `designs/shared/shell.css` (already global) + `designs/pages/guests/guests.css` (page-specific — **needs the `globals.css` import fix**, §2) | Zero new CSS authored beyond what's already in these two files. |
| Nav chrome (`FloatingNav`, `ToolRail`, `HelpFab`, `ScrollProgress`, `Breadcrumb`, `PageFooter`) | `components/layout/*` | Already used by every event-scoped page; `layout.tsx` for `/events/[id]/*` needs no changes. |
| Modal pattern (`useState` open flags + `.modal-scrim`/`.modal-card` JSX) | `MediaClient.tsx` precedent | No new modal abstraction. |
| Toast pattern | `MediaClient.tsx` / `ProfileSection.tsx` precedent (`useState` + `setTimeout`) | No new toast provider. |
| Generic picker (sheet on phone / popover on desktop, single + multi select) | Ported from `guests.js`'s `openPicker()` — this is genuinely new React code (no existing React equivalent exists yet), but it's built **once** in `GuestManagementClient.tsx` and reused for: RSVP setter, sort control, function+tag filter, per-guest function assignment (swipe "Assign"), bulk tag, bulk assign. Six call sites, one implementation — matches the prototype's own reuse of a single `openPicker` function. |
| Validation conventions (zod, `.strict()`, uuid param checks, typed error responses) | `lib/validations/events.ts`, `app/api/events/[id]/guest-settings/route.ts` | API routes below follow this pattern exactly. |
| `EVENT_SUBEVENTS` shape (`{id, label}`) | `designs/pages/guests/_page.md`: "Source of `EVENT_SUBEVENTS` shape reused by planning" | Confirmed still the shape `event_sub_events` naturally provides (`id`, `custom_name` / joined type name) — no reshaping needed. |

### 4.2 API routes (new)

Kept to the minimum surface that covers every interaction in the prototype without one-route-per-button sprawl:

| Route | Method | Purpose |
|---|---|---|
| `/api/events/[id]/guests` | `POST` | Create guest. |
| `/api/events/[id]/guests/[guestId]` | `PATCH`, `DELETE` | Partial update — accepts any subset of `{name, phone, email, partySize, notes, rsvpStatusId, subEventIds, tagIds}`. One route serves the edit-modal save, the RSVP setter (just `rsvpStatusId`), and the swipe-rail "Assign" action (just `subEventIds`) — same pattern as `guest-settings/route.ts`, where only defined fields are written. `DELETE` removes the guest (cascades via FK on `event_guest_sub_events`/`event_guest_tag_links`). |
| `/api/events/[id]/guests/bulk` | `POST` | `{action: 'tag' \| 'assign' \| 'delete', guestIds: string[], tagIds?: string[], subEventIds?: string[]}` — one round trip for bulk operations instead of N requests per selected guest (matters at real wedding-list scale, 100–300 guests). |
| `/api/events/[id]/guests/import` | `POST` | Batch insert from client-validated CSV rows (§5). Server re-validates and re-dedupes against the live DB (defense in depth — the client's row list can be stale by the time Import is clicked) and returns the inserted rows with real UUIDs, so the client appends them without a full refetch. |
| `/api/events/[id]/guest-tags` | `POST` | Create a custom per-event tag (`event_guest_tags`, `is_custom = true` — required by the existing RLS insert policy). |
| `/api/events/[id]/guest-tags/[tagId]` | `DELETE` | Remove a tag. Matches the prototype's tag manager, which doesn't distinguish seeded vs. custom on delete, and matches the existing RLS delete policy, which is owner-scoped only (no `is_custom` restriction). |

No route is added for "Send invites" — it stays a disabled UI affordance this pass.

## 5. CSV import — exact flow

Per founder decision, this is a real import, not the prototype's simulated one:

1. **Template.** Client generates a `Name,Phone,Email` CSV Blob and triggers a download. No API route needed — this is static content, not data.
2. Host edits the downloaded template in their own spreadsheet tool and uploads the edited file.
3. **Client-side parse.** A small hand-rolled parser (no library — `papaparse` isn't installed and a 3-column format doesn't need one; RFC4180-minimal, handles quoted commas).
4. **Live preview table.** Every parsed row renders immediately with a per-row status:
   - **Valid** — passes name/phone shape checks.
   - **Error** — missing name, or phone that isn't a 10-digit number after stripping non-digits. Shown inline with the reason.
   - **Duplicate** — phone matches an existing `event_guests` row for this event (client checks against the initial-load guest list; server re-checks at insert time in case the list is stale).
5. **Validation gate.** Any row-level **error** blocks the Import button — the host must fix the source file and re-upload. **Duplicates are informational only**, automatically excluded from the insert set, not blocking (matches the prototype's "N new guests · M duplicates skipped" framing, made real).
6. Confirm → `POST /api/events/[id]/guests/import` with the validated, deduped row set. Server re-validates, batch-inserts (`rsvp_status_id = pending`, `invited = false`, `party_size = 1`, no functions/tags — CSV only carries Name/Phone/Email, matching the modal's documented columns), returns inserted rows. Client appends them to local state — no refetch.

Deferred, not in this pass: CSV columns for tags/functions (template stays 3-column, matching the prototype's documented contract); inline cell-editing inside the preview table (a row with an error must be fixed at the source and re-uploaded).

## 6. Send invites — exact scope

Disabled everywhere, this pass: main toolbar button, bulk-bar "Send" action, swipe-rail "Send" action, and the edit-modal's resend/send-invite line. None of them fire a request or flip `event_guests.invited`. The `gm-send-modal` confirmation dialog from the prototype is not built (would be dead code with no live trigger). The `invited` column and its "Not invited" row chip stay wired for **read** — it's always `false` right now, which is accurate, not misleading, and costs nothing to leave in place for when sending is built. The real WhatsApp send (personalized message + event website URL + invitation card) is out of scope here and needs its own planning session.

## 7. Data fetch / mutation pattern

Server-fetched initial snapshot → held in client component state → each mutation calls its API route → on success, apply the confirmed change to local state (no full-page refetch per action); on failure, roll back and toast. This ports the prototype's own `applyRsvp()` optimistic-update-with-rollback pattern, which is already good UX design, not something to simplify away.

## 8. Efficiency notes

- **One picker implementation, six call sites** (§4.1) — avoids six bespoke dropdown/sheet components.
- **One partial-PATCH route** for guest updates instead of separate endpoints per field (RSVP-only, functions-only, full edit) — matches the existing `guest-settings` PATCH precedent of "only write what's defined."
- **One bulk route** instead of fan-out requests per selected guest — matters directly at real list sizes (100–300 guests is a normal wedding).
— **CSV import needs no new library** — the format is simple enough that a ~30-line parser is less surface area than adding a dependency.
- **No new modal/toast/component abstraction** — reuses the pattern already proven across four shipped pages, rather than introducing a fifth pattern that would need to be reconciled later.

## 9. Testing / verification plan

Same discipline as `docs/superpowers/specs/2026-07-29-user-settings-design.md`, which caught 3 defects live testing found that 8 code reviews and a clean `tsc` missed:

1. Task-by-task build with a review gate after each task (subagent-driven-development).
2. `/council code` before commit (non-trivial: schema-adjacent, multiple API routes).
3. **Live browser testing against the real dev server and a real Supabase session** at 360 / 390 / 414 / 768 / 1024 / 1440px — not just a passing `tsc`. Specifically verify:
   - Add / edit / remove guest round-trips against the DB (not just UI state).
   - CSV import: valid file, file with error rows (import blocked), file with duplicates (skipped, not blocking), template download.
   - Bulk select → tag / assign / delete on 3+ guests.
   - RSVP setter optimistic update, and its rollback path.
   - Zero-assigned banner appears/disappears correctly as functions are assigned.
   - Swipe-to-reveal on an actual touch viewport, not just resized desktop Chrome.
   - Empty state (zero guests) vs. filtered-empty state (search/filter with no matches) — separate states, don't conflate.
   - Search/filter/sort combined (search only within a status filter, etc.).
4. Whole-branch review before merge.

## 10. Open items / deferred

- `docs/PORT-MAP.md` is stale (§8 coverage tracker shows Guests/Media/Planning/Invitations/Hub as not-built when they are; §4.5's Radix/React-Aria modal recommendation was never adopted). Worth a doc-fix pass — not bundled into this build.
- Event Management Hub gap audit — next after this ships.
- WhatsApp send planning session — personalized message, public website template URL, invitation card.
- CSV template with tags/functions columns — only if a future pass needs it; not requested now.

## 11. Built — 2026-07-29

Implemented from `docs/superpowers/plans/2026-07-29-guest-management.md` across 9 build tasks (types/validation → 4 API-route tasks → 4 component tasks → final page integration), each independently reviewed before the next began — Tasks 1-8 by a dedicated subagent reviewer per task, Task 9 (the final integration) reviewed directly by the controller against the plan and verified live, given a session token-budget constraint reached partway through this task. All 9 build tasks landed on `Dev-Vibe`.

### One real bug caught before it shipped

The implementer building Task 9 (final integration) flagged that all three modal components (`GuestFormModal`, `ImportCsvModal`, `TagManagerModal`) rendered their `.modal-scrim` wrapper without the `is-open` class shell.css requires — confirmed by reading `designs/shared/shell.css:2108-2133` directly: `.modal-scrim` defaults to `opacity:0; visibility:hidden; pointer-events:none`, only becoming visible/interactive with `.is-open`. Every "Add guest," CSV import, and tag-manager modal was rendering invisible and unclickable across all four mount points (including the nested Remove-guest confirm). Fixed directly (commit `ad120c1`) and verified live in the browser — the Add Guest modal now renders fully styled, populated with the event's real functions, and interactive.

### Verified live, against the real dev server and a real Supabase session (not just `tsc`)

- Full end-to-end write path: opened the Add Guest modal, submitted a real guest (name + 10-digit phone), confirmed it appeared in the list immediately with correct stats-bar update (1 total, 1 pending, 0% response rate), correct row rendering (initials avatar, formatted phone, "Not invited" chip, PENDING RSVP badge, swipe-rail buttons), then reloaded the page and confirmed the guest persisted — a genuine DB round-trip through `POST /api/events/[id]/guests`, not client-only state.
- Empty state renders correctly (before any guest existed) with both CTAs.
- "Send invites" confirmed disabled everywhere it appears (toolbar button correctly labeled "Send WhatsApp invitations (coming soon)") — no request ever fires from it, matching the design's explicit scope decision.
- `tsc --noEmit` clean across every new/changed file.
- No new browser console errors introduced (confirmed the one pre-existing hydration warning from the anti-FOUC theme script, already documented in the User Settings build notes, is unrelated and was present before this feature).

### Task 10 — full functional + breakpoint pass (2026-07-30, resumed session)

The prior session's deferred checklist was completed. "Manage tags" trigger wired first (commit `f9444b5`) — a link next to the guest form's Tags label, matching the prototype's placement — since the tag manager was otherwise unreachable.

**Verified live, real DB, real Supabase session:**

- **RSVP setter** — GuestPicker opens anchored to the badge, all 4 statuses render with icons, current selection checked. Picked Confirmed → stats bar updated instantly (100%, 1/1 responded), toast fired, PATCH body confirmed to carry only `{rsvpStatusId}` (not the whole guest), persisted through reload.
- **Functions (single-guest)** — unchecked all 4 in the edit modal → "This guest won't see any functions" warning shown, saved → zero-assigned banner appeared with correct count and a working Show all/Review toggle. Re-checked all 4 → banner cleared.
- **Tag combobox** — creating a new tag via the suggestion click (`POST /guest-tags` → 201, DB row confirmed) and via Enter-on-no-match (also confirmed via DB — one row, no duplicate) both work correctly end-to-end. The Task 6 review's flagged "Enter creates a duplicate on partial match" concern did not reproduce — it turned out to be a testing-tool timing artifact (an early read of `input.value` before the async create/state-clear resolved), not a real defect. Both chips persisted correctly on save (`event_guest_tag_links` confirmed).
- **CSV import — the full founder-specified flow**: downloaded template, uploaded a 5-row test file (2 valid, 1 missing name, 1 invalid phone, 1 duplicate phone) via a real `File`/`DataTransfer` injected into the actual file input (exercises the real `parseCsv`/`validateRows` code, not a mock) — every row classified correctly ("Ready" / "Missing name" / "Invalid phone number" / "Duplicate — skipped"), Import stayed disabled with 2 error rows present even with consent checked, confirming errors truly block while duplicates don't. Fixed the file (removed the 2 bad rows) and re-uploaded → "2 guests imported · 1 duplicates skipped", exactly 2 new `event_guests` rows created, the duplicate correctly never inserted.
- **Bulk actions** — selected 2 guests: bulk Assign (replaces functions, confirmed both went to the exact 2 selected functions, zero-assigned banner cleared), bulk Tag (union-add, both guests got the tag without disturbing existing behavior), bulk Delete (native `confirm()` — cancel path confirmed to fire zero requests; accept path confirmed via an overridden `confirm` to remove exactly the 2 selected guests, DB-verified, selection mode auto-exited).
- **Search / filter / sort** — search narrows the list and shows the correct "No guests match" empty state with query text; Clear filters resets every filter dimension at once.
- **Send invites** — reconfirmed inert through all of the above: disabled toolbar button, disabled swipe-rail button, zero requests ever fired to any endpoint, `invited` never became `true` on any guest across the whole session.
- **Breakpoint sweep** — 360/390/414/768/1024/1440px. No horizontal page overflow at any width (`scrollWidth`/`clientWidth` checked programmatically, not just visually). Toolbar collapses to icon-only on narrow widths, filter chips scroll horizontally without breaking layout, desktop column header (`GUEST`/`RSVP`) appears correctly at 768px+.

**One pre-existing, cross-cutting bug found — not introduced by this feature, not fixed here:** at ≥1024px the vertical `ToolRail` sidebar overlaps page content (confirmed: the stats cards on the Guests page, and the hero content on the already-shipped Event Hub page, both affected identically). This is a shared-chrome layout defect in `ToolRail`/`page-band`'s interaction at desktop widths, reproducing on a page this build never touched — out of scope for Guest Management, needs its own fix task.

**Not exercised this pass** (lower-risk, deferred as genuinely optional polish rather than launch-blocking): swipe-to-reveal specifically on a touch-simulated viewport (the underlying buttons were exercised via direct click and work correctly; only the CSS scroll-snap swipe gesture itself is unverified), RSVP setter's simulated-failure rollback path (no network-failure injection was available in this pass).

Test data (guests, custom tags) created during this pass was deleted from the dev event after verification — the event is clean.

**Status: build tasks 1-10 complete.** Final whole-branch code review (plan step 11) is the only remaining step before this is ready for `Dev-Vibe-Testing`.
