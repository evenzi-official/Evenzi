# Antigravity test runbook — Planning (`planning`)  ·  SPEC_VERSION 2026-06-06.1 (REWORK)

You are testing the Evenzi **Planning** page (Tasks + Budget) in `designs/pages/planning/`. You start with no prior context.

## 0 · STOP-check before you test (wrong-worktree / not-built guard)
This repo has **many git worktrees**. Before testing:
1. Open `_status.md` (this folder). It MUST read **`STAGE: TEST`** (Cursor sets this when the build is done) and **`SPEC_VERSION: 2026-06-06.1`**.
2. If it says `STAGE: BUILD` → Cursor hasn't finished building yet — **STOP** and tell the human to let Cursor finish first. If it says `DONE` or an older `SPEC_VERSION` → you're likely in the wrong worktree — **STOP** and tell the human: *"`_status.md` here is `<stage>` / `<version>`, not `TEST` / `2026-06-06.1` — open the worktree with the built page and re-run me. I can't switch worktrees myself."*
3. Proceed only when STAGE is TEST.

## Read first
1. `_test.md` (this folder) — the test source of truth. Run every row.
2. The built page served via `npm run design` (http://localhost:4000) → `designs/pages/planning/planning.html`.

## Steps
1. **Run section 1 (Smoke) FIRST.** If any of `1.smoke / 1.styled / 1.databody / 1.chrome / 1.noregress` FAILS, record it and STOP — the page is structurally broken (or the alias-first promotion regressed a shipped page). Flag for rebuild. `1.noregress` is critical: confirm `pages/guests/` and `pages/website/` render unchanged AND `git status` shows no modified files under them.
2. If smoke passes, work sections 2–6 in order. Exercise: both pill tabs; the List⇄Timeline toggle; the FAB-only add + tap-a-row-to-edit; the guest-style task card + To-do/Done/Overdue status badge; the default List sort; the tappable sub-event chip filter; the Timeline date-bar filter + Today auto-scroll + "No date" group; the task add/edit modal (incl. blank-title error and the no-sub-events hidden field); priority dot (high-only); overdue red chip; "Whole event" label; Add-FAB context switch; swipe rail + its a11y-parity equivalents; the bulk bar (Complete/Set date/Assign/Delete) with FAB hidden; the **reworked expense modal** (Expense type rename + "+ Add type" inline; event tag preselected + optional sub-event; receipt upload stub with no network; date-only date defaulting TODAY; breakdown "by type"); plus the retained Budget regression rows.
3. For **manual** rows (section 7, "agent: skip and flag for human") record `SKIP (human)`. `7.whatsapp` is n/a (host-only) — record `N/A`.
4. Record every row in `_findings.md` under a new `## <today> — Antigravity — against SPEC_VERSION 2026-06-06.1` heading, one table line per row ID: `| <row id> | PASS/FAIL/SKIP/N/A | note (repro for FAIL) |`.

## When done
Update `_status.md`: `STAGE: REVIEW`, `UPDATED: <today> — Antigravity`, `NEXT: /spec-kit-review planning`.
