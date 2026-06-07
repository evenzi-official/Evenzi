# Evenzi design — multi-editor handover system

One playbook for building/iterating any `designs/` page across Claude + Cursor + Antigravity. The **baton is `designs/pages/<page>/_status.md`**; per-loop docs are **spawned from the templates below, then deleted** (the lasting record lives in each page's `_page.md`). The standing config/role-books are permanent — never spawned.

## The loop
```
            _status.md baton:  SPEC → BUILD → TEST → REVIEW → DONE

1. CLAUDE · plan     /spec-kit <page> (new) or write a fix-doc (loop).
   Reads overview + shell + brand + ai/agents/*. Writes the build-doc. → STAGE: BUILD
2. CURSOR · build    "read <build-doc> and execute it completely".
   Builds in-place, runs design self-review + self-test. → STAGE: TEST
3. TEST              pick the lane: Antigravity (automated a11y/responsive) ·
   Claude Playwright (real-browser overflow/console/computed — reliable) ·
   Founder phone (LAN :4000 — visual/UX truth). Findings recorded. → STAGE: REVIEW
4. CLAUDE · review   verify findings (kill axe false-positives).
   clean → STAGE: DONE   |   defects → write fix-doc → STAGE: BUILD (loop to 2)
5. RECORD            fold the outcome into pages/<page>/_page.md
```

## Standing pieces (permanent — point to these, don't copy)
- `.cursor/rules/evenzi-design.mdc` — design-system rules + mandatory self-review & self-test (Cursor auto-applies on `designs/**`).
- `.agents/rules/evenzi-testing.md` — Antigravity test rules (STOP-check + re-test contract).
- `docs/cursor/design-reviewer-mode.md` — Cursor "Design Reviewer" custom mode.
- `ai/agents/{ui_ux_designer,frontend_engineer,test_engineer}.md` + `ai/system/agent_rules.md` — role-books.
- `docs/BRAND-GUIDELINES.md` · `designs/components.html` + `designs/shared/shell.css` — brand + catalog.

## `_status.md` baton (the one file each tool reads/writes)
```
PAGE: <page>
STAGE: SPEC | BUILD (Cursor) | TEST | REVIEW | DONE
SPEC_VERSION: <YYYY-MM-DD.n>
UPDATED: <date> — <who/what>
NEXT: <the exact next action / doc to read>
```
Every spawned doc opens with a **STOP-check**: assert `_status` STAGE + SPEC_VERSION match before acting (catches wrong-worktree).

---

## Spawn templates (create per loop in `designs/pages/<page>/`, delete when DONE)

### `_build.md` (Claude → Cursor)
```
# Build/fix — <page> · SPEC_VERSION <v>
STOP-check: _status must read STAGE: BUILD + SPEC_VERSION <v>, else stop (wrong worktree).
Read: ai/agents/ui_ux_designer.md + .cursor/rules/evenzi-design.mdc.
Standard: complete + correct, every instance, no partial migrations, no regressions; tokens-only;
generic→shell.*, page-specific→<page>.*; alias-first if promoting.
## Tasks
1. <each change: what, exact target file:line, reuse map, a11y, verify-grep>
## Out of scope: <…>
## Done: run design self-review + self-test; report grep proofs + git status; bump _status → TEST.
```

### `_test.md` (Cursor → Antigravity / Claude)
```
# Test — <page> · SPEC_VERSION <v>
STOP-check: STAGE must be TEST + version match, else stop.
Integrity: load-sanity-gate each page (real body[data-page], not 404/<pre>); verify every finding vs
live DOM before recording; no boilerplate (real selector + measured value + repro); de-dupe across
viewports; skip known-benign (favicon 404, Tailwind CDN warning); href="#" are intentional.
## Matrix: smoke · click-everything · forms · responsive 360/390/414/768/1024/1440 · states ·
keyboard/focus · a11y · dark/light · nav · stress (long/Devanagari/crore/empty) · design-standard · gaps.
## Done: record findings; bump _status → REVIEW.  (Antigravity manual pass via CDP is unreliable —
prefer Claude Playwright + founder phone for visual/interaction.)
```

### `_fix.md` (Claude → Cursor, on a REVIEW loop)
```
# Fix — <page> · SPEC_VERSION <v>
Only VERIFIED-real findings (triage out axe over-reports first). Per item: severity · element ·
observed value · fix · verify-grep. Complete + correct. → bump _status → TEST when done.
```

> A whole-`designs/` sweep (all pages at once) reuses the `_test.md` template at repo level, written to a temp `_SWEEP.md` + findings to `_FINDINGS.md` — both deleted after triage; real fixes become `_fix.md` loops and the record lands in each `_page.md`.
