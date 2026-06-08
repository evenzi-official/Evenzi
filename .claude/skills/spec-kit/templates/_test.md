# Test plan — {{PAGE_TITLE}} (`{{PAGE_SLUG}}`)  ·  against SPEC_VERSION {{SPEC_VERSION}}

> Test source of truth. Antigravity tests **only** from this file. Run every row; record PASS/FAIL in _findings.md by row ID.

## Acceptance criteria
{{ACCEPTANCE_CRITERIA — bullet list, each independently checkable}}

## Test matrix

### 1. Smoke (run FIRST — gates everything below)
- `1.smoke` — Page loads with no console errors/warnings on load.
- `1.styled` — Computed background is the themed surface, NOT the unstyled default (proves tokens/Tailwind config loaded).
- `1.databody` — `<body>` carries `data-page` (and `data-section` if under a nav tab); active nav/tool-rail item is highlighted.
- `1.chrome` — Floating-nav, tool-rail, and breadcrumb render and match sibling pages.
- `1.resilience` — No runtime third-party CDN for layout-critical CSS/JS. **Actively simulate failure:** after first load, block the network / third-party requests and hard-reload — layout MUST hold (no collapse to unstyled flow). A loaded CDN is HTTP 200 + console-clean, so `1.smoke`/`1.styled` will NOT catch this — trigger the failure yourself. Layout-critical assets must be local/committed.

### 2. Component states
{{STATE_CHECKS — every interactive element in all applicable states}}
- `2.console` — No new console errors/warnings after each interaction.

### 3. Interaction & keyboard
- `3.controls` — Every button/link/toggle/tab/modal trigger fires.
- `3.keyboard` — Logical tab order; Enter/Space activate focused control; Esc closes overlays.
- `3.deadlinks` — No dead links (every href → existing page or explicit `#` with comment).
{{EXTRA_INTERACTION_CHECKS}}

### 4. Responsiveness (widths × content)
- `4.<width>` for each of 360 / 390 / 414 / 768 / 1024 / 1440 — no horizontal scroll, no clipped content, touch targets ≥44px on mobile widths.
{{PAGE_SPECIFIC_RESPONSIVE_CHECKS}}

### 5. Accessibility (fixed floor)
- `5.focusring` — Visible focus indicator on every keyboard-focusable control.
- `5.alt` — All images have alt text.
- `5.labels` — Every input has a programmatic label (not placeholder-only).
- `5.headings` — Single logical heading order.
- `5.coloronly` — Status is never conveyed by color alone (icon/text too).
- `5.reducedmotion` — With `prefers-reduced-motion: reduce`, non-essential animation is suppressed.
- `5.darkcontrast` — Dark mode: text/icon contrast meets WCAG AA (4.5:1 body, 3:1 large); {{A11Y_TIER}} tier honored.
{{A11Y_CHECKS — page-specific additions}}

### 6. Edge / sad paths (fixed)
- `6.empty` — Empty-data state renders.
- `6.loading` — Loading/skeleton state renders.
- `6.error` — Error/failure state renders with recovery affordance.
- `6.longcontent` — 90+ char name, regional-script (Devanagari ~1.4× width), multi-line button label, max-row list — all hold without overflow/clipping.
- `6.counts` — Single-item vs many-items both render correctly.
{{PAGE_SPECIFIC_EDGE_CASES}}

### 7. Guest-surface & device (conditional + manual)
- `7.whatsapp` — IF primary user = guest: page renders correctly as a WhatsApp link preview (OG) AND in the WhatsApp Android in-app WebView. (manual — agent: skip and flag for human)
- `7.device` — Mobile real-device pass on a mid-tier Android with CPU throttle; TalkBack sanity for guest surfaces. (manual — agent: skip and flag for human)

## Definition of done
Every non-manual row PASS (deferrals documented in _findings.md), no console errors, manual rows flagged for human.
