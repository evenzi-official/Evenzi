# Digital Presence — Plan v1

**Status:** Locked for design. Implementation framework TBD.
**Owner:** Abhijith (product) · Claude Code (design support)
**Last updated:** 2026-05-21
**Anchor module:** Digital Presence is the connector between Guest Management (data) and Digital Invitations (delivery). Plan it first; all other event-feature plans defer to its identity and access model.

---

## 1. One-liner

The host builds a **public invitation website** via a lightweight no-code editor. Guests open it via WhatsApp link, see the content, and RSVP per sub-event. RSVPs flow back into Guest Management in real time.

## 2. Scope summary

- **Host-side:** 5-tab editor (Overview · Design · Edit Pages · Photos · Card Templates), live mobile preview, page library with drag-reorder, tiered access control, share + publish flow.
- **Guest-side:** 2-tier public website (public hero + private details), unlock by password or personalized link token, per-event RSVP with phone-number identifier matching.
- **Out of scope (MVP):** custom CSS/HTML, custom domains, multi-language, AI auto-fill, real-time co-editing, decorative motif overlays, registry page, card auto-generation (lives in Digital Invitations).

## 3. Decisions locked

| # | Decision | Rationale |
|---|---|---|
| D-1 | **Tiered content model** — Public tier (Hero + CTA + Countdown) is open; Private tier (Schedule, RSVP, Venue, Wedding Party, etc.) is gated. | Mirrors real wedding-invite norms (per Vidya & Anshuman reference). Default is private-by-default for guest content. |
| D-2 | **Two unlock paths** — (a) password (host-set, shared via WhatsApp message) OR (b) personalized link token in URL (`?g=<token>`). Either unlocks the private tier for the browser session (30-day cookie). | Password handles family-forwarded links. Token handles direct WhatsApp deliveries (zero friction). |
| D-3 | **Identity matcher = phone number** (default). Guest types phone → matches against guest list → "Responding for [Name]" → per-event RSVP. *Exact identifier field is parked — phone is the default.* | Phone is more unique than name (typos, common names). |
| D-4 | **Per-event RSVP granularity** — Guest sees only sub-events they're tagged to; submits Yes/No per sub-event. | Indian weddings have 3-7 sub-events; not all guests are invited to all. |
| D-5 | **Page library, MVP set:** Home/Hero, RSVP, Schedule, Story, Wedding Party, Venue, Travel & Stay, Q&A, Gallery, Video, Custom ("Something"). **Out:** Registry. | Mirrors WithJoy minus what's out of MVP per Evenzi scope. |
| D-6 | **Sub-event editing lives in the Schedule page editor.** Hub gets a shortcut link; Settings does not duplicate. | Sub-events are inherently part of the public schedule — editing context. |
| D-7 | **Photos in DP = thin wrapper over Media & Memories.** Single source of truth. Host picks which Media albums show on the site. | Avoids dual buckets, dual upload UIs. |
| D-8 | **Card Templates capability** — DP hosts a downloadable static-card gallery (PDF/PNG, designer-made). Auto-fill with event data + WhatsApp send is Digital Invitations' job. | Per Abhijith's call: invite-card *generation* is invitation territory; DP just offers the library. |
| D-9 | **5-tab editor IA:** Overview · Design · Edit Pages · Photos · Card Templates. | Mirrors WithJoy minus the CSS/Art advanced tabs. |
| D-10 | **Live preview model:** desktop split-pane (~40% editor · ~60% preview); mobile tab toggle. Device toggle (📱 / 🖥️) above preview. Updates on field-blur (~250ms debounce). | Matches WithJoy + standard editor UX. |

## 4. Decisions parked (revisit before/during build)

| ID | Parked decision | Default for now |
|---|---|---|
| P-1 | Plus-one model (host pre-decides per guest vs. open vs. guest cluster) | Host pre-decides per guest (`+N allowed`); guest sees N+1 slots in RSVP |
| P-2 | Video page scope (embed vs upload vs both) | Embed-only (YouTube/Vimeo URL paste) |
| P-3 | Publish default (auto-published vs draft) | Draft-first; host hits "Publish" when ready |
| P-4 | Identifier field for RSVP matching (phone vs phone+name vs other) | Phone number only; default-on |
| P-5 | Decorative motif overlays (florals, mehendi patterns) | Defer to v2 |
| P-6 | Open-RSVP fallback (when typed phone doesn't match) | Hard reject + "Ask the Host" link |
| P-7 | OG image generation (auto from cover vs separate upload) | Separate upload (host control) |

## 5. Tiered content access model

| Tier | Pages | Visibility |
|---|---|---|
| **Public** | Hero only (couple/host names, cover image, date, countdown, optional short tagline, "Unlock Guest Details" CTA, footer) | Anyone with the URL |
| **Private** | Schedule, RSVP, Venue, Story, Wedding Party, Travel & Stay, Q&A, Gallery, Video, Custom | Unlock required (password OR token) |

After unlock, state persists for the browser session (30-day cookie/localStorage). "Unlock Guest Details" pattern matches the WithJoy "Private Event" modal.

## 6. Identity model

```
GUEST OPENS LINK
│
├─ Bare URL (/e/<slug>)
│   ├─ Public hero loads
│   ├─ "Unlock Guest Details" CTA → modal: phone OR password
│   ├─ Phone match → identifies guest → unlock + personalize
│   ├─ Password match → unlock only (anonymous browsing of private tier)
│   └─ No match → "Ask the Host" link
│
└─ Token URL (/e/<slug>?g=<token>)
    └─ Auto-unlock + auto-identify → personalized view + pre-filled RSVP
```

Both flows write to the same RSVP record. Token = convenience; phone = baseline.

## 7. Page library — host editor (DP module)

### 7.1 Top-level tabs

| Tab | Purpose | Screens to design |
|---|---|---|
| **Overview** | Module landing — site URL, visibility, RSVP toggle, get-started checklist, mobile preview, pages panel | 1 |
| **Design** | Layout · Color · Font · Cover photo · OG image | 1 (multi-section single page) |
| **Edit Pages** | Per-page editor with section list (add/remove/reorder), per-section content edit, per-page lock + visibility | 1 list view + 1 detail editor view = 2 |
| **Photos** | Album selector wrapper over Media & Memories | 1 |
| **Card Templates** | Browse + preview + download static invitation cards | 1 grid + 1 preview modal |

**Total host-editor screens:** 6 + supporting modals.

### 7.2 Modals (host side)

- Share & Publish (URL + visibility + password + RSVP toggle + copy-link)
- Change template (confirm + reset warning)
- Discard unsaved changes (confirm)
- Photo crop / cover edit
- Delete page (confirm)
- Card template preview (full-screen with download CTA)

## 8. Page library — public website (guest-side)

| Page | Tier | Section anatomy |
|---|---|---|
| **Home / Hero** | Public | Names + tagline + date + countdown + cover + CTA |
| **RSVP** | Private | Identifier input → identified guest → per-event Yes/No → submit |
| **Schedule** | Private | Sub-event cards (date, time, venue, dress code, note) |
| **Story** | Private | Title + rich-text body + optional photo grid |
| **Wedding Party** | Private | Person cards (photo + name + relation), grouped by side |
| **Venue / Where & When** | Private | Map + address + parking note |
| **Travel & Stay** | Private | Hotel cards (photo + distance + booking link) + travel tips |
| **Q & A** | Private | Q/A pair list |
| **Gallery / Moments** | Private | Pulls Media & Memories albums |
| **Video** | Private | Embed (YouTube/Vimeo) |
| **Custom / "Something"** | Private | Free-form rich text + image blocks (1 slot in MVP) |

**Total public website templates:** 11 page types. Each page has multiple section variants per template.

## 9. Section primitives (small library, fixed in MVP)

To keep the editor "lightweight," the per-page editor only lets hosts add sections from this fixed list:

1. Heading + paragraph
2. Photo (single)
3. Photo grid (2-4)
4. Two-column text
5. Schedule item (sub-event)
6. Person card (with photo)
7. Hotel/venue card (with map link)
8. Q&A item
9. CTA button
10. Divider

**Total ≈ 10 section primitives.** Maintainable, no combinatorial explosion.

## 10. Component reuse audit (host editor — vs designs/shared/shell.css)

| Need | Existing primitive | Status |
|---|---|---|
| Floating glass nav | `floating-nav` + `fn-icon-btn` | Reuse |
| Sticky breadcrumb | `breadcrumb-shell` + `bc-copy` | Reuse |
| Page shell (header + content) | `.page-shell-*` family | Reuse |
| Clay surface card | `clay-card` | Reuse |
| Pill button | `btn-pill` + variants | Reuse |
| Toggle switch | `toggle-switch` | Reuse |
| Form input | `form-input` + `form-input-group` (for slug field with `evenzi.com/e/` prefix) | Reuse |
| Modal/sheet | `modal-scrim` + `modal-card` | Reuse |
| Toast | existing toast system | Reuse |
| Choice card | `choice-card` (for template picker tiles) | Reuse |
| Avatar | `avatar-edit` | Reuse |
| Help FAB | `help-fab` | Reuse |
| **New: device-toggle pill group** | (similar to `radio-pill-group` but with icon-only) | Extend `radio-pill-group` |
| **New: page-list row** | List item with drag handle + name + visibility eye + lock icon + chevron | New shell primitive (`.page-list-row`) |
| **New: get-started checklist tile** | Card with icon + label + arrow + done state | New shell primitive (`.gs-tile`) |
| **New: status-badge** | "Published" / "Draft" / "Offline" pill (long-deferred from prior plans) | Add to shell as `.status-badge` |
| **New: editor split-pane layout** | Side-by-side editor + preview (desktop), tab toggle (mobile) | New page-level layout primitive |
| **New: section block (in Edit Pages)** | Card with drag handle + section type label + content editor + visibility/delete actions | New, lives in `designs/pages/digital-presence/` |
| **New: card-template tile** | Tile with thumb + name + style tag + download icon | New, lives in `designs/pages/digital-presence/` |

**Promotion candidates to shell:** `.page-list-row`, `.gs-tile`, `.status-badge`, `.device-toggle` (extend radio-pill-group with icon-only mode).

## 11. Modal / popup / toast inventory (DP only)

### Host-side

| Type | Trigger | Content |
|---|---|---|
| Modal | Header "Share" button | Share & Publish: URL editor + status toggle + password + RSVP toggle + copy-link |
| Modal | Design → "Change Design" | Template gallery + warning that overrides reset |
| Modal | Navigate-away with dirty state | Discard unsaved changes confirm |
| Modal | Photo upload completes | Crop tool |
| Modal | Manage Pages → delete | Confirm page deletion |
| Modal | Card Template tile click | Full-screen preview + download CTA |
| Toast | Any autosave | "Saved" |
| Toast | Visibility change | "Published" / "Taken offline" / "Set to draft" |
| Toast | Share modal | "Copied to clipboard" |
| Toast | Slug validation | "URL is taken" / "Available" |
| Toast | Error | "Save failed" / "Upload failed" |
| Empty state | Schedule with 0 sub-events | "No sub-events yet — add one to populate the Schedule" |
| Empty state | Photos with 0 albums linked | "No photos yet — link a Media & Memories album" |

### Guest-side

| Type | Trigger | Content |
|---|---|---|
| Modal | Click locked page or Unlock CTA | "Private Event" — phone OR password → View Event |
| Modal | RSVP submit success | "Thanks! Your RSVP is recorded." + sub-event summary + Change response CTA |
| Toast | RSVP autosave (per sub-event) | "Response saved" |
| Toast | Phone not found | "Couldn't find your name — please contact the host." + "Ask the Host" link |

## 12. Data model checkpoints (informational for engineering)

These aren't designed in this round but flagged so plan stays grounded:

- `event_website_config` JSONB column on `events` table — stores the section schema (pages, sections, content per section)
- `event_website_design` JSONB — stores template choice, color/font selections, layout overrides
- `event_visibility` enum (`draft`, `published`, `offline`)
- `event_password` (hashed) + `event_password_required boolean`
- `guest_tokens` table (one row per guest with `guest_id`, `token`, `expires_at`)
- `rsvp_responses` table (per `guest_id` × `sub_event_id` → `yes/no/maybe` + `plus_one_count` + `timestamp`)

## 13. Stack feasibility

| Capability | Approach | Concerns |
|---|---|---|
| Section-based editor | JSON schema in DB + React component per section type | None |
| Live preview | Shared component tree (same React components, read-only mode) | None |
| Drag-and-drop reorder | `dnd-kit` (React 18 + Next.js compatible) | None |
| Slug routing | Next.js dynamic `app/e/[slug]/page.tsx` | None |
| Tokenized personalization | `?g=<token>` query param + server-side decode (JWT or signed short token) | None |
| Public access (no auth) | Already allowlisted in middleware | None |
| Image upload | Storage bucket (engineering decision pending — see Q-DP-S1 in chat) | Engineering decision, not design-blocking |
| OG image generation | `next/og` (Vercel-native) or static upload | None |
| RSVP form submission | POST `app/api/rsvp/<token>/route.ts` or POST `app/api/e/<slug>/rsvp/route.ts` for phone-match path | None |
| Tiered access cookie | HTTP-only cookie set after unlock; middleware checks before rendering private routes | None |

**No stack blockers for design.** Storage bucket decision is engineering-time only.

## 14. React implementation recommendation

When this moves from design (HTML/CSS/JS in `designs/`) to implementation (Next.js + React in `app/`), the editor should use **[Puck](https://puck.dev)** as the base framework:

- Open-source, MIT-licensed, React 18 + Next.js 14 App Router compatible
- Built specifically for "section-based no-code editor with JSON-config persistence"
- Drag-and-drop reorder built-in
- Side-by-side preview built-in (and customizable layout)
- Each Evenzi section primitive (Heading, Photo Grid, Schedule Item, etc.) registered as a Puck component → host gets typed, validated content editing for free
- Saves ~2-3 weeks of editor scaffolding

**Fallback path** if Puck doesn't fit: custom JSON-schema editor with `dnd-kit` for reorder.

**Action when implementation begins:** verify Puck's React 18 + Next.js 14 App Router compatibility via Context7 before adoption.

## 15. Build order (for the design sprint)

This plan covers Digital Presence end-to-end. The design work breaks down as follows, in this order:

1. **DP Overview** (host editor entry) — **THIS SESSION**
2. DP Design tab
3. DP Edit Pages — list view
4. DP Edit Pages — page editor (per-page section editor)
5. DP Photos
6. DP Card Templates
7. Public website — Home / Hero (public tier)
8. Public website — Unlock modal + identity flow
9. Public website — RSVP page (private tier)
10. Public website — Schedule, Story, Wedding Party, Venue, Travel, Q&A, Gallery (private-tier templates)
11. Shared modals (Share & Publish, Change template, etc.)

Each item gets the design-path treatment: section plan → UI/UX agent pre-build review → build → per-section agent pass → mobile device test → final agent verdict → close.

## 16. Cross-references

- WithJoy reference screenshots (provided in chat, 2026-05-21) — particularly: Overview admin (#3), Design tab (#4), Private Event modal (#5), public hero (#6), RSVP name entry (#7), RSVP per-question (#8)
- Vidya & Anshuman invitation PDF + WhatsApp screenshot (#1, #2) — reference for invite card style and WhatsApp message format
- `docs/features/overviews/digital-presence-overview.md` — feature overview (treated as revolving, not binding)
- `docs/foundation/user-flows.md §5, §11` — RSVP + cross-feature interaction map
- `designs/pages/event-control/` — Hub design (where the "Event Website" card lives, entry point to DP)
- `designs/shared/shell.css` + `shell.js` — existing primitives
- `designs/components.html` — component showcase

---

## Built

_(Pages built in this session will be appended here.)_

---

## Update — 2026-05-22 (post round-2 + plan-phase agent + Abhijith defaults)

### Locked decisions (Q1–Q8 from agent round 2, all "yes default" by Abhijith)

| ID | Decision |
|---|---|
| Q1 | Template bundles {Layout, Hero variant, Palette, Font}. Host can override individually. Changing template resets these (with Discard-changes confirm). |
| Q2 | Card templates are palette-independent — designer-made static PDFs/PNGs keep their own design regardless of the host's website palette. |
| Q3 | **Photos tab deferred** until Media & Memories module ships. Sub-nav hides the tab until then (avoid linking to a non-existent destination). |
| Q4 | Card filter chips: drop language filter (Tamil/Hindi/English) for MVP; keep Style filter only. |
| Q5 | Body font locked to Poppins. Host can only swap **heading font**. Prevents brand drift. |
| Q6 | OG image auto-derived from cover photo (cropped to 1.91:1) by default; host can upload a separate override. |
| Q7 | **Section primitives — final 12:** Heading+paragraph (with two-column toggle), Photo (single), Photo grid (2-4), Schedule item, Person card, Hotel/venue card, Q&A item, Divider, **Map embed (NEW)**, **Countdown block (NEW)**, **Video embed (NEW)**. Dropped: stand-alone "Two-column text" (folded into Heading+paragraph). Dropped: stand-alone "CTA button" (only used in Hero, no clear 3rd consumer). |
| Q8 | Explicit Publish confirm modal required before Draft → Published. Shows the share URL preview + "Make this live" CTA. |

### Process model — autosave + dirty state (was unspecified; resolved per agent CC-2)

- **Autosave per field-blur** (600ms debounce) for all editor surfaces (template choice, palette pick, font, section content, slug, cover, OG image).
- Save signal lives in the **breadcrumb's `bc-system` chip** (`SYNCED HH:MM:SS AM/PM IST`) — same primitive as the canonical top-section pattern. No autosave toasts (they nag).
- **Explicit Publish** is the only ceremony button. Lives in the header chrome (and inside URL & Status card on Overview).
- **Discard-changes modal** fires only on template-change (which resets palette/font/sections), not on tab switches.

### Per-page editor mobile model (was unspecified; resolved per agent CC-8)

- **Desktop ≥1024px:** 55/45 split — section list left, sticky preview right.
- **Mobile <1024px:** Edit | Preview **tab-toggle** under the page title. State persists when toggling. Field-blur autosave still fires regardless.
- (Bottom-sheet preview was the alternative but conflicts with the section-list scrolling.)

### Modal inventory — consolidated 9 → 7+1 (agent CC-4)

| Modal | Owner | Notes |
|---|---|---|
| Share & Publish | All tabs (header Share button) | URL editor + visibility radio + password toggle + RSVP toggle |
| **Publish confirm** (NEW per Q8) | Triggered from Share & Publish "Publish" action | Shows share URL preview + Make-it-live CTA |
| Change template | Design tab | Template gallery + reset warning + Apply |
| Edit URL slug | Already built (Overview) | Phone input + live validation |
| **`.modal-picker-grid`** (consolidated) | Add Page · Add Section pickers | Same shell modal; different content payload. PROMOTE to shell. |
| **`.modal-image-crop`** (consolidated) | Cover upload + OG upload | Parameterized by aspect ratio (16:9 vs 1.91:1). PROMOTE to shell. |
| **`.modal-image-lightbox`** (consolidated) | Card template preview, future Media gallery viewer | Generic image-with-actions lightbox. PROMOTE to shell. |
| Delete page confirm | Edit Pages list + per-page editor | Type page name to confirm |
| Discard unsaved changes | Template-change only (per autosave model above) | Cancel · Discard |

### Toast catalog — re-budgeted ~30 → ~15 (agent F-1)

Drop all "Saved" autosave toasts (replaced by breadcrumb SYNCED chip). Keep:
- State-change confirmations (PUBLISHED / SAVED TO DRAFT / RSVP COLLECTION ON|OFF / SHOWING ON WEBSITE / HIDDEN FROM WEBSITE / KEYBOARD REORDER COMING SOON)
- Page-level actions (PAGE ADDED / PAGE DELETED / TEMPLATE APPLIED / CARD DOWNLOADED)
- Clipboard copies (LINK COPIED / COULDN'T COPY)
- Errors (SOMETHING WENT WRONG / OFFLINE — RECONNECTING)

### Top-section pattern — canonical for ALL event sub-pages (locked 2026-05-22 from Abhijith reference screenshot)

The Website module (and Media, Guests, Planning, etc. — all event sub-pages) shares ONE top-section composition:

```
[Floating Nav: EVENZI logo + Dashboard|Website tabs + Bell/Theme/Avatar]

[Rich breadcrumb: <back DASHBOARD › EVENT NAME › [CURRENT PAGE pill]   • SYNCED HH:MM:SS AM/PM IST [copy]]

[Flat section head:
  SECTION         (eyebrow, brand-red small caps)
  Event Website   (big bold title — Poppins 700-800)
  Subtitle…       (muted, 1.5 line-height)
]

[Sub-tabs if module has them]

[Content...]
```

All primitives live in shell.css:
- `.bc-shell` + `.bc-active` (brand-pill current) + `.bc-divider` + `.bc-system` (SYNCED chip) + `.bc-copy` + `.bc-mono` (tabular numerals for the clock)
- `.section-head` + `.section-head-eyebrow` + `.section-head-title` + `.section-head-sub`

Implementation reference (live): `designs/pages/website/overview.html` lines ~91–143.

### Build order — revised (Step 0 added per agent G)

0. **Shell primitives PR (foundation):** `.dp-preview-frame` 3-mode (`.is-static` / `.is-controls-driven` / `.is-page-scoped`), `.dp-tile-grid` family (replaces ad-hoc grids in Design palette / Photos albums / Card templates), `.modal-picker-grid`, `.modal-image-crop`, `.modal-image-lightbox`, `.dp-row-reorder` (chevrons + drag handle), `.dp-page-tier` badge (already exists, document), `.dp-section-block`. **`.section-head` already landed 2026-05-22.**
1. Cross-cutting modals: Share & Publish + Publish confirm + Discard unsaved
2. Design tab (proves `.dp-preview-frame` controls-driven mode)
3. Edit Pages list (proves `.dp-row-reorder` + `.dp-page-tier`)
4. Card Templates tab (proves `.dp-tile-grid` dense variant + `.modal-image-lightbox`)
5. Per-page editor (composes all above + Edit/Preview mobile tab-toggle)
6. Photos tab — **deferred** until Media & Memories ships (Q3)

### Card template assets (Q via agent D-1)

- Prototype phase: `designs/assets/card-templates/<style>/<id>.{pdf,png}` with a manifest JSON in `designs/assets/card-templates/manifest.json`
- React port: Supabase Storage bucket `card-templates/` (public read); manifest moves to `card_templates` table

### Out-of-scope follow-ups noted

- `pages/event-control/event-control.html:83-90` still uses legacy `role="tablist"`/`role="tab"` on cross-page nav. Propagate the fix when event-control is next touched.
- Section primitive "Gift Registry" remains parked (D-5 above); reserve a grayed-out "Coming soon" slot in the Add Section picker so removal-vs-coming-soon is unambiguous.

---

## Update — 2026-05-22 (modal-layer plan-phase agent review + Abhijith "go default")

### Shell modal controller — rebuilt stacking-safe (landed)

The pre-existing shell modal controller had P0 stacking bugs (single `lastFocused`, first-match Esc, fixed z-index). Rebuilt:
- `openStack[]` tracks open modals in open order; `topModal()` = last.
- `focusReturnMap[]` pairs each modal with its focus-return target (out-of-order closes are safe).
- Dynamic z-index per depth (base 80, +10/level).
- Esc / Tab-trap / scrim-click operate on the **top** modal only.
- `.modal-scrim` closed state gains `visibility:hidden` (was `opacity:0` only — left the closed modal Tab-reachable + stranded focus).
- `closeModal` blurs any in-modal focus before hiding; only restores focus to targets still in the DOM.
- Exposed as `window.evenzi.openModal(idOrEl)` / `window.evenzi.closeModal(idOrEl)`. Pages no longer re-implement modal open/close — `website.js` duplicate deleted; page scripts only do content-prep then delegate.

Verified: slug modal opens (z-index 90, focus → input), closes via Esc (focus → trigger button, scroll unlocked, `aria-hidden` restored). Zero console errors.

### Modal layer — locked decisions (agent REVISE addressed, Abhijith "go default")

| Decision | Resolution |
|---|---|
| **Share modal split** | Split into **Share** (URL + Quick-share + RSVP toggle — no Save button, each action fires immediately) and **Publish settings** (Visibility + Password — Save/Cancel scope). |
| **Publish-confirm is the only Draft→Published path** | Draft→Published always routes through Publish-confirm. Draft↔Offline and Published→Draft are reversible, no confirm. |
| **`.modal-confirm-affirmative`** | Promoted to shell (Publish-confirm pattern; future consumers: Send Invitations, Lock Guest List). `.modal-confirm-destructive` stays page-local (1 MVP consumer). |
| **"Overrides exist" (Discard trigger)** | Fires when ANY of: palette ≠ template default, heading-font ≠ default, custom section content, added/reordered sections, custom cover, custom OG. Also fires on palette/font change alone (not just template change). |
| **Discard confirmation bar** | Simple Cancel + "Change template anyway" (red secondary). No type-to-confirm (Q-A default). |
| **Toast naming** | `PUBLISHED` (not `LIVE NOW`) — matches the Visibility radio value. Added `WHATSAPP OPENED`. |
| **Standalone slug modal** | Folds into Share modal's URL section. `#dp-slug-modal` will be removed once Share lands; URL editing lives only inside Share. |
| **Add-Page picker** | All 11 page types shown; already-added types disabled + check icon + "Added" label; only Custom allows multiple. Reserve grayed "Gift Registry — Coming soon" slot. |
| **QR code** | Client-side `qrcode-svg` (~6KB CDN), brand-red modules on white. |
| **Lightbox download** | Native `<a download>`; "CARD DOWNLOADED" toast on click (action-initiated, not completion). Mobile-Safari cross-origin fallback: `target="_blank"` + "Card opened — save from menu." |
| **Image crop** | Touch-first: pinch-zoom + drag on touch; zoom-slider on `pointer:fine` (slider always in DOM, visually-hidden on touch for a11y). Reset-to-fit button. |
| **WhatsApp share message** | Host-editable textarea in Share modal, pre-filled with: greeting + couple names + date + RSVP URL + conditional password line. In-modal read-only preview before send. |
| **Publish-confirm bullets** | Dynamic — computed from current state ("Guests will see: Hero, N sub-events, gallery, RSVP form"), capped at 4 + "+N more". |
| **Publish-confirm tone** | Restrained-celebratory: brand-red CTA, single 32px filled `celebration` icon, gentle scale-in (collapsed under reduced-motion). No confetti. |
| **Build order** | JS API contract → shell CSS shells → instance HTML → instance JS → trigger wiring → verify. (JS contract first because it constrains instance HTML attributes.) |

### Modal inventory — final

**Shell primitives:** `.modal-picker-grid` · `.modal-image-crop` · `.modal-image-lightbox` · `.modal-confirm-affirmative`
**Instances (in overview.html / future tabs):** Share · Publish settings · Publish-confirm · Discard/Template-reset · Cover-crop · OG-crop · Add-page picker · Add-section picker · Card-template lightbox · Delete-page confirm
