# Website · Design tab — Plan

**File:** `designs/pages/website/design.html` (+ `website.css` / `website.js` additions)
**Status:** Draft, awaiting UI/UX agent review + Abhijith sign-off
**Owner:** Abhijith · Claude Code
**Last updated:** 2026-05-23
**Parent plan:** [digital-presence-plan.md](./digital-presence-plan.md)

---

## 1. One-liner

The host picks a **template bundle** (Layout + Hero variant + Palette + heading Font) and tweaks the three individual axes (palette, heading font, cover/OG). A right-side **live preview** in `.dp-preview-frame.is-controls-driven` mode reflects every change in <120ms. Body font is locked to Poppins (Q5). OG image auto-derives from cover with a toggle to upload a separate override (Q6).

This page is the **first consumer** of `.dp-preview-frame.is-controls-driven` — it's the proof that the shell primitive composes correctly across multiple control sections feeding one preview.

## 2. User goals (host)

1. **Pick a template fast.** "Make my site not look default" → 5 tiles, one click, done.
2. **Stay in control of details.** After picking a template I should be able to swap palette OR heading font without losing the rest.
3. **See the change before I publish.** Right-pane preview reflects every tap.
4. **Trust the cover photo crop.** I uploaded it, I want to see what guests see; I don't want surprises on WhatsApp share.
5. **Don't ask me to re-pick OG.** Default to "use the cover" — only let me override if I care.

## 3. Decisions inherited from parent plan (locked, do not re-litigate)

| ID | Decision | Source |
|---|---|---|
| Q1 | Template bundles {Layout, Hero variant, Palette, Font}. Host overrides individual axes. Template change resets to bundle defaults via Discard confirm (only if any override exists). | DP plan Update 2026-05-22 |
| Q5 | Body font = Poppins, locked. Only **heading** font is host-swappable. | DP plan Update 2026-05-22 |
| Q6 | OG default = auto-derived from cover (cropped to 1.91:1). Host can upload separate override. | DP plan Update 2026-05-22 |
| — | Autosave per field-blur (600ms debounce). Save chip in breadcrumb (`SYNCED HH:MM:SS`). No autosave toasts. | DP plan Update 2026-05-22 |
| — | Modal stack uses `window.evenzi.openModal/closeModal` only. No page-level modal controllers. | DP plan Update 2026-05-22 |

### Decisions locked this session (Abhijith, 2026-05-23)

| ID | Decision |
|---|---|
| S1 | **Reference:** locked plan + WithJoy as wireframe. Free to design beyond. |
| S2 | **Cross-cutting modal reuse:** extract Share / Publish settings / Publish-confirm / Discard to a JS-injected partial. Single source. **Phase 0 of this build.** |
| S3 | **Cover & OG UI:** single "Cover & OG image" card with a "Use a custom OG image" toggle. Default state shows the auto-derived OG preview; toggle reveals separate upload + crop (1.91:1). |

## 4. Scope summary

**In scope:**
- Full Design tab page at `designs/pages/website/design.html` — reuses Overview's top chrome (nav, breadcrumb, section-head, wb-tabs)
- 4 control sections: **Template**, **Palette**, **Heading font**, **Cover & OG image**
- Right-side **live preview** (`.dp-preview-frame.is-controls-driven`) — desktop sticky, mobile in-flow
- 3 new modal instances: **Change-template picker**, **Cover-crop**, **OG-crop**
- Phase 0: extract Share / Publish settings / Publish-confirm / Discard to `website-shared.js`
- Promote `wb-tabs` `Design` href from `#design` to `design.html`; update `overview.html` to do the same

**Out of scope (deferred):**
- Hero variant picker (this is part of the template bundle for now; standalone Hero editor will live in Edit Pages → Home/Hero page editor)
- Layout swap (this is part of the template bundle; no standalone Layout control on the Design tab itself per Q1)
- Body font picker (locked, Q5)
- Real image crop logic (placeholder UI for now; React port wires native crop)
- Real QR generation (placeholder icon)

> **Note on Layout:** The plan v1 listed Layout as a Design-tab control. Per Q1 the bundle bundles Layout into the template, so we surface **Template** + **Palette** + **Font** + **Cover/OG** as the four control sections, NOT five. Layout is implicit in template choice. (If a future user-test shows hosts want to swap layout independently of template, we revisit — but YAGNI.)

## 5. Layout — desktop ≥1024px and mobile <1024px

### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Floating Nav]                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│  [Rich Breadcrumb · SYNCED chip]                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  [Section Head — Event Website / subtitle]                                │
├──────────────────────────────────────────────────────────────────────────┤
│  [Wb-tabs — Overview · DESIGN · Edit Pages · Photos · Card Templates]    │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  Template       [Change]       │  │   [Mobile / Desktop toggle]     │  │
│  │  ── current template tile ──   │  │                                  │  │
│  │  caption / "Change Design"     │  │   ┌─ phone frame ─┐              │  │
│  ├────────────────────────────────┤  │   │  PREVIEW       │  (sticky    │  │
│  │  Palette                       │  │   │  (updates on   │   top:8rem) │  │
│  │  ── 8 swatch tiles ──          │  │   │  field-blur,   │              │  │
│  │  ── selected: rim + dot ──     │  │   │  ≤120ms fade)  │              │  │
│  ├────────────────────────────────┤  │   └────────────────┘              │  │
│  │  Heading font                  │  │   "What guests see"               │  │
│  │  ── 5 font preview rows ──     │  │                                   │  │
│  ├────────────────────────────────┤  │                                   │  │
│  │  Cover & OG image              │  │                                   │  │
│  │  ── cover preview · upload ──  │  │                                   │  │
│  │  ── toggle: custom OG ──       │  │                                   │  │
│  │  ── (revealed) OG preview ──   │  │                                   │  │
│  └────────────────────────────────┘  └─────────────────────────────────┘  │
│            ~55% width                            ~45% width                │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mobile (<1024px)

Controls stack first, preview last (matches Overview: "what guests see" is consistently last on mobile to avoid pushing controls off-screen).

```
[Nav] · [Breadcrumb] · [Section head] · [Wb-tabs]
[Template card]
[Palette card]
[Heading font card]
[Cover & OG image card]
[Live preview card · sticky? NO — in-flow on mobile, matches Overview]
```

Why preview is **not** sticky on mobile: a sticky 60vh phone frame above the fold blocks the controls below it. The Overview pattern keeps preview in-flow on mobile too. Same here.

## 6. Section detail

### 6.1 Template card

```html
<section class="clay-card dp-card" id="template">
  <header class="dp-card-head">
    <div>
      <h2 class="dp-card-title">Template</h2>
      <p class="dp-card-sub">A bundled look — layout, hero, palette, and font.</p>
    </div>
  </header>

  <article class="dp-current-template">
    <div class="dp-current-template-thumb">
      <img src="…" alt="" />  <!-- live thumb of the template -->
    </div>
    <div class="dp-current-template-meta">
      <h3 class="dp-current-template-name">Classic Romance</h3>
      <p class="dp-current-template-blurb">Editorial layout, serif headings, blush palette.</p>
      <button class="btn-pill btn-pill-secondary btn-pill-sm" data-modal-target="#dp-template-modal">
        <span class="material-symbols-outlined">palette</span>
        Change template
      </button>
    </div>
  </article>

  <p class="dp-card-foot-note">
    Changing your template will reset your palette and font picks. We'll ask first.
  </p>
</section>
```

**5 templates in MVP** (matches WithJoy's "we ship a finite gallery" model):

| ID | Name | Layout | Hero | Palette | Heading font |
|---|---|---|---|---|---|
| classic-romance | Classic Romance | Editorial | Centered serif over cover | Blush | Cormorant |
| minimal-modern | Minimal Modern | Single column | Top-aligned text + bottom cover | Ivory | Inter |
| bold-festive | Bold Festive | Magazine | Full-bleed cover + bottom card | Brand red (default) | Poppins (default) |
| garden-soft | Garden Soft | Two-column | Side photo + text | Sage | Lora |
| midnight-elegant | Midnight Elegant | Dark hero | Inverted cover bg | Midnight | Playfair Display |

**Empty / no-template state:** there is always a default (Bold Festive = current Vibrant Union look), so no empty state.

### 6.2 Palette card

```html
<section class="clay-card dp-card" id="palette">
  <header class="dp-card-head">
    <div>
      <h2 class="dp-card-title">Palette</h2>
      <p class="dp-card-sub">Pick a color story. Or stick with your template's default.</p>
    </div>
    <span class="dp-card-override-pill" hidden>
      <span class="material-symbols-outlined">edit</span>
      Overridden
    </span>
  </header>

  <div class="dp-tile-grid-sm" role="radiogroup" aria-label="Palette">
    <button class="dp-palette-tile is-selected" role="radio" aria-checked="true" data-palette="brand-red">
      <span class="dp-palette-swatches">
        <span style="background:#BB0020"></span>
        <span style="background:#F2E5E2"></span>
        <span style="background:#FFFFFF"></span>
      </span>
      <span class="dp-palette-name">Brand Red</span>
    </button>
    <!-- 7 more tiles: Blush · Ivory · Sage · Midnight · Sunset · Ocean · Marigold -->
  </div>
</section>
```

**8 palettes in MVP:**

| ID | Name | Primary | Surface | Accent |
|---|---|---|---|---|
| brand-red | Brand Red (default) | #BB0020 | #FDF7F4 | #1f2937 |
| blush | Blush | #C97B7B | #FBF4F2 | #4A2C2C |
| ivory | Ivory | #6B4A2B | #FAF6EE | #2C1F12 |
| sage | Sage | #5A7A5A | #F2F6EF | #2D3D2D |
| midnight | Midnight | #1A1F2E | #F4F4F8 | #6B5BA9 |
| sunset | Sunset | #D97755 | #FFF4EC | #4A2818 |
| ocean | Ocean | #2A6F8E | #EFF6F9 | #133545 |
| marigold | Marigold | #D9892E | #FFF8EC | #4A3015 |

`.is-selected` adds a 2px brand-rim + check dot in the corner. Selecting fires `field-blur` autosave (immediate, since it's a radio).

**Override pill:** when `data-palette ≠ template-default-palette`, the `Overridden` pill in the card header becomes visible. Same pattern for font + cover + OG. Triggers the Discard-changes modal when host attempts to swap template.

### 6.3 Heading font card

```html
<section class="clay-card dp-card" id="font">
  <header class="dp-card-head">
    <div>
      <h2 class="dp-card-title">Heading font</h2>
      <p class="dp-card-sub">Body text stays in Poppins for clarity. Headings define your style.</p>
    </div>
    <span class="dp-card-override-pill" hidden>…</span>
  </header>

  <div class="dp-font-list" role="radiogroup" aria-label="Heading font">
    <button class="dp-font-row is-selected" role="radio" aria-checked="true" data-font="poppins">
      <span class="dp-font-preview" style="font-family:Poppins;font-weight:800">Anya &amp; Kabir</span>
      <span class="dp-font-name">Poppins · default</span>
    </button>
    <!-- 4 more rows: Cormorant · Playfair Display · Lora · Inter -->
  </div>
</section>
```

**5 heading fonts in MVP** (all Google Fonts, loaded on the Design tab + preview):

| ID | Family | Weight | Style |
|---|---|---|---|
| poppins | Poppins | 800 | Geometric sans, default |
| cormorant | Cormorant Garamond | 700 | Serif, editorial |
| playfair | Playfair Display | 700 | Display serif, dramatic |
| lora | Lora | 600 | Soft serif, friendly |
| inter | Inter | 800 | Modern sans, clean |

Each row is a horizontally-stretched tile (full-width). Preview text uses the actual host's couple names ("Anya & Kabir" in stub) — concrete, not lorem-ipsum.

### 6.4 Cover & OG image card

```html
<section class="clay-card dp-card" id="cover">
  <header class="dp-card-head">
    <div>
      <h2 class="dp-card-title">Cover &amp; social-share image</h2>
      <p class="dp-card-sub">Cover appears on the public hero. Social-share is what WhatsApp / Instagram show.</p>
    </div>
    <span class="dp-card-override-pill" hidden>…</span>
  </header>

  <!-- Cover -->
  <div class="dp-cover-block">
    <div class="dp-cover-preview" aria-label="Current cover image">
      <img src="…" alt="Anya and Kabir, cover photo" />
      <button class="dp-cover-replace" data-modal-target="#dp-cover-crop-modal">
        <span class="material-symbols-outlined">add_photo_alternate</span>
        Replace cover
      </button>
    </div>
    <p class="dp-cover-meta">JPG · 1600 × 900 · 480 KB</p>
  </div>

  <!-- Divider -->
  <hr class="section-rule" />

  <!-- OG -->
  <div class="dp-og-block">
    <label class="toggle-switch">
      <input type="checkbox" data-dp-og-custom />
      <span class="toggle-switch-track"><span class="toggle-switch-thumb"></span></span>
      <span class="toggle-switch-label">
        Use a custom social-share image
        <span class="toggle-switch-hint">Default: we crop your cover to 1.91:1.</span>
      </span>
    </label>

    <!-- Auto-derived preview (default state) -->
    <div class="dp-og-preview" data-dp-og-state="auto">
      <img src="…" alt="Auto-derived OG image" />
      <p class="dp-og-caption">
        <span class="material-symbols-outlined">auto_awesome</span>
        Auto-derived from your cover (1200 × 630)
      </p>
    </div>

    <!-- Custom upload state (hidden by default) -->
    <div class="dp-og-preview" data-dp-og-state="custom" hidden>
      <img src="…" alt="Custom OG image" />
      <button class="dp-cover-replace" data-modal-target="#dp-og-crop-modal">
        <span class="material-symbols-outlined">add_photo_alternate</span>
        Replace social-share image
      </button>
    </div>
  </div>
</section>
```

### 6.5 Live preview card (right column / bottom on mobile)

Reuses Overview's `.dp-preview-stage` + `.dp-preview-frame` markup, **except** the frame gets `.is-controls-driven` (was `.is-static` on Overview). Sticky top:8rem on ≥1024px; in-flow on mobile.

The preview's inner content is the **same Vibrant Union public hero** that Overview shows, but its `data-palette` / `data-font` / `data-cover` attributes are wired to the controls. `website.js` updates the preview on radio change.

```html
<section class="clay-card dp-card" id="preview" aria-labelledby="dp-prev-h">
  <header class="dp-card-head">
    <div>
      <h2 id="dp-prev-h" class="dp-card-title">Live preview</h2>
      <p class="dp-card-sub">Updates as you tweak.</p>
    </div>
    <div class="device-toggle" role="radiogroup" aria-label="Preview device">
      <!-- mobile / desktop buttons -->
    </div>
  </header>
  <div class="dp-preview-stage" data-device-stage="mobile">
    <div class="dp-preview-frame is-controls-driven" data-palette="brand-red" data-font="poppins" role="img" aria-label="Live preview">
      <div class="dp-preview-screen">
        <div class="dp-preview-content">
          <p class="dpp-eyebrow">Wedding of</p>
          <h3 class="dpp-couple">Vibrant Union</h3>
          <p class="dpp-date">Sat, 14 Feb 2026</p>
          <!-- countdown + CTA -->
        </div>
      </div>
    </div>
    <div class="dp-preview-caption">
      <span class="material-symbols-outlined">info</span>
      Public hero. Private pages unlock after phone match or password.
    </div>
  </div>
</section>
```

The palette mapping in `.dp-preview-screen` reads CSS vars scoped to the frame:

```css
.dp-preview-frame[data-palette="blush"]    { --dpp-primary:#C97B7B; --dpp-surface:#FBF4F2; … }
.dp-preview-frame[data-palette="sage"]     { --dpp-primary:#5A7A5A; --dpp-surface:#F2F6EF; … }
/* …7 more variants… */
```

`data-font` swaps the `--dpp-heading-font` CSS var.

## 7. Modal inventory

### 7.1 New instances (this page)

| Modal id | Shell shape | Trigger | Purpose |
|---|---|---|---|
| `dp-template-modal` | `.modal-picker-grid` | Template card "Change template" | 5 template tiles (no filter chips — too few items); current template gets `.is-selected` flag; clicking another fires `data-dp-template-pick` |
| `dp-template-discard-modal` | `.modal-confirm-affirmative` (but red-tinted CTA — overrides will be lost) | When `dp-template-modal` user picks a *different* template AND any override pill is showing | Confirm reset. Two buttons: "Cancel" (returns to picker) and **"Change template anyway"** (red secondary, brand-tint not destructive — per parent plan: "Cancel + Change template anyway, no type-to-confirm") |
| `dp-cover-crop-modal` | `.modal-image-crop` | Cover "Replace cover" | Upload + crop to 16:9. Stub: shows drop-zone, then a stage with the cover image and a zoom slider; "Apply" closes + updates preview |
| `dp-og-crop-modal` | `.modal-image-crop` | OG "Replace social-share image" (custom mode only) | Upload + crop to 1.91:1. Same shell, different aspect ratio set via `data-aspect="1.91"` |

### 7.2 Reused across all tabs (Phase 0 extraction)

Pre-existing in `overview.html`:
- `dp-share-modal` (Share)
- `dp-publish-settings-modal` (Publish settings)
- `dp-publish-confirm-modal` (Publish-confirm)
- `dp-template-reset-modal` (Discard unsaved — was scoped to Overview's URL slug edit. Renamed: this becomes the generic "Discard unsaved" used by the template-discard flow above.)

**Phase 0 task:** move these 4 modal `<template>` blocks (and their wiring in `website.js`) into a new file `designs/pages/website/website-shared.js`. The JS module:
1. Owns the `<template>` strings inline (or fetches them from `website-shared.html`).
2. On `DOMContentLoaded`, appends them to `document.body` IF they aren't already present (so overview.html can drop its copies).
3. Wires the cross-cutting handlers (Share's clipboard copy, Publish-confirm's URL preview, etc.).
4. Exports a thin API: `window.evenziDP = { openShare, openPublishConfirm, … }` for triggers on each page.

Then both `overview.html` and `design.html` (and future tabs) drop their cross-cutting modal markup and just include `website-shared.js`.

> **Why JS-injected and not a server include?** Static design folder. No build step. JS injection is the cleanest "single source" pattern that works in raw HTML/CSS/JS. React port replaces this with a `<DPModals />` portal.

### 7.3 Toasts emitted by this page

- `TEMPLATE APPLIED` — after template apply (whether via discard flow or no-override direct apply)
- `PALETTE CHANGED` — on palette swap (also covered by SYNCED chip, but a toast helps confirm intent on first-touch — to be reviewed by UI/UX agent)
- `COVER UPDATED` / `SOCIAL-SHARE IMAGE UPDATED` — after crop apply
- `RESET TO TEMPLATE DEFAULTS` — when host clicks "Reset all overrides" (parked — not in MVP scope; flag for v2)

**Open question (for agent review):** PALETTE CHANGED / FONT CHANGED toasts vs SYNCED chip. The parent plan's toast catalog **dropped autosave toasts** — but template-bundle changes are higher-stakes. Default: skip them (rely on preview + SYNCED chip), only toast on TEMPLATE APPLIED.

## 8. Component reuse audit (vs designs/shared/shell.css)

| Need | Existing primitive | Status |
|---|---|---|
| Floating glass nav | `floating-nav` + `fn-icon-btn` | Reuse |
| Sticky rich breadcrumb | `bc-shell` family | Reuse |
| Section head | `.section-head` + family | Reuse |
| Wb-tabs (Overview / Design / etc.) | `.wb-tabs` + `.wb-tab` (in website.css) | Reuse — update `Design` href to `design.html` |
| Card surface | `.clay-card` + `.dp-card` family | Reuse |
| Card header | `.dp-card-head` + title/sub | Reuse |
| Pill button | `.btn-pill` + variants | Reuse |
| Tile grid | `.dp-tile-grid-sm` (palette swatches) | Reuse |
| Live preview frame | `.dp-preview-frame.is-controls-driven` | Reuse (first consumer of this mode — proves it) |
| Device toggle | `.device-toggle` | Reuse |
| Toggle switch | `.toggle-switch` (custom OG toggle) | Reuse |
| Section rule (divider) | `.section-rule` | Reuse |
| Picker modal | `.modal-picker-grid` (template picker) | Reuse |
| Image crop modal | `.modal-image-crop` (cover + OG) | Reuse |
| Confirm modal | `.modal-confirm-affirmative` (discard confirm) | Reuse (red-tinted variant — verify with agent) |
| Toast | `window.evenzi.showToast()` | Reuse |
| **New: current-template tile** | thumb + name + blurb + CTA | New, page-specific (`.dp-current-template` in website.css) |
| **New: palette swatch tile** | 3 mini-swatches + name + selected rim | New, page-specific (`.dp-palette-tile`) — candidate for shell promotion if any other surface picks colors |
| **New: font preview row** | large preview text + tiny font-name line | New, page-specific (`.dp-font-row`) — candidate for shell promotion if any other surface picks fonts |
| **New: cover preview block** | image + meta + replace button | New, page-specific (`.dp-cover-preview`) |
| **New: OG state container** | dual-mode auto/custom | New, page-specific (`.dp-og-block`) |
| **New: card override pill** | "Overridden" label in card header | New, page-specific (`.dp-card-override-pill`) — candidate for shell promotion (will reuse on Edit Pages per-page overrides) |

**Shell promotion candidates to flag after build:** `.dp-card-override-pill`, `.dp-palette-tile`, `.dp-font-row`. Promote on second consumer.

## 9. State management

A tiny page-scoped store in `website.js` (or `design.js` if we split):

```js
const DesignState = {
  template: 'classic-romance',
  palette: 'brand-red',           // override if !== template default
  font: 'poppins',                // override if !== template default
  cover: { url: '…', cropped: true },
  ogMode: 'auto',                 // 'auto' | 'custom'
  ogCustom: null,
};
```

On any field-blur:
1. Update `DesignState`.
2. Reflect in `.dp-preview-frame` (data-attrs).
3. Diff against template defaults → toggle `.dp-card-override-pill` visibility per axis.
4. Fire SYNCED chip animation (reuse Overview's mechanism).
5. NO autosave toast.

On template "Change":
1. Open `dp-template-modal`.
2. Host clicks a tile.
3. If host has any overrides set → close picker → open `dp-template-discard-modal`.
4. On confirm → reset palette/font to new template's defaults → apply → toast `TEMPLATE APPLIED` → close.
5. If no overrides → apply directly → toast `TEMPLATE APPLIED` → close picker.

## 10. Mobile model

| Breakpoint | Layout |
|---|---|
| <640px | Single column. Preview last, in-flow. Palette tile grid = 3 cols × 3 rows. Font list = full-width rows. |
| 640–1023px | Single column. Preview last. Palette = 4 cols. Font = full-width. |
| ≥1024px | 55/45 split. Preview right + sticky `top:8rem`. Palette = 4 cols. Font = full-width rows. |
| ≥1280px | Same as 1024 + slight gutter increase (matches `.dp-shell` spec). |

No Edit|Preview tab-toggle on the Design tab — the live preview is small enough to fit alongside controls on mobile (it's the Per-page editor that needs the tab-toggle per CC-8 in the parent plan). On Design tab, mobile shows controls first, preview last (natural scroll), which is fine because changes are non-destructive and reversible.

## 11. Accessibility

- All radiogroups (`.dp-tile-grid-sm` for palette, `.dp-font-list` for font) use `role="radiogroup"` + `role="radio"` + `aria-checked` — arrow-key navigation, single Tab stop.
- `.dp-card-override-pill` has `aria-live="polite"` so SR users hear "Overridden" when overrides start.
- Preview frame stays `role="img"` with `aria-label` reflecting the current template name + couple + date (re-computed on swap).
- Modals: standard `window.evenzi` API — focus-trap, focus-return, Esc, scrim click already implemented in shell.js.
- Color picks: each palette tile has both name text AND swatches (not color-only). Each font row has both preview text AND font name.
- Cover thumbnail has descriptive alt (couple names).
- OG toggle uses `<input type="checkbox">` (real checkbox, not div) inside `.toggle-switch` (matches existing shell pattern in settings).
- Touch targets: palette tiles ≥44px, font rows ≥56px, all buttons ≥44px.
- Reduced-motion: `.dp-preview-frame.is-controls-driven` cross-fade already respects `prefers-reduced-motion: reduce` (parent shell rule).

## 12. Build order

| Step | Action |
|---|---|
| 0 | **Extract cross-cutting modals** → `website-shared.js` (Share / Publish settings / Publish-confirm / Discard). Update overview.html to drop its copies + include shared file. Verify overview still works end-to-end (Esc closes, focus returns, scrim click closes). |
| 1 | Add new CSS to `website.css` — `.dp-current-template`, `.dp-palette-tile`, `.dp-font-row`, `.dp-cover-preview`, `.dp-og-block`, `.dp-card-override-pill`. |
| 2 | Add the 8 palette CSS variants on `.dp-preview-frame[data-palette="…"]` (scoped vars). |
| 3 | Add the 5 font CSS variants on `.dp-preview-frame[data-font="…"]` (scoped var). Load the 4 non-Poppins families via Google Fonts on `design.html` head only. |
| 4 | Build `design.html` top-chrome (copy from overview.html, change `data-wb-page="design"` + flip wb-tab active state). |
| 5 | Build the 4 control sections (Template, Palette, Heading font, Cover & OG). |
| 6 | Build the preview section on the right (mobile in-flow / desktop sticky). |
| 7 | Build the 3 new modal instances (template picker, cover crop, OG crop) inline in design.html. (Template-discard reuses the shared one from Phase 0.) |
| 8 | Wire `website.js` (or new `design.js`) with the `DesignState` store + radio handlers + preview updaters + override-pill diff. |
| 9 | Update overview.html: switch wb-tab Design from `#design` to `design.html`; also re-verify after Phase 0 extraction. |
| 10 | UI/UX agent review (post-build). |
| 11 | Test phase (full matrix). |
| 12 | Close — append `## Built` block to this plan; update components.html (Task #4). |

## 13. Open questions for UI/UX agent

1. **Template tile size & info density** — should each template tile show a mini-thumb of the actual hero (rendered as a tiny preview frame), or a designer-made screenshot? MVP says screenshot (no live render in picker) — verify this is the right call vs. live mini-renders.
2. **Palette override pill placement** — header-right corner of the card, or under the card title? Header-right is current proposal — verify it doesn't crowd the "Change" CTA when both are visible.
3. **Font row preview text** — couple names ("Anya & Kabir") vs static lorem ("Your headline here"). Couple names = concrete, more useful for decision; lorem = neutral, doesn't bias on length. **Default: couple names**, since hosts always have names by this point in the flow.
4. **"Change template" CTA placement** — inside the current-template tile vs. as a card-header action. Current proposal: inside the tile. Verify.
5. **Discard-confirm CTA color** — parent plan says "red secondary" but the modal shell is `.modal-confirm-affirmative` which has a brand-red primary CTA by default. Verify this composes correctly without forking the shell.
6. **PALETTE CHANGED toast** — emit or not? Lean: not (rely on preview + SYNCED chip). Agent decides.
7. **Empty/error states** — what if the cover image fails to load? Need a fallback in `.dp-cover-preview`.
8. **Phase 0 extraction risk** — extracting cross-cutting modals to JS-inject means overview.html behavior must be re-verified. Worth doing now (vs. duplicate for one more page)?

## 14. Out-of-scope follow-ups (parked)

- `.dp-card-override-pill` promotion to shell.css (after second consumer)
- "Reset all overrides to template defaults" CTA (single click, no per-axis reset) — defer to v2; first version: discard happens only via template change
- Live mini-preview inside template picker tiles (vs. static screenshot)
- Real image crop logic (only stub UI here; React port handles)
- Custom palette builder (host enters hex) — far-future; MVP = curated palettes only

## 15. Built

### Phase 0 — landed 2026-05-23 (foundation, verified)

- **`.modal-confirm-cautionary` shell primitive** (`shell.css` ~lines 2890–2926). Sibling of `.modal-confirm-affirmative`. Neutral icon tint (`color-mix(in oklab, var(--muted) 14%, var(--card))`), outline glyph, no spring pop. Companion `.is-cautionary` modifier on `.modal-confirm-icon` for in-place styling. Documented future consumers: Reset overrides, Delete page, Remove guest. **Verified rendering:** Discard modal now uses the primitive — restart_alt icon in neutral grey circle, brand-red action CTA stays visible (per agent rationale: forward action stays brand-red so user can see what's primary).
- **`.dp-reset-chip` shell primitive** (`shell.css` ~lines 2367–2410). Hidden by default; reveals via `.is-visible`. Small pill `↺ Reset to template default`; on hover rotates icon -90° + fills with brand tint. Ready for per-axis override reset on Design tab (palette / font / cover / OG).
- **`.dp-crop-stage[data-crop-aspect]`** (`shell.css` ~lines 2820–2837). 6 aspect-ratio overrides (16:9, 1.91:1, 1:1, 4:3, 3:4, 9:16). Cover crop (16:9) and OG crop (1.91:1) are the immediate consumers; rest are pre-allocated for future use.
- **Cross-cutting modals extracted** to `website.js` `SHARED_MODALS_HTML` constant (~180 lines). Idempotent injection guard (`if (!document.getElementById('wb-share-modal'))`). 4 modal blocks removed from `overview.html` (replaced with explanatory comment). Single source for every wb-page going forward.
- **Discard confirm rewritten** to use `.modal-confirm-cautionary` primitive (was generic modal-card + modal-head + modal-body with `btn-pill-danger` action).
- **Overview re-verified post-extraction:**
  - Share modal: opens via `[data-dp-share]`, focus lands on slug input, Esc closes, focus returns to trigger. ✓
  - Publish-settings → Published → Save → Publish-confirm: stacks correctly (z:90 under, z:100 top), Esc closes top only first, second Esc closes underlying. ✓
  - Discard confirm (clean open via direct API): cautionary appearance verified, animation:none confirmed, action button center-justified, Esc closes, focus returns. ✓
  - Console: zero errors. ✓

### Phase 1+ — NOT YET BUILT

Phases 1–13 of the build order (control sections, palette/font CSS variants, design.html scaffold, 3 new modal instances, state store, mobile jump-anchor, agent post-build review, full test matrix) remain for the next session.


---

## Update — 2026-05-23 (UI/UX agent plan review · APPROVE WITH NOTES)

Agent ran a full plan-phase review. Verdict: APPROVE WITH NOTES. 1 P0, 8 P1s, 9 P2s. Resolutions below. Items in **bold** are decisions for Abhijith to sign off before build.

### P0 — applied

**P0-1. `.modal-confirm-cautionary` — new shell primitive.** Don't fork `.modal-confirm-affirmative` (it's a forward-momentum primitive — Publish, Send). Build a sibling for "you'll lose X" cases. Same skeleton (title + body + 2-button row); primary CTA defaults to `btn-pill-secondary` neutral fill; icon slot defaults to `warning` / `restart_alt`. **Promote to shell in Phase 0** alongside cross-cutting modal extraction. Future consumers: Reset overrides, Delete page, Remove guest.

### P1 — applied (planning-time)

- **P1-1. Override pill → interactive Reset chip per axis.** Drops passive "Overridden" label in favor of a focusable button `↺ Reset to template default`. Click reverts that single axis → chip hides → SYNCED fires. Removes the §14 parked "Reset all overrides" CTA (per-axis is strictly better; global reset is a footgun). Resolves §13-Q2.
- **P1-2. Mobile "Jump to preview" anchor.** Floating bottom-right pill, visible only when `#preview` is out of viewport (IntersectionObserver). Tap → smooth-scroll. Reuses `.fn-icon-btn` + `position:fixed` — no new primitive.
- **P1-3. Desktop sticky preview — grid-aligned.** Use `position:sticky; top:8rem; align-self:start` with the right column matching the controls column height. Preview ends naturally when controls end; no floating orphan.
- **P1-4. OG toggle — no CLS.** Reserve space with `min-height` on `.dp-og-block` sized to the larger of the two states. Show/hide via opacity+visibility within fixed height.
- **P1-5. Cover image — 4 states specced.** First-touch (dashed drop-zone + "Add cover photo" + dim hint "Recommend 1600×900"), upload-pending (skeleton), upload-failed (error chip + Retry), broken-src fallback (`--peach` bg + icon overlay).
- **P1-6. Disabled state hook.** `.dp-cover-replace` and crop CTAs respect `:disabled` cleanly (no flow built, just markup-ready).
- **P1-7. `aria-live` change.** Drop `aria-live="polite"` on the reset chips. Field-level radio announcement ("Blush, checked") covers the change. Less chatter.
- **P1-8. Selected palette tile — 3 signals.** Rim + check-dot + filled `check_circle` brand icon (on white/neutral backing, not on swatch row). `aria-checked="true"` already there.

### P2 — applied

- **P2-1.** Font row preview text = couple names pulled from event state (fallback "Your headline" if empty).
- **P2-2.** Font row also renders the **font name** in its own font (Poppins shows "Poppins" in Poppins, Cormorant shows "Cormorant Garamond" in Cormorant). CSS-only.
- **P2-3.** Template tile content = designer screenshots (locked, no live mini-renders).
- **P2-4.** `.modal-image-crop` shell needs `data-aspect` consumption — verify in Phase 0; document contract.
- **P2-5.** No PALETTE CHANGED toast. Only TEMPLATE APPLIED.
- **P2-6.** Body-font lock — small info tooltip on Heading font card title showing labeled preview ("Headings = couple names, section titles. Body = paragraphs.").
- **P2-7. `.dp-card-override-pill` (now `.dp-reset-chip`) — promote to shell NOW.** Edit Pages per-page overrides is the second consumer (already named in writing). Two consumers = promote, don't fork. Lives in shell.css from landing.
- **P2-8.** Palette name strip: `min-height` + `text-overflow: ellipsis` fallback. Cap names at 12 chars in the data model.
- **P2-9.** `.dp-palette-swatches` as `flex-wrap` row — handles 3-5 swatches gracefully. Future-proofs without locking the schema.

### Answers to §13 questions (agent verdict)

| Q | Verdict |
|---|---|
| 1 — Template tile content | Designer screenshots. Locked. |
| 2 — Override pill placement | Inside card body, left-aligned under sub, as **interactive Reset chip** (not passive label). |
| 3 — Font row preview text | Couple names + font-name-rendered-in-its-own-font. |
| 4 — "Change template" CTA placement | Inside current-template tile. Correct. |
| 5 — Discard-confirm CTA color | New `.modal-confirm-cautionary` shell, not a fork. |
| 6 — PALETTE CHANGED toast | Skip. |
| 7 — Cover empty/error states | All four states specced (P1-5). |
| 8 — Phase 0 extraction | Do it now. Add explicit "re-verify Overview" sub-step (Esc, focus return, scrim, Tab-trap). |

### Updated build order

Old build order (§12) replaced by:

| Step | Action |
|---|---|
| 0a | **Promote `.modal-confirm-cautionary` to shell.css** (sibling of `.modal-confirm-affirmative`). |
| 0b | **Promote `.dp-reset-chip` to shell.css** (single-button axis-reset chip). |
| 0c | **Extract cross-cutting modals** → `website-shared.js`. Update overview.html to drop copies + include shared file. **Re-verify Overview end-to-end** (Esc closes, focus returns, scrim click closes, Tab-trap on each modal). |
| 1 | Add new page-CSS to `website.css` — `.dp-current-template`, `.dp-palette-tile` (3-5 swatch flex-wrap), `.dp-font-row`, `.dp-cover-preview` (with 4 states), `.dp-og-block` (min-height reserved). |
| 2 | Add 8 palette CSS variants on `.dp-preview-frame[data-palette="…"]`. |
| 3 | Add 5 font CSS variants on `.dp-preview-frame[data-font="…"]`. Load 4 non-Poppins families. |
| 4 | Build `design.html` top-chrome (mirror overview). Wb-tab active = Design. |
| 5 | Build 4 control sections — Template / Palette / Heading font / Cover & OG. Each card carries a `.dp-reset-chip` slot (hidden until override). |
| 6 | Build live-preview section (right col on desktop sticky-with-grid; bottom in-flow on mobile). |
| 7 | Build 3 new modal instances — template picker, cover crop, OG crop. Template-discard reuses cautionary shell + `window.evenziDP` wiring. |
| 8 | Wire `design.js` — `DesignState` store, radio handlers, preview updater, reset-chip diff. |
| 9 | Add mobile "Jump to preview" anchor (IntersectionObserver). |
| 10 | Update overview.html: `Design` wb-tab href → `design.html`. Re-verify after Phase 0. |
| 11 | UI/UX agent post-build review. |
| 12 | Test phase (full matrix). |
| 13 | Close — append `## Built` block; update components.html (Task #4). |

### Anti-pattern check (agent)

Clean. No AI-default trendiness, no glass abuse, no excess motion. Override-pill-as-decoration risk eliminated by P1-1 conversion.


