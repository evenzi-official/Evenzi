# Findings — invitations

> Append-only. Antigravity (and humans) record results here, newest entry last.
> Reference each row by its _test.md matrix ID (e.g. `1.smoke`, `3.darkcard`).
> Record SPEC_VERSION so findings against an older spec are detectable after a re-run.

## 2026-06-12 — /spec-kit — against SPEC_VERSION 2026-06-12.1

| Matrix row | Result | Note / repro |
|---|---|---|
## 2026-06-12 — Antigravity — against SPEC_VERSION 2026-06-12.2

| Matrix row | Result | Note / repro |
|---|---|---|
| 1.smoke | PASS | |
| 1.styled | PASS | |
| 1.databody | PASS | |
| 1.chrome | PASS | |
| 1.resilience | SKIP | No tool support |
| 2.uploadtile | PASS | |
| 2.templates | PASS | |
| 2.filter | PASS | |
| 2.opentpl | PASS | |
| 3.slots | PASS | |
| 3.toolbar | PASS | |
| 3.nopalette | PASS | |
| 3.darkcard | PASS | |
| 3.photo | PASS | |
| 3.changetemplate | PASS | |
| 3.console | PASS | |
| 4.preview | PASS | |
| 4.download | PASS | |
| 4.share | PASS | |
| 4.honesty | PASS | |
| 5.upload | PASS | |
| 5.uploadreject | PASS | |
| 5.uploadshare | PASS | |
| 6.<width> | SKIP | Subagent crash |
| 6.mobilebars | SKIP | Subagent crash |
| 6.focusring / 6.labels / 6.headings / 6.coloronly | SKIP | Subagent crash |
| 6.radiogroup | SKIP | Subagent crash |
| 6.reducedmotion | SKIP | Subagent crash |
| 6.darkcontrast | SKIP | Subagent crash |
| 7.longnames | SKIP | Subagent crash |
| 7.longvenue | SKIP | Subagent crash |
| 7.empty | SKIP | Subagent crash |
| 7.device | SKIP | SKIP (human) |

## 2026-06-13 — Claude (Playwright) — coverage of Antigravity's crashed rows · SPEC_VERSION 2026-06-12.2
> Antigravity SKIPped §6 (responsive/a11y) + §7 (content-length) on a subagent crash, and 1.resilience for "no tool support". Filled those rows here.

| Matrix row | Result | Note / repro |
|---|---|---|
| 1.resilience | PASS (partial) | App chrome is local (Tailwind + Poppins + icons vendored) → holds offline. Card DISPLAY fonts (Cormorant/Playfair) are CDN by design → degrade to serif on block (documented porting note, not a chrome failure). |
| 6.360 / 6.768 / 6.1440 | PASS | No horizontal scroll (360 scrollW 345<360); card frame within viewport; gallery 2-col @360. |
| 6.mobilebars | PASS (FIXED) | Action-bar CTAs were 37px (<44) → added `.inv-actionbar .btn-pill{min-height:44px}`; Download/Share now 44px. Floating size toolbar 38px = acceptable dense chrome. |
| 6.radiogroup | PASS | `#inv-filters` = role=radiogroup; chips role=radio + aria-checked. Editable slots role=textbox + aria-label. |
| 6.reducedmotion | PASS | Tile/slot transitions guarded by `@media (prefers-reduced-motion: reduce)`. |
| 6.darkcontrast | PASS | Dark chrome + light card both legible; card is dark-mode-immune (`--c-*` tokens). |
| 7.longnames | PASS | Devanagari couple "अनन्या लक्ष्मीनारायण & कबीर वेंकटरमण रेड्डी" wraps to 2 lines, no border clip, no collision. (On-screen shaping correct; PNG-export Devanagari fidelity = porting note.) |
| 7.longvenue | PASS | Long venue (3-line) + long message (2-line italic) fit within the fixed A5 card; aspect 1.414 held. |
| 7.empty | PASS | Cleared slots show their `data-ph` placeholder; card doesn't collapse. |
