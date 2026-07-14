# Event Website (Digital Presence) — Gap Tracker

> **Purpose.** Running sheet of everything the guest-facing event website needs that does **not exist yet** — missing tables, missing host-editor section types, missing Event Settings pages, missing infra. Opened during the 2026-07-10 template-design session (Lovable prompt work), which is **design-only**: we build the visual template, not the backend. Every gap surfaced during design lands here first, then becomes a ClickUp ticket + data-model slice later.
>
> **Owner:** Abhijith · **Opened:** 2026-07-10 · **Status:** OPEN (accumulating during template design)
>
> **Related:** [`designs/_plans/digital-presence-plan.md`](../../designs/_plans/digital-presence-plan.md) · [`designs/_plans/event-website-template-sourcing.md`](../../designs/_plans/event-website-template-sourcing.md) (theme-sourcing strategy + ThemeForest analysis) · [`DATA-MODEL.md`](DATA-MODEL.md) · ClickUp Feature `86d2jwzge` (Digital Presence)

---

## How to read this

- **Area** — `data-model` (new table/columns) · `editor` (host Edit-Pages section type) · `settings` (Event Settings page) · `infra` (storage/routes/auth).
- **Blocks** — which guest-site section can't be fully wired until this closes.
- **Status** — `OPEN` · `TICKETED` (ClickUp id noted) · `DONE`.
- Design proceeds regardless — gaps are for the *content-binding* phase, not the Lovable scratch design.

---

## Gaps

| # | Area | What's missing | Blocks (section) | Proposed shape | Status |
|---|------|----------------|------------------|----------------|--------|
| **G1** | data-model | Per-section **content store** for free-form pages — Story, Wedding Party, Q&A, Registry/Custom have no backing table. Plan §12 flagged `event_website_config` JSONB. | Our Story · Wedding Party · Q&A · Registry/Something | `event_website_config` JSONB on `events` (or a `event_website_sections` table) holding ordered section list + per-section content + on/off + tier. | OPEN |
| **G2** | data-model | **Travel points** — nearby airports / railway stations / bus stands. No table. | Venue &amp; Travel → Getting There | `event_travel_points` (event_id, kind `airport\|railway\|bus`, name, distance_text, travel_time_text, map_link, note, display_order). | OPEN |
| **G3** | data-model | **Suggested stays / accommodations** — host-recommended hotels near the venue. No table (`hotel` editor block is cosmetic-only, unbacked). | Venue &amp; Travel → Where to Stay | `event_stays` (event_id, name, address, distance_text, price_band, booking_url, phone, map_link, note, display_order). | OPEN |
| **G4** | data-model | **Venue geo** — real map embeds need lat/lng or place_id. `events.primary_venue` &amp; `event_sub_events.venue` are free text only. | Venue &amp; Travel → Our Venue(s) (map) | Add `lat`/`lng`/`place_id` to venues, or an `event_venues` table. MVP fallback: store a Google Maps share URL only. | OPEN |
| **G5** | data-model | **Website design/theme persistence** — which of the 4 templates + palette/font/cover/section-order the host chose. Prototype keeps this only in `sessionStorage`. | All (which theme renders) | `event_website_design` (event_id, template_slug, palette, heading_font, cover overrides, section_order jsonb, section_visibility jsonb). | OPEN |
| **G6** | infra/auth | **Guest tokens** for personalized `?g=<token>` auto-unlock links. No table. | Unlock gate · RSVP personalization | `guest_tokens` (guest_id, token, expires_at). | OPEN |
| **G7** | data-model | **Per-sub-event RSVP responses** — `event_guest_sub_events` link table exists (0 rows) but confirm it carries response (`yes\|no\|maybe`) + `plus_one_count` + timestamp. | RSVP | Verify columns on `event_guest_sub_events`; add if absent. | OPEN — verify |
| **G8** | editor | **New host-editor section types** in `edit-page.js` `SECTION_TYPES`: `travel-point` (airport/railway/bus), a real `stay` card (backed), and a proper **Venue block** (map + directions). Current `hotel`/`map` blocks are thin/unbacked. | Venue &amp; Travel | Add 2–3 typed section blocks once G2/G3/G4 land. | OPEN |
| **G9** | editor/infra | **The guest-facing public website itself is not built** — only host-side *preview cards* exist (`designs/pages/website/templates/*.html`). The real scrollable site (`/e/<slug>`) has never been built. | Entire site | This session's Lovable prompt → scratch build → port to `app/e/[slug]/`. | IN DESIGN |
| **G10** | settings | **Event Settings → "Travel & Stay"** sub-page — where the host enters airports/railway/bus + suggested stays. Doesn't exist. Current sub-pages: general, website, admins, guest-list, registry, plan-billing. | Venue &amp; Travel (populates it) | New settings sub-page writing to G2/G3/G4 tables. | OPEN |
| **G11** | settings/editor | **Ownership of free-form content editing** — Story/Party/Q&A currently live in the Website "Edit Pages" editor, not Settings. Decide the single home before wiring so hosts don't edit the same content in two places. | Our Story · Wedding Party · Q&A | Decision, not a table. Recommend: Edit-Pages owns section content; Settings owns structured logistics (travel/stays). | OPEN — decision |

---

## Section → gap map (quick reference)

| Guest-site section | Backing today | Gap(s) |
|---|---|---|
| Hero | `events` + `event_general_settings.tagline` | — |
| Countdown | `events.primary_date` | — |
| Announcement | `event_website_settings.announcement_banner_text` | — |
| Unlock gate | password in `event_website_settings`; token missing | G6 |
| Our Story | — | G1 |
| Schedule | `event_sub_events` (+ `show_on_website`) | — |
| Venue &amp; Travel | `*.venue` text only | **G2, G3, G4, G8, G10** |
| Wedding Party | — | G1 |
| Gallery | `event_media` + `event_albums` | — |
| Q&A | — | G1 |
| RSVP | `event_guests`, `event_guest_settings`, `event_guest_sub_events` | G6, G7 |
| Registry/Something | — | G1 |
| Footer (card download) | `event_invitation_cards` | — |
| Which theme renders | sessionStorage only | G5 |

---

## Next actions (end of session)

- [ ] Turn each OPEN gap into a ClickUp ticket under Feature `86d2jwzge` (Digital Presence) — or a data-model slice ticket where it's schema-only.
- [ ] G11 + G7 are **decisions/verifications**, not builds — resolve before ticketing G1/G8.
- [ ] Sequence: G5 (theme persistence) + G1 (content store) are the spine; G2–G4 (travel) + G10 (settings page) are one coherent "Travel &amp; Stay" slice; G6 (tokens) rides with the RSVP build.
