# Help Centre V0 — staged handoff

The [implementation plan](../2026-08-08-help-centre-v0.md) is 14 tasks. This splits them into nine stages sized so each fits one compact Cursor session without the context running thin.

**Read the plan for the actual code.** These stage files are routing and handoff wrappers — they say who builds what, in what order, against which dependencies, and what "done" means. The task bodies in the plan carry the real test code and implementation code.

## Stage map

| Stage | Plan tasks | Owner | Depends on | Size |
|---|---|---|---|---|
| [1 — Foundations A](stage-1-foundations-a.md) | 1, 2 | Cursor | nothing | small |
| [2 — Foundations B](stage-2-foundations-b.md) | 3, 4 | Cursor | nothing | medium |
| 3 — Database | 5, 6, and the SQL half of 7 | **Claude** | nothing | medium |
| 4 — Search library | TS half of 7, and 8 | Cursor | stage 3 | small |
| 5 — API routes | 9, 10 | Cursor | stages 3, 4 | medium |
| 6 — Markdown and CSP | 11 | Cursor | nothing | small |
| 7 — `/help` pages | 12 | Cursor | stages 2, 5, 6 | large |
| 8 — Help panel | 13 | Cursor | stages 2, 5, 6 | large |
| 9 — Documentation | 14 | **Claude** | stage 3 | medium |

## Why stages 3 and 9 are not Cursor's

**Stage 3 is database work.** Every migration in this project is followed immediately by `get_advisors`, because that is the only check that observes actually-granted privileges rather than the SQL that intended to set them. Decisions D50 and D51 both record gaps that survived multiple rounds of human and agent review and were caught only by running that check. The migration also needs live verification of three things that were already proven wrong once on paper — the generated column's immutability, the negation behaviour of the search query, and the trigram threshold. That verification loop belongs where the Supabase connection and the prior session's evidence already are.

**Stage 9 is the data-model documentation obligation.** The standing rule is that the database, `DATA-MODEL.md` and `ERD.md` change together in one pull request, and the decision-log entry has to record *why* each choice was made. That reasoning lives in the spec and the council trail, not in the diff.

## Parallelism

Stages 1, 2, 3 and 6 have no dependencies on each other and can run at the same time in different sessions.

Stages 7 and 8 both depend on 2, 5 and 6, but not on each other — they can run in parallel once those land.

**Start stages 1 and 3 immediately.** Stage 1 repairs two defects that are live in production right now and have nothing to do with this feature. Stage 3 unblocks four other stages.

## Standing rules for every stage

Give these to Cursor in every session — they are not repeated in each stage file.

- Read `CLAUDE.md` first, especially Coding Conventions and the Component Reuse rule.
- Branch from `Dev-Vibe`. Never commit to `main`.
- No copy anywhere may contain "chat", "assistant", "ask me", "bot", or "AI". V0 contains no AI; every answer is staff-authored text from the database.
- Spelling is **"Help Centre"** (en-IN), everywhere.
- TypeScript strict. No `any`. Explicit return types on exported functions.
- Tests go in `__tests__/`, mirroring the source path. Run `npm run test:run`.
- Reuse before create. Cite the `shell.css` primitive being reused. Any new shared primitive must be added to `designs/components.html` in the same change.
- Never accept `user_id` or `audience` from a request body — always derive them server-side.
- Never log ticket message bodies or search query text to the application log.
- Finish with `npx tsc --noEmit && npm run lint && npm run test:run` clean.

## Review gate

Every stage comes back to Claude for review before it is considered done, per the delegation gate in `CLAUDE.md`. Cursor builds; Claude reviews. Push the branch and say which stage is ready.
