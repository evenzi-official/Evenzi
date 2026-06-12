# Cursor follow-up runbook — Media & Memories (`media`) · revision R2 (2026-06-12)

> Context: you already built this page from `_cursor-prompt.md` (R1). Two founder-requested
> changes were then applied by hand during live review and verified in the browser. This doc is
> the **source of truth for those changes** — re-derive / clean / own them here, then work the
> open fix-list. Build target is unchanged: static prototype `designs/pages/media/media.{html,css,js}`
> served via `npm run design` (http://localhost:4000/pages/media/media.html). Tokens only, no inline
> CSS/JS, reuse-before-create, mobile-first ≥44px, `.bc-wrap`/`.page-band` wrappers, dark mode + reduced-motion.

## Change 1 — Content is now an in-page TAB structure (NOT a line-by-line stack)
Founder wants the page organized like the **Event Website** page's sub-nav (Overview/Design/Photos/Card-Templates) — a `.seg` segmented control, **not** a long vertical stack and **not** an accordion.

**Structure (top → bottom):**
1. `main.page-band` › `.section-head` (h1 "Media & Memories") — **persistent**.
2. Storage meter strip (`#md-meter`) — **persistent** (global status, stays above the tabs).
3. **Tabs** — reuse shell `.seg` exactly as `planning.html` does in-page:
   - `<div class="seg-wrap reveal">` → `<nav class="seg" role="tablist" aria-label="Media sections">`
   - Three `<button role="tab" class="seg-item seg--page" aria-selected aria-controls tabindex>`: **Photos** · **Albums** · **Videos** (Videos carries a `.role-tag-soon` "Soon" pill).
   - **Use `.seg-wrap`, NOT `.seg-wrap--page`** — see Change 2.
4. Three `<section role="tabpanel" aria-labelledby class="media-panel reveal" [hidden]>` panels:
   - `#md-panel-photos` (active): Upload dropzone + Recent uploads strip + All photos grid (`#md-all`).
   - `#md-panel-albums` (hidden): albums grid (6 presets + Create album) + preset chips.
   - `#md-panel-videos` (hidden): the "coming soon" `.empty-cta-card` teaser.
5. Tab JS lives in `media.js` (`wireTabs()` IIFE): click + ArrowLeft/Right/Up/Down/Home/End, roving `tabindex`, toggles `aria-selected`/`is-active` and panel `[hidden]`. This is the in-page idiom proven on `planning.html` — do not invent a new one, do not use separate-page links.

> All existing `#md-*` ids and `media.js` hooks (dropzone, upload list, recent, `#md-all` `data-photos-state`/`data-select-mode`, `#md-grid`, sentinel, albums grid, select toggle, filter chip, bulk-bar) must be preserved — the panels wrap the existing content, they don't replace it.

## Change 2 — Tab-bar left alignment (bug fix — keep this)
`.seg-wrap--page` adds `padding: 0 2.5rem` for **full-bleed** placement (how the Website page uses it, as a sibling OUTSIDE the page-band). Here the seg sits **inside** `main.page-band`, which already applies the 2.5rem gutter — so `--page` double-inset the tab track (left x=80 vs the band edge x=40), making the left edge ragged against the section title, Storage card, and dropzone.

**Rule:** when a `.seg` is placed inside a `.page-band`/`.bc-wrap` container, use the base **`.seg-wrap`** (no `--page`). Verified: title / Storage / seg track / dropzone / Recent all share left=40 (desktop) and 24 (360). Do not reintroduce `--page` here.

## Open fix-list (work these)
1. **(P2, shell-wide) Touch target:** `.seg-item` renders 40px tall (<44px). Affects every `.seg` consumer (planning, website, media). If pursued, raise the min-height in `shell.css` `.seg-item` to 44px and re-verify planning + website segs don't regress — do NOT fork a media-only override.
2. **(P1, shell-wide, carryover from Antigravity `1.resilience`) Vendor the fonts:** Poppins + Material Symbols load from `fonts.googleapis.com` (layout-critical). Per the standing runtime-dependency-resilience rule, layout-critical assets must be local/committed (Tailwind is already vendored). This is a **shell-wide** change (every page links the same Google Fonts `<link>`s) — scope it as its own task across all pages + `shell` head, not a media-only patch. Flag to founder before doing it broadly.
3. **(P3, optional) Tab set review:** current grouping is Photos / Albums / Videos. Founder may want Recent split out or Upload as its own tab — confirm before changing.

## Verification checklist (run after any edit; mirror `_test.md`)
- `npm run design`; open `…/pages/media/media.html` (empty, default) and `?seed=populated`.
- Tabs: click each + keyboard arrows; only the active panel is visible; `aria-selected` tracks; console clean.
- Alignment: at 1440/768/360, section title + Storage card + seg track + dropzone share the same left edge; no horizontal scroll at any width.
- States: empty = dropzone hero + "Add your first photos" + empty Recent copy + presets-as-chips + 0% meter; populated = 90 tiles lazy-load, Albums shows 6 presets + Create.
- Flows still work post-restructure: dropzone opens picker, lightbox prev/next, bulk-bar = {Add to album, Remove from album} only (no bulk delete), album create/rename/delete (delete un-files, reassuring copy), passive storage CTA.
- Dark + reduced-motion honored.

## When done
Update `_status.md`: keep `STAGE: REVIEW` (or `TEST` if you want Antigravity to re-run the full matrix against R2), bump the note to "R2 — tabs + alignment", `NEXT: /spec-kit-review media`.
