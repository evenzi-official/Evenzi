<!-- Build-kit baton. STAGE advances: SPEC → BUILD → TEST → REVIEW → DONE.
     Who sets each: /spec-kit writes SPEC then bumps to BUILD on Gate-2 approval;
     Cursor bumps BUILD→TEST when it finishes building; Antigravity bumps TEST→REVIEW.
     Each tool rewrites STAGE/UPDATED/NEXT on handoff. Keep to these lines.
     v1: REVIEW is the terminal state. /spec-kit-review (TODO A.2) owns REVIEW→DONE when built —
     a cold agent at REVIEW should stop and wait, not treat it as a failure. -->
PAGE: planning
STAGE: TEST
SPEC_VERSION: 2026-06-06.2
UPDATED: 2026-06-06 — Cursor loop-3 fixes (2/2): custom calendar on date fields, toast top-right
NEXT: Antigravity → smoke + interaction matrix → bump TEST→REVIEW. Touch only designs/pages/planning/* + designs/shared/shell.{css,js}.
