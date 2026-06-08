---
name: spec-kit-review
description: Claude-only review skill for the multi-editor workflow — reads a built page's _findings.md (Antigravity test results) against its _spec.md/_test.md, runs a focused council/codex review, writes _review.md, patches the spec/test if gaps are found, and advances the _status.md baton (REVIEW→DONE when clean, or REVIEW→BUILD with a fix-list for another Cursor pass). Invoke as /spec-kit-review <page>.
---

# spec-kit-review — Review & loop gate for the multi-editor workflow

The back half of the `/spec-kit` pipeline. After Cursor builds and Antigravity tests, the baton sits at `STAGE: REVIEW`. This skill assesses the findings, decides whether the page is done or needs another build pass, and **owns the `REVIEW→DONE` transition** (the terminus `/spec-kit` deliberately left open). The baton is files; this skill never builds or tests — it judges and routes.

## Usage
`/spec-kit-review <page>` — review the page's findings and route.
`/spec-kit-review <page> --codex` — add one codex review pass (reserve for hard/contested pages; codex is on a limited plan).

Resolve `<page>` via the **same v1 alias map as `/spec-kit`** (10 supported slugs with a real `designs/pages/<page>/` dir; `dashboard`/`landing`/`admin` unsupported). No match → list slugs and ask.

## Run flow — 4 phases, 1 gate

### Phase 0 — Resolve & read (auto)
Resolve `<page>`. Read from `designs/pages/<page>/`: `_status.md`, `_findings.md`, `_spec.md`, `_test.md`, and the built page (`<page>.html` + `<page>.css` + `<page>.js`).
- If `_status.md` is **not** at `STAGE: REVIEW`, warn the user (e.g. "status is BUILD — Antigravity hasn't written findings yet") and confirm before continuing.
- If `_findings.md` has no real results (still the stub), stop — there's nothing to review; tell the user to run Antigravity first.
- Check `SPEC_VERSION`: if `_findings.md` was recorded against an older `SPEC_VERSION` than `_spec.md`, flag that the findings may be stale (spec was re-generated after testing).

### Phase 1 — Triage findings (auto)
For each entry in `_findings.md`, classify against `_spec.md` (acceptance + reuse map + states) and `_test.md` (matrix rows):
- **Confirmed defect** — a real FAIL the build must fix.
- **False-pass / noise** — a PASS that shouldn't count (e.g. smoke passed but a constraint was skipped), or a FAIL that's actually a test error.
- **Spec/test gap** — the finding reveals the spec or test plan was wrong/incomplete (fix the kit, not the page).
- **Manual-deferred** — section-7 rows flagged `SKIP (human)`; list them so they aren't silently lost.

### Phase 2 — Focused review (auto, unattended)
Run a **scoped review of the built page + the triage**:
- Default: dispatch `/council code` scoped to `designs/pages/<page>/*` (code_reviewer + ui_ux_designer + frontend_engineer + test_engineer) to validate the triage and catch what Antigravity's matrix missed (visual/structural issues a cold tester would pass). Honor council's triviality skip — if the page is tiny and findings are all-clean, log the skip.
- `--codex` → add one codex pass on the page + findings.
- Keep it scoped: this reviews ONE page's output, not the whole repo.

### Phase 3 — Write review + patch the kit (auto)
- **Append** a dated entry to `_review.md` (newest last): the verdict, a per-finding ruling (uphold/overrule with reason), and the concrete action list.
- If Phase 1/2 surfaced **spec or test gaps**, patch `_spec.md` / `_test.md` to close them and **bump `SPEC_VERSION`** (note the bump in `_review.md`). If `_spec.md` changed, `_cursor-prompt.md` and `_test.md` already reference it by version — no template edits needed, just the version stamp.
- Never clobber `_findings.md` (append-only).

### Phase 4 — Verdict & route → 🚪 GATE
Present the verdict to the user, then route by bumping `_status.md`:
- 🟢 **DONE** — no confirmed defects (or all were spec-gaps now patched + re-testable as clean). Set `STAGE: DONE`, `NEXT: none — page complete`. This is the v1 terminus.
- 🔁 **LOOP → BUILD** — confirmed defects remain. Set `STAGE: BUILD`, `NEXT: open Cursor → read _cursor-prompt.md (spec updated to SPEC_VERSION <v>) → fix the listed defects → bump to TEST`. Put the explicit fix-list at the top of the latest `_review.md` entry so Cursor reads exactly what to change.
- ⚠️ **BLOCKED** — findings are unusable (stale SPEC_VERSION, missing build, or contradictory). Explain and ask the user how to proceed (re-run Antigravity / re-run /spec-kit).

Get user confirmation on the verdict before bumping `_status.md`.

## Scope
Reviews & routes one page. Does **not** build (Cursor) or test (Antigravity). Pairs with `/spec-kit` (which owns SPEC→BUILD via Gate-2); together they own the full `SPEC → BUILD → TEST → REVIEW → DONE` baton.
