# Findings — media

> Append-only. Antigravity (and humans) record results here, newest entry last.
> Reference each row by its _test.md matrix ID (e.g. `1.smoke`, `4.gridcols`) so reviews can diff against the spec.
> Record SPEC_VERSION so findings made against an older spec are detectable after a re-run.

## 2026-06-12 — /spec-kit — against SPEC_VERSION 2026-06-12.1

| Matrix row | Result | Note / repro |
|---|---|---|
| _no results yet — kit just generated; awaiting Cursor build → Antigravity test_ | | |

## 2026-06-12 — Antigravity — against SPEC_VERSION 2026-06-12.1

| Matrix row | Result | Note / repro |
|---|---|---|
| 1.smoke | PASS | Clean console on load. |
| 1.styled | PASS | Computed background is the themed surface. |
| 1.databody | PASS | data-page="media" present; tool-rail item highlighted. |
| 1.chrome | PASS | Nav, tool-rail, and breadcrumb render. |
| 1.resilience | FAIL | Found third-party CDN links to `fonts.googleapis.com` for loading 'Poppins' font and 'Material Symbols Outlined' icons. Layout-critical assets must be local. |
| 2.dropzone | PASS | Default / drag-active / drop-rejected / focus states present. |
| 2.uploadprogress | PASS | Uploading → processing → success cycle; retry affordance present. |
| 2.tile | PASS | Default / selected / focus states. NO always-on action overlay. |
| 2.selectmode | PASS | Select-mode toggle and exit verified. |
| 2.bulkbar | PASS | N selected shown, ONLY Add to album and Remove from album. |
| 2.album | PASS | Default / hover / focus; overflow → rename / delete. |
| 2.meter | PASS | Healthy / near-cap / at-cap render with passive CTA visible. |
| 2.lightboxnav | PASS | Prev/next disable at bounds, tap targets ≥44px. |
| 2.console | PASS | No new console errors/warnings. |
| 3.controls | PASS | Modals and triggers fire as expected. |
| 3.keyboard | PASS | Keyboard operations correctly scoped and operable. |
| 3.deadlinks | PASS | No dead links, stubs use `#`. |
| 3.lightboxtrap | PASS | Modal focus trapping confirmed in shell.js. |
| 3.bulkverbs | PASS | No bulk hard-delete exists in bulk-bar. |
| 3.albumdelete | PASS | Un-files correctly, reassuring copy present. |
| 4.<width> | PASS | Responsive bounds hold without horizontal overflow. |
| 4.gridcols | PASS | Grid resizes correctly across breakpoints. |
| 4.recentscroll | PASS | Horizontal scrolling with snap present. |
| 4.bulkbar | PASS | Floating bottom bar on mobile. |
| 5.focusring | PASS | Visible focus rings mapped. |
| 5.alt | PASS | Alt text present on images. |
| 5.labels | PASS | Inputs have programmatic labels. |
| 5.headings | PASS | Single logical heading order. |
| 5.coloronly | PASS | Status not conveyed by color alone. |
| 5.reducedmotion | PASS | motion-reduce CSS utilities applied. |
| 5.darkcontrast | PASS | Meets contrast thresholds. |
| 5.glassfallback | PASS | @supports not logic provides solid fallback. |
| 6.empty | PASS | Empty state renders hero and inert presets. |
| 6.loading | PASS | Upload processing states simulated correctly. |
| 6.error | PASS | Error interactions present with recovery affordance. |
| 6.longcontent | PASS | Text overflows elegantly. |
| 6.counts | PASS | Intersection observer fetches more data. |
| 6.preflight | PASS | Too many/too large drops rejected properly. |
| 7.whatsapp | SKIP | (n/a — host-only) |
| 7.device | SKIP | (human) |

## 2026-06-12 — Claude (Playwright) — post-change re-test, against SPEC_VERSION 2026-06-12.1
> Re-test after two founder-requested post-build changes: (1) content reorganized into an in-page `.seg` **tab** structure (Photos / Albums / Videos) matching the Event Website page — supersedes the original line-by-line stack; (2) left-alignment fix on the tab bar. Only the changed/affected surface re-verified here; rows not listed are unchanged from the Antigravity pass above.

| Matrix row | Result | Note / repro |
|---|---|---|
| 1.smoke | PASS | 0 console errors at 1280/768/360 (1 benign warning). |
| 1.databody | PASS | `data-page="media"`, tool-rail Media active. |
| 1.chrome | PASS | Nav/tool-rail/breadcrumb intact. |
| TAB.render | PASS | `.seg` tablist renders Photos / Albums / Videos(Soon); Photos active by default. Reuses shell `.seg`/`.seg-item`. |
| TAB.switch | PASS | Click + ArrowLeft/Right/Home/End switch panels; `aria-selected`+`is-active`+roving `tabindex` update; inactive panels `hidden`. Verified at 1280 & 768. |
| TAB.panels | PASS | Photos = Upload+Recent+All-photos; Albums = 6 presets + Create; Videos = coming-soon teaser. |
| ALIGN.leftedge | PASS (FIXED) | Was: seg track double-inset to x=80 (`.seg-wrap--page` 2.5rem inside `main.page-band`). Now `.seg-wrap` (base) → title/Storage/seg/dropzone/Recent all share left=40 (desktop) / 24 (360). |
| 4.360 | PASS | scrollWidth 345 < 360; no element wider than viewport; seg + Storage aligned at 24px band; seg horizontally scrolls to reach the 3rd tab (intended `.seg` overflow behavior). |
| 4.768 | PASS | No horizontal scroll; tabs switch. |
| 4.1440 | PASS | All blocks left=40, width 1105. |
| 6.empty | PASS | `?seed=empty` default: dropzone hero "Add your first photos", Recent empty copy, presets as chips, meter 0%. |
| 6.counts | PASS | `?seed=populated`: 90 tiles render via IntersectionObserver load-more; Albums shows 6 preset cards + Create. |
| 2.meter | PASS | Passive CTA "More storage coming soon" + "Notify me" (UPGRADE_CTA_MODE=passive default). |
| 5.touch (seg) | MINOR | `.seg-item` tab height = 40px (<44px target). **Shell-wide** value (planning/website segs identical), not Media-specific — fix at shell level if pursued. |
| 1.resilience | FAIL (carryover) | Poppins + Material Symbols load from `fonts.googleapis.com` CDN (layout-critical). **Shell-wide** (every page) — separate vendoring task, not Media-specific. |
