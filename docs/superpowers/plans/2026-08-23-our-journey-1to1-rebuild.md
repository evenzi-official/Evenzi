# Build Doc — Our Journey page: 1:1 rebuild to match the design

**Owner:** Cursor (auto mode, free NVIDIA model). Build from this Claude-authored spec.
**Review gate:** returns to Claude for a diff + live review before merge.
**Branch:** `feature/our-journey-rebuild` off `Dev-Vibe`.
**Date:** 2026-08-23. Author: Claude (Abhijith session). Raised as Finding #11 in the live bug sweep.

---

## 1. Objective

The React page `app/events/[id]/journey/page.tsx` is a minimal, read-only list ("No sub-events yet" / "Manage on event hub"). The locked design is a full **sub-event management** page. Rebuild the React page to be a 1:1 copy of the design, wired to real data.

**Design source of truth:** `designs/pages/event-control/our-journey.html` + `designs/pages/event-control/our-journey.css` + `designs/pages/event-control/our-journey.js`. Read all three first. The `.oj-*` CSS classes the design uses already exist in `our-journey.css` — port them into the app's stylesheet system the same way other converted pages did (check how a recently-converted page like Guests or Planning brought its page CSS across; do NOT inline styles).

**REUSE FIRST (hard rule — CLAUDE.md "Reuse Before Create"):** most of what this page needs already exists. Do not build new versions of components that already ship. Reuse the ones listed in §3 and extend via props/modifiers only. A same-purpose duplicate is a review-blocking defect.

## 2. What the page must have (from the design)

1. **Header** — eyebrow "Our Journey", title "Sub-events & functions", the full subtitle about the Event Control roadmap + public website schedule.
2. **Summary bar** — two pills: `N FUNCTIONS` and `X HELD · Y TO COME`; plus an **Add sub-event** primary button (right-aligned).
3. **Sub-event rows** (`.oj-row`), one per `event_sub_events` row, in roadmap order:
   - Type icon (from the `config.event_sub_types.icon_name` catalog — same resolution the hub uses).
   - Title (custom_name, else the type name).
   - Status badge: **Held** (date in the past), **Next up** (nearest upcoming function), **The big day** (the wedding-ceremony row — the design gives it the `is-marquee` treatment). Rows with no special status show no badge.
   - Meta line: `date · time · venue` (omit missing parts; the hub already formats these — match its format).
   - **Website toggle** (per row) → persists `show_on_website`.
   - **Edit** and **Delete** icon buttons.
4. **Add / Edit modal** (one modal reused for both): Function name (required, inline error "Give this function a name."), Type (dropdown from the sub-event type catalog), Date, Time, Venue, and a "Show on event website" toggle. Primary CTA reads "Add sub-event" (add) or "Save changes" (edit). **CTA disabled until the name is filled** (aligns with the platform-wide CTA-gating rule in `2026-08-23-cta-gating-platform-wide.md`).
5. **Remove-confirm** dialog — "Remove this function?" with the function name in the body; destructive confirm.
6. **Empty state** — when the event has no sub-events, show the design's empty card with "Add your first sub-event".
7. **Footer note** — the tip about toggling Website off to keep a function private.

## 3. Components to REUSE (do not rebuild)

| Need | Reuse this | Notes |
|---|---|---|
| Per-row + in-modal toggle | `components/ui/ToggleSwitch.tsx` | already used in 6+ places (SecuritySection, WebsiteContent, ScheduleEditor…) |
| Remove-confirm dialog | `components/ui/ConfirmDialog.tsx` | destructive `tone="danger"`; already the platform standard |
| Save / busy freeze | `components/ui/BusyProvider.tsx` → `useBusy()` | wrap mutations in `runBusy` / `setBusy` like other pages |
| **Add/Edit sub-event form** | `app/events/create/components/Step3Modals.tsx` + `SubEventCard.tsx` | the create wizard already has a sub-event add/edit modal. Reuse/adapt its form fields + validation rather than authoring a new modal. If it needs to work outside the wizard's local state, lift the form body into a shared component both can use — do NOT fork a parallel modal. |
| Type dropdown + icon map | `config.event_sub_types` catalog (id, name, icon_name) — resolved exactly as `app/events/[id]/page.tsx` does (see `typesById`, `WEDDING_ROADMAP_ORDER`) | drive the Type `<select>` from the catalog, not the design's hardcoded option list |
| Breadcrumb, footer | `components/layout/Breadcrumb`, `components/layout/PageFooter` | already in the current journey page — keep them |
| Roadmap order + status | the hub's `WEDDING_ROADMAP_ORDER` + date logic in `app/events/[id]/page.tsx` | extract to a shared helper if reused across both, don't copy-paste |
| Form primitives | `form-group` / `form-input` / `form-select` / `form-error` classes in `shell.css` | no new form CSS |

## 4. Backend changes

Existing: `PATCH app/api/events/[id]/sub-events/[subId]/route.ts` accepts **only** `{ show_on_website: boolean }`.

Needed:

1. **Extend PATCH** to also accept (all optional, `.strict()` union or a widened schema): `custom_name` (string, trimmed, non-empty when present), `event_sub_type_id` (uuid, must exist in `config.event_sub_types`), `event_date` (date|null), `start_time` (time|null), `venue` (text|null). Keep the `requireEventWrite(..., 'website')` guard; confirm that capability is the right one for editing function details (if editing details needs a broader capability than the website toggle, use the appropriate one — check `lib/auth/eventAccess`). Preserve `updated_at` bump.
2. **New POST** `app/api/events/[id]/sub-events/route.ts` (collection route) — create a sub-event: required `custom_name` or `event_sub_type_id`, optional date/time/venue, `show_on_website` default true, `display_order` = max(existing)+1, `status` default the same value the create wizard uses (check what `create_event_with_details` / the wizard sets — likely `'tbc'`). Scope to `event_id`, guard with `requireEventWrite`.
3. **New DELETE** `app/api/events/[id]/sub-events/[subId]/route.ts` — hard delete the row scoped to `event_id`, `requireEventWrite` guard. (Confirm no FK dependents block a hard delete — e.g. guest↔sub-event assignments; if there are, delete/cascade them or block with a clear error.)

Follow the existing route's patterns exactly: zod validation, uuid checks, auth via `supabase.auth.getUser()`, `requireEventWrite`, JSON error shapes, `console.error` on failure.

## 5. Data / behaviour notes

- The current journey query was just fixed to resolve type names via a **direct `config` query, not a cross-schema embed** (see `journey/page.tsx` and the pattern in planning/guests pages). Keep that pattern; also pull `icon_name`, `start_time`, `show_on_website`, `status`, `display_order` now that the page needs them.
- Status derivation is **client/server-computed from dates**, not a stored "held/next" flag. "The big day" = the wedding-ceremony type (match on the catalog type, not a hardcoded string if avoidable).
- Optimistic updates on toggle/delete with rollback on failure (the platform pattern — see Planning/Media mutations).
- Mobile-first; the design's row actions must stay reachable at 360px. Verify no horizontal scroll at 360/390/414/768/1024/1440.

## 6. Pixel-parity testing (required — Antigravity, then Claude review)

After the build compiles and works, run a pixel-by-pixel parity pass against the design. Antigravity owns this automated visual/responsive pass; Claude reviews the report before merge.

**Setup — both surfaces side by side:**
- Design (source of truth): `npm run design` → `http://localhost:4000/pages/event-control/our-journey.html` (static demo content: "Anya & Kabir", 6 functions incl. one Held / one Next up / the wedding-ceremony "big day").
- React (the build): `npm run dev` → `http://localhost:3000/events/<id>/journey`.
- **Seed a matching fixture event** so the two show the same data: create (or SQL-seed) an event whose sub-events mirror the design's six rows (Pre-wedding shoot = past → Held; Mehendi = nearest upcoming → Next up; Haldi, Sangeet; Wedding ceremony = The big day; Reception), with the same dates/venues. Without matching data the comparison is meaningless. Record the fixture event id in the findings doc.

**Method — capture, overlay, diff at every breakpoint:** 360, 390, 414, 768, 1024, 1440 px.
1. Screenshot the design page and the React page at each width, full-page.
2. Overlay/diff each pair (Antigravity's visual-diff, or an image-diff of the two PNGs).
3. Log every deviation with a screenshot pair and the pixel delta.

**Parity checklist — the two must match on:**
- [ ] Header: eyebrow, title, subtitle — font family, size, weight, line-height, color, spacing.
- [ ] Summary pills: text, padding, height (h-8), tint colors, gap; the "Add sub-event" button position/size.
- [ ] Each row: icon glyph + fill + tint, title type, status badge (Held / Next up dot / The big day) colors + shape, meta line format/color, the `is-marquee` "big day" row treatment, the `is-next` treatment.
- [ ] Row actions: Website label + toggle on/off states, edit + delete icon buttons — size, spacing, alignment.
- [ ] Add/Edit modal: field order, labels, placeholders, the required-name inline error, the show-on-website toggle row, Cancel/Save button placement, the disabled CTA state.
- [ ] Remove-confirm: icon, title, body copy, Keep it / Remove buttons.
- [ ] Empty state + footer tip note.
- [ ] Light and dark themes both match (toggle the theme on each surface).
- [ ] No horizontal scroll on any width; touch targets ≥44px at mobile widths.

**Tolerance:** anti-aliasing / sub-pixel font rendering differences are acceptable. Layout, spacing, sizing, color tokens, and every state must match. Real content will differ from the demo copy — that is fine; **structure, spacing, and styling must be identical**.

**Iterate** until parity, logging each round in `docs/testing/2026-08-23-our-journey-parity-findings.md` (per-breakpoint before/after). Do not mark done while any layout/spacing/color/state deviation remains open.

## 7. Definition of done

- [ ] `app/events/[id]/journey/page.tsx` (+ a client component) renders the design 1:1: header, summary pills, rows with icon/status/meta/toggle/edit/delete, add/edit modal, remove-confirm, empty state, footer note.
- [ ] Reused `ToggleSwitch`, `ConfirmDialog`, `useBusy`, the create-wizard sub-event form, Breadcrumb, PageFooter — **no duplicated components**. Cite each reuse in the PR description.
- [ ] Type dropdown + row icons come from the `config.event_sub_types` catalog.
- [ ] PATCH extended; POST + DELETE added; all guarded by `requireEventWrite`, zod-validated, event-scoped.
- [ ] Add / edit / delete / website-toggle all work live against Supabase; optimistic + rollback.
- [ ] Add/Edit CTA disabled until the name is filled.
- [ ] `npx tsc --noEmit` clean; no new CSS beyond porting the design's `.oj-*` classes.
- [ ] Live-tested at 6 breakpoints; no horizontal scroll.
- [ ] **Pixel-parity pass (§6) complete** — design vs React diffed at all 6 breakpoints, light + dark, all deviations resolved, findings logged in `docs/testing/2026-08-23-our-journey-parity-findings.md`.
- [ ] Diff + live review by Claude before merge.

## 8. Out of scope

- Drag-to-reorder rows (design has none — order is derived).
- Any change to the create-event wizard's own sub-event step beyond extracting a shared form body if that is the clean reuse path.
- Guest↔sub-event assignment UI.
