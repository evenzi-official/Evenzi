<!-- Build-kit baton. STAGE advances: SPEC → BUILD → TEST → REVIEW → DONE.
     Who sets each: /spec-kit writes SPEC then bumps to BUILD on Gate-2 approval;
     Cursor bumps BUILD→TEST when it finishes building; Antigravity bumps TEST→REVIEW.
     Each tool rewrites STAGE/UPDATED/NEXT on handoff. Keep to these lines.
     v1: REVIEW is the terminal state. /spec-kit-review (TODO A.2) owns REVIEW→DONE when built —
     a cold agent at REVIEW should stop and wait, not treat it as a failure. -->
PAGE: planning
STAGE: DONE
SPEC_VERSION: 2026-06-06.1
UPDATED: 2026-06-06 — /spec-kit-review (close-out, loop 2: all 9 fixes verified + #5 resolved)
NEXT: none — page complete. (Manual residual: 7.device — on-device crore-scale ₹ at 360px, partially covered by founder phone pass.)
