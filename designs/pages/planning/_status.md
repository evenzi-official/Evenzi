<!-- Build-kit baton. STAGE advances: SPEC → BUILD → TEST → REVIEW → DONE.
     Who sets each: /spec-kit writes SPEC then bumps to BUILD on Gate-2 approval;
     Cursor bumps BUILD→TEST when it finishes building; Antigravity bumps TEST→REVIEW.
     Each tool rewrites STAGE/UPDATED/NEXT on handoff. Keep to these lines.
     v1: REVIEW is the terminal state. /spec-kit-review (TODO A.2) owns REVIEW→DONE when built —
     a cold agent at REVIEW should stop and wait, not treat it as a failure. -->
PAGE: planning
STAGE: DONE
SPEC_VERSION: 2026-06-05.2
UPDATED: 2026-06-05 — /spec-kit-review (fixes applied + verified)
NEXT: none — page complete. (Manual residual: on-device crore-scale ₹ fit at 360px, _test.md 7.device.)
