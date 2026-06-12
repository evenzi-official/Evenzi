<!-- Build-kit baton. STAGE advances: SPEC → BUILD → TEST → REVIEW → DONE.
     /spec-kit writes SPEC then bumps to BUILD on Gate-2 approval; Cursor bumps BUILD→TEST;
     Antigravity bumps TEST→REVIEW; /spec-kit-review owns REVIEW→DONE. Keep to these lines. -->
PAGE: invitations
STAGE: TEST (Antigravity)
SPEC_VERSION: 2026-06-12.2
UPDATED: 2026-06-12 — Claude (built inline as a PERSONALIZER + upload-first + front-only; verified via Playwright; _spec/_test aligned to as-built. Cursor skipped.)
NEXT: Antigravity → read _antigravity-prompt.md → run _test.md (SPEC_VERSION 2026-06-12.2) → /spec-kit-review invitations
