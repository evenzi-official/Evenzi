# Spec — {{PAGE_TITLE}} (`{{PAGE_SLUG}}`)  ·  SPEC_VERSION {{SPEC_VERSION}}

> Build source of truth. Cursor builds **only** from this file. Filled by `/spec-kit` from the
> feature overview + design system + council review. Overwritten on re-run (SPEC_VERSION bumps).

## Goal & user
- **Primary user:** {{HOST_OR_GUEST}}  (if this is arguably "both", that is a Gate-1 open question — do not silently accept dual-user)
- **User goal of this page:** {{ONE_SENTENCE_GOAL}}
- **Overview source:** docs/features/overviews/{{OVERVIEW_FILE}}
- **a11y tier:** {{A11Y_TIER}}  (guest/public surfaces = AAA; host surfaces = AA)
- **Share / Open Graph:** {{OG_REQUIREMENTS}}  (guest-facing pages MUST render as a correct WhatsApp link preview — OG title/description/image; for host-only pages write "n/a")

## Page composition (top → bottom)
{{SECTION_LIST — each section: name, purpose, contents}}

## Element reuse map
> Every UI element → one of three rungs. Cursor consumes this literally.

| Element | Rung: reuse-as-is / modifier-extend / new | Primitive or new-file | Notes |
|---|---|---|---|
{{REUSE_ROWS}}

> Reuse discipline (cite the catalog): `designs/components.html` is organized into named sections
> (foundations, shell/chrome, surfaces, pills/chips, buttons/controls, forms, avatars, data, layout).
> Check there + `designs/shared/shell.css` first. Dark mode (`.dark`) and semantic status tokens
> (`--success/--warning/--danger/--info`) are mandatory, not optional.

## New primitives needed
> generic → designs/shared/shell.*; page-specific → designs/pages/{{PAGE_SLUG}}/{{PAGE_SLUG}}.*
{{NEW_PRIMITIVES — name, where it lives, why, states}}

## Interaction states (per interactive element)
> default / hover / focus / active / disabled / loading / error / empty — list those that apply.
{{STATES}}

## Data & content model
- **Content fields:** {{FIELDS}}
- **Content-length resilience:** {{LONG_SHORT_EMPTY_BEHAVIOR}}  (the standard stressors are enforced as fixed _test.md rows)

## Responsive behavior
- Mobile-first; design at 360px, scale up. Widths: 360 / 390 / 414 / 768 / 1024 / 1440.
- {{BREAKPOINT_NOTES}}

## Accessibility
- Floor (always): visible focus ring on keyboard nav; alt text on all images; every input has a programmatic label (not placeholder-only); single logical heading order; color is never the sole status signal; touch targets ≥44px.
- Page-specific: {{A11Y_REQUIREMENTS}}

## Copy (Indian conventions: ₹ + lakh/crore, DD/MM/YYYY, 12-hour time)
{{COPY — headings, labels, empty-state text, toasts}}

## Council notes folded in
{{COUNCIL_CRITICAL_AND_IMPORTANT — or "n/a (trivial skip)"}}
