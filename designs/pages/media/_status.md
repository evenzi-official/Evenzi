<!-- Build-kit baton. STAGE advances: SPEC → BUILD → TEST → REVIEW → DONE.
     Who sets each: /spec-kit writes SPEC then bumps to BUILD on Gate-2 approval;
     Cursor bumps BUILD→TEST when it finishes building; Antigravity bumps TEST→REVIEW.
     Each tool rewrites STAGE/UPDATED/NEXT on handoff. Keep to these lines.
     v1: REVIEW is the terminal state. /spec-kit-review (TODO A.2) owns REVIEW→DONE when built —
     a cold agent at REVIEW should stop and wait, not treat it as a failure. -->
PAGE: media
STAGE: BUILD (Cursor — R-final)
SPEC_VERSION: 2026-06-12.1
UPDATED: 2026-06-12 — Claude (post-review changes: tabs + alignment applied & verified; consolidated all open items into _cursor-final.md)
NEXT: Cursor → read _cursor-final.md (supersedes _cursor-prompt.md + _cursor-followup.md) → apply font-vendoring + 44px seg + own the tab structure → bump to TEST for Antigravity
