# W3 — Headed Chrome deep click (2026-08-07)

| | |
|---|---|
| **Branch** | `feature/platform-truth-audit` |
| **Base** | `http://127.0.0.1:3002` |
| **Spec** | `tests/platform-truth/w3-chrome-deep-click.spec.ts` |
| **Mode** | Headed Chrome (`HEADED=1`, slowMo ~50–60ms) |

## Results

| Suite | Result |
|-------|--------|
| Host surfaces (filters, hub QA, guests modal, planning tabs+FAB, media tabs, website nav, journey, invitations, all settings tabs, bell, user settings) | **PASS** (45 steps) |
| Collab (invite UI → bell → Accept → hub + surfaces → viewer write 404 → Decline) | **PASS** (12 steps; settings/billing needed retry after initial HMR 500) |

Screenshots: `docs/testing/audit-2026-08-07/chrome-shots/`

## Notes

- Public `/e/{slug}` skipped — no `/e/` link on website overview for this fixture.
- First collab attempt hit Next webpack `useContext` null / 500 on settings+billing; retry + billing empty-plan guard fixed the re-run.
- Not covered: every form save, file upload bytes, all 4 roles deep click (viewer Accept/Decline covered here; full role matrix remains in `w3-full-clickthrough.spec.ts`).
