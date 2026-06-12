---
title: Design → Next.js Port Map
status: Draft — awaiting Dheeraj confirmation
owner: Abhijith (design / maintainer) → Dheeraj (port / consumer)
last_updated: 2026-06-12
canonical_home: docs/PORT-MAP.md   # repo copy is now the source of truth (was shared with Dheeraj as a loose file)
coverage: partial   # see §8 Coverage tracker
update_trigger: >
  Rolling doc. Add/adjust an entry whenever a new shell primitive lands, a
  shell.js behavior changes, a sessionStorage key is added, or a page ships.
  Treat "PORT-MAP entry updated" as part of the design-path definition-of-done
  (same discipline as the components.html backfill).
---

# Design → Next.js Port Map

> **What this is.** The Evenzi UI is built first as static HTML/CSS/JS prototypes in `designs/`, then ported to the Next.js/React + Tailwind app by Dheeraj. This document is the **bridge**: it maps every design-folder artifact to its intended React equivalent so the port composes the prototype rather than re-negotiating it.
>
> **It is descriptive, not code** — no design files change because of this doc. It is a *rolling* reference: kept current as pages ship, not written once at the end.

---

## 0. Current React app baseline (where the port actually starts)

> ### 🔄 Changelog since 2026-06-04 (read this first)
> Several baseline facts below changed. The big ones:
> - **A shared component library now EXISTS** (Dheeraj's revamp → `Dev-Vibe`/`Dev-Vibe-Testing`). `components/ui/` = Button · ClayCard · FormGroup · FormInput · Icon · SegmentedControl · StatusBadge · ToggleSwitch · WizardStepper (+ 3 hero comps). `components/layout/` = Breadcrumb · FloatingNav · HelpFab · PageFooter · RevealObserver · ScrollProgress · ThemeToggle · ToolRail. So §4 is **no longer all "to build"** — those rows are partially landed (still generic-tokened; the §3 brand re-skin is the gap, not the components).
> - **Design-side fonts vendored** — `designs/shared/fonts/*.woff2` (Poppins 300–800 latin/latin-ext/devanagari + Material Symbols) with `@font-face` in `shell.css`; the Google-CDN `<link>`s were dropped across pages. The 4 *website-template* display fonts (Cormorant/Playfair/Lora/Inter) + the new **Invitations card fonts** still load from the CDN — tracked vendoring debt (§3.3).
> - **`.seg` is the canonical view-switcher** — `.nav-tabs`-in-page / `.pill-tab` / `.wb-tab` / `.auth-tabs` were consolidated into one `.seg`/`.seg-item`/`.seg-wrap` family (matches `SegmentedControl.tsx`). §4.1's `.nav-tab` row is superseded — see §4.1 note.
> - **New shell primitives** since 2026-06-04: `.photo-tile` + `.bulk-bar` family (promoted from website.css), `.dp-tile-trigger`, `.modal-lightbox-nav` (lightbox prev/next), `.dp-dropzone--multi`, the **`.skeleton` loading family** (+ `--skel-*` tokens, `window.evenzi.setLoading`). See §3.1/§4.8/§5.
> - **New full page prototypes:** **Media** (`media.html` — photos + videos tabs + albums, sort/filter, bulk, lightbox) and **Invitations** (`invitations.html` — a card *personalizer*: gallery → inline-edit → share; page-module CSS `.inv-*`). Both move from "shells only" to designed in §8.2.

**A functional React app already exists** (`app/`) — the port is **re-skin + extend, not greenfield**. It is still **generically styled and shares little visual with `designs/`** (the brand-token re-skin is the remaining gap):

- **Stack:** Next 14.2.5 App Router · **Tailwind v4** (`@import "tailwindcss"` + `@theme inline` in `app/globals.css` — no `tailwind.config.*` file).
- **Tokens / font today:** `globals.css` still carries **placeholder tokens** (`--color-primary:#111827` slate, marked *"placeholder values"*) — **none of the brand system** (no `#BB0020`, no clay/liquid-glass, no `--brand`/`--success`/`--danger`, no class-based dark mode). **Partial progress:** Poppins is now wired via `--font-poppins`/`next/font` (`@theme` exposes `--font-display`). So §3's first move is *started* (font) but the **brand-red token re-skin + dark mode are still pending**.
- **Shared component library: PARTIAL** (was "none") — `components/ui/` + `components/layout/` exist (revamp, list above). They render but consume the *generic* tokens; re-skinning them via §3 is the high-leverage move, not rebuilding them. `lib/contexts/WizardContext.tsx` exists (§5 ✅); no Theme/Toast/Modal providers yet.

**What's functionally built (generic-styled — these are re-skin targets, not greenfield):**

| Feature | Route (actual) | State / notes |
|---|---|---|
| Auth (login) | `/auth` | functional |
| Role selection | `/auth/role-selection` | functional |
| Create-event wizard (4 steps) | `/events/create` | **`WizardContext` (`useReducer`) — already the §6 pattern ✅** (not sessionStorage) |
| Event hub | `/events/[id]` | basic |
| Create success | `/events/[id]/success` | functional |
| Home dashboard | `/home` (+ `/` root) | `EventsGrid`, real event cards |
| API | `/api/events`, `/api/event-types`, `/api/auth/verify` | functional |

**Not built at all (designed in `designs/` only):** Our Journey · event-settings (6 tabs) · website / Digital-Presence (8 pages) · guests · invitations · planning · media · user-settings · public guest site.

**Implication — the highest-leverage first move is §3:** replace `globals.css`'s placeholder tokens + Inter with the `shell.css` token system + Poppins + class-based dark mode. That re-skins the *already-functional* auth / wizard / home with near-zero logic change. Routes mostly match §7 — note the wizard is **`/events/create`**, not `/events/new`.

> **Live-site note:** evenzi.vercel.app currently runs this generic-styled version — the `designs/` visual language has **not** reached production yet.

---

## 1. Purpose & rolling-update protocol

**Why it exists.** The council/Codex review flagged that the static→React path was undefined (no primitive→component map, an undocumented cross-page state layer). Reverse-engineering that at port time is the biggest avoidable cost. This doc removes it incrementally.

**How to keep it rolling (the protocol):**
- When a **new shell primitive** is promoted to `shell.css` → add a row in §4 (and a showcase tile in `components.html`).
- When a **shell.js behavior** is added/changed → add/adjust a row in §5.
- When a **storage key** is introduced → add a row in §6 (shape, producer, consumer, React target).
- When a **page ships** → confirm its route in §7 and flip its row in the §8 coverage tracker.
- Module-only components (page CSS, not shell) are flagged inline — they port *with their page*, not into the shared design-system package.

**Status legend (used in §8):** ✅ Drafted · ◐ Partial · ☐ Not started · ✔ Confirmed (Dheeraj) · 🚀 Ported.

---

## 2. Conventions

- **Naming:** a class-family becomes a PascalCase component; modifiers become a `variant` prop, states become boolean/enum props. e.g. `.btn-pill` + `.btn-pill-danger` + `.is-loading` → `<ButtonPill variant="danger" loading />`.
- **a11y is part of the contract:** every primitive already ships correct `role`/`aria-*` and a `:focus-visible` ring keyed to `--brand`. The React component **must preserve native semantics** — don't replace `<button>`/`<input>`/`<select>` with non-semantic `<div>`s.
- **The `window.evenzi.*` global is the de-facto "shell SDK"** (toast, modal, DOM builders). It splits into React Context providers + hooks; the imperative DOM-wiring vanishes.
- **Three tiers of port effort:** *vanishes* (DOM builders, auto-injection, active-state indirection — gone in JSX) · *port-as-is* (presentational primitives, simple hooks) · *buy* (modal/popover/calendar/time-picker/radio/switch → headless lib).

---

<!-- ════════════════ §3 contributed by Tailwind/tokens agent ════════════════ -->

## 3. Design tokens + Tailwind config bridge

The static prototype already runs on a CSS-custom-property token system defined once in `designs/shared/shell.css` (`:root` = light, `.dark` = dark) and a Tailwind config repeated inline in every page `<head>` that maps utility names onto those vars. The port collapses this into **one** `tailwind.config.ts` + **one** `globals.css` with the `:root`/`.dark` blocks moved verbatim.

### 3.1 Token inventory

All tokens live on `:root` (light) and are selectively redefined under `.dark`. **Theme-aware** = redefined in `.dark`; **constant** = defined once.

**Core color tokens** (all theme-aware):

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f9fafb` | `#0d0d0d` |
| `--card` | `#ffffff` | `#18181b` |
| `--brand` | `#BB0020` | `#ee3f3a` |
| `--brand-hover` | `#1f2937` | `#ff5a55` |
| `--brand-tint` | `rgba(187,0,32,0.05)` | `rgba(238,63,58,0.10)` |
| `--brand-tint-2` | `rgba(187,0,32,0.10)` | `rgba(238,63,58,0.18)` |
| `--ink` | `#111827` | `#f9fafb` |
| `--ink-soft` | `#374151` | `#e5e7eb` |
| `--muted` | `#6b7280` | `#a8a8a8` |
| `--muted-soft` | `#9ca3af` | `#7a7a7a` |
| `--line` | `#e5e7eb` | `#2a2a2a` |
| `--line-soft` | `#f3f4f6` | `#1f1f1f` |
| `--skel-base` (NEW) | `#e7e9ed` | `#232327` |
| `--skel-sheen` (NEW) | `#f4f6f8` | `#303036` |
| `--cream-soft` | `rgba(187,0,32,0.08)` | `rgba(238,63,58,0.08)` |
| `--peach` | `rgba(187,0,32,0.05)` | `#1f2937` |
| `--peach-deep` | `rgba(187,0,32,0.10)` | `#374151` |
| `--dark-card` | `#111827` | `#1f2937` |
| `--dark-card-soft` | `#1f2937` | `#374151` |

> Note `--brand-hover` is **not** a lighter brand red in light mode — it's `#1f2937` (slate ink), an intentional design choice. Carry it across as-is; don't "fix" it.

**Semantic / status tokens** (theme-aware — success/danger each have a base, `-on`, `-tint`, `-rim`):

| Token | Light | Dark |
|---|---|---|
| `--success` | `#15803d` | `#4ade80` |
| `--success-on` | `#15803d` | `#4ade80` |
| `--success-tint` | `rgba(22,163,74,0.10)` | `rgba(74,222,128,0.12)` |
| `--success-rim` | `rgba(22,163,74,0.28)` | `rgba(74,222,128,0.32)` |
| `--danger` | `#ef4444` | `#f87171` |
| `--danger-on` | `#dc2626` | `#fca5a5` |
| `--danger-tint` | `rgba(239,68,68,0.10)` | `rgba(248,113,113,0.12)` |
| `--danger-rim` | `rgba(220,38,38,0.28)` | `rgba(252,165,165,0.32)` |

Used by status-badge, page-tier, and `gs-tile.is-done`. (`BRAND-GUIDELINES.md` §"Status colors" still lists these as "not yet tokenized" — that doc is stale; they **are** tokenized in shell.css now. Flag for a docs fix.)

**Radii** — *not* CSS vars; defined as Tailwind `borderRadius` keys (constant): `clay` = `24px`, `clay-sm` = `16px`, `clay-lg` = `32px`.

**Shadows** (theme-aware — light uses ink-tinted drops, dark uses near-black): `--shadow-clay`, `--shadow-clay-hover`, `--shadow-clay-pill` (pill is brand-tinted). **Gradients/decorative** (theme-aware): `--featured-grad`, `--avatar-1/-2/-3`, `--dot-color`. **Liquid-glass** (theme-aware, second block): `--lg-bg-grad`, `--lg-rim`, `--lg-inset-top/-bottom`, `--lg-shadow`, `--lg-spec`, `--lg-blur` (`blur(30px) saturate(180%)`) — back `.lg-glass-card`.

### 3.2 The Tailwind bridge

The current inline `tailwind.config` maps utility classes to the vars. It lifts unchanged into `theme.extend`:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", card: "var(--card)",
        cream: "var(--bg)", "cream-soft": "var(--cream-soft)",
        peach: "var(--peach)", "peach-deep": "var(--peach-deep)",
        "dark-card": "var(--dark-card)", "dark-card-soft": "var(--dark-card-soft)",
        brand: "var(--brand)", "brand-hover": "var(--brand-hover)",
        "brand-tint": "var(--brand-tint)", "brand-tint-2": "var(--brand-tint-2)",
        ink: "var(--ink)", "ink-soft": "var(--ink-soft)",
        muted: "var(--muted)", "muted-soft": "var(--muted-soft)",
        line: "var(--line)", "line-soft": "var(--line-soft)",
        // ADD — semantic tokens exist as vars but were never bridged:
        success: "var(--success)", "success-tint": "var(--success-tint)", "success-rim": "var(--success-rim)",
        danger: "var(--danger)", "danger-tint": "var(--danger-tint)", "danger-rim": "var(--danger-rim)",
      },
      fontFamily: { display: ["Poppins", "sans-serif"], body: ["Poppins", "sans-serif"] },
      borderRadius: { clay: "24px", "clay-sm": "16px", "clay-lg": "32px" },
      boxShadow: { clay: "var(--shadow-clay)", "clay-hover": "var(--shadow-clay-hover)", "clay-pill": "var(--shadow-clay-pill)" },
    },
  },
};
export default config;
```

Deltas worth Dheeraj's attention:
- **`cream` aliases to `var(--bg)`** (intentional — no separate cream var). Preserve.
- The **semantic `success`/`danger` families were never in the inline bridge** — pages reach them via raw `var(--success)`. Bridging them (above) is a safe, additive improvement.
- Tailwind's `/opacity` modifier (`text-brand/30`, `border-brand/85`) composes **only** on solid-color tokens; the prototype already restricts `/NN` to `brand`/`ink`/`line` — keep that discipline (`rgba()` tokens like `--brand-tint` won't compose with `/NN`).

### 3.3 CDN → build migration

> **Update (2026-06-12):** the design side already did two of these. **(a)** Tailwind is **vendored** (`designs/shared/tailwind.css`, pinned v3 CLI build) — the runtime `cdn.tailwindcss.com` `<script>` is gone from every page. **(b)** **Poppins + Material Symbols are vendored** (`designs/shared/fonts/*.woff2` + `@font-face` in `shell.css`); their Google-CDN `<link>`s were removed. **Still CDN:** the 4 website-template display fonts (Cormorant/Playfair/Lora/Inter) and the Invitations card fonts (Cormorant/Playfair) — vendor these for export/offline fidelity (the Invitations card PNG-export build needs `document.fonts.ready`). The inline `tailwind.config` per-page is also gone (one shared config era).

The prototype historically loaded `https://cdn.tailwindcss.com` and repeated the inline `tailwind.config` in every page `<head>`. The port:
1. Drops the CDN `<script>` + all inline configs.
2. Installs Tailwind as a build dep; the single `tailwind.config.ts` above is the only config.
3. Moves the `:root{…}`/`.dark{…}` token blocks out of `shell.css` into `app/globals.css` `@layer base`, imported once in the root layout. The rest of `shell.css` (`.clay-card`, `.lg-glass-card`, `.floating-nav`…) ports as global component CSS or per-component modules.
4. **Dark mode stays class-based** (`darkMode:'class'`) — `#theme-toggle` adds/removes `.dark` on `<html>`; preserve the SSR-safe read-before-paint to avoid a light flash.
5. The two `<meta name="theme-color">` tags and the Poppins (`300;400;500;600;700;800`) + Material Symbols font links move to Next `<head>` / `next/font` (Poppins via `next/font/google` preferred — self-hosted, no layout shift).

### 3.4 Palette / swatch system (public-website theming)

The event-website preview uses a **second, independent token layer** scoped to `.dp-preview-frame`, prefixed `--dpp-*` (`--dpp-primary`, `--dpp-surface`, `--dpp-ink`, `--dpp-muted`, `--dpp-eyebrow`, `--dpp-heading-font`). These are **palette-aware, not theme-aware** — driven by a `data-palette="…"` attribute. `website.css` defines **8 palettes** (`brand-red`, `blush`, `ivory`, `sage`, `midnight`, `sunset`, `ocean`, `marigold`) via attribute selectors; `design.js` swaps the live theme with `previewFrame.setAttribute('data-palette', id)` (no class churn).

**Swatch binding (`--sw`):** each swatch chip is `<span style="--sw:#BB0020">` and the CSS renders `background: var(--sw)` (3 per tile).

**Port guidance:** keep palettes as a `data-palette` attribute on the public-site root + the 8 `[data-palette]` blocks in global CSS (natural per-event theming — each published site carries its palette as a data-attr, no rebuild). Do **not** fold `--dpp-*` into the app's `--brand`/`--ink` set — it's a separate user-selectable axis for the *guest-facing* site, orthogonal to light/dark. Render swatch chips with `style={{ ['--sw']: hex }}`. Confirm `color-mix(in oklab,…)` browser floor (evergreen OK) or precompute.

---

<!-- ════════════════ §4 contributed by primitives agent ════════════════ -->

## 4. Primitive → Component map

Maps every primitive **defined in `designs/shared/shell.css`** to a proposed React component. Classes that are **not** in shell (`.featured-event-card` → `index.css`; `.dp-template-card`/`.dp-palette-tile`/`.dp-font-row` → `website.css`; `.choice-card` → `settings.css`) are flagged in-table as **module components** — they port alongside their page, not into the shared design-system package.

> **Port status (app today): ❌ none of these exist as reusable components yet.** `app/` has no shared component library (no `components/` / `ui/` dir) and styles inline with generic Tailwind. **Treat every row below as TO BUILD.** The functional *pages* that already render equivalent UI (auth, create-event wizard, home — see §0) are re-skin targets, not component sources.

Convention: "Pure-presentational" = render-only; "stateful" = owns or must be handed open/checked/loading/value state; a11y wiring listed must be preserved by the component.

### 4.1 Buttons & controls

| Design class(es) | → React component | Variants / states | Suggested props | Notes |
|---|---|---|---|---|
| `.btn-pill` + `-primary`/`-secondary`/`-danger`/`-lg`, `.is-loading`, `.btn-pill-spinner` | `<ButtonPill>` | variant: primary·secondary·danger; size: md·lg; default·hover·disabled·loading | `variant`, `size`, `loading`, `leadingIcon`/`trailingIcon`, `as`, `disabled` | Stateful only for `loading`. On `loading` set `aria-busy="true"` **and** `disabled`, render `.btn-pill-spinner` (3-dot ::before/::after). Disabled honors `aria-disabled`. Reduced-motion → opacity-pulse (CSS). |
| `.btn-google` (+ `-icon`, shares spinner + `.is-loading`) | `<GoogleButton>` | default·hover·loading | `loading`, `onClick`, `label?` | Full-width 46px. 4-color G SVG must **not** be recolored. Same loading contract. |
| `.toggle-switch` + `-thumb` | `<ToggleSwitch>` | on·off·disabled | `checked`, `onChange`, `disabled`, `aria-label` | Must render `role="switch"` + `aria-checked`. Own `:focus-visible` ring. |
| `.radio-pill-group` + `.radio-pill` (`.is-checked`/`[aria-checked]`) | `<RadioPillGroup>`/`<RadioPill>` | default·hover·checked; stacked <480, row ≥480 | group: `value`,`onChange`,`aria-labelledby`; pill: `value`,`icon`,`checked` | `role="radiogroup"` + `role="radio"`/`aria-checked`, roving focus + arrow nav. |
| `.dp-filter-chip` (+ `.dp-filter-chips`) | `<FilterChip>`/`<FilterChipRow>` | default·hover·active | chip: `active`,`onClick`,`label` | Row hides scrollbar + scroll-snaps. `:focus-visible`. |
| `.device-toggle` + `-btn` (`.is-active`) | `<DeviceToggle>` | mobile·desktop | `value`,`onChange` | Drives `[data-device-stage]`. `::before` = 44px touch target. Pair with radiogroup semantics. |
| `.dp-reset-chip` (`.is-visible`) | `<ResetChip>` | hidden·visible·hover | `visible`,`onClick`,`axis`,`label` | Consumer computes visibility (value ≠ template default). Icon rotates -90° hover. |
| `.fn-icon-btn` (+ `.fn-dot`), `.fn-avatar` | `<NavIconButton>`/`<NavAvatar>` | default·hover·current·with-dot | `icon`/`label`,`showDot`,`current`; avatar `initials` | `.fn-dot` = unread pip. Always `aria-label` (icon-only). |
| **`.seg` + `.seg-item` + `.seg-wrap`** (+ `.seg--fill`/`.seg--page`) — *canonical, since 2026-06-08* | `<SegmentedControl>` *(exists: `components/ui/SegmentedControl.tsx`)* | default·hover·active; `--fill` (even split) · `--page` (full-bleed, scroll-on-overflow) | `items`,`value`,`onChange`,`mode`(tablist\|radiogroup),`variant` | **Supersedes `.nav-tab`/`.nav-tabs`/`.pill-tab`/`.wb-tab`/`.auth-tabs`** (all consolidated into `.seg`). Used in-page (planning views, website sub-nav, media tabs) AND in the floating-nav. **Dual a11y:** tablist+tab+aria-selected (with panels) vs radiogroup+radio+aria-checked (filter/view). Overflow fade auto-wired by shell.js. NB: the floating-nav route tabs still use `.nav-tab`/`.nav-tabs` (route nav only); view-switchers use `.seg`. |
| `.page-theme-toggle`, `.theme-icon-light/-dark` | `<ThemeToggle>` | light·dark | `onToggle` | Flips `.dark` on root; icon visibility is CSS off `.dark`. |
| `.checklist-row` (+ `-check`/`-body`/`-title`/`-sub`/`-due`) | `<ChecklistRow>` | default·hover·checked | `checked`,`onToggle`,`title`,`sub?`,`due?` | Checked = filled brand tick + line-through. |

### 4.2 Badges & status

| Design class(es) | → React component | Variants / states | Notes |
|---|---|---|---|
| `.status-badge` + `-draft`/`-published`/`-offline` (+ `.status-dot`) | `<StatusBadge status>` | draft·published·offline | Color not the only signal — keeps dot + uppercase label + descriptive `aria-label`. |
| `.dp-page-tier` + `-public`/`-private` | `<PageTierBadge tier>` | public·private | Private has optional lock icon (`aria-hidden`). |
| `.role-tag-soon` | `<ComingSoonTag>` | single | Micro-chip for roadmap/locked items. |
| `.hero-pill` (+ `-brand`), `.hero-meta-chip` | `<HeroPill>`/`<HeroMetaChip>` | glass·brand; chip default·hover | Glass status chips. |
| `.avatar-stack` (+ `-item`/`-overflow`) | `<AvatarStack>` | with/without overflow | Overlapping circles + "+N". |
| `.clay-pill` | `<ClayPill>` | tint = utility classes | Pill radius + shadow; color via utilities. |

### 4.3 Surfaces & cards

| Design class(es) | → React component | Notes |
|---|---|---|
| `.clay-card` | `<ClayCard>` | Hover lift (hover-capable pointers only). |
| `.lg-glass-card` | `<GlassCard>` | backdrop-filter fallback → solid on old WebViews. |
| `.tool-card` (+ `-num`/`-icon`) | `<ToolCard>` | Bento nav card; `active` = brand ring. |
| `.qa-card` + `.qa-tile` | `<QuickActionCard>`/`<QuickActionTile>` | Glass card + translucent tiles. |
| `.stats-strip-card` + `.stat-icon` | `<StatsStrip>` | Heavily translucent (hero bleeds through). |
| `.empty-cta-card` (+ `-icon`/`-title`/`-sub`) | `<EmptyCtaCard>` | Dashed "+ New …" surface; link or button. |
| `.dp-tile` (+ `-thumb`/`-meta`/`-name`/`-sub`/`-actions`/`-link`) + `.dp-tile-grid`/`-grid-sm` | `<DpTile>` + `<DpTileGrid dense?>` | `selected` stateful; `.dp-tile-link` = stretched-link (preserve `pointer-events` layering). Grid = thin layout wrapper. |
| **`.featured-event-card`** | `<FeaturedEventCard>` *(module: index.css)* | Ports with the dashboard page. |
| **`.dp-template-card`** | `<TemplateCard>` *(module: website.css/templates.css)* | Website module component. |
| **`.choice-card`** | `<ChoiceCard>` *(module: settings.css)* | Settings module component. |

### 4.4 Forms

| Design class(es) | → React component | Notes |
|---|---|---|
| `.form-group` + `.form-label` + `.form-helper` | `<Field>` | Wires `htmlFor` ↔ control id. |
| `.form-input` (+ `.form-password`/`-toggle`) | `<TextInput>`/`<PasswordInput>` | 44px pill; invalid keyed off `aria-invalid`. Reveal toggle is a real button w/ `aria-label`. |
| `.form-textarea` | `<Textarea>` | clay-sm radius; `aria-invalid`. |
| `.form-select` + `-chevron` | `<Select>` | Wraps **native `<select>`** (Android UX). Chevron decorative. |
| `.form-input-group` + `-prefix`/`-suffix`/`-field` | `<InputGroup>` | +91 / ₹ / unit. Border + focus on the **group** (`:focus-within`); `aria-invalid` on group. |
| `.form-input-trigger` + `-value` | `<DateTimeTrigger>` | Pill button opening calendar/time picker; pairs w/ visually-hidden native input (`.sr-only`). |
| `.cal-*` | `<CalendarPopover>` | **Stateful — BUY a headless lib** (see §5). Desktop popover, mobile sheet. |
| `.tp-*` | `<TimePicker>` | **Stateful — BUY** (see §5). |
| `.pin-input` + `-cell` | `<PinInput>`/`<OtpInput>` | Auto-advance, paste-distribute, iOS OTP. `role="group"`; cells `inputmode="numeric"` + `autocomplete="one-time-code"`. |
| `.form-error` / `.form-helper-success` | `<FieldMessage tone>` | Error → `role="alert"`. Never color-only — paired with icon. |
| `.cw-stepper` + `.cw-step` (`.is-done`/`.is-active`) + `-connector` | `<WizardStepper steps currentIndex>` | Active = `aria-current="step"`; labels collapse ≤640px. |
| `.avatar-edit` (+ `-img`/`-btn`/`-input`) | `<AvatarEditor>` | Hidden-but-focusable file input; preserve `input:focus-visible + .btn` ring. |
| `.section-rule` (+ `-bar`) | `<SectionRule>` | Eyebrow heading w/ brand dash. (Note: website module's divider was renamed `.dp-section-divider` to avoid collision.) |

### 4.5 Modals

| Design class(es) | → React component | Notes |
|---|---|---|
| `.modal-scrim` (+ `-deep`) + `.modal-card` (+ `.modal-title`/`-body`/`-actions`), `.modal-static`/`-sheet` | `<Modal>` | **BUY** (Radix/React-Aria Dialog) — focus trap, focus-return stack, body lock, Esc, scrim-click, stacking z-index all come for free. Centered ≥768 ↔ bottom-sheet <768. `role="dialog"`/`aria-modal`. `.modal-static` = showcase-only, **don't port**. |
| `.modal-head` (+ `-lead`/`.modal-sub`) + `.modal-close` | `<ModalHeader>` | Close is a real button (`aria-label`, hit-area `::before`). |
| `.modal-section` + `-label` | `<ModalSection>` | Labelled block. |
| `.modal-confirm-affirmative` (+ `-icon`/`-title`/`-text`/`-url`/`-list`) | `<ConfirmDialog variant="affirmative">` | Celebratory: brand icon + spring pop (reduced-motion off). |
| `.modal-confirm-cautionary` (+ `-icon.is-cautionary`) | `<ConfirmDialog variant="cautionary">` | **Same component**, variant only changes icon tint/animation. CTA stays brand. `role="alertdialog"`. |
| `.modal-picker-grid` (modifier) + `-body` + `.modal-picker-tile` (+ `-icon`/`-name`/`-desc`/`-flag`/`-check`) | `<PickerModal>`/`<PickerTile>` | Grid is a layout modifier (fold in). Tiles are buttons; disabled = `aria-disabled`. Pairs w/ `.dp-filter-chips`. |
| `.modal-image-crop` (modifier) + `.dp-dropzone` (+ `.is-dragover`) + `.dp-crop-stage` (`[data-crop-aspect]`) + `.dp-crop-controls`/`.dp-zoom-slider` | `<ImageCropModal>`/`<Dropzone>`/`<CropStage>` | Aspects 16:9·1.91:1·1:1·4:3·3:4·9:16. Dropzone focusable. Zoom slider stays in DOM for keyboard. |
| `.modal-image-lightbox` (modifier) + `-img`/`-bar`/`-meta`/`-actions`/`-close` (uses `.modal-scrim-deep`) | `<ImageLightbox>` | White-on-dark close has white `:focus-visible`. |
| `.modal-radio-row` (+ `-meta`/`-title`/`-desc`, `.is-active`) | `<ModalRadioRow>` | Wraps native `<input type=radio>`; `:focus-within` ring. |

### 4.6 Chrome / layout

| Design class(es) | → React component | Notes |
|---|---|---|
| `.floating-nav` + `-inner` (`.is-minimal`), `.fn-logo`/`-link`, `.fn-actions`, `.fn-divider` | `<FloatingNav variant>` | full ↔ minimal; composes SegmentedControl + NavIconButton + NavAvatar. Width-locked to page band. |
| `.fn-notif-panel` (+ items) | `<NotificationMenu>`/`<NotificationItem>` | **BUY** (Radix Popover) — replaces the auto-injected, hand-positioned panel. |
| `.tool-rail` + `.tr-btn` (`.is-active`)/`-divider`/`-status` | `<ToolRail>`/`<ToolRailButton>` | Vertical (≥1400) ↔ bottom-dock (<1400). Active via `usePathname()`. |
| `.bc-shell` + `-back`/`-path`/`-sep`/`-active`/`-copy`/`-toast`… | `<Breadcrumb>` (+ `<BreadcrumbToast>`) | `<nav aria-label="Breadcrumb">` + `<ol>`, active `aria-current`. Mobile collapses first crumb (CSS). |
| `.help-fab` | `<HelpFab>` | Hidden ≤768; lifts above dock ≤1399. `aria-label`. |
| `.page-band`, `.bc-wrap` (+ `-narrow`) | `<PageBand>`/`<BreadcrumbWrap>` | **Canonical 1440px width band** — single source of truth; do not hand-roll `max-w-[…]`. |
| `.section-head` (+ `-eyebrow`/`-title`/`-sub`) | `<SectionHead>` | Canonical flat page header. |
| `.page-bg`, `.page-shell` (+ `-header`/`-actions`/`-footer`), `.page-logo`, `.page-main`(`-center`/`-wide`)… | `<PageShell>` family | Sticky-footer layout for auth + create-event (no floating-nav/tool-rail). |
| `.divider-or` | `<OrDivider>` | Auth "or" rule. |
| `.reveal`, `.scroll-progress`, `.pf-bar` | `<Reveal>`/`<ScrollProgress>` | IO hook + scroll listener (see §5). Reduced-motion shows immediately. |

### 4.7 Digital Presence (preview / sections / tiles)

| Design class(es) | → React component | Notes |
|---|---|---|
| `.dp-preview-stage` (`[data-device-stage]`) + `.dp-preview-frame` (`.is-static`/`-controls-driven`/`-page-scoped`/`-scrollable`) + `-screen`/`-content`/`-caption` | `<PreviewFrame device mode palette font>` | Phone-chrome ↔ desktop-chrome via `[data-device-stage]`. Exposes `--dpp-*`; controls-driven cross-fades ≤120ms. Driven by `<DeviceToggle>`. |
| `.dp-section-list` + `.dp-section-block` (`.is-hidden`/`-collapsed`) + `-head`/`-drag`/`-type`/`-actions`/`-body`/`-row` | `<SectionBlock>`/`<SectionList>` | Per-page editor card. Drag handle `aria-disabled` when DnD off. Reuses `.dp-icon-btn-sm`. |
| `.dp-tile-grid`/`-grid-sm` | `<DpTileGrid dense?>` | Responsive grid container; tiles = `<DpTile>`. |
| **`.dp-palette-tile`** | `<PaletteTile>` *(module: website.css)* | Design-tab module component (extends `.dp-tile`). |
| **`.dp-font-row`** | `<FontRow>` *(module: website.css)* | Design-tab module component. |

**Cross-cutting:** keep native focusability; state shell currently drives imperatively (modal focus-trap + body lock, notification positioning, breadcrumb copy/toast, pin auto-advance, calendar/time pickers, reveal/scroll-progress) becomes component-owned React state/effects — the **stateful** rows are the highest-effort ports.

### 4.8 New shell primitives (since 2026-06-04)

| Design class(es) | → React component | Variants / states | Notes |
|---|---|---|---|
| **`.skeleton`** + `.skeleton-line` (`-sm`/`-lg`) / `-circle` / `-pill` / `-thumb` / `-block` / `.skeleton-text-row` | `<Skeleton variant>` | line·circle·pill·thumb·block | Token-driven (`--skel-base`/`--skel-sheen`). Subtle shimmer (`::after`); **reduced-motion → opacity pulse**. Region-swap: a container with `aria-busy="true"` (or `data-loading`) shows `[data-skeleton]` + hides `[data-content]`. Canonical composed templates (event card / tile grid / list row / section head) live in `components.html §14`. Port: `<Skeleton/>` + a `loading` prop / Suspense fallback; the `aria-busy` swap → conditional render. |
| **`.photo-tile`** (+ `-select`/`-check`/`-cover-badge`/`-actions`) + **`.bulk-bar`** (+ `-act`/`-act--danger`/`-count`/`-cancel`) + `.dp-tile-trigger` | `<PhotoTile>` / `<BulkBar>` | tile: default·selected·cover; bulk-bar: hidden·N-selected | **Promoted from `website.css` to `shell.css`** (Media is the 2nd consumer). Tile = button-trigger + checkbox + cover badge + hover action chips (glass, has `@supports` fallback). `.dp-tile-trigger` is the tile-as-button reset. Bulk-bar = floating multi-select bar; `--danger` = destructive action. Empty-state hook `[data-photos-state]`. |
| **`.modal-lightbox-nav`** (+ `-btn`/`-prev`/`-next`) | (folds into) `<ImageLightbox>` | prev·next·disabled-at-bounds | Prev/next promoted onto `.modal-image-lightbox`. Drive from a data/index array (not DOM) so it survives lazy-load; ←/→ + swipe. |
| **`.dp-dropzone--multi`** | `<Dropzone multiple>` | + drag-active·rejected·hero | Multi-file modifier on `.dp-dropzone` (drop never fires on touch → keep the hidden `<input type=file multiple>` path). Used by Media upload; the Invitations photo/upload uses the same pattern. |

**New page-module components (port WITH their page, not the shared package):**
- **Invitations** (`invitations.css/js`): `.inv-card` (the card render — reflowable HTML/CSS, **light-surfaced & dark-mode-immune**, consumes per-`[data-tpl]` `--c-*` tokens) · `.inv-card-frame` (A5) · `.inv-slot` (contenteditable text) · `.inv-card-photo` · `.inv-toolbar` (floating size) · `.inv-tile`/`.inv-upload-tile`. → `<CardEditor>` / `<CardCanvas>` / `<CardGallery>`. State = a `CardState` object; gallery↔editor via `body[data-view]`. **Export PNG + WhatsApp share are faked** in the proto — real build: server render (Satori/Puppeteer) → Supabase Storage → hosted card URL; `wa.me` is text-only (no image attach). See `designs/pages/invitations/_spec.md`.
- **Media** (`media.css/js`): `.media-*` (storage meter, recent strip, upload-progress, toolbar) · `.album-card`. → page components; **array-as-source state** (the recommended port shape); `?seed=` fixtures are proto-only.

---

<!-- ════════════════ §5 contributed by behaviors agent ════════════════ -->

## 5. Behaviors → React hooks / components

`shell.js` is a set of IIFEs hanging helpers off `window.evenzi`. **Treat `window.evenzi.*` as the de-facto "shell SDK"** — every page script calls `showToast / openModal / closeModal / elc / elo / icon` rather than re-implementing. In React this splits into **three Context providers** (toast, modal, theme), **a handful of hooks** (reveal, count-up, bar-fill, scroll-progress, clock), **two build-vs-buy headless widgets** (calendar, time-picker), and **behaviors that vanish** because JSX + controlled state replace the imperative DOM wiring. Mount the three providers once in the root layout.

> **Port status (app today):** the only behavior already implemented is **wizard state** — `lib/contexts/WizardContext.tsx` (`useReducer`) ✅ matches the recommendation. **No theme/dark-mode, no toast/modal/picker/notification infrastructure exists yet** — every other row is TO BUILD.

| Behavior (shell.js) | → React | Port note |
|---|---|---|
| **Theme toggle + persistence** (`localStorage['evenzi-theme']`, `.dark` on `<html>`) | `<ThemeProvider>` + `useTheme()` | **Provider — use `next-themes`** (SSR no-flash, persistence, class toggle). Keep the `evenzi-theme` key. |
| **Stacking modal controller** (`openModal`/`closeModal`, `openStack[]`, `focusReturnMap[]`, z-base 80+depth*10, `trapTab`, Esc/scrim close-top-only, `no-scroll`, reflow-then-focus) | `<ModalProvider>` + `useModal()` + headless `<Dialog>` | **Provider + BUY (Radix/React-Aria).** Hardest IIFE to port faithfully; the lib gives trap/return/lock/Esc/stacking free. Keep `openModal/closeModal` as a thin shim so call sites port 1:1. |
| **Toast** (`ensureToast()` lazy-creates `#bc-toast`; `showToast(msg)` 1800ms; `window.evenzi.showToast`) | `<ToastProvider>` + `useToast()` | **Provider.** Lazy-injection vanishes (one portal region). Or adopt `sonner`. Keep `showToast(msg)` signature. |
| **Breadcrumb: copy + back-chip + IST clock** (`tickClock()` 1s + `visibilitychange`; clipboard copy → toast) | `<Breadcrumb>` + `useClock()` + `useToast()` | Clock = `useEffect`+`setInterval` (skip when hidden). Copy/back = `onClick`. |
| **Scroll-progress** (`#scroll-progress`, RAF scroll → `--scroll-pct`) | `useScrollProgress()` | Passive scroll + RAF throttle; keep CSS-var to avoid per-frame re-render. |
| **Scroll-reveal** (`.reveal` IO 0.12 → `.in`; sync anti-flash; reduced-motion fallback) | `useReveal()` / `<Reveal>` | One IO per el; replicate the `getBoundingClientRect` anti-flash for above-the-fold. |
| **Count-up** (`[data-count]` IO 0.4, RAF ease, `toLocaleString`+suffix) | `useCountUp(target,{suffix})` | RAF easing in `useEffect`, gated by IO. Reduced-motion snaps. |
| **Bar-fill** (`.pf-bar[data-fill]` IO → width) | `useInViewport()` or `<ProgressBar fill>` | Share `useInViewport` with count-up. |
| **Auto-injected notification dropdown** (selector-found bell, `el()`-built panel, manual position/outside-click/Esc/scroll-close) | `<NotificationMenu>` (headless Popover) | **BUY.** Entire builder + positioning logic vanishes (Radix Popover). Place in nav layout instead of auto-injecting. |
| **Custom calendar** (`cal` singleton: scrim/pop dialog, month + month-picker, 42-cell grid, full keyboard nav, min/max, sheet vs anchored, hidden `<input type=date>` + synthetic `change`) | `<DatePicker>` — **headless lib** | **BUY, don't port** (~300 lines bespoke a11y). React-Aria DatePicker / react-day-picker, themed to `cal-*`. Hidden-input bridge vanishes (controlled component; `create-event.js` gets `onChange`). `data-min-today` → `minValue`. |
| **Custom time-picker** (`tp` singleton: hour/min scroll cols + AM/PM, hidden `<input type=time>` + `change`) | `<TimePicker>` — **headless or thin custom** | **BUY.** React-Aria TimeField; if scroll-column UX is required, build small controlled comp w/ CSS scroll-snap. Synthetic-change bridge vanishes. |
| **Radio-pill arrow-key nav** (delegated `aria-checked` swap + roving arrow nav skipping disabled) | `<RadioPillGroup>` / React-Aria `useRadioGroup` | **BUY.** `design.js` has its own palette/font arrow-nav — consolidate into one primitive. |
| **Password show/hide** (`[data-pw-toggle]` flips `type` + icon + `aria-label`) | `<PasswordInput>` + `useState(show)` | Vanishes into one controlled component. |
| **Toggle switch** (`role=switch`, Space/Enter flips `aria-checked`) | `<Switch>` (React-Aria/Radix) | `edit-page.js` reads state via `MutationObserver` on `aria-checked` — that hack vanishes (controlled `checked`). |
| **PIN/OTP** (auto-advance, paste-distribute, iOS multi-digit fill) | `<OtpInput>` | Port as-is or `input-otp` (shadcn). Keep iOS distribution edge case. |
| **Avatar file-input** (5MB cap → error, success toast) | `<AvatarUpload>` | Controlled file input + local error + `useToast()`. |
| **Tool-rail / nav-tab active-state** (`body[data-page]`/`[data-section]` → `.is-active`/`aria-current`) | layout comps using `usePathname()` | **Vanishes.** The data-attr indirection exists for static self-resolution; Next uses route. |
| **`elc`/`elo`/`icon` DOM builders** (`window.evenzi.*`) | JSX + `<Icon name>` | **Vanishes.** `icon('x')` → `<Icon name="x"/>`. |
| **Ripple** (`spawnRipple()` on bc controls) | `useRipple()` or CSS-only | Cosmetic; lowest priority. |
| **Skeleton loading** *(NEW 2026-06-12)* — `window.evenzi.setLoading(elOrId, bool)` flips `aria-busy` on a region; CSS swaps `[data-skeleton]` ↔ `[data-content]` | `<Skeleton/>` + a `loading` prop / Suspense fallback | **Vanishes.** The imperative toggle becomes conditional render: show `<Skeleton>` while `loading`/pending, content when resolved. Tokens `--skel-*`; templates in `components.html §14`. |

**Page-script flags:** (1) `create-event.js` persists the 4-step wizard in `sessionStorage` (`window.evenzi.cc` `getState/setState/clearState`) + drives pickers via hidden inputs — port as a wizard Context (or `useReducer`+sessionStorage); once pickers are controlled, the `change`-bridge goes. (2) `design.js` has its **own** IO ("Jump to preview") + radio arrow-nav — fold into the shared primitives. (3) `edit-page.js` reads toggle state via `MutationObserver` — disappears with a controlled `<Switch>`.

---

<!-- ════════════════ §6 + §7 contributed by state/routing agent ════════════════ -->

## 6. State contract (sessionStorage / localStorage)

The static prototype has no backend, so it wires the entire user journey through **browser storage keys** — each page reads keys an earlier page wrote (create-event wizard, auth OTP, website designer/editor). In React this layer is **deleted, not ported**: replace with React Context (in-flight wizard/designer state), the router (`[id]` / `?page=` params), or server-fetched data. Producing this table (grep + reading every write/read site) is the highest-value, hardest-to-see part of the port — none of it is visible in the rendered HTML. **8 keys** (7 session, 1 local); all in JS files (no inline-script storage); every access `try/catch`-wrapped (WebView resilience).

| Storage key | Store | Shape / fields | Written by | Read by | → React equivalent |
|---|---|---|---|---|---|
| `evz-event` | session | **JSON (PII)**: `type`, `customType`, `title`, `partnerOne`, `partnerTwo`, `eventDate`, `guestCount`, `venue`, `celebrations:[{id,name,time,venue}]`, `createdAt`. Merged via `setState(patch)`. | create-event wizard (`create-event.js` setState + autosave); **cleared** on success (`clearState`) | all wizard steps + review (`getState`) | **React Context** (wizard) → on submit **server (Supabase `events`)**. ⚠️ **PII — must NOT be source of truth client-side.** |
| `evz-phone` | session | **string** raw 10-digit phone | auth phone-entry (`auth.js:124`) | verify-otp (`auth.js:161`, formats +91) | **Router/auth state.** Supabase Auth owns phone/OTP. ⚠️ **PII — don't persist client-side.** |
| `dpTemplateApplied` | session | **string** template id (write-then-clear handoff) | Templates detail "Apply" (`templates.js`) | Design page (`design.js:191` reads + clears); `?apply=` fallback | **Router param / nav state.** Round-trip becomes a normal action/route. |
| `dpCurrentTemplate` | session | **string** applied template id (default `bold-festive`) | Design page (`design.js:221`) | Templates gallery (`.is-current` pill) | **Server data** (event's selected template). |
| `dpHasOverrides` | session | **flag** `'1'`/`'0'` (palette/font diverged from template) | Design page (`design.js:88`) | Templates detail (gates discard confirm) | **Designer Context (derived).** Never a stored string. |
| `epPage` | session | **string** page id — **read-only fallback, no writer** | *(none)* | page editor (`edit-page.js:281`, only if `?page=` absent) | **Route param** — `?page=` is the real producer; drop the storage path. |
| `epTier:<id>` | session | **string** `'public'`/`'private'` — **dynamic key per page** | page editor `flipTier()` (`edit-page.js:335`) | editor on load (`:290`) + Overview list `syncPageTiers()` (`website.js:822`) | **Server data** (per-page tier on the website record). Cross-page sync = shared server state / query cache. |
| `evenzi-theme` | **local** | **string** `'light'`/`'dark'` (default dark) | `shell.js:20` | `shell.js:13` (applies before paint) | **Genuinely client-persistent** — the one key that stays (or a theme provider). No PII. |

**Port-cost callouts:** PII keys (`evz-event`, `evz-phone`) ARE the source of truth in the prototype → must be transient in React, authoritative state server-side (flag for security carry-over). Three `dp*` + `epTier:*` encode website-designer state that belongs on the event record. `epPage` has no writer — don't port the storage path.

## 7. Routing map

The prototype links pages with **relative hrefs** (`../../` / `../<dir>/`), plus a few near-root from the dashboard; one true root-relative (`/manifest.webmanifest`). Each becomes a Next `<Link href>`.

> **Already built in `app/` (functional, generic-styled — re-skin targets):** `/` · `/home` · `/auth` · `/auth/role-selection` · `/events/create` · `/events/[id]` · `/events/[id]/success`. **Every other route below is not built yet.** Naming delta: the wizard lives at **`/events/create`** (the rows below say `/events/new` — keep the existing `/events/create` path). Per-group build status is tracked in §8.2. The demo event **"Vidya & Anshuman" is hardcoded** across every event-scoped page. `index.html` is the **Host Dashboard** (event list), not a marketing landing. React must introduce a **dynamic event id** (`/events/[id]/…`); the page editor additionally needs `?page=`/`[page]` (the real producer behind `epPage`).

| Design file | → Next route | Notes |
|---|---|---|
| `index.html` | `/` (or `/events`) | **Host Dashboard** = event list (demo card = "Vidya & Anshuman"). NOT marketing landing. |
| `components.html` | *(not a route)* | Design-system gallery; dev-only / Storybook. |
| `pages/auth/auth.html` | `/auth` | Phone + Google. Writes `evz-phone`. |
| `pages/auth/verify-otp.html` | `/auth/verify` | OTP; reads `evz-phone` (router/auth state in React). |
| `pages/auth/role-select.html` | `/auth/role` | Post-OAuth role pick. |
| `pages/create-event/step-1-type.html` | `/events/new/type` | Wizard 1 (`evz-event` → Context). |
| `pages/create-event/step-2-details.html` | `/events/new/details` | Wizard 2. |
| `pages/create-event/step-3-celebrations.html` | `/events/new/celebrations` | Wizard 3. |
| `pages/create-event/step-4-review.html` | `/events/new/review` | Wizard 4 (full `evz-event`). |
| `pages/create-event/success.html` | `/events/new/success` → redirect `/events/[id]` | Clears `evz-event`; persist to Supabase → real id. |
| `pages/event-control/event-control.html` | `/events/[id]` | Per-event hub. |
| `pages/event-control/our-journey.html` | `/events/[id]/journey` | Sub-events. |
| `pages/event-settings/general.html` | `/events/[id]/settings/general` | Settings tab. |
| `pages/event-settings/admins.html` | `/events/[id]/settings/admins` | Settings tab. |
| `pages/event-settings/guest-list.html` | `/events/[id]/settings/guests` | Settings tab. |
| `pages/event-settings/plan-billing.html` | `/events/[id]/settings/billing` | Settings tab. |
| `pages/event-settings/registry.html` | `/events/[id]/settings/registry` | Settings tab. |
| `pages/event-settings/website.html` | `/events/[id]/settings/website` | Settings tab (website meta). |
| `pages/guests/guests.html` | `/events/[id]/guests` | Guest management. |
| `pages/invitations/invitations.html` | `/events/[id]/invitations` | **Invitation CARD designer** (personalizer: gallery → inline-edit → share). NOT the WhatsApp send-hub — send/status tracking lives in Guest Management; the two connect via a hosted card URL. Single page, two views (`data-view`). See `_spec.md`. |
| `pages/media/media.html` | `/events/[id]/media` | Media & memories — **full prototype** (Photos / Videos tabs + Albums, sort/filter, bulk, lightbox). Could carry `?tab=` for deep-links. |
| `pages/planning/planning.html` | `/events/[id]/planning` | Planning. |
| `pages/settings/settings.html` | `/settings` | **User** settings — no `[id]`. |
| `pages/website/overview.html` | `/events/[id]/website` | Website editor home; reads `epTier:*`. |
| `pages/website/edit-pages.html` | `/events/[id]/website/pages` | Page list. |
| `pages/website/edit-page.html` | `/events/[id]/website/pages/[page]` | Single-page editor (`?page=` → `[page]`). Writes `epTier:<page>`. |
| `pages/website/design.html` | `/events/[id]/website/design` | Palette/font/template designer. |
| `pages/website/photos.html` | `/events/[id]/website/photos` | Photos tab. |
| `pages/website/card-templates.html` | `/events/[id]/website/cards` | Card templates tab. |
| `pages/website/templates/index.html` | `/events/[id]/website/templates` | Template gallery. |
| `pages/website/templates/<id>.html` (×5) | `/events/[id]/website/templates/[template]` | **Collapse the 5 detail files into ONE `[template]` route** backed by the `TEMPLATES` map. |

**Convention notes:** all inter-page hrefs are relative → Next `<Link>`. The 6 template detail files collapse to one `[template]` dynamic route. `index.html` (dashboard), `settings.html` (user settings), `components.html` (gallery) are the **non-`[id]`** pages; everything else is event-scoped and needs the real dynamic id the prototype fakes.

---

## 8. Coverage tracker (the rolling engine)

Flip these as work lands. This is what keeps the doc honest.

### 8.1 By concern

| Concern | Mapped (this doc) | Confirmed by Dheeraj | Ported |
|---|---|---|---|
| Tokens + Tailwind bridge (§3) | ✅ Drafted | ☐ | ◐ Poppins/`next/font` wired; **brand-red tokens + dark mode still placeholder** |
| Shell primitives (§4) | ✅ Drafted | ☐ | ◐ `components/ui/*` + `components/layout/*` exist (Button·ClayCard·Form*·SegmentedControl·StatusBadge·ToggleSwitch·WizardStepper + chrome) — generic-tokened |
| New primitives (§4.8: skeleton, photo-tile/bulk-bar, lightbox-nav) | ✅ Drafted (2026-06-12) | ☐ | ☐ |
| Behaviors / shell.js (§5) | ✅ Drafted | ☐ | ◐ `WizardContext` only; Theme/Toast/Modal providers ☐ |
| State contract (§6) | ✅ Drafted | ☐ | ☐ |
| Routing (§7) | ✅ Drafted | ☐ | ◐ auth/wizard/home/event routes exist |
| Module components (`featured-event-card`, `dp-template-card`, `dp-palette-tile`, `dp-font-row`, `choice-card`, **`.inv-*`**, **`.media-*`/`.album-card`**) | ◐ Flagged, not detailed | ☐ | ☐ |

### 8.2 By page-group (port progress)

**Functional in app today** = exists in `app/` but generic-styled (re-skin target). **Design-skinned port** = rebuilt in the `designs/` language (the actual goal).

| Page-group | Designed | Mapped here | Functional in app today (generic) | Design-skinned port |
|---|---|---|---|---|
| Dashboard (`index.html`) | ✅ | ✅ (§4/§7) | ✅ `/home` (+ `/`) | ☐ |
| Auth | ✅ | ✅ | ◐ `/auth` + `/auth/role-selection` (OTP-verify page TBD) | ☐ |
| Create-event wizard (5 pages) | ✅ | ✅ | ✅ `/events/create` — **WizardContext ✅** | ☐ |
| Event-control + Our Journey | ✅ | ✅ | ◐ `/events/[id]` basic; Our Journey ❌ | ☐ |
| Event-settings (6 tabs) | ✅ | ✅ | ❌ | ☐ |
| Website / Digital Presence (overview, design, edit-page, templates, photos, cards) | ✅ | ✅ | ❌ | ☐ |
| Settings (user) | ✅ | ✅ | ❌ | ☐ |
| Guests | ✅ full (cards, RSVP setter, bulk, swipe, tags, sub-event assign) | ✅ | ❌ | ☐ |
| Planning | ✅ full (checklist + budget, List/Timeline) | ✅ | ❌ | ☐ |
| Media | ✅ full (Photos/Videos tabs + Albums, sort/filter, bulk, lightbox) | ✅ | ❌ | ☐ |
| Invitations | ✅ full (card **personalizer** — gallery → inline-edit → share) | ✅ | ❌ | ☐ |
| **Public guest-facing site** (`/e/<slug>`) | ☐ not designed | ☐ | ❌ | ☐ |

---

## 9. Open questions for Dheeraj

Decisions that shape the port — please confirm so the design side can align:

1. **Headless library:** the modal, notification popover, calendar, time-picker, radio-group, and switch are all "buy not build" (§5). **Radix UI** or **React Aria** as the base? (Affects how faithfully the `cal-*`/`tp-*` styling re-skins.)
2. **Theme:** OK to use **`next-themes`** (keeping the `evenzi-theme` storage key + class-based dark mode)?
3. **Routing shape:** confirm `/events/[id]/…` for event-scoped pages, `/settings` (no id) for user settings, and collapsing the **5 template detail files → one `[template]` route**.
4. **PII / security carry-over:** confirm `evz-event` and `evz-phone` become **transient (Context/router) + server-authoritative**, never client storage. (Ties to the security review's tier/token findings.)
5. **Tailwind tokens:** OK to **additively bridge `success`/`danger`** into Tailwind utilities (they exist as CSS vars but were never in the inline config)?
6. **Fonts:** Poppins via **`next/font/google`** (self-hosted) vs keeping the CDN `<link>`?
7. **`color-mix(in oklab,…)`** (used in palette tokens) — acceptable browser floor, or precompute mixes at build time?

### Found while drafting (housekeeping)
- `docs/BRAND-GUIDELINES.md` §"Status colors" says status colors are "not yet tokenized" — **stale**; they ARE tokenized (`--success`/`--danger` families). Fix the doc.

---

*This is a living document. Keep it in sync as pages ship — the §8 tracker is the source of truth for what's mapped vs ported.*
