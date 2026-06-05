<!-- Build-kit baton. STAGE advances: SPEC → BUILD → TEST → REVIEW → DONE.
     Who sets each: /spec-kit writes SPEC then bumps to BUILD on Gate-2 approval;
     Cursor bumps BUILD→TEST when it finishes building; Antigravity bumps TEST→REVIEW.
     Each tool rewrites STAGE/UPDATED/NEXT on handoff. Keep to these lines.
     v1: REVIEW is the terminal state. /spec-kit-review (TODO A.2) owns REVIEW→DONE when built —
     a cold agent at REVIEW should stop and wait, not treat it as a failure. -->
PAGE: {{PAGE_SLUG}}
STAGE: SPEC
SPEC_VERSION: {{SPEC_VERSION}}
UPDATED: {{DATE}} — /spec-kit
NEXT: review the kit, then bump STAGE to BUILD (open Cursor → read _cursor-prompt.md → execute)
