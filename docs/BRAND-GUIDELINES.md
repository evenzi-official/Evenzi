# Evenzi Brand Guidelines

> **Source of truth:** `designs/shell.css` and `designs/shell.js`. This document mirrors the tokens defined there. If a value here disagrees with `shell.css`, **shell.css wins** — update this file to match.

---

## Brand Name & Identity

- **Full name:** Evenzi
- **Tagline:** TBD (not yet committed in any design)
- **Logo:** Wordmark "Evenzi" set in Poppins 800, letter-spacing `-0.05em`, in brand red. No icon mark yet.
- **Visual signature:** Liquid Glass (Apple-style frosted glass with rim, inset highlights, and a directional specular streak) layered over a warm light background or near-black dark background.

---

## Color Palette

All colors below are CSS custom properties defined in `designs/shell.css`. Light mode is the default; dark mode activates via `.dark` class on the root.

### Brand

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--brand` | `#BB0020` | `#ee3f3a` | Logo, primary actions, focus ring, key emphasis |
| `--brand-hover` | `#1f2937` | `#ff5a55` | Hover state on brand surfaces |
| `--brand-tint` | `rgba(187,0,32,0.05)` | `rgba(238,63,58,0.10)` | Subtle brand washes, hairline backgrounds |
| `--brand-tint-2` | `rgba(187,0,32,0.10)` | `rgba(238,63,58,0.18)` | Slightly stronger tint, scrollbar thumb, divider |

> Brand red is the single accent. There is no separate "accent" color — `--brand` plays both roles.

### Surfaces

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg` | `#f9fafb` | `#0d0d0d` | Page background |
| `--card` | `#ffffff` | `#18181b` | Card / panel surface |
| `--dark-card` | `#111827` | `#1f2937` | Inverted hero surfaces (used inside light mode for contrast) |
| `--dark-card-soft` | `#1f2937` | `#374151` | Softer inverted variant |
| `--cream-soft` | `rgba(187,0,32,0.08)` | `rgba(238,63,58,0.08)` | Soft brand-tinted surfaces (chip backgrounds) |
| `--peach` | `rgba(187,0,32,0.05)` | `#1f2937` | Decorative warm wash (light); neutral fill (dark) |
| `--peach-deep` | `rgba(187,0,32,0.10)` | `#374151` | Stronger warm wash (light); neutral fill (dark) |

### Text & Lines

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--ink` | `#111827` | `#f9fafb` | Primary text, headings |
| `--ink-soft` | `#374151` | `#e5e7eb` | Secondary headings, body emphasis |
| `--muted` | `#6b7280` | `#a8a8a8` | Secondary text, descriptions |
| `--muted-soft` | `#9ca3af` | `#7a7a7a` | Footnotes, fine print, placeholder |
| `--line` | `#e5e7eb` | `#2a2a2a` | Card borders, dividers |
| `--line-soft` | `#f3f4f6` | `#1f1f1f` | Subtle internal dividers |

### Decorative gradients

| Token | Usage |
|-------|-------|
| `--featured-grad` | Background for featured / hero cards (brand-tinted diagonal) |
| `--avatar-1` / `--avatar-2` / `--avatar-3` | Avatar fallback gradients (brand-tinted) |
| `--dot-color` | Dot-pattern background for empty states |

### Semantic colors

> Not yet tokenized in `shell.css`. When introduced, use these values consistent with the warm/red brand palette:

| Purpose | Suggested value | Notes |
|---------|-----------------|-------|
| Success | `#22c55e` | Confirmations |
| Error | `#ef4444` | Errors (avoid clash with brand red — error is brighter, more orange-leaning) |
| Warning | `#f59e0b` | Warnings |
| Info | `#3b82f6` | Informational |

When semantic tokens are added to `shell.css`, update this section with the actual token names.

---

## Typography

### Font families

| Family | Source | Usage |
|--------|--------|-------|
| **Poppins** | Google Fonts | All text (display + body). Loaded sitewide. |
| **Material Symbols Outlined** | Google Fonts | Icons. Default variation: `FILL 0, wght 500, GRAD 0, opsz 24`. `.icon-fill` toggles `FILL 1`. |

There is no separate body / display family — Poppins is used for both, distinguished by weight and size.

### Type scale (used in shell)

The shell currently uses inline sizes rather than a tokenized type scale. Common sizes observed across `shell.css` and the page templates:

| Role | Size | Weight | Letter-spacing | Notes |
|------|------|--------|----------------|-------|
| Logo wordmark | `1.5rem` (1.25rem on mobile) | 800 | `-0.05em` | Brand red |
| Page heading (h1) | per page | 700–800 | `-0.02em` | Display style |
| Section heading (h2/h3) | per page | 700 | `-0.02em` | |
| Tool-card title | `14px` | 800 | default | |
| Body text | `13–14px` | 400 | default | |
| Nav tab label | `12.5px` | 600 | `-0.005em` | |
| Eyebrow / caps label | `9–11px` | 700 | `0.18em–0.32em` | All-caps, wide-tracked |
| Stat label | `11px` | 700 | `0.05em` | |
| Footnote | `10–11px` | 700 | varies | |

When the type scale is tokenized in `shell.css`, update this table with the token names.

### Font weights used

| Weight | Usage |
|--------|-------|
| 400 | Body text |
| 500 | Material Symbols default |
| 600 | Buttons, CTAs, nav tabs |
| 700 | Headings, eyebrows, stat labels |
| 800 | Logo wordmark, hero titles, tool-card titles |

---

## Shape

### Border radius

Inline values in `shell.css` (not tokenized yet):

| Value | Usage |
|-------|-------|
| `8px` | Focus-visible ring rounding |
| `24px` | Card surfaces (`.clay-card`, `.lg-glass-card`) |
| `9999px` | Pills, badges, avatar wells, floating nav, action buttons |

When radius tokens are added to `shell.css`, update this table.

### Spacing

The shell uses Tailwind utility classes for spacing rather than custom CSS spacing tokens. Mobile-first padding patterns:

- Page gutter: `px-6` (mobile) → `md:px-10` (tablet+)
- Floating nav width: `max-width: 1440px` (matches main content container)
- Touch targets: ≥36px in chrome, ≥44px in primary actions

---

## Shadows & Elevation

### Clay surface shadows

Multi-layer soft shadow with inset rim — gives the "molded" feel.

| Token | Light | Dark |
|-------|-------|------|
| `--shadow-clay` | Soft drop + inset highlight rim | Deeper drop + faint inner highlight |
| `--shadow-clay-hover` | Stronger drop on hover (`translateY(-3px)`) | Stronger drop on hover |
| `--shadow-clay-pill` | Brand-tinted drop + inset highlight (used on pill CTAs) | Brand-tinted drop + inset highlight |

Exact values are defined in `shell.css` lines 28–30 (light) and 56–58 (dark).

### Liquid Glass tokens

Apple-style frosted glass. Used for the floating nav, hero pills, stats strip, QA cards, and any surface where translucency over a hero image or warm background is desired.

| Token | Purpose |
|-------|---------|
| `--lg-bg-grad` | Glass body — diagonal gradient with low alpha |
| `--lg-rim` | Border color for the glass rim |
| `--lg-inset-top` | Top inner highlight |
| `--lg-inset-bottom` | Bottom inner shadow |
| `--lg-shadow` | External multi-layer drop shadow |
| `--lg-spec` | Specular streak overlay (35° highlight) |
| `--lg-blur` | `blur(30px) saturate(180%)` — applied via `backdrop-filter` |

Light-mode opacity for stats overlaying hero imagery is **28%** (reduced from earlier 75%) so the hero image bleeds through.

### When to use which surface

| Surface | When |
|---------|------|
| `.clay-card` | Default card. Most content panels. |
| `.lg-glass-card` | Glass card with explicit border + inset highlights, no backdrop-filter (for non-translucent contexts). |
| Liquid Glass with `backdrop-filter` | Floating chrome over imagery (nav, hero pills, meta chips). |
| `.featured-bg` | Hero / featured cards. |

---

## Motion

| Pattern | Duration | Easing | Notes |
|---------|----------|--------|-------|
| Hover lift on cards | `0.25s` | `ease-out` | `translateY(-3px)` + shadow change |
| Color/background transitions | `0.2–0.3s` | `ease` | |
| Reveal animation | `0.7s` | `cubic-bezier(.2,.7,.2,1)` | With per-element `--reveal-delay` |
| Progress bar fill | `1.4s` | `cubic-bezier(.2,.8,.2,1)` | |
| Scroll-progress bar | `0.08s linear` | linear | |
| Breadcrumb pulse | `~2s loop` | linear | Brand-colored ripple |

**Reduced motion:** `prefers-reduced-motion: reduce` is honored — `.reveal` snaps to final state, all animations clamp to `0.01ms`. Always respect this.

---

## Accessibility

- **Focus ring:** `outline: 2px solid var(--brand); outline-offset: 3px; border-radius: 8px;` on all `a`, `button`, `[role="button"]` `:focus-visible`.
- **Touch targets:** ≥44px on primary actions; ≥36px in dense chrome.
- **Safe area:** `env(safe-area-inset-top, 0px)` on the floating nav so it clears iOS status bar in PWA mode.
- **Reduced motion:** honored sitewide.
- **Dark mode:** every component must work in both modes — toggle is at the user's discretion.
- **Keyboard nav:** every interactive element must be focusable and operable with Enter/Space; overlays close on Esc.

---

## Implementation Notes

- All brand values are CSS custom properties on `:root` (light) and `.dark` (dark mode), defined in `designs/shell.css`.
- Components reference tokens — never raw hex/rgba — so a token change cascades.
- Page-specific colors / sizes go in `<page>.css`; shared tokens stay in `shell.css`.
- The Tailwind setup (when the React port lands) should mirror these tokens via `theme.extend` so React components consume the same values.

When extending the system:
1. Add the token to `designs/shell.css` first.
2. Mirror it in this document under the matching section.
3. Reference it from components — never inline new raw values.
