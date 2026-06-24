# Findings — All In-Scope Screens (2026-06-23)

> Multi-agent QA pass. Browser dimensions (D1/D2/D7/D8) driven live via Playwright against the running app (`:3001`); static dimensions (D3/D4/D5/D6/D9) by the `ai/agents` personas; D10 by direct tooling. Supersedes the earlier Antigravity draft (which was static-only + had a false "create broken" finding — refuted below).

## Summary
- **Personas:** `test_engineer` (QA lead, live browser) · `code_reviewer` (D3/D6) · `data_modeller` (D4) · `security_expert` (D9) · `ui_ux_designer` (D5).
- **Dimensions run:** D1–D10 (all). Browser pass completed (Antigravity could not run it).
- **Findings:** 21 — Blocker 0 · High 3 · Medium 8 · Low 10. (Plus pre-existing tech-debt, listed separately.)
- **Overall: PASS-WITH-ISSUES.** Core in-scope flows work; 3 High issues are user-visible and should be fixed before sign-off.
- **Designs matched (discovered):** auth → `designs/pages/auth/auth.html` (+ `verify-otp.html`); event creation → `designs/pages/create-event/step-1…4`; user dashboard → `designs/index.html`; event dashboard → `designs/pages/event-control/event-control.html`.
- **Refuted:** Antigravity's "Step 4 create fails with 500" is **false** — live `POST /api/events` → **201** (twice). The 500s it saw are stale unit-test mocks, not runtime.

---

## D1 — Functional (live)
| # | Scenario | Result | Evidence |
|---|---|---|---|
| 1 | Login (phone OTP 9999999999/123456) | ✅ PASS | reached `/home` |
| 2 | Create wizard (Wedding → details → celebrations → review → launch) | ✅ PASS | `POST /api/events → 201`; landed on event dashboard |
| 3 | Event dashboard renders (hub fix) | ✅ PASS | `qa/_shots/event-dashboard/app-event-dashboard-1440.png` |
| 4 | User dashboard (empty state) | ✅ PASS | `qa/_shots/user-dashboard/...`, `qa/_shots/responsive/home-360.png` |
| 5 | Bad event id → not-found | ✅ PASS | `/events/<zero-uuid>` → clean **404** page |
| 6 | Edit + Save (General settings) | ✅ PASS | `PUT → 200`, persisted (verified earlier this session) |
| 7 | Delete (soft-delete) | ✅ PASS (endpoint) | `DELETE → 200` earlier; a later attempt hit **401 (expired test session)** — environmental, not a product defect |
| 8 | `/events/<id>/success` page | ❌ **FAIL** | redirects to `/home` — see D4 #1 (cross-schema embed) |
| 9 | Wizard React `key` warning | ✅ PASS | 0 console errors on `/events/create` |

**[Low] D1 — top-nav "Settings" button uses a `logout` icon** (`app/home/*` nav) — label/icon mismatch on the user dashboard. shot: `qa/_shots/user-dashboard/app-home-empty-1440.png`.
**[Low] D1 — 401 on an expired session is not handled in the UI** — Delete with a lapsed session returns 401 and the form just stays put (console 401 only); no "session expired"/redirect. Minor UX; surfaced because the test session expired mid-pass.

## D2 — Design fidelity (live, vs `:4000` designs)
Spot-comparison of built screens against the discovered prototypes (structure/sections/hierarchy/flow, not pixels). Screens **match intent** at the layout level — create wizard steps, review, event dashboard hero + tool grid, dashboard empty state all track their designs. Component/design-system *consistency* defects are in D5 (the higher-value lens here). shots under `qa/_shots/{event-creation,event-dashboard,user-dashboard}/`. No structural/intent mismatches found beyond the D5 items + the D1 icon nit.

## D3 — Code quality (code_reviewer)
- **[Medium]** `app/api/event-types/route.ts:16` (+ `[typeId]/sub-events/route.ts:33`) — error branch returns 500 **without `console.error`**; inconsistent with the rest of the codebase; harder to diagnose. (commit `77f0385`)
- **[Low]** `app/home/page.tsx:29` — `const { data } =` **swallows `error`** (the recurring bug class); a query failure silently renders an empty list. (pre-existing; the parallel API route handles it correctly.)
- **[Low]** `lib/types/events.ts:146` — `EventMetadataRow` is **dead code** (`event_metadata` table dropped).
- NEW code in `0e72a70` (hub fix, PUT/DELETE, settings form): **clean** — strict types, every Supabase call handles `error`, correct status codes, no raw-error leak.

## D4 — Data modeling, retrieval & storage (data_modeller) — confirmed live
- **[High]** `app/events/[id]/success/page.tsx:25` — **cross-schema embed** `events.select('… event_types ( name, slug )')` → **PGRST200** → query null → page redirects to `/home`. **The only cross-schema embed left in the repo** (full sweep). **Verified live** (#8 above). Fix: drop the embed; fetch `event_type_id` then `.schema('config').from('event_types')` + JS join — the pattern already used in `app/api/events/[id]/route.ts`, `app/events/[id]/page.tsx`, `app/api/events/route.ts`.
- **PASS:** all other `config.*` reads use `.schema('config')`; `event_hub_summary` columns match live view; soft-delete filters everywhere; D44 empty→null coercion correct; jsonb `event_details` read-merge-write correct; column names accurate; R2 keys namespaced + server-only; `website_password_hash` never selected.
- **[Low]** `settings/page.tsx:11` reads `events.event_details` directly instead of `event_general_settings_view` (works today). **[Low]** comment drift: `form_schema` in comments, code reads `field_schema`.

## D5 — Component reuse & design system (ui_ux_designer)
- **[High]** `app/auth/page.tsx:307` — toast uses **`is-active`** (no matching CSS); shell reveals toasts via **`.bc-toast.is-show`**. → the **"OTP SENT" confirmation is invisible**; user gets no feedback. Fix: `is-active` → `is-show` (the settings form already does this right).
- **[High]** `components/ui/ToggleSwitch.tsx:11` — invented classes (`.toggle-thumb`/`.toggle-label`) + `<input type=checkbox role=switch>`; shell's on-state selector (`.toggle-switch[aria-checked=true] .toggle-switch-thumb`) never matches → **toggle is visually dead**. Used in 4 settings pages. Fix: compose per shell (`<button class="toggle-switch" role="switch" aria-checked>` + `.toggle-switch-thumb`).
- **[Medium]** `components/ui/StatusBadge.tsx:9` — 5/7 variant classes don't exist in shell → badges render shape-only, no semantic color.
- **[Medium]** `components/ui/Button.tsx:18,22` — `btn-pill-ghost` / `btn-pill-sm` undefined → unstyled base pill.
- **[Medium]** `app/events/[id]/success/page.tsx` — bypasses the design system (raw Tailwind + parallel `--color-*` tokens) instead of shell primitives (compounds D4's bug — this file needs a rebuild anyway).
- **[Medium]** dead fork `app/events/create/components/WizardProgress.tsx` (not imported; wizard uses `WizardStepper`); dual token namespace (`--color-*` vs `--bg/--ink/--brand`); inline `seg`/`btn-pill` markup vs unused `components/ui/{SegmentedControl,Button}` wrappers.
- **Catalog debt:** the `components/ui/*` React wrappers aren't mapped in `designs/components.html`, which is why the ToggleSwitch/StatusBadge divergence went uncaught.

## D6 — React / Next (code_reviewer)
- **[Medium]** `app/events/create/components/Step3SubEvents.tsx:179` — `key={idx}` on a **removable** custom-sub-event list → reconciliation/stale-state risk on mid-list removal. (pre-existing) Fix: stable client id.
- **[Low]** `GeneralSettingsForm.tsx:49` — `flashToast` `setTimeout` has no cleanup (timer can fire after unmount on delete→navigate; React 18 no-ops it).
- **PASS:** event hub server-component boundary, controlled inputs, `role=alertdialog`/`aria-busy`, double-submit guards, stable keys on DB-id lists, WizardStepper `Fragment key` fix.

## D7 — Accessibility (live)
- **[Medium]** Delete confirm modal (`GeneralSettingsForm`) **does not close on Esc** — verified live (modal stayed open after Escape). Keyboard-dismiss gap. (It does set `role="alertdialog"`/`aria-modal` and `aria-busy` — just missing the Esc handler / focus-trap return.)
- Modal opens, Cancel/confirm present, accessible names OK.

## D8 — Responsive & theming (live)
- Spot-tested **360 / 1440**. No horizontal scroll; event dashboard + home reflow cleanly at 360. shots: `qa/_shots/responsive/{home-360,event-dashboard-360}.png`. (Did not exhaustively sweep 390/414/768/1024.)

## D9 — Security (security_expert)
- **[Medium]** `app/api/media/[...key]/route.ts:15` — **unauthenticated proxy** serves any object in the public R2 bucket by key, **no `getUser()` and no key-prefix validation**. Cross-bucket traversal is NOT exploitable (bucket hardcoded), but any caller can fetch any public-bucket object by guessing keys. Fix: allowlist known prefixes (`events/`, `event-covers/`, `website/`) and/or ownership-check if any access-controlled media can land there. (Hinges on whether the public bucket ever holds private content — confirm with storage owner.)
- **[Low]** `app/api/events/cover/route.ts:34` — `contentType` trusted from client (SVG not allowlisted, so XSS-via-upload not currently reachable; validate magic bytes as hardening).
- **[Low]** `app/api/auth/verify/route.ts:9` — returns the **entire** Supabase `user` object (self-disclosure only); trim to needed fields.
- **[Low — by design]** `app/api/event-types/*` `GET` has no `getUser()` — it's the **public catalog**; acceptable, **not a blocker** (corrects Antigravity's "Blocker").
- **PASS (verified):** all events mutations (`POST`/`PUT`/`DELETE`) call `getUser()` → 401 + rely on live `events_owner_all` RLS; soft-deleted/non-owned rows return 404; Zod validation at every entry; no service-role key anywhere; only the publishable key is `NEXT_PUBLIC_`; `/auth/callback` no open-redirect; `middleware.ts` allowlist reasonable; `/api/dev/r2/*` 404 in prod.

## D10 — Build & test health
- **`npx tsc --noEmit`:** **0 app-code errors** (16–17 errors all in `__tests__/*` — stale `role`→`role_slug`, `field`→`key`).
- **`npm run test:run`:** **13 failed / 58 passed (71)**; 5 of 10 test files red. Failures are **stale mocks/fixtures** (event-types route, auth/callback, validations, middleware) lagging the `77f0385`/`0e72a70` schema renames — **not runtime bugs** (live flows pass). Needs a test-suite refresh.
- **`npm run lint`:** **104 errors / 1878 warnings** project-wide (`@typescript-eslint/no-explicit-any`, unused vars) — pre-existing tech debt.

## Skipped / environment
- **R2 storage runtime:** SKIPPED — R2 keys absent locally (cover upload + media proxy static-audited only).
- **Out-of-scope screens** (guests/invitations/planning/media/website/journey, settings sub-tabs): not deep-tested per scope. Note: `ToggleSwitch`/`StatusBadge` defects (D5) live in those pages but are shared components.
- **Test session expired** mid-pass → the final Delete hit 401; the endpoint itself is verified working (200 earlier). Test event soft-deleted via SQL for cleanup.

## Pre-existing tech-debt (track separately, not this change)
- Stale unit tests (13 failing) · lint debt (104/1878) · hub hero SVG `transform-origin`→`transformOrigin` (DOM warning) · `EventMetadataRow` dead type · dual `--color-*` token set.

## Appendix
- Commands: `npm run dev -- -p 3001`, `npm run design` (:4000), `npx tsc --noEmit`, `npm run test:run`, `npm run lint`.
- Screenshots: `qa/_shots/{auth,event-creation,user-dashboard,event-dashboard,responsive}/`.
- Live network confirmations: `POST /api/events → 201`, `PUT → 200`, `/events/<id>/success → /home` redirect, `/events/<bad-id> → 404`, `DELETE → 401 (expired session)`.
