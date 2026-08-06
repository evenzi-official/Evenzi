# Handoff — Event Settings Cleanup (Cursor build)

> **For the receiving editor (Cursor):** this is a self-contained brief. You do not have the chat history that produced it. Everything you need is here or in the two linked files. Read this top to bottom before writing any code.

| | |
|---|---|
| **Date** | 2026-08-06 |
| **Author** | Abhijith (+ Claude) |
| **Routing** | Cursor (auto mode, free NVIDIA NIM model) builds; Claude reviews each phase before it's considered done |
| **Spec** | [`docs/superpowers/specs/2026-08-06-event-settings-cleanup-design.md`](../../superpowers/specs/2026-08-06-event-settings-cleanup-design.md) |
| **Plan (authoritative, task-by-task)** | [`docs/superpowers/plans/2026-08-06-event-settings-cleanup.md`](../../superpowers/plans/2026-08-06-event-settings-cleanup.md) — **2,200 lines, 18 tasks, follow it exactly** |
| **Branch** | `Dev-Vibe` (create a feature branch off it; do not commit straight to `Dev-Vibe`) |
| **Supabase project** | `smjkbmkxweevqpvygabe` (ap-northeast-1) — migrations apply live via MCP, they are NOT file-based |

---

## 1. What this is

A cleanup + wiring pass across the 6 Event Settings tabs (`app/events/[id]/settings/**`), plus:
- a new shared full-page `BusyOverlay` component,
- two global fixes (ToolRail LIVE/OFFLINE status pill; Host Dashboard "Collaborations" tab),
- a new read-only per-event **Usage** tab,
- and the big one: a **tiered co-host permission system** (Part D of the plan) — new RLS predicate functions + a TypeScript access-check helper applied across ~37 API routes, giving the 4 collaborator roles (co-host / planner / photographer / viewer) real, enforced, tiered access instead of the current owner-only model.

The plan file breaks all of this into 18 numbered tasks across 5 parts (A–E), each with exact file paths, full code blocks, exact commands, and expected output. **Build strictly in numbered order** unless a task says otherwise — several later tasks depend on earlier ones by file-line position.

## 2. Already done this session — do NOT redo

Two **live IDOR security bugs** were found and fixed + committed already (commit `68e2f18`), and are referenced in spec §0. They are NOT part of the build:
- `app/api/events/[id]/guest-settings/route.ts` — added the missing `verifyOwnership()` check.
- `app/api/events/[id]/general-settings/route.ts` — same.

Note: Part D (Task 15) will later *replace* these `verifyOwnership()` calls with the new `requireEventWrite()` helper — that's expected, the plan says so.

## 3. Review status — READ THIS, it changes how much you can trust each part

The plan went through **two full 5-agent council reviews** (Tech Lead, Security Expert, Data Modeller, Backend Engineer, Frontend Engineer — Critique + Debate + Arbiter). Round 1 found 6 critical + 8 important defects; round 2 confirmed the round-1 fixes correct but found more residual gaps. **All findings from both rounds are fixed in the current plan** — see the plan's "Council Review" section at the bottom for the full disposition list, and the inline "council finding, fixed here" callouts at each fix point.

**One caveat you must respect:** during the round-2 fix pass, the author manually caught a real **ownership-theft hole** in their own first draft of the new `events` UPDATE RLS policy (an RLS `WITH CHECK` can't compare `NEW.user_id` to `OLD.user_id`, so it couldn't stop a co-host from `UPDATE events SET user_id = <self>`). It was closed with a guard trigger (`guard_events_collab_update()` / `trg_guard_events_collab_update`, in Task 13 Step 4). **That guard-trigger SQL and the round-2 net-new RLS material have NOT yet had an independent review** — a targeted security re-verification was queued and then deferred in favor of writing this handoff. **Before you apply Task 13's migrations to the live database, get a second set of eyes on the Task 13 Step 4 `events` policies + trigger specifically** (ask Abhijith to have Claude run the targeted security verification, or review it very carefully yourself against the four questions listed in §7 below). Everything else in Part D was twice-reviewed and is trustworthy.

## 4. Build order & the HARD GATE

Suggested phasing (each phase = its own review gate with Claude before moving on):

| Phase | Tasks | Notes |
|---|---|---|
| A — small fixes | 1–6 | Sequential (files overlap; later tasks assume earlier line-shifts). Low risk. |
| B — BusyOverlay | 7–9 | Task 7 builds the shared primitive (with a focus-trap — don't drop it); 8–9 wire it. Do NOT close the modals before the request resolves (the plan explains why — it's a withdrawn round-1 change). |
| C — ToolRail / Dashboard / invite-id | 10–12 | Task 10 must reuse the Website tab's existing `?? false` default, not invent a new one. |
| **D — permissions** | **13–17** | **The largest, riskiest block. See the HARD GATE below.** |
| E — Usage tab | 18 | **Blocked by Task 16** — do not start until 16 is done. Not parallel with Part D. |

**🔒 HARD GATE inside Part D (this is critical, not optional):** Task 13's migrations apply *live the instant they run* via the Supabase MCP `apply_migration` tool — there is no git/deploy step gating them. The moment Task 13 Steps 4–6 run the policy conversions, collaborator RLS write access is live in the database. Until Task 15's route-level `requireEventWrite()` checks are ALSO live, a collaborator can write via a direct Supabase REST call (publishable key + their own JWT) that never touches the Next.js app. Therefore:
- Task 13 Steps 1–3 (the two functions + the CHECK constraint + the index) grant nothing by themselves — safe to apply and commit independently.
- **Task 13 Steps 4–6 (the policy conversions) MUST NOT run until Task 15's route code is written, tested, and ready to apply back-to-back in the same working session.** Do not stop at a review gate or session break between Task 13 Step 4 and the end of Task 15. If you can't finish Steps 4–6 + all of Task 15 in one sitting, don't start Step 4.

## 5. Non-negotiable conventions (from CLAUDE.md)

- Every new/modified API route: `uuidSchema.safeParse` on the event id → auth check → ownership/capability check → zod body validation → typed `NextResponse` with `{ error, details? }` on failure. Match the existing routes exactly.
- No inline CSS/JS in `designs/**` — generic → `designs/shared/shell.css`, page-specific → the page's own `.css`. The React app imports `designs/shared/shell.css` via `app/globals.css:2`, which is why the settings tabs use `es-*` / `btn-pill` / `modal-scrim` classes.
- Every new shared UI primitive gets catalogued in `designs/components.html` in the same change (Task 7's `BusyOverlay` does this).
- `npm run test:run` and `npx tsc --noEmit` must stay clean after every task.
- Owner-only actions (Delete event, Plan & Billing writes) stay hardcoded to `events.user_id = auth.uid()` — never routed through the capability system.
- **DB + doc change together:** any migration in Part D updates `docs/data-model/DATA-MODEL.md` in the same task (the plan's Task 13/16 have explicit doc steps).

## 6. The permission model (so you understand what Part D is building)

Capability matrix (lives in two hand-maintained places that MUST stay in sync — `lib/auth/eventAccess.ts`'s `CAPABILITY_MATRIX` and the SQL predicates `can_read_event`/`can_write_event`; Task 14 adds a drift-guard test):

| Role | Write access | Read access |
|---|---|---|
| **owner** | everything (billing, delete, admins, website, guests, planning, media, general) | everything |
| **co-host** | everything EXCEPT billing + delete | everything except billing/delete |
| **planner** | guests + planning only | guests + planning only |
| **photographer** | media only | media only |
| **viewer** | nothing | everything (read-only) |

Enforced at TWO independent layers by design: the API route (`requireEventWrite(supabase, id, userId, capability)`) AND the database (RLS policies calling `can_write_event`/`can_read_event`). Both must agree.

## 7. If you review the net-new RLS yourself (§3 caveat)

For Task 13 Step 4's `events` policies + `guard_events_collab_update` trigger, answer these before applying the migration:
1. Can a co-host steal ownership (`UPDATE events SET user_id = self`) through any combination of the 3 policies + trigger? (The trigger's `(select auth.uid()) is distinct from old.user_id` condition is the guard — check it's not wrongly exempting a non-owner or wrongly blocking the owner.)
2. Can a co-host soft-delete (`SET deleted_at = now()`) via direct REST?
3. Does the owner retain full control (rename / delete / restore / transfer)?
4. Does the DELETE route's soft-delete still work? (It runs as the owner — only owners have `'delete'` capability — so the trigger's owner-exemption should let it through.)

## 8. Testing (required before each phase is "done")

- Part D is the highest-risk work in the whole pass. Every one of the ~37 routes in Task 16 gets the full 4-case test (owner succeeds / non-collaborator 404 / wrong-role 404 / right-role succeeds) — Task 16 Step 5 has a concrete `it()`-count check that enforces this; it is NOT optional or time-permitting.
- Live two-account verification per role (owner + each of the 4 collaborator roles) — Task 15 Step 5 and Task 16 Step 6 spell out exactly which role should succeed/fail on which tab. Use a `viewer` (not a `planner`) to demonstrate the read-visible/write-blocked split.
- All other tasks: live browser testing at the project's standard 6 breakpoints (360/390/414/768/1024/1440) before the whole-branch review, same as every prior feature pass.
- IDOR fixes (spec §0): a live two-account test (non-owner hits the PATCH routes with another event's id → 404; owner still succeeds) should be run during Part D's verification since it wasn't done live yet.

## 9. Definition of done

- [ ] Tasks 1–18 complete, each committed with the message in its Step-N commit block.
- [ ] `npx tsc --noEmit` + `npm run test:run` clean.
- [ ] Task 16's `it()`-count coverage check passes for every route.
- [ ] Live per-role verification done for all 4 collaborator roles + owner.
- [ ] Task 13 Step 4's `events` policies + trigger independently reviewed before the migration was applied (§3 caveat).
- [ ] `DATA-MODEL.md` updated for every Part D migration.
- [ ] `designs/components.html` updated for the new `BusyOverlay` primitive.
- [ ] Hand back to Claude for a whole-branch review before merging to `Dev-Vibe` / `Dev-Vibe-Testing`.

## 10. Explicitly out of scope (do not build)

- Guest-facing RSVP submission form (`app/e/[slug]`) — doesn't exist yet; Task 3 only hardens the backend route for when it does. It's its own future Digital Presence spec.
- Legal pages (`/legal/*`) — flagged, not built.
- Real payment / "Upgrade now" — blocked on LLP registration + GST + a current account.
- Registry real backend (link or cash fund) — Task 2 relabels the tab "coming soon" honestly; no persistence is built.
- Digital Invitations, Support Chatbot, the developer Admin Module — untouched.
- `event_invitation_cards`, `event_media_tags`, `event_media_tag_links` — deliberately left owner-only (no live route touches them; documented in Task 16 Step 8). Convert when those features get wired.
