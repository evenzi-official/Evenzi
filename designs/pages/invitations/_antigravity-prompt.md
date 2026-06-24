# Antigravity test runbook — Invitations · Card Designer (`invitations`)

You are testing the Evenzi **Invitations** card-designer page in `designs/pages/invitations/`. You start with no prior context.

## Read first
1. `_test.md` (this folder) — test source of truth. Run every row.
2. The built page via `npm run design` → http://localhost:4000/pages/invitations/invitations.html

## Notes for this page
- It's a card DESIGNER (gallery → editor), NOT a WhatsApp send hub. There is no per-guest send/status here (that's Guest Management).
- The card must stay **light-surfaced even in dark app mode** (`3.darkcard`) — toggle the theme and confirm the card does NOT invert.
- Export + WhatsApp share are **faked** but must behave **honestly**: Share = text + a card LINK, NEVER an implied image auto-attach (`4.share`/`4.honesty`).
- `1.resilience` + heading-font check: actively block network/third-party and hard-reload — layout holds AND headings render from LOCAL fonts (not a serif fallback). A clean load won't catch this.
- Photo: only JPG/PNG; a `.heic`/non-image must be rejected with an inline message (`3.photoreject`).
- Content-length: long + Devanagari couple names ON the card must wrap/clamp, not clip (`7.longnames`).

## Steps
1. Run Section 1 (Smoke) FIRST. If `1.smoke/1.styled/1.databody/1.chrome` fails, record + STOP (structurally broken).
2. Then work Sections 2–7 in order. Toggle gallery↔editor via "Use this card" / "Change template".
3. Manual rows (`7.device`, tagged "agent: skip + flag"): record `SKIP (human)`.
4. Record every row in `_findings.md` under a new `## <today> — Antigravity — against SPEC_VERSION 2026-06-12.2` heading: `| <row id> | PASS/FAIL/SKIP | note (repro for FAIL) |`.

## When done
Update `_status.md`: `STAGE: REVIEW`, `UPDATED: <today> — Antigravity`, `NEXT: /spec-kit-review invitations`.
