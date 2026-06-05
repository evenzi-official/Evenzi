<!-- Build-kit baton. STAGE advances: SPEC → BUILD → TEST → REVIEW → DONE.
     Who sets each: /spec-kit writes SPEC then bumps to BUILD on Gate-2 approval;
     Cursor bumps BUILD→TEST when it finishes building; Antigravity bumps TEST→REVIEW.
     Each tool rewrites STAGE/UPDATED/NEXT on handoff. Keep to these lines.
     v1: REVIEW is the terminal state. /spec-kit-review (TODO A.2) owns REVIEW→DONE when built —
     a cold agent at REVIEW should stop and wait, not treat it as a failure. -->
PAGE: planning
STAGE: BUILD (Cursor)
SPEC_VERSION: 2026-06-05.1
UPDATED: 2026-06-05 — /spec-kit (Gate-2 approved)
NEXT: open Cursor on designs/pages/planning/ → "read _cursor-prompt.md, execute" → build → bump STAGE to TEST
