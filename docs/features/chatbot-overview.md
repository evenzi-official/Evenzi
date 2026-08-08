# Evenzi Help Centre — Team Overview

**Status:** Built on `feature/help-centre` (stages 1–8 merged; Stage 9 data-model docs). Content seed and launch gates still open.
**Owner:** Abhijith (product/spec), engineering on feature branch
**Spelling:** Help Centre (en-IN)
**Created:** 2026-04-14 (as Support Chatbot) · **Rewritten:** 2026-08-08 (Help Centre — no AI)

> Historical filename kept for link stability. Product name is **Help Centre**. Prior “chatbot” / LLM designs are superseded.

---

## 1. What it is in one line

A guided Help Centre: browse topics → read human-authored answers → search if needed → file a support ticket when nothing fits. **No generated answers, no conversational agent.**

## 2. Why we're building it

MVP will not staff live human chat. Hosts and visitors still hit real questions. The Help Centre is the first line:

1. **Answer common questions** from curated articles, 24/7
2. **Catch the rest** in a short ticket form so nothing falls through
3. **Save ops time** — only tickets that need a person reach the inbox

Goal (ops): deflect ≥70% of issues before email (measured via search logs + feedback + tickets — not an LLM session metric).

## 3. Who it serves

| Audience | Corpus | What they need | V0 |
|---|---|---|---|
| **Public visitors** | `audience = public` | What Evenzi is, pricing, privacy | ✅ |
| **Signed-in hosts** | `audience = app` | How to use the product | ✅ |
| **Guests** (invitees) | — | Event-specific info from invitation / website | ❌ Deferred |

Two corpora are separate articles, not one article with two visibility flags.

## 4. What it costs

**₹0 / month** for the product surface itself — Postgres full-text + trigram search, Next.js routes, no paid LLM keys.

Email escalation is best-effort via Resend when configured; unset `RESEND_API_KEY` still persists the ticket row (source of truth).

## 5. What users will experience

### In the app
- Help FAB / panel: guided category → questions, Frequent tab (`is_frequent`), search, ticket form when needed
- Product copy must not say chat, assistant, ask me, bot, or AI

### On `/help`
- Browse categories, open articles at `/help/a/{slug}`, search
- Same corpora rules as the panel (`public` vs `app` by session)

### When nothing helps
- Short ticket form (signed-in hosts)
- Confirmation with human-quotable reference `EVZ-XXXXX`
- Team replies by email

**Support address:** interim `evenzi.official@gmail.com` via `NEXT_PUBLIC_SUPPORT_EMAIL` (code fallback matches). At launch set `support@evenzii.com` in Vercel — no code change.

## 6. What we manage (ops / content)

V0 content lives in `config.faq_*` (migration / SQL seed) — **no admin UI yet**. Launch gate: ≥3 published articles per enabled category; empty categories ship `enabled = false`.

Ops process (articles, tickets, monthly review) stays in `docs/ops/support-best-practices.md` and `docs/ops/platform-policies.md`.

## 7. V0 scope

### ✅ In
- `/help` pages + in-app Help panel
- Lexical search (`config.search_faq`) + search logging (`help_queries`, 90-day retention)
- Article feedback + support tickets
- OverlaySurface + design-system primitives

### ❌ Out (Phase 2+ or separate)
- Generated / LLM answer tier (evidence gate on `help_queries` misses first)
- Admin FAQ / ticket console (launch needs Resend **or** a minimal read-only ticket list — not informal full Dashboard access)
- Guest-specific help, WhatsApp handoff, multilingual, live human chat UI

## 8. How it works (non-technical)

```
User opens Help
  → Browse category / Frequent, or search
  → Read published article (Markdown, server-sanitised)
  → Optional: Was this helpful?
  → Still stuck? File ticket → EVZ-XXXXX → email reply
```

Search ranks question title highest, then synonym tags, then answer body. Typos use word similarity (threshold 0.5).

## 9. Safety and reliability

- Published articles only at the RLS boundary; `audience` is curation, not secrecy
- Ticket / search / feedback writes via `service_role` API routes; never trust client `user_id` / `audience` / raw `context`
- Do not log ticket bodies or search query text in app logs
- Account deletion: tickets cascade; search queries null user + redact text; feedback nulls user, keeps vote

## 10. Status vs launch

| Item | State |
|---|---|
| Stages 1–8 (foundations → panel) | ✅ on `feature/help-centre` |
| Stage 9 (DATA-MODEL / ERD / naming) | This session |
| FAQ article content | Empty — critical path for Brindo / Sree |
| `support@evenzii.com` + ticket watching | Launch gate |
| Merge to `Dev-Vibe` | When feature is content-ready / founder call |

## 11. Key documents

| Document | Role |
|---|---|
| This overview | Shareable team reference |
| [`2026-08-07-help-centre-v0-design.md`](../superpowers/specs/2026-08-07-help-centre-v0-design.md) | **Source of truth** (schema, search, security, Phase 2 gate) |
| [`2026-08-07-help-centre-v0-ui-design.md`](../superpowers/specs/2026-08-07-help-centre-v0-ui-design.md) | UI states in words |
| [`2026-08-08-help-centre-v0.md`](../superpowers/plans/2026-08-08-help-centre-v0.md) | Implementation plan |
| [`help-centre-stages/CONTEXT.md`](../superpowers/plans/help-centre-stages/CONTEXT.md) | Session pickup |
| [`DATA-MODEL.md`](../data-model/DATA-MODEL.md) D60 | Live tables |

**Superseded (do not build from):** `2026-04-14-chatbot-design.md`, `2026-06-22-chatbot-model-hosting-analysis.md` (Phase 2 notes only).

## 12. FAQ

**Q: Is there an AI that writes answers?**  
A: No. Answers are written by the team. A future generated-answer tier is optional and gated on search-miss evidence.

**Q: How do we add an article in V0?**  
A: Insert/update rows in `config.faq_articles` (and categories if needed), `status = published`. Admin UI is later.

**Q: Can it answer something we never wrote?**  
A: No. Search only ranks existing published articles; otherwise the user files a ticket.

**Q: Interim vs launch email?**  
A: Interim `evenzi.official@gmail.com`. Launch `support@evenzii.com` via env — not `support@evenzi.com`.

---

## Contact

Questions: Abhijith. Current branch state: `docs/superpowers/plans/help-centre-stages/CONTEXT.md`.
