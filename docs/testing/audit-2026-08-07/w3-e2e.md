# W3 — Playwright E2E (full UI click-through)

| | |
|---|---|
| **Date** | 2026-08-07 |
| **Fixture** | Account A phone OTP · Account B `e2e.collab.b@evenzi.test` · event `e2e-truth-audit` (`f990d6d7-…`) |
| **Spec** | `tests/platform-truth/w3-full-clickthrough.spec.ts` |
| **Base** | worktree Next on `:3002` (`feature/platform-truth-audit`) |
| **Raw** | `w3-full-clickthrough.json`, `w3-full-clickthrough.run.log` |
| **Prior thin smoke** | `collab-matrix.spec.ts` (API+load only) — superseded for “done” claims |

## Results (2026-08-07 re-run)

| Test | Result |
|------|--------|
| Host click-through (hub QA tiles + media/website/journey/settings/admins/billing/user settings) | **PASS** |
| Collab × 4 roles — Admins UI invite → Collaborations **Accept** click → hub as collab → forbidden write probes | **PASS** |
| Decline — Collaborations **Decline** + confirm dialog | **PASS** |

**3 passed** in ~2.7m.

## What this asserts (honest scope)

- Host: real clicks on Quick actions + visits interactive chrome on key surfaces (not pixel/visual QA).
- Collab: invite via **Add co-host** modal; Accept/Decline via **Collaborations** pending cards (not API-only).
- Forbidden writes after Accept (session cookies): `POST guests` / `media/upload-url` / `admins` expect **404** when role lacks capability; allowed roles must **not** get 401/403/404.

## Capability matrix checked

| Role | guests write | media write | admins write |
|------|--------------|-------------|--------------|
| co-host | allowed | allowed | allowed |
| planner | allowed | forbidden | forbidden |
| photographer | forbidden | allowed | forbidden |
| viewer | forbidden | forbidden | forbidden |

## Not covered (still open)

- Bell Accept path (Collaborations Accept covered; bell is parallel UI)
- Every secondary CTA / form save / upload bytes / public guest site walkthrough
- Pixel screenshots / mobile breakpoints (Antigravity)
- Prod `evenzi.vercel.app`

## Note

Fixtures **kept**. Collab rows for Account B cleared between roles; decline leaves no active B collab.
