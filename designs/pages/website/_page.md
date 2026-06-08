# Event Website (Digital Presence) — page record

**Status:** built. Host-side editor for the public guest-facing site.

## Pages in module
`overview.html` (landing) · `design.html` (template/palette/font/cover) · `photos.html` (gallery curation) · `card-templates.html` (invite card gallery + lightbox) · `edit-page.html` (per-page section editor, 11 section types) · `edit-pages.html` (retired → redirects to overview) · `templates/` (gallery index + 5 theme previews).

## Notes
- Sub-tabs use the shared shell `.pill-tabs` (migrated off the local `.wb-tab*` block — glow removed, flat, matches planning).
- `.dp-card-head` action rows wrap on mobile (overflow fix).
- Entry point is `overview.html` (NOT `website.html` — nav links across the app point here).
- Deferred: guest-side unlock flow + public site; real card PDF/PNG assets; `components.html` backfill of the `.dp-*` primitives.
