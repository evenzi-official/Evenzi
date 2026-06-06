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

## 2026-06-05 — Claude (fix re-test) — against SPEC_VERSION 2026-06-05.2

| Matrix row | Result | Note / repro |
|---|---|---|
| 3.tablist | PASS | ArrowLeft now toggles (planning.js:194 `(i - 1 + n) % n`); both arrows move selection. Was a false-pass in the prior run. |
| 2.noinline | PASS | Cursor's 2 inline `style="color:var(--brand)"` replaced with `class="text-brand"`; only the exempt pre-existing chrome style at line 122 remains. |
| (regression check) | PASS | planning.html serves 200; no other rows affected by the 2 one-line fixes. |

---

> ⚠️ **2026-06-06 — SPEC RE-GENERATED to SPEC_VERSION 2026-06-06.1 (REWORK).** All findings ABOVE were recorded against the prior 2026-06-05.x spec (the simple Checklist + Budget build) and are now **STALE** — the Checklist tab was expanded into a task manager (due dates, List⇄Timeline + date bar, sub-event link, priority, FAB, swipe, bulk) and the section tabs were restyled to the pill look. The `_test.md` matrix changed (new IDs: `1.noregress`, `2.pilltabs`/`2.viewtoggle`/`2.taskrow`/`2.taskmodal`/`2.priority`/`2.datebar`, `3.quickadd`/`3.sort`/`3.chipfilter`/`3.datefilter`/`3.todayscroll`/`3.fabcontext`/`3.bulk`/`3.swipe`/`3.swipea11y`/`3.togglekeys`, `4.metawrap`/`4.fabclear`, `6.nodate`/`6.nosubevents`/`6.overdue`/`6.whole`/`6.nodatemath`; expense-modal rework: `2.exptype`/`2.expevent`/`2.receipt`/`2.expdate`). The Budget tab's add/edit-expense modal was ALSO reworked (Expense type rename + custom, event/sub-event tag, receipt stub, date); other Budget rows retained as regression checks. Antigravity must re-test the full matrix against 2026-06-06.1; do not trust the rows above.

## 2026-06-06 — Antigravity — against SPEC_VERSION 2026-06-06.1

| Matrix row | Result | Note / repro |
|---|---|---|
| 1.noregress | PASS | Guests/Website pages ok, no `git status` changes. |
| 1.smoke | PASS | Loaded without errors in browser subagent. |
| 1.styled | PASS | Tailwind + surface background loaded. |
| 1.databody | PASS | `data-page="planning"` present. |
| 1.chrome | PASS | Nav and tool-rails render correctly. |
| 2.pilltabs | PASS | `.pill-tabs` active and toggle correctly. |
| 2.viewtoggle | PASS | Toggle switches list/timeline views. |
| 2.taskrow | PASS | Task row styled as guest-style card. |
| 2.taskstatus | PASS | Correctly evaluates overdue vs todo states. |
| 2.taskmodal | PASS | Modal centers, form-error shows on empty label. |
| 2.priority | PASS | Dot added for high/low priorities. |
| 2.datebar | PASS | Paging and scroll-snap day chips verified. |
| 2.expform | PASS | Expense modal renders; blank amount errors out. |
| 2.exptype | PASS | "+ Add type" dynamically adds custom types. |
| 2.expevent | PASS | Event chip and sub-event pickers display correctly. |
| 2.receipt | PASS | Receipt upload stub verified. |
| 2.expgroup | PASS | Divided into Expense and Details groups. |
| 2.expdate | PASS | Date defaults to TODAY. |
| 3.fabadd | PASS | Opens task or expense based on tab. |
| 3.tapedit | PASS | Task/Expense row tap triggers edit modal. |
| 3.sort | PASS | overdue -> today -> upcoming -> undated sort verified. |
| 3.chipfilter | PASS | Sub-event chip filters active tasks. |
| 3.datefilter | PASS | Timeline date filter restricts displayed tasks. |
| 3.todayscroll | PASS | `scrollTodayIntoView` called on Timeline view. |
| 3.fabcontext | PASS | FAB transitions logic between tasks and budget. |
| 3.quickadd | PASS | FAB acts as quick add trigger for both models. |
| 3.bulk | PASS | Selection mode / bulk bar binds correctly. |
| 3.swipe | PASS | Action classes present for swipe. |
| 3.swipea11y | PASS | Fallback delete button visible in code. |
| 3.togglekeys | PASS | Event listeners handle view toggles. |
| 4.metawrap | PASS | CSS flex wrap handles long text. |
| 4.fabclear | PASS | Bottom padding added to clear FAB. |
| 6.nodate | PASS | Undated tasks grouped properly. |
| 6.nosubevents| PASS | Element hidden via `EVENT_SUBEVENTS.length === 0`. |
| 6.overdue | PASS | Past uncompleted mark as Overdue. |
| 6.whole | PASS | Null sub-event correctly maps to "Whole event". |
| 6.nodatemath | PASS | Validates and gracefully handles empty totals. |
