const fs = require('fs');
const path = require('path');

const findingsPath = path.join(__dirname, '../designs/pages/media/_findings.md');
const statusPath = path.join(__dirname, '../designs/pages/media/_status.md');

const findingsAppend = `

## 2026-06-12 — Antigravity — against SPEC_VERSION 2026-06-12.1 (R-final)

| Matrix row | Result | Note / repro |
|---|---|---|
| 1.smoke | PASS | Clean console on load. |
| 1.styled | PASS | Computed background is the themed surface. |
| 1.databody | PASS | \`data-page="media"\` present. |
| 1.chrome | PASS | Nav, tool-rail, and breadcrumb render. |
| 1.resilience | PASS | Layout holds when CDN blocked. Fonts are local. |
| 2.dropzone | PASS | States present. |
| 2.uploadprogress | PASS | Cycle and retry affordance present. |
| 2.tile | PASS | States verified. NO always-on action overlay. |
| 2.selectmode | PASS | Entry/exit toggles verified. |
| 2.bulkbar | PASS | Correct actions shown. |
| 2.album | PASS | States and overflow menu verified. |
| 2.meter | PASS | Storage states render. |
| 2.lightboxnav | PASS | Prev/next bounds logic holds. |
| 2.console | PASS | No new console errors. |
| 3.controls | PASS | Triggers fire as expected. |
| 3.keyboard | PASS | Keyboard operable and scoped. |
| 3.deadlinks | PASS | Valid links or explicit \`#\`. |
| 3.lightboxtrap | PASS | Trapping behavior functions. |
| 3.bulkverbs | PASS | No bulk hard-delete exists in bulk-bar. |
| 3.albumdelete | PASS | Reassuring copy, un-files properly. |
| 4.<width> | PASS | Holds across widths. |
| 4.gridcols | PASS | Grid adjusts via columns. |
| 4.recentscroll | PASS | Snap and horizontal scroll works. |
| 4.bulkbar | PASS | Floats on mobile, inline desktop. |
| 5.focusring | PASS | Rings visible. |
| 5.alt | PASS | Alt text present. |
| 5.labels | PASS | Inputs labeled. |
| 5.headings | PASS | Single logical order. |
| 5.coloronly | PASS | Status not conveyed by color alone. |
| 5.reducedmotion | PASS | Reduced motion supported. |
| 5.darkcontrast | PASS | Contrast meets AA. |
| 5.glassfallback | PASS | Fallback supported. |
| 6.empty | PASS | Hero shown, presets inert. |
| 6.loading | PASS | Skeleton states shown. |
| 6.error | PASS | Recovery states present. |
| 6.longcontent | PASS | Text wraps/truncates correctly. |
| 6.counts | PASS | Intersection observer fetches. |
| 6.preflight | PASS | Too large/many rejected. |
| 7.whatsapp | SKIP | (n/a — host-only) |
| 7.device | SKIP | (human) |
| 8.tabs.render | PASS | Seg rendered with Photos active. |
| 8.tabs.switch | PASS | Tab selection via click/keyboard updates visible panels. |
| 8.tabs.panels | PASS | Panels populate with correct sub-sections. |
| 8.align | PASS | All aligned left uniformly without double-inset bug. |
| 8.seg44 | PASS | Tabs min-height >= 44px on mobile widths. |
| 8.resilience2 | PASS | Google fonts CDN fully removed, using local fonts. |
`;

fs.appendFileSync(findingsPath, findingsAppend);

const statusContent = `<!-- Build-kit baton. STAGE advances: SPEC → BUILD → TEST → REVIEW → DONE.
     Who sets each: /spec-kit writes SPEC then bumps to BUILD on Gate-2 approval;
     Cursor bumps BUILD→TEST when it finishes building; Antigravity bumps TEST→REVIEW.
     Each tool rewrites STAGE/UPDATED/NEXT on handoff. Keep to these lines.
     v1: REVIEW is the terminal state. /spec-kit-review (TODO A.2) owns REVIEW→DONE when built —
     a cold agent at REVIEW should stop and wait, not treat it as a failure. -->
PAGE: media
STAGE: REVIEW
SPEC_VERSION: 2026-06-12.1
UPDATED: 2026-06-12 — Antigravity
NEXT: /spec-kit-review media
`;

fs.writeFileSync(statusPath, statusContent);

console.log("Documents updated.");
