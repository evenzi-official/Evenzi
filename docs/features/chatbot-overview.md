# Evenzi Support Chatbot — Team Overview

**Status:** Planned — awaiting Figma designs
**Owner:** Abhijith (product/spec), Dheeraj (engineering)
**Target release:** MVP Phase 1
**Monthly cost:** ₹0 (zero paid API keys)
**Created:** 2026-04-14

---

## 1. What it is in one line

A smart FAQ bot that lives as a floating chat bubble on the Evenzi site and a dedicated `/help` page — it answers user questions in plain English, and when it can't, it opens a support ticket that lands in our inbox.

## 2. Why we're building it

Evenzi's MVP will not have live human customer support. Real users will hit real questions ("how do I change the event date?", "can I invite more guests later?", "I forgot my password"). Without a first line of defense, those questions turn into emails, WhatsApp messages, and frustration.

The chatbot is that first line. Its job is to:

1. **Answer the easy questions** instantly, 24/7 — so users stay unblocked
2. **Catch the hard ones** in a clean support-ticket form, so nothing falls through cracks
3. **Save management time** — only tickets that actually need human judgment reach the team

Goal: deflect ≥70% of questions before they become support work.

## 3. Who it serves

| Audience | What they'll ask | Served in MVP? |
|---|---|---|
| **Public visitors** (browsing evenzi.com) | "What is Evenzi? Is it free? Can I use it for birthdays?" | ✅ Yes |
| **Hosts** (logged in, planning an event) | "How do I invite guests? Can I change date? How do I add a Sangeet?" | ✅ Yes |
| **Admins** (us) | Uses the same bot; also manages its FAQ content | ✅ Yes |
| **Guests** (receiving invitations) | "When/where is the event? Dress code?" | ❌ Deferred to Phase 2 — guests get info from the invitation itself |

## 4. What it costs

**₹0 / month** at MVP scale.

- Uses Google Gemini's free tier (generous limits) as the primary AI brain
- Falls back to Groq's free tier when Gemini is busy
- When both are exhausted, falls back to a simple keyword search over our FAQ
- No OpenAI, no Anthropic, no paid keys anywhere

At up to ~500 daily users asking 3 questions each, we never pay a rupee. Beyond that, the bot quietly downgrades to "search mode" — users still get answers, just not conversational ones.

## 5. What users will experience

### On every page
- A small chat bubble in the bottom-right corner
- Click → opens a chat panel with suggested questions
- Ask a question → bot answers in 2-4 sentences with a "source" citation
- If the answer isn't quite right → thumbs up/down + "create a ticket" button always visible

### On `/help` page
- Browse FAQ articles by category (Getting Started, Creating Events, Account, Billing, etc.)
- Search across all articles
- Or just chat with the bot full-screen

### When the bot can't help
- "Sorry, I don't have an answer for that. Want me to create a support ticket? Our team will reply by email within 24 hours."
- User fills a short form (pre-filled from the conversation)
- Email lands in `support@evenzi.com` with the full transcript attached
- No user is ever stuck at a dead-end

## 6. What we (as admins) will be able to do

A simple admin interface at `/admin/faq` lets us:

- **Add / edit / delete FAQ articles** without needing a developer
- **Organize articles by category** (Getting Started, Events, Account, etc.)
- **Publish or keep as drafts** — work on answers before going live
- **See usage stats** — view counts, helpful votes per article
- **Review support tickets** at `/admin/tickets` — read the full conversation leading up to each escalation

Everything is editable from the browser. No code deployments needed to update FAQs.

## 7. MVP scope — what's in vs what's out

### ✅ In for MVP Phase 1

- Floating chat widget on most pages (hidden on `/auth` and event wizard to avoid distraction)
- `/help` page with FAQ categories + search + chat
- `/admin/faq/*` admin interface for managing content
- `/admin/tickets` view of escalated support tickets
- Email escalation to `support@evenzi.com` via Resend
- ~25 seed FAQ articles covering all MVP features
- Rate limiting + abuse protection
- Graceful degradation when AI providers are unavailable

### ❌ Out of scope (planned for Phase 2+)

- **Admin analytics bot** — "Hey bot, how many users signed up this week?" Needs its own spec, different architecture. Deferred.
- **Guest-side bot** — bot that knows guest-specific event details. Waits on Guest Management feature.
- **WhatsApp support handoff** — waits on WhatsApp Invitations feature.
- **Multilingual** — English only for MVP.
- **Live human chat** — if/when team grows.
- **Voice, rich text editor, A/B tests, version history UI** — all nice-to-have, all deferred.

## 8. How it works (non-technical overview)

```
User asks a question
    ↓
Bot checks: "Have I answered this exact question in the last 24 hours?"
    → Yes: returns saved answer instantly (costs nothing)
    → No: continue...
    ↓
Bot searches our FAQ database for the most relevant articles
    ↓
Bot reads those articles and writes a concise answer
    ↓
Response streams to the user with a citation
    ↓
User can give 👍 or 👎 feedback, or create a ticket if unhappy
```

If the AI is unavailable, the bot falls back to a simple keyword search — shows the 3 closest FAQs instead of a written answer.

## 9. Safety and reliability

Built-in protections:

- **Rate limiting** — 20 messages per user per day, 30 per IP per hour. Prevents abuse and cost blowup.
- **Kill switch** — one env variable flips the bot off site-wide if something goes wrong.
- **Admin-only routes** — the FAQ management interface is gated by admin role; non-admins can't see or edit.
- **Spam protection** on the ticket form (honeypot field, rate limits, entropy check).
- **XSS / injection hardening** — user input is isolated from the AI's instructions; admin-authored content is sanitized before rendering.
- **Escalation always works** — if AI fails entirely, users can always fill the ticket form.

Every piece was reviewed by simulated specialists (security, data modeling, frontend, backend, QA, tech lead) before being finalized.

## 10. Timeline

| Phase | What happens | Status |
|---|---|---|
| **Phase 0** | Design + plan + review + ClickUp tasks | ✅ DONE (2026-04-14) |
| **Phase 1a** | Backend implementation starts | ⏸ Ready anytime — no Figma needed |
| **Phase 1b** | UI implementation | 🔒 Blocked on Figma designs |
| **Phase 2** | Dogfood + seed FAQ content + iterate | Pending Phase 1 |
| **Phase 3** | Launch with MVP Phase 1 | Pending Phase 2 |
| **Phase 4** | Post-launch — convert ticket patterns into new FAQs | Ongoing |

### What needs to happen before the team starts building

1. **Figma:** Designs finalized for:
   - Chat widget (12 states: collapsed, streaming, answered with feedback, rate-limited, degraded, offline, escalating, etc.)
   - `/help` page layout (desktop + mobile)
   - Admin FAQ screens (list, editor with markdown preview, category manager)
   - Admin tickets screen + transcript modal
2. **Resend domain** verified for production sender
3. **Support email inbox** provisioned (e.g. `support@evenzi.com`)
4. **Supabase service role key** added to environment variables

Backend work (database schema, API routes, RAG pipeline, admin APIs) can start **in parallel with design** — it doesn't depend on Figma.

## 11. Who's involved

| Role | Person | What they own |
|---|---|---|
| **Product owner** | Abhijith | Scope, content review, approvals at every phase gate |
| **Design** | (to be assigned) | Figma designs for all 5 UI areas |
| **Engineering** | Dheeraj | Frontend + backend implementation |
| **Implementation support** | Claude Code | Backend libraries, tests, admin APIs (parallel execution) |
| **Content** | Abhijith + team | Review the 25 seed FAQ articles Claude drafts |
| **Operations** | Team | Responds to tickets in `support@evenzi.com` inbox |

## 12. Key documents

| Document | Audience | Purpose |
|---|---|---|
| This overview (`docs/features/chatbot-overview.md`) | Everyone | High-level shareable reference |
| Design Spec (`docs/superpowers/specs/2026-04-14-chatbot-design.md`) | Product + engineering | Full 16-section technical spec |
| Implementation Plan (`docs/superpowers/plans/2026-04-14-chatbot-implementation.md`) | Engineering | 34 tasks with code, tests, migrations |
| ClickUp Feature Task ([`86d2n3jxv`](https://app.clickup.com/t/86d2n3jxv)) | Everyone | Project tracker — 30 subtasks with dependencies, status, assignments |

## 13. FAQ about the chatbot

**Q: What happens when the free AI quotas run out?**
A: The bot falls back to keyword search — still answers questions, just less conversationally. Users never see an error.

**Q: How do we add a new FAQ?**
A: Log into `/admin/faq`, click "New Article", write the question and answer (markdown supported), publish. Changes go live instantly. No deploys needed.

**Q: Can the bot answer a question we haven't written?**
A: No. The bot can only answer from our FAQ. If no article covers the question, it says so and offers a ticket. This keeps answers accurate — no AI hallucination.

**Q: What if someone asks something completely off-topic (e.g., cooking advice)?**
A: The bot politely refuses and redirects to Evenzi-related topics.

**Q: Will it get smarter over time?**
A: Indirectly — as we add more FAQ articles (especially based on real ticket patterns), its coverage improves. The AI itself doesn't learn from conversations.

**Q: Can it be turned off if something goes wrong?**
A: Yes. One environment variable (`CHATBOT_MODE=off`) hides the widget site-wide. `faq-only` keeps the FAQ visible but disables AI.

**Q: Can guests (people receiving invitations) use the chatbot?**
A: Not in MVP. Guests rely on the invitation itself for event info. Once Guest Management ships, we'll add a guest-aware bot that knows their specific event.

**Q: Why not just use Intercom / Tidio / Crisp?**
A: Those are good products but (a) paid tiers are ₹3-8k/month at our scale, (b) our user data leaves our system, (c) we can't fully control the UX. Building our own is cheap, keeps data home, and matches Evenzi's brand.

**Q: How much work is this to build?**
A: ~30 ClickUp subtasks total. Most of the backend can start immediately; UI work is gated on Figma. Realistic estimate: 2-3 weeks of engineering work once unblocked.

**Q: What about admin analytics — "how many users signed up this week?"**
A: Separate Phase 2 feature. Different architecture (connects directly to the database), different security requirements, different users (just admins). Planned but not part of this scope.

---

## Contact

Questions about this feature? Ping Abhijith or check the ClickUp feature task ([86d2n3jxv](https://app.clickup.com/t/86d2n3jxv)) for progress and detailed subtasks.
