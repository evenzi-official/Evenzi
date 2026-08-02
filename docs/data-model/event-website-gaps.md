# Event Website (Digital Presence) — Gap Tracker

> **Purpose.** Running sheet of everything the guest-facing event website needs that does **not exist yet** — missing tables, missing host-editor section types, missing Event Settings pages, missing infra. Opened during the 2026-07-10 template-design session (Lovable prompt work), which is **design-only**: we build the visual template, not the backend. Every gap surfaced during design lands here first, then becomes a ClickUp ticket + data-model slice later.
>
> **Owner:** Abhijith · **Opened:** 2026-07-10 · **Status:** OPEN (accumulating during template design) · **Re-verified against live DB + full host-editor code scan 2026-07-30** — all gaps below independently confirmed still open, no drift. One new gap added (G12).
>
> **2026-07-30 — full data-model spec drafted, council-reviewed (Tech Lead/Data Modeller/Security Expert/Backend Engineer), revised, and Wave 1 migrated to the live DB:** [`docs/superpowers/specs/2026-07-30-event-website-data-model-spec.md`](../superpowers/specs/2026-07-30-event-website-data-model-spec.md) · [`DATA-MODEL.md` D49](DATA-MODEL.md#decision-log). **Wave 1 is LIVE** — migrations `website_01`–`website_10` applied, `get_advisors` clean, TypeScript types regenerated. Resolves **G1 (DONE)**, **G2 (DONE)**, **G3 (DONE)**, **G4 (DONE, MVP fallback)**, **G5 (DONE)**, **G7 (DONE — per-sub-event RSVP confirmed + columns live)**, **G13 (DONE)**. **Wave 2** (public site + guest lookup, first-ever `anon` RLS surface) is spec'd but **not migrated** — gated behind its own dedicated council pass. G9 stays open (public site itself, Wave 2 + React port). G8 (new host-editor section types) is now largely moot — Story/Wedding Party/Q&A got dedicated tables instead of generic sections, see G1 update below. G10/G11 remain open product/UI-placement decisions, not schema-blocking. G12 stays open (seed data only, moved to Digital Invitations' backlog).
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
| **G1** | data-model | Per-section **content store** for free-form pages — Story, Wedding Party, Q&A, Registry/Custom have no backing table. Plan §12 flagged `event_website_config` JSONB. **Resolved differently than proposed:** Story/Wedding Party/Q&A got dedicated typed tables (`event_story_blocks`/`event_wedding_party_members`/`event_qa_items`), not a jsonb blob — founder call. Registry/Custom still uses the generic `event_website_sections` jsonb table. | Our Story · Wedding Party · Q&A · Registry/Something | ~~`event_website_config` JSONB~~ → 3 dedicated tables + `event_website_sections` for the remainder. Live. | **DONE — `website_03`/`website_04`** |
| **G2** | data-model | **Travel points** — nearby airports / railway stations / bus stands. No table. | Venue &amp; Travel → Getting There | `event_travel_points` (event_id, kind `airport\|railway\|bus`, name, distance_text, travel_time_text, map_link, note, display_order). Live. | **DONE — `website_05`** |
| **G3** | data-model | **Suggested stays / accommodations** — host-recommended hotels near the venue. No table (`hotel` editor block is cosmetic-only, unbacked). | Venue &amp; Travel → Where to Stay | `event_stays` (event_id, name, address, distance_text, price_band, booking_url, phone, map_link, note, display_order). Live. | **DONE — `website_05`** |
| **G4** | data-model | **Venue geo** — real map embeds need lat/lng or place_id. `events.primary_venue` &amp; `event_sub_events.venue` are free text only. | Venue &amp; Travel → Our Venue(s) (map) | MVP fallback shipped: `map_link text` on both `events` and `event_sub_events` (Google Maps share URL). Real `lat`/`lng`/`place_id` deferred until map embeds need more than an iframe link. | **DONE (MVP) — `website_05`** |
| **G5** | data-model | **Website design/theme persistence** — which of the 4 templates + palette/font/cover/section-order the host chose. Prototype keeps this only in `sessionStorage`. **2026-07-30 finding:** the React host-editor mock (`app/events/[id]/website/design/page.tsx`) doesn't even match the design prototype's theme set — hardcodes 6 different theme names (classic/modern/garden/golden/midnight/heritage) vs. the prototype's 5 (classic-romance/minimal-modern/bold-festive/garden-soft/midnight-elegant). No shared source of truth exists between design and app, unsurprising since there's nowhere to persist to. | All (which theme renders) | `event_website_design` (event_id, template_id, palette_id, heading/body_font_id, cover/og image keys). Live — `template_id` nullable since `config.website_templates` is seeded empty until the lineup locks. **Wiring the React mock to this table + fixing the theme-name mismatch is still an app-layer task**, not a data-model gap anymore. | **DONE (schema) — `website_02`** |
| **G6** | infra/auth | **Guest tokens** for personalized auto-unlock/session. No table. **Mechanism changed from `?g=<token>` links to phone+name self-lookup** (founder call) — session token still created via `guest_tokens`, just minted on successful lookup instead of pre-generated. | Guest personalization · RSVP | `guest_tokens` (event_id, guest_id **no FK** — rule-7 fix, see D-log), token, expires_at) + `resolve_guest_by_lookup`/`resolve_guest_session`/`submit_rsvp` RPCs. **Live — Wave 2b (D51).** | **DONE (schema) — `website_17`–`website_20`** |
| **G7** | data-model | **Per-sub-event RSVP responses** — `event_guest_sub_events` link table exists but confirmed assignment-only (verified by reading Guest Mgmt code, not just the schema). **Founder confirmed: per-sub-event response is a real requirement**, not blanket. | RSVP | `response_status`/`plus_one_count`/`dietary_notes`/`responded_at` + `unique(guest_id, sub_event_id)` added to `event_guest_sub_events`. Live. | **DONE — `website_07`** |
| **G8** | editor | **New host-editor section types** in `edit-page.js` `SECTION_TYPES`: `travel-point`, a real `stay` card, a proper **Venue block**. **Largely moot now** — Travel/Stay content is structured via `event_travel_points`/`event_stays`, not a generic section type; only a UI/editor task remains (build the host-editor forms against the real tables), not a schema gap. | Venue &amp; Travel | Editor forms against `event_travel_points`/`event_stays` (live). | App-layer only, schema done |
| **G9** | editor/infra | **The guest-facing public website itself is not built** — only host-side *preview cards* exist. The real scrollable site (`/e/<slug>`) has never been built. | Entire site | React port to `app/e/[slug]/` + Wave 2's public RPCs (`get_public_website_payload`, guest lookup). **Full DB layer (Wave 1 + 2a + 2b) is live, including `events.slug` generation (G13/D52).** Remaining work is entirely app-layer: `app/api/e/[slug]/*` route family + the React public-site build. | OPEN — app-layer + React port only, schema done |
| **G10** | settings | **Event Settings → "Travel & Stay"** sub-page — where the host enters airports/railway/bus + suggested stays. Doesn't exist. Current sub-pages: general, website, admins, guest-list, registry, plan-billing. Backing tables (G2/G3) are now live — this is purely a UI-placement decision. | Venue &amp; Travel (populates it) | New settings sub-page writing to the now-live `event_travel_points`/`event_stays`. | OPEN — UI placement, not schema-blocking |
| **G11** | settings/editor | **Ownership of free-form content editing** — Story/Party/Q&A currently live in the Website "Edit Pages" editor, not Settings. Decide the single home before wiring so hosts don't edit the same content in two places. **Schema half resolved** — each got its own dedicated table (G1), so this is now purely which app route writes to them. | Our Story · Wedding Party · Q&A | Decision, not a table. Recommend: Edit-Pages owns section content; Settings owns structured logistics (travel/stays). | OPEN — UI placement, not schema-blocking |
| **G12** | data-model | **Website invitation-card catalog** — `card-templates.html` (host-editor sub-tab, "Need a printed-style invitation card?") shows its own gallery: 18 templates × 6 styles (classic/floral/modern/festive/minimal/royal), hardcoded in JS. This is a *separate* catalog from `config.invitation_templates` / `event_invitation_cards` (Digital Invitations feature scope) — no table backs it, no React page exists at all. Found during 2026-07-30 full-scan of the design module against React + DB. **Decision made:** reuse `config.invitation_templates`/`config.invitation_card_styles` — the table already exists live (0 rows). | Overview → card CTA · Footer (card download) | Reuse `config.invitation_templates`/`config.invitation_card_styles` (already live, empty). Seed-data task (18 templates × 6 styles) moved to Digital Invitations' own backlog — not this feature's job. | OPEN — seed data only, tracked under Digital Invitations |
| **G13** | data-model | **Public site route key** — `app/e/[slug]/` needs something to key off that isn't a raw event UUID. No column existed. | Entire public site | `events.slug text unique`. Live, plus generator (`generate_event_slug`, wired into `create_event_with_details`) + one-time backfill — all 19 existing events have a slug. | **DONE (schema + generator) — `website_06`, `website_21` (D52)** |

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
| Gallery | `event_media` + `event_albums` (note: `event_media.published` bool exists, looks purpose-built as the "show on public site" flag, but no host-editor page reads/writes it yet — app-wiring gap, not data-model) | — |
| Q&A | — | G1 |
| RSVP | `event_guests`, `event_guest_settings`, `event_guest_sub_events` | G6, G7 |
| Registry/Something | — | G1 |
| Footer (card download) | `event_invitation_cards` | — |
| Which theme renders | sessionStorage only | G5 |
| Card-templates picker (Website module) | — | G12 |

---

## Next actions (end of session)

- [ ] Turn each OPEN gap into a ClickUp ticket under Feature `86d2jwzge` (Digital Presence) — or a data-model slice ticket where it's schema-only.
- [ ] G11 + G7 are **decisions/verifications**, not builds — resolve before ticketing G1/G8.
- [ ] Sequence: G5 (theme persistence) + G1 (content store) are the spine; G2–G4 (travel) + G10 (settings page) are one coherent "Travel &amp; Stay" slice; G6 (tokens) rides with the RSVP build.
