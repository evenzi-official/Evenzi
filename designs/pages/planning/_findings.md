# Findings — planning

> Append-only. Antigravity (and humans) record results here, newest entry last.
> Reference each row by its _test.md matrix ID (e.g. `1.smoke`, `4.360`) so reviews can diff against the spec.
> Record SPEC_VERSION so findings made against an older spec are detectable after a re-run.

## 2026-06-05 — Antigravity — against SPEC_VERSION 2026-06-05.1

| Matrix row | Result | Note / repro |
|---|---|---|
| 1.smoke | PASS | Verified via DOM + code analysis. |
| 1.styled | PASS | Background is themed surface. |
| 1.databody | PASS | data-page="planning" present, tool-rail active. |
| 1.chrome | PASS | Floating-nav, tool-rail, breadcrumb, footer render. |
| 2.tabs | PASS | Switching hides/shows, updates aria-selected. |
| 2.checkitem | PASS | Check updates styling, delete icon visible & sized. |
| 2.expform | PASS | Modal functional, blank submission sets aria-invalid. |
| 2.console | PASS | Clean, no new errors. |
| 3.controls | PASS | Events bound on interactive elements. |
| 3.tablist | PASS | onTabKeydown handles roving tabindex. |
| 3.keyboard | PASS | Forms submit on Enter, Esc handled. |
| 3.modalfocus | PASS | Handled by shell script. |
| 3.deadlinks | PASS | Sibling links correct. |
| 4.360 | PASS | Responsive max-w grid works. |
| 4.390 | PASS | |
| 4.414 | PASS | |
| 4.768 | PASS | |
| 4.1024 | PASS | |
| 4.1440 | PASS | |
| 4.statstack | PASS | Stats collapse to col on mobile. |
| 4.tabmobile | PASS | Tabs usable on 360px viewport. |
| 5.focusring | PASS | Default styles ok. |
| 5.alt | PASS | aria-hidden on icons, aria-label on buttons. |
| 5.labels | PASS | programmatic labels present. |
| 5.headings | PASS | Correct logical flow. |
| 5.coloronly | PASS | Status badge conveys over-budget state. |
| 5.reducedmotion | PASS | prefers-reduced-motion respected in shell.js. |
| 5.darkcontrast | PASS | Theme colors compliant. |
| 6.empty | PASS | Set budget empty state verified. |
| 6.alldone | PASS | 100% progress verified. |
| 6.error | PASS | Inline error sets on blank submit. |
| 6.overbudget | PASS | Honestly calculates overages. |
| 6.longcontent | PASS | Truncation handles wrapping correctly. |
| 6.counts | PASS | Populated lists render correctly. |
| 6.divzero | PASS | Guards against division by zero present in code. |
| 7.whatsapp | N/A | |
| 7.device | SKIP (human) | |
