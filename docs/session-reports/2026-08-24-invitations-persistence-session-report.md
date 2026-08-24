# Session Report — Digital Invitations Persistence

> **Date:** 2026-08-24 · **Operator:** Abhijith · **Branch:** `feature/invitations-persistence` (from `Dev-Vibe`)
> **Goal:** Close the P3 gap where the invitation card designer's edits did not persist. Make the card survive reload/navigation with full fidelity.

---

## Outcome

**Digital Invitations card persistence is built and core-verified live.** A host's chosen template, seven text slots, per-line text sizes, and images now persist to the database and reload exactly as designed. The autosave indicator that was previously cosmetic is now real.

Delivered on `feature/invitations-persistence` (not yet merged at time of writing — see Remaining).

## What shipped

**Database (1 migration):** `inv_07_slot_sizes` — additive `slot_sizes jsonb NOT NULL DEFAULT '{}'` column on `public.event_invitation_cards`. No new table (the `inv_01`–`inv_06` schema already existed and every event already gets a seeded default card via `create_event_with_details`). `get_advisors` clean. Types updated surgically in `lib/supabase/database.types.ts`.

**API (3 routes, cloned from proven patterns):**
- `GET/PATCH /api/events/[id]/invitation-card` — reads/updates the default main-event card; owner-only; enforces the dual-mode invariant (template vs. uploaded card) server-side.
- `POST /api/events/[id]/invitation-card/upload-url` — presigned R2 PUT, cloned from `media/upload-url`.
- New `'invitations'` capability added to `lib/auth/eventAccess.ts` (owner-only, matching D57's deferral of collaborator access to cards).

**Client (`InvitationsClient.tsx` + `page.tsx`):**
- Server page fetches the saved card + template catalog, resolves template slug↔uuid, and passes a `savedCard` prop (with `share_token` deliberately omitted — no server→client leak).
- The editor hydrates from the saved card and **resumes into the editor when the card is personalized**, otherwise shows the gallery.
- Per-line text sizes were lifted out of DOM-only CSS classes into React state so they are saveable and restorable.
- Debounced autosave (`lib/invitations/useAutosaveCard.ts`) — a pure `createAutosaveController` state machine plus a thin `useSyncExternalStore` hook (this split avoids the repo's broken jsdom on Node 22 and satisfies the `react-hooks/refs` lint rule). Indicator shows `Saving… → Saved · HH:MM → Not saved — retry`.
- Images (photo-layout background + upload-your-own-card) upload to the **public** R2 bucket and render back through the existing `media/[...key]` proxy — no new read route, no signing (plan-review fix A).

**Design/plan/review artifacts:**
- Spec: `docs/superpowers/specs/2026-08-23-digital-invitations-persistence-design.md`
- Plan: `docs/superpowers/plans/2026-08-23-digital-invitations-persistence.md` (reviewed via `/plan-review`; one important finding — image read-path bucket mismatch — resolved with fix A before build).

## Execution model

Subagent-driven development: 8 implementation tasks dispatched one at a time (cheap model for mechanical transcription tasks, standard model for the integration tasks), each diff controller-reviewed before the next. The migration (teaching-mode) and the click-through were run in-session. Ledger at `.superpowers/sdd/2026-08-23-digital-invitations-persistence/progress.md`.

## The bug the click-through caught (P0)

Static review and a green type-check both passed, but the live click-through found **saving was completely broken** — every PATCH returned 400.

Root cause: `slot_sizes` was validated with `z.record(z.enum(SLOT_KEYS), slotSize)`. **In Zod v4 an enum-keyed `z.record` is exhaustive** — it demands all seven slot keys, so any partial map (a single size-bump) or the empty `{}` sent on template reset was rejected outright. A second, quieter defect compounded it: the autosave hook injected empty `slots`/`slot_sizes` objects into every save payload, and because the PATCH does a full-column replace, a text-only edit would have wiped previously-saved sizes.

Fixes (commit `568cbad4`):
1. `z.partialRecord(z.enum(SLOT_KEYS), slotSize)` — accepts partial/empty maps, still validates keys and values. Regression tests added.
2. Autosave hook now merges only the fields actually provided.
3. Template swap now persists its reset (default text + cleared sizes), so a reload reopens the swapped template rather than the previous card's content.

This is a concrete example of why live click-through matters even when types and unit tests are green — the failure lived entirely in a runtime validation boundary.

## Verification

- `tsc --noEmit` clean. Full Vitest suite: 281 pass, 1 pre-existing unrelated failure (`__tests__/api/events/route.test.ts`, confirmed failing identically on the merge-base).
- Live click-through (founder session, dev, event `f990d6d7…`), all PATCH 200 after the fix:
  - **Scenario 1 PASS** — edit couple text to `PERSIST_OK_999` + bump to Large → reload → editor reopens with identical text and size (the exact scenario that failed at session start).
  - **Scenario 2 PASS** — swap template Eternal→Saffron → text/size reset → reload → Saffron persists.
  - **Scenario 5 PASS** — pristine event still lands on the gallery.

## Remaining / follow-ups

1. **Photo-BG and upload-own-card image persistence (scenarios 3/4) not live-clicked** — the automated browser cannot drive the OS file-picker dialog (same limitation class as OTP). Code path was reviewed and is sound (optimistic preview → presigned PUT → save key → proxy render). Needs a manual founder click-through.
2. **Final whole-branch review** not run as a separate pass — each task diff and the fix were controller-reviewed and live-verified instead, to conserve the usage window.
3. **Merge `feature/invitations-persistence` → `Dev-Vibe`** (and onward to `Dev-Vibe-Testing` for the preview/prod deploy) pending.
4. v0-readiness artifact row not yet updated (CLAUDE.md row was updated).

## Out of scope (unchanged from spec)

Sub-event invitation cards, server-side card render to PNG/PDF (`Download soon` stays disabled), WhatsApp send (lives in Guest Management), collaborator write access to cards.
