# Website · Templates Gallery + Detail Pages — Plan

**Page(s):** `designs/pages/website/templates/index.html` (gallery) + `designs/pages/website/templates/<id>.html` × 5 (detail)
**User goal:** Let a host browse the 5 template bundles in a dedicated, link-shareable space, see each one in real context (palette + heading font rendered), and apply one — with a cautionary confirm if they've customized their current design.
**Module:** Website / Digital Presence. Pre-task design prototype (no ClickUp).
**Owner:** Abhijith (design path).
**Date:** 2026-06-02.

---

## 0. Context & locked contract (from NEXT-SESSION 2026-05-26)

The Design tab (`design.html`) already ships. Its Template card's "Change template" CTA is an `<a href="templates/index.html">` that currently 404s. This plan builds the destination. The route + apply flow are **already locked**:

- **Templates are pages, not a modal.** Gallery at `templates/index.html`; one detail page per template at `templates/<id>.html`.
- **`.dp-template-card` + `[data-palette]`/`[data-font]` selectors are reusable** (live in `website.css`, lines 504–595 for palette/font, 1300–1454 for the card). Gallery/detail compose them.
- **Apply flow:** detail page "Apply this template" → (cautionary confirm if overrides) → `sessionStorage.setItem('dpTemplateApplied', '<id>')` → navigate `../design.html` → existing `applyFromSession()` IIFE in `design.js` commits + clears.
- **`.bc-wrap` is the canonical page wrapper** — DO NOT override at module level; new pages just add `class="bc-wrap reveal"`.

The 5 templates (data model already in `design.js` `TEMPLATES`):

| id | name | palette | font | blurb |
|---|---|---|---|---|
| `classic-romance` | Classic Romance | blush | cormorant | Editorial layout, serif headings, blush palette. |
| `minimal-modern` | Minimal Modern | ivory | inter | Single column, sans headings, ivory palette. |
| `bold-festive` ★ | Bold Festive | brand-red | poppins | Magazine layout, full-bleed cover, brand-red palette, Poppins headings. |
| `garden-soft` | Garden Soft | sage | lora | Two-column layout, soft serif, sage palette. |
| `midnight-elegant` | Midnight Elegant | midnight | playfair | Dark hero, display serif, midnight palette. |

★ `bold-festive` is the current/default template → carries the "Current" pill.

---

## 1. File plan

```
designs/pages/website/templates/
├── index.html                 Gallery — 5 dp-template-cards, "Current" pill on bold-festive
├── classic-romance.html       Detail
├── minimal-modern.html        Detail
├── bold-festive.html          Detail
├── garden-soft.html           Detail
├── midnight-elegant.html      Detail
├── templates.css              Page-specific styles (gallery grid, detail hero/sidebar/mini-previews)
└── templates.js               Page-specific JS (apply-confirm flow, current-template marking)
```

**Path depth (critical — templates/ is 3 levels under designs/):**
- shell: `../../../shared/shell.css` · `../../../shared/shell.js`
- module css/js: `../website.css` · `../website.js`
- page css/js: `templates.css` · `templates.js` (gallery) — detail pages also use these
- assets: `../../../assets/hero-image.jpg`
- design tab: `../design.html` · gallery: `index.html` (from detail) / `templates/index.html` (from design.html)

---

## 2. Component reuse audit

| Element | Decision | Source |
|---|---|---|
| Floating nav, tool rail, breadcrumb (`.bc-wrap`/`.bc-shell`), section-head, footer, help-FAB, toast | **Reuse as-is** | shell.css + copy chrome from `design.html` |
| Website sub-nav (`.wb-tabs`) | **Reuse as-is** — Design tab marked active (templates is a Design sub-flow) | design.html lines 146–169 |
| Template card (preview + meta + swatches + Current pill + Selected check) | **Reuse as-is** | `website.css` `.dp-template-card` family |
| Palette/font token cascade (`[data-palette]` / `[data-font]` → `--dpp-*`) | **Reuse as-is** | `website.css` 504–595 |
| Live hero preview frame (`.dp-preview-frame` 3-mode + `.is-page-scoped`) | **Reuse as-is** for detail mini-previews | shell.css 2461–2533 |
| Cautionary confirm (`.modal-confirm-cautionary`) | **Reuse shell, new instance** — page-specific id `#tpl-apply-confirm`, own handler | shell.css 2983–3025; pattern in website.js |
| Buttons (`.btn-pill` variants incl. `btn-pill-sm`) | **Reuse as-is** | shell.css |
| Status badge / "Current" pill | **Reuse** `.dp-template-current` (card) + `.status-badge` family if needed on detail | website.css / shell.css |
| **Gallery grid** (5 large cards, 1→2→3 col) | **New, page-specific** — existing `.dp-template-grid` caps at 5-col small picker tiles; gallery wants larger cards capping at 3-col | `templates.css` `.tpl-gallery-grid` |
| **Detail hero** (full-bleed template mock) | **New, page-specific** — composes `[data-palette]`/`[data-font]` + `--dpp-*` tokens | `templates.css` `.tpl-hero` |
| **Detail mini-previews** (Schedule / RSVP / Wedding Party) | **New, page-specific** — 3 small page mocks under `[data-palette]`/`[data-font]` | `templates.css` `.tpl-page-mock` |
| **Detail sticky sidebar** (palette/font meta + Apply CTA) | **New, page-specific** | `templates.css` `.tpl-aside` |

No new **shell** primitives expected. If the detail hero/mock turns out to be reused elsewhere later (e.g. live site builder), promote then — not now (one consumer).

---

## 3. Gallery page (`index.html`)

**Layout (top → bottom):**
1. Standard chrome: floating nav, tool rail, breadcrumb (`DASHBOARD › VIBRANT UNION › WEBSITE · DESIGN · TEMPLATES`), section-head, `.wb-tabs` (Design active).
2. **Back affordance:** breadcrumb back-chip → `../design.html` (label "DESIGN"). Plus a section-head sub line: "Pick a look. You can fine-tune the palette and font after."
3. **Gallery grid** — `.tpl-gallery-grid` with 5 `.dp-template-card`s:
   - Each card is an `<a href="<id>.html">` (whole card navigates to detail — richer than the picker tile which was a `<button>`).
   - `data-palette` + `data-font` on the card so the preview renders in context.
   - `.dp-template-preview` shows couple name ("Vidya & Anshuman") in the template heading font + `.dp-template-rule`.
   - `.dp-template-meta`: title (e.g. "Classic Romance") + tag row with 3 swatches + "blush · Cormorant" caption.
   - `bold-festive` carries `.is-current` → green "Current" pill.
4. Footer + help-FAB + toast.

**Card grid responsive:** 1 col < 560px, 2 col 560–900px, 3 col ≥ 900px. Cards larger than picker tiles (preview `aspect-ratio: 4/3`, full meta).

**Interaction:** entire card is a link (stretched-link pattern not needed — the `<a>` IS the card). Keyboard: Tab moves between cards, Enter navigates. `:focus-visible` ring (inherited from `.dp-template-card`).

---

## 4. Detail page (`<id>.html`) — one per template

**Layout:** two-column on desktop (≥ 1024px), stacked on mobile.

**Main column:**
1. Chrome (same as gallery) + breadcrumb back-chip → `index.html` (label "TEMPLATES").
2. **Hero** (`.tpl-hero`) — full-bleed template mock under `[data-palette="<p>"] [data-font="<f>"]`: eyebrow "WEDDING OF", couple name in heading font, date, countdown, an "Unlock Guest Details" pill, foot line. Mirrors the real public hero (`.dpp-*` content from design.html preview) but larger/standalone. Reuses `--dpp-*` tokens for color.
3. **3 page mini-previews** (`.tpl-page-mock` × 3) — Schedule, RSVP, Wedding Party — small representative mocks rendered in the template's palette/font. Each labeled. Shows "this template across pages", not just the hero.

**Sticky sidebar (`.tpl-aside`, desktop) / in-flow card (mobile):**
- Template name + blurb.
- Palette meta: 3 swatches + palette name.
- Font meta: heading-font name rendered IN that font + "Body stays Poppins" note.
- **"Apply this template"** primary CTA (`.btn-pill-primary.btn-pill-lg`).
- "← Back to all templates" text link → `index.html`.

**Apply behavior (`templates.js`):**
- Click "Apply this template" → **always route through `#tpl-apply-confirm`** cautionary modal (see §5 decision D1) → on confirm: `sessionStorage.setItem('dpTemplateApplied', '<id>')` → `location.href = '../design.html'`.
- The current template's detail page (`bold-festive.html`) shows the Apply CTA as **"Applied — this is your current template"** disabled state instead (can't re-apply the one you're on). Secondary "Customize in Design" link → `../design.html`.

---

## 5. Decisions needing Abhijith sign-off

**D1 — Override detection on the prototype.** The locked contract says the cautionary confirm fires "if overrides exist". But `DesignState` (palette/font diff vs template) lives only in-memory on `design.html` and isn't persisted across the navigation. Options for the prototype:
- **(a) Always show the confirm** on Apply (recommended for the prototype — it demonstrates the full, safer flow; note inline that React makes it conditional on real override state). ← my recommendation
- (b) Skip the confirm entirely in the prototype (simpler, but doesn't prototype the interesting path).
- (c) Wire a `sessionStorage.dpHasOverrides` flag that `design.js` sets when palette/font diverge, and read it here (most faithful, slightly more plumbing).

**D2 — Current template's detail page Apply CTA.** Recommend: disabled "Applied" state + "Customize in Design" secondary link (§4). Alternative: show normal Apply (re-applies, resets overrides — but that's odd UX for the current template).

**D3 — Mini-previews count/content.** NEXT-SESSION names Schedule / RSVP / Wedding Party. Confirm these 3, or swap (e.g. Our Story, Travel, Registry)?

**D4 — Thumbnails.** Same as Design tab: no designer screenshots yet → previews are CSS-rendered mocks (couple name + tokens), not images. Consistent with `.dp-thumb-fallback` decision. OK to ship mocks?

---

## 6. States to cover (test phase)

- Card: default / hover / focus-visible / current (pill) — selected-check is N/A on the gallery (selection happens by navigating).
- Apply CTA: default / hover / focus / disabled (current template) / loading (`.is-loading` during the brief pre-navigate moment, optional).
- Cautionary modal: open / Esc-close / Cancel / Confirm → navigate. Focus-trap + focus-return (inherited from shell controller).
- Empty/edge: long couple name wrap in mock; palette tokens in light AND dark; midnight palette dark-mode check (known P2 watch item).
- Responsive: 360 / 390 / 414 / 768 / 1024 / 1440. No horizontal scroll. Touch targets ≥ 44px. Sidebar sticky ≥ 1024, stacked below.
- Cross-page: design.html → gallery → detail → (apply) → design.html round-trip commits the template (verify `TEMPLATE APPLIED` toast + name update). Back-chips correct at each level.

---

## 7. Build order

1. `templates.css` skeleton (gallery grid + detail hero/mock/aside tokens).
2. `templates/index.html` gallery (chrome + 5 cards). Verify in browser.
3. `templates.js` (apply-confirm + current marking).
4. `bold-festive.html` detail (the "current" one — exercises disabled state). Verify round-trip.
5. Remaining 4 detail pages (parallel-author from the bold-festive template, swap id/palette/font/copy).
6. Wire `#tpl-apply-confirm` modal instance into detail pages (or inject via templates.js once).
7. Test matrix + UI/UX agent post-build pass.

---

## 8. Open follow-ups (not this session unless time)

- `designs/components.html` backfill (growing debt — `.dp-template-card`, gallery grid, etc.).
- Mobile real-device pass (Abhijith on phone via LAN URL).
- Designer template thumbnails to replace CSS mocks.

---

## Agent Review

**UI/UX agent verdict (2026-06-02): APPROVE WITH NOTES.** User assignment confirmed **Host** (6–18mo authoring surface, AA floor — not the AAA RSVP bar). Structure + reuse strategy sound; gaps are state/a11y specification + two card-reuse correctness traps. Resolutions adopted below (all folded into the build):

**P0 — Blockers (resolved in plan)**
- **P0-1 · No card markup exists to "reuse" + whole-card-`<a>` trap.** `.dp-template-card` CSS exists but no HTML instance does (deleted 2026-05-26; only a stale `design.js:206` selector references the dead `#dp-template-modal`). → Cards are **authored fresh** from the CSS. Each gallery card is a whole-card `<a href="<id>.html">` with **zero nested interactives** (no inner buttons/links), decorative preview text `aria-hidden`, and an explicit `aria-label` (P1-1). Confirmed not using stretched-link (nothing nested to stretch around).
- **P0-2 · Dead `commitTemplate` selector must not be copied.** `templates.js` marks the gallery's `.is-current` card by **`data-template-id` / href match**, never by reviving `#dp-template-modal .dp-template-card`. (The stale selector in design.js is harmless there — no cards on that page — and out of scope to fix this session; noted in §8.)

**P1 — Fixed before build (adopted)**
- **P1-1 · Card a11y name.** Per-card `aria-label` ("Classic Romance — blush palette, Cormorant headings. Current template."); preview mock `aria-hidden`.
- **P1-2 · Heading hierarchy.** Gallery: `h1` = "Templates" (section-head). Detail: `h1` = **template name** (not the sample couple name, which is `aria-hidden` content), `h2` = "Across your pages", `h3` per mini-preview. Ships sequential.
- **P1-3 · Current-template CTA.** Rendered as a **non-interactive status badge** ("Your current template", `.status-badge`/`.dp-template-current` idiom) + the only actionable control is the "Customize in Design" link. No bare `disabled` button (avoids the focus/announce gap).
- **P1-4 · Mobile apply reachability + sticky offset.** Desktop: sticky sidebar with `top` offset that clears the **sticky** floating nav (not `top:0`); short-viewport (1024×600) checked so it doesn't trap. Mobile: a **sticky bottom Apply bar** (in safe-area) so the primary action is always reachable without scrolling past hero + 3 mocks.
- **P1-5 · Light-palette islands in dark mode.** `[data-palette]` tokens are single-set (no `.dark` redefinition). Detail **hero mock is wrapped in a neutral frame** (same idiom as the Design-tab phone frame) so a light palette sits inside its own surface island rather than clashing with dark page chrome at full-bleed edges. Gallery cards already self-frame (`.dp-template-preview` on `--card`).
- **P1-6 · Storage-blocked / WhatsApp-WebView fallback.** The Apply write is `try/catch`-wrapped; on failure it falls back to a **query-param** (`../design.html?apply=<id>`). `design.js applyFromSession()` is extended to also read `?apply=` (and strip it via `history.replaceState`). This is a small, additive edit to a shipped file — see sign-off note.

**P2 — Noted**
- P2-1 · `.tpl-gallery-grid` breakpoints aligned to the established **640 / 980** rhythm (not 560/900).
- P2-2 · `.dp-template-name` font-size bumped at gallery scale via `.tpl-gallery-grid .dp-template-name`.
- P2-3 · Active breadcrumb crumb shortened to **"TEMPLATES"** (4-deep path); verify `.bc-path` truncation at 360px in test.
- P2-4 · Test: longest template name in each of the 5 fonts (e.g. "Classic Romance" in Cormorant) doesn't wrap awkwardly in the sidebar at 360px.

**Decision resolutions (agent-recommended, adopted):**
- **D1 → (c).** `design.js` sets `sessionStorage.dpHasOverrides` from the diff `syncResetChips()` already computes (line 71); detail page reads it and **only fires the cautionary confirm when overrides exist** — preserves the confirm's meaning instead of nagging on every apply. Falls back to (a) always-confirm only if the plumbing slips.
- **D2 → status badge** (per P1-3); re-apply-to-reset belongs on the Design tab, not here.
- **D3 → Schedule / RSVP / Wedding Party confirmed in MVP** (digital-presence-plan.md D-5). Reordered **RSVP first** (the page every guest hits).
- **D4 → ship CSS mocks** (consistent with `.dp-thumb-fallback`; perf win on the WhatsApp hot path; explicit `aspect-ratio` already set → no CLS).

## Built (2026-06-02)

**Shipped — templates gallery + 5 detail pages + apply round-trip.**

Files:
- `templates/index.html` — gallery: 5 `.dp-template-card`s (whole-card `<a>`, no nested interactives, per-card `aria-label`), 1→2→3 col @640/980, "Current" pill on Bold Festive (default) and dynamically re-marked by `templates.js` from `dpCurrentTemplate`.
- `templates/{bold-festive,classic-romance,minimal-modern,garden-soft,midnight-elegant}.html` — detail pages. Hero mock (neutral-framed palette island), "Across your pages" (RSVP / Schedule / Wedding Party mocks, `h2`→`h3` order, decorative screens `aria-hidden`), sticky sidebar (palette/font meta, body-stays-Poppins note). Apply CTA on the 4 non-current; **bold-festive** shows a non-interactive `.status-badge` ("Your current template") + "Customize in Design" instead.
- `templates.css` — gallery grid, detail layout/hero/mock/aside, mobile sticky Apply bar.
- `templates.js` — current-card marking by `data-template-id` match (NOT the dead `#dp-template-modal` selector); apply flow with cautionary confirm (fires only when `dpHasOverrides==='1'`); injected `#tpl-apply-confirm` modal (one instance, not 5); storage `try/catch` + `?apply=` fallback.
- `design.js` (edited, approved) — `syncResetChips()` sets `dpHasOverrides`; `applyFromSession()` reads `?apply=` fallback + strips it via `replaceState`; `commitTemplate()` sets `dpCurrentTemplate`.

**Verified in-browser (live-server):** apply round-trip both paths (no-override → direct commit; override → cautionary confirm → commit), gallery "Current" pill follows applied template, no console errors, no horizontal scroll @360, 1-col→2-col→3-col responsive, mobile sticky Apply bar <1024 / sticky sidebar (top 104px, clears nav) ≥1024, light + dark, all internal links resolve, all 5 heading fonts render.

**UI/UX agent — plan-phase APPROVE WITH NOTES, post-build APPROVE WITH NOTES.** All plan P0/P1/P2 resolutions confirmed implemented in code (no divergences). Post-build P1s fixed in-session: mock-grid breakpoint 560→640 (rhythm), help-FAB/Apply-bar collision lifted in 769–1023 band. P2-4 long-name resilience (`overflow-wrap`) added.

**Deferred (carryover):**
- `components.html` backfill now also owes the `.tpl-*` family (gallery grid, hero/mock, aside, apply-bar) on top of the prior Design-tab debt.
- Mobile real-device pass (Abhijith, phone via LAN URL).
- Designer template thumbnails to replace the CSS mocks.
- Dead `#dp-template-modal` selector in `design.js` (~line 230) — confirmed no-op, scoped out; cleanup task spawned by the post-build agent.
- P2 (accepted): `dpp-couple` is `h2` here vs `h3` on design.html (both `aria-hidden`, harmless); no page-level `prefers-reduced-motion` block (card hover transform is `hover:hover`-gated); gallery card `aria-label` kept deliberately over `aria-labelledby` (clearer SR name).
