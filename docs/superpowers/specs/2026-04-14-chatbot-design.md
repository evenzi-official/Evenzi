# Evenzi Support Chatbot — Design Spec

**Date:** 2026-04-14
**Status:** Design approved — awaiting implementation plan & Figma
**Author:** Brainstormed with Claude Code
**Ship target:** MVP Phase 1 (after Figma designs land)

---

## 1. Overview

A RAG-powered (Retrieval-Augmented Generation) support chatbot that serves as the **only customer support channel** for Evenzi during MVP Phase 1. The bot deflects common questions via an FAQ-grounded assistant and escalates unresolved issues to a support email inbox via automated tickets.

The system is designed around a hard cost constraint: **zero paid API keys**. It uses Google Gemini's free tier as primary, Groq's free tier as fallback, and gracefully degrades to keyword search when both are exhausted.

### Primary Motivation

Evenzi's MVP will not have live human customer support. Users will hit issues — confusing flows, account questions, product clarifications — and there must be a first line of defense that handles most issues without team intervention. The chatbot serves as that first line.

### Goals

1. **Deflect ≥70% of user questions** without human involvement
2. **Zero monthly cost** at MVP scale (50–500 daily users)
3. **No dead-ends** — every unresolved question becomes a support ticket
4. **Admin-editable FAQ** without code deployment
5. **Graceful degradation** — bot stays useful even when LLM providers fail
6. **Expandable** — architecture supports adding admin-analytics bot (Phase 2) and guest-aware bot (Phase 2+) without rewrite

### Non-Goals (MVP)

See § 14 Future Enhancements for the full deferred list. Headlines:
- No admin analytics bot ("how many users do I have?")
- No guest-side event-aware bot
- No WhatsApp handoff
- No live human chat
- No multilingual support (English only)
- No paid LLM tiers

---

## 2. Audience & Scope

### Audiences served

| Audience | Served? | Notes |
|---|---|---|
| **Public visitors** (pre-signup) | ✅ | Landing/marketing pages, "What is Evenzi?" type questions |
| **Hosts** (logged-in users) | ✅ | Product how-to, account issues, event management |
| **Guests** (receiving invitations) | ❌ | Deferred — invitations carry their own event info; guest-aware bot is Phase 2+ |
| **Admins** (internal) | ✅ (as users) | Admins also get the bot. Admin analytics chat is a separate Phase 2 spec. |

### Content domains covered

- Product how-to (create event, add sub-events, invite guests, etc.)
- Account & authentication (login problems, forgot password, change email)
- Billing & pricing (even if free during MVP, users will ask)
- Feature clarification ("what does X do?")
- General platform questions ("is this for birthdays or only weddings?")

---

## 3. Architecture

### High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       USER BROWSER                          │
│   ┌──────────────┐      ┌──────────────┐                    │
│   │ Chat Widget  │      │ /help Page   │                    │
│   │  (most pages)│      │ (FAQ + chat) │                    │
│   └──────┬───────┘      └──────┬───────┘                    │
│          └───── shared ChatPanel component ─────┘            │
└───────────────────────────┬─────────────────────────────────┘
                            │ POST /api/chat
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  NEXT.JS SERVER (Vercel)                    │
│                                                             │
│   /api/chat (Edge Runtime)                                  │
│     1. Rate limit check (per IP + per user + global)        │
│     2. Cache check (hash query → recent answer?)            │
│     3. Embed query (Gemini text-embedding-004)              │
│     4. Retrieve top-5 FAQ chunks (pgvector similarity)      │
│     5. Build prompt with retrieved context                  │
│     6. Stream answer (Gemini 2.5 Flash → Groq → FAQ search) │
│     7. Persist message + update cache                       │
│     8. If escalate tool called → create ticket              │
│                                                             │
│   /api/chat/ticket                                          │
│     → creates support_tickets row                           │
│     → sends email via Resend with transcript                │
│                                                             │
│   /api/admin/faq/*  (admin role required)                   │
│     → CRUD on faq_articles + faq_categories                 │
│     → On save: re-chunk + re-embed in same transaction      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRES                        │
│   faq_categories, faq_articles, faq_chunks (pgvector)       │
│   chat_conversations, chat_messages, chat_cache             │
│   support_tickets, chat_rate_limits                         │
└─────────────────────────────────────────────────────────────┘
                   │
                   ▼ Resend → support@evenzi.com inbox
```

### Key design decisions

- **Edge Runtime** for `/api/chat` → fast streaming, cheap cold starts
- **Streaming responses** via Vercel AI SDK → perceived speed even at low-tier LLM
- **pgvector in Supabase** → no new infra; already available in existing plan
- **Supabase as FAQ source of truth** → admin-editable without deploys (markdown files rejected for this reason)
- **Shared `<ChatPanel>` component** → used by both widget and `/help` page; single UX source of truth

### Component breakdown

#### Frontend (`app/components/chat/`)

| Component | Purpose |
|---|---|
| `<ChatWidget>` | Floating bubble + expandable panel, rendered in root layout |
| `<ChatPanel>` | Shared chat UI — used by widget AND `/help` page |
| `<MessageList>` | Renders messages, auto-scroll, typing indicator |
| `<Message>` | Single message bubble with role styling, markdown, citations |
| `<Composer>` | Input + send + character limit + quick-question chips |
| `<QuickQuestions>` | Pre-defined suggested Qs with cached answers (zero LLM cost) |
| `<TicketForm>` | Inline escalation form — email + summary |
| `<ChatDisabledBanner>` | "Chat is slow — browse FAQs below" (degraded mode) |

#### Help Page (`app/help/`)

| Component | Purpose |
|---|---|
| `<HelpLayout>` | Two-column: FAQ nav (left) + chat/article (right) |
| `<FaqNav>` | Category list + search + anchor links |
| `<FaqArticle>` | Renders article markdown with "Ask the bot about this" CTA |
| `<FaqSearch>` | Client-side Fuse.js search over FAQ (zero LLM cost) |

#### Admin (`app/admin/faq/`)

| Component | Purpose |
|---|---|
| `<FaqListTable>` | Table with filters, bulk actions |
| `<FaqEditor>` | Question + markdown answer + preview + category + status |
| `<CategoryManager>` | Inline-editable list of categories |
| `<TicketList>` | Read-only list of support tickets with transcript modal |

#### Hooks & state (`lib/chat/`)

| File | Purpose |
|---|---|
| `useChat.ts` | Wraps Vercel AI SDK `useChat` — streaming, history, errors |
| `useChatWidget.ts` | Widget open/close state, unread count, route-based visibility |
| `chatStore.ts` | Persists conversation to localStorage (anon) or DB (auth'd) |
| `quickQuestions.ts` | Pre-defined common Qs + cached answers |

#### Server libs (`lib/chat/`)

| File | Purpose |
|---|---|
| `embed.ts` | Gemini embeddings wrapper |
| `retrieve.ts` | pgvector similarity search, top-k chunks |
| `generate.ts` | LLM call with fallback chain |
| `cache.ts` | Query hash → answer cache |
| `ratelimit.ts` | Per-user + per-IP rate limiting |
| `chunker.ts` | Split article answer into embedding chunks (~300 tokens) |
| `schemas.ts` | Zod schemas for all request bodies |

---

## 4. LLM Strategy

### Providers (all free tier)

| Provider | Model | Purpose | Free tier limits |
|---|---|---|---|
| **Gemini** (primary) | `gemini-2.5-flash` | Chat generation | 15 RPM, 1M tokens/day, ~250 requests/day |
| **Gemini** | `text-embedding-004` | Embeddings | 1,500 RPM, generous daily |
| **Groq** (fallback) | `llama-3.1-8b-instant` | Chat generation | 30 RPM, generous daily |

Both provider keys are already listed in `CLAUDE.md` as optional env vars:
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `GROQ_API_KEY`

No Anthropic, no OpenAI, no paid tiers.

### Degradation chain

```
User sends message
    │
    ▼
Try Gemini 2.5 Flash (RAG answer) ──success──► stream answer
    │ fails / rate-limited
    ▼
Try Groq Llama 3.1 8B (RAG answer) ──success──► stream answer
    │ fails / rate-limited
    ▼
Static FAQ keyword search (Fuse.js over published articles)
    "I'm having trouble with my AI. Here are the closest FAQs…"
    │ no good matches
    ▼
Escalate → offer to create support ticket
```

Every failure mode produces a useful response. No dead-ends.

### Prompt template

```
You are Evenzi's support assistant. You help users with questions
about the Evenzi wedding/event planning platform.

Rules:
- Answer ONLY using the FAQ context below. If the context doesn't
  contain the answer, say so and offer to create a support ticket.
- Be concise (2-4 sentences for simple questions).
- Cite the source FAQ at the end: [Source: <category> > <question>]
- Never invent features or behaviors not in the context.
- If the user seems frustrated or reports a bug, offer a ticket.

FAQ Context:
[retrieved chunks, formatted as:
  ## <question>
  <answer>
  Category: <category>
]

User question: <user message>
```

Hard caps: output 500 tokens, input context 2000 tokens. System prompt is supplied as a Gemini system instruction (not repeated in chat history turns), minimizing per-request token overhead.

### Cost model summary

| Load | Daily LLM calls | Cache hits | Actual Gemini calls | Status |
|---|---|---|---|---|
| Light (20 users × 2 q) | 40 | 16 | 24 | ✅ Well within limits |
| Medium (100 users × 3 q) | 300 | 120 | 180 | ✅ Within 250/day free tier |
| Heavy (300 users × 3 q) | 900 | 360 | 540 | ⚠️ Groq fallback kicks in |
| Spike (1000 users × 5 q) | 5000 | 2000 | 3000 | 🚨 Degrades to FAQ-only mode |

System absorbs up to ~500 daily users on free tiers. Beyond that, FAQ-only mode serves everyone free.

---

## 5. Data Model

All tables in Supabase `public` schema. RLS policies enforce access.

### FAQ Content (admin-editable)

```sql
CREATE TABLE faq_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text,
  icon            text,                      -- lucide icon name
  display_order   int NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE TYPE faq_article_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE faq_articles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       uuid NOT NULL REFERENCES faq_categories(id) ON DELETE RESTRICT,
  question          text NOT NULL,
  answer            text NOT NULL,           -- markdown supported
  tags              text[] DEFAULT '{}',
  status            faq_article_status NOT NULL DEFAULT 'draft',
  priority          int NOT NULL DEFAULT 0,  -- ordering within category
  view_count        int NOT NULL DEFAULT 0,
  helpful_count     int NOT NULL DEFAULT 0,
  not_helpful_count int NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id),
  updated_by        uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_faq_articles_category_status ON faq_articles(category_id, status);
CREATE INDEX idx_faq_articles_status_priority ON faq_articles(status, priority DESC);
```

### Embeddings (auto-generated from articles)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE faq_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid NOT NULL REFERENCES faq_articles(id) ON DELETE CASCADE,
  chunk_text  text NOT NULL,
  chunk_index int NOT NULL,
  embedding   vector(768) NOT NULL,           -- Gemini text-embedding-004
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_faq_chunks_embedding ON faq_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Conversations & messages

```sql
CREATE TABLE chat_conversations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id),  -- null for anonymous
  session_id       text NOT NULL,                   -- client-generated UUID
  started_at       timestamptz DEFAULT now(),
  last_message_at  timestamptz DEFAULT now(),
  message_count    int NOT NULL DEFAULT 0
);

CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id, started_at DESC);
CREATE INDEX idx_chat_conversations_session ON chat_conversations(session_id);

CREATE TYPE chat_message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE chat_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role              chat_message_role NOT NULL,
  content           text NOT NULL,
  retrieved_chunks  jsonb,                           -- audit trail for answers
  provider_used     text,                            -- 'gemini' | 'groq' | 'fallback'
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
```

### Cache

```sql
CREATE TABLE chat_cache (
  query_hash         text PRIMARY KEY,                -- sha256 of normalized query
  answer             text NOT NULL,
  retrieved_chunks   jsonb,
  provider_used      text,
  hit_count          int NOT NULL DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  expires_at         timestamptz NOT NULL
);

CREATE INDEX idx_chat_cache_expires ON chat_cache(expires_at);
```

### Rate limiting

```sql
CREATE TABLE chat_rate_limits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type    text NOT NULL,                       -- 'user' | 'ip' | 'session'
  scope_value   text NOT NULL,                       -- user_id, ip, or session_id
  window_start  timestamptz NOT NULL,
  count         int NOT NULL DEFAULT 0,
  UNIQUE (scope_type, scope_value, window_start)
);

CREATE INDEX idx_chat_rate_limits_lookup ON chat_rate_limits(scope_type, scope_value, window_start);
```

### Support tickets

```sql
CREATE TYPE support_ticket_status AS ENUM ('open', 'replied', 'closed');

CREATE TABLE support_tickets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid REFERENCES chat_conversations(id),
  user_id          uuid REFERENCES auth.users(id),
  email            text NOT NULL,
  summary          text NOT NULL,
  issue            text NOT NULL,
  page_url         text,
  status           support_ticket_status NOT NULL DEFAULT 'open',
  created_at       timestamptz DEFAULT now(),
  replied_at       timestamptz
);

CREATE INDEX idx_support_tickets_status ON support_tickets(status, created_at DESC);
```

### Auth extension — admin role

Extend the existing role enum/column on `user_profiles` to include `'admin'`. The exact migration depends on whether the current schema uses a Postgres enum or a text column with a CHECK constraint — confirm during implementation and match the existing pattern from the Auth & Role Selection feature.

After migration, seed at least one admin user via a manual UPDATE on the owner account.

### RLS policies (summary)

| Table | Read | Write |
|---|---|---|
| `faq_categories` | Public (status=published) | Admin only |
| `faq_articles` | Public (status=published) | Admin only |
| `faq_chunks` | Server-only (service role) | Server-only |
| `chat_conversations` | Owner (auth'd) or server-only (anon) | Server-only |
| `chat_messages` | Owner (auth'd) or server-only (anon) | Server-only |
| `chat_cache` | Server-only | Server-only |
| `chat_rate_limits` | Server-only | Server-only |
| `support_tickets` | Owner or admin | Server-only |

### Atomic FAQ save RPC

To keep article + chunks consistent, wrap save + embed in a single Postgres function (called from Next.js after chunks are embedded):

```sql
CREATE FUNCTION upsert_faq_article_with_chunks(
  p_article_id uuid,
  p_article jsonb,
  p_chunks jsonb          -- [{chunk_text, chunk_index, embedding}]
) RETURNS uuid AS $$
  -- Implementation:
  -- 1. UPSERT faq_articles with p_article
  -- 2. DELETE FROM faq_chunks WHERE article_id = <id>
  -- 3. INSERT INTO faq_chunks from p_chunks
  -- 4. RETURN article id
$$ LANGUAGE plpgsql;
```

If the transaction fails at any step, the old chunks remain (stale but functional).

---

## 6. API Contracts

### Public endpoints

#### `POST /api/chat`
Streaming chat response (Vercel AI SDK SSE protocol).

**Request:**
```typescript
{
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  conversationId?: string,
  sessionId: string
}
```

**Response:** SSE stream with final metadata frame:
```typescript
{
  conversationId: string,
  citations: Array<{ articleId, question, category }>,
  source: 'gemini' | 'groq' | 'fallback-keyword' | 'cache'
}
```

**Errors:**
- `429` rate limit → `{ error: 'rate_limit', resetAt: ISO8601 }`
- `400` validation → `{ error: 'invalid_input', message: string }`
- `503` degraded → `{ error: 'degraded_mode', fallback: 'faq_search' }`

Auth: optional (public). Authenticated users get higher rate limits.

#### `POST /api/chat/ticket`
```typescript
// Request
{
  conversationId: string,
  email: string,
  summary: string,   // max 200
  issue: string      // max 2000
}

// Response: 201
{ ticketId: string, emailSent: boolean }
```

Anti-spam: 3 tickets/IP/hour. Captures user_id if logged in.

#### `GET /api/chat/history` *(auth required)*
List user's past conversations. `?limit=20&cursor=<id>`.

#### `GET /api/chat/history/[id]` *(auth required, ownership)*
Messages in a conversation.

#### `GET /api/faq` *(public, cached at edge)*
FAQ list for `/help` page static render. `?category=<slug>&search=<text>`.

### Admin endpoints

All under `/api/admin/faq/*`, middleware-gated (role=admin).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/faq` | List articles (including drafts), filters |
| `POST` | `/api/admin/faq` | Create article (triggers embed if published) |
| `PATCH` | `/api/admin/faq/[id]` | Update + re-embed if content changed |
| `DELETE` | `/api/admin/faq/[id]` | Soft delete (status → archived, chunks removed) |
| `POST` | `/api/admin/faq/[id]/reindex` | Manual re-embed (debug/recovery) |
| `GET` | `/api/admin/faq/categories` | List categories |
| `POST/PATCH/DELETE` | `/api/admin/faq/categories/...` | Category CRUD |
| `GET` | `/api/admin/tickets` | List support tickets |

### Middleware

Extend `middleware.ts`:
```typescript
const adminPaths = ['/admin/*', '/api/admin/*']

if (isAdminPath(pathname)) {
  // fetch role from user_profiles; redirect or 403 if not admin
}
```

Public paths (already in matcher config): `/api/chat*`, `/api/faq`, `/help`.

### Validation

All request bodies validated with Zod at `lib/chat/schemas.ts`. Pattern matches existing Event CRUD validation.

---

## 7. Flows — Request Lifecycles

### Flow 1: User asks a question

```
1. Frontend: <Composer> → useChat hook → POST /api/chat
2. Edge runtime:
   a. Rate limit check (per-user, per-IP, global). 429 if exceeded.
   b. Cache lookup (sha256(normalize(question))). Hit → stream cached & exit.
   c. Embed query (Gemini text-embedding-004).
   d. Retrieve top-5 faq_chunks via pgvector (similarity > 0.7, published only).
   e. Build prompt with retrieved chunks + system instruction.
   f. Generate with fallback chain: Gemini → Groq → keyword search.
   g. Stream tokens to client.
   h. Persist: conversation, messages, retrieved_chunks array.
   i. Upsert chat_cache entry.
3. Frontend: <MessageList> renders tokens live, shows citations at end.
```

### Flow 2: Admin saves FAQ article

```
1. Admin submits /admin/faq/[id] form → POST /api/admin/faq/[id]
2. Middleware: require role=admin.
3. Validate with Zod.
4. Server:
   a. Chunk answer text (~300 tokens each, respects paragraph breaks).
   b. Embed each chunk via Gemini (parallel).
   c. Call upsert_faq_article_with_chunks RPC: update article + replace chunks.
5. Response: updated article + chunks indexed count.
6. UI: toast "Saved & indexed". Next user query uses new content.
```

### Flow 3: Escalation to ticket

```
1. Trigger (three sources):
   a. LLM chose `createTicket` tool (low confidence / frustration detected).
   b. User clicked "Create a ticket" button (always visible after 2+ exchanges).
   c. Static fallback: LLM + keyword search both failed to produce useful answer.
2. Frontend: <TicketForm> rendered inline. Pre-fills email (if auth'd) + summary.
3. User submits → POST /api/chat/ticket.
4. Server:
   a. Validate with Zod.
   b. Anti-spam check (3/IP/hour).
   c. INSERT into support_tickets.
   d. Fetch conversation messages.
   e. Resend email to CHATBOT_SUPPORT_EMAIL: subject "[Evenzi Support] <summary>",
      body includes email, transcript, page URL.
5. Response: ticket ID + confirmation.
6. Frontend: success state, "We'll email you within 24h."
```

---

## 8. Cost Controls & Safeguards

Defense in depth — no single point of failure.

### Layer 1: Rate limits

| Scope | Limit | Storage |
|---|---|---|
| Per authenticated user | 20 messages/day | `chat_rate_limits` |
| Per IP | 30 messages/hour | `chat_rate_limits` |
| Per anonymous session | 10 messages/session | localStorage + server verify |
| Global | 200 LLM calls/day | env-config kill switch |

Admin role bypasses all limits (for testing).

### Layer 2: Caching

**Tier A — Exact match (MVP):** Normalize query (lowercase, strip punctuation) → sha256 → lookup. TTL 24h. Expected 30–40% hit rate at steady state.

**Tier B — Semantic cache:** Deferred to Phase 2.

### Layer 3: Quick questions (zero-LLM)

Widget empty-state shows 5 hardcoded Q chips. Clicking returns a pre-generated answer from `lib/chat/quickQuestions.ts`. Covers ~20–30% of real traffic empirically.

### Layer 4: Kill switch / degradation

Env var `CHATBOT_MODE`:
- `full` — LLM active, all features
- `faq-only` — LLM disabled, keyword search only (still useful)
- `off` — widget hidden, `/help` shows FAQ only

Auto-flip to `faq-only` when global daily cap reached.

### Layer 5: Prompt hygiene

- Output cap: 500 tokens
- Input context cap: 2000 tokens
- System instruction cached (Gemini feature)
- Stateless by default — conversation memory added only on explicit follow-up

### Layer 6: Abuse detection (soft)

- Reject messages > 500 chars
- Basic profanity filter
- Flag >5 messages/minute as probable bot → hard rate-limit

---

## 9. UX States & Behaviors

*(Not visual design — that's Figma's job. These are the states the UI must support.)*

### Chat widget states

| State | Trigger | Behavior |
|---|---|---|
| Collapsed | Default | Small bubble bottom-right, unread badge |
| Opening | User clicks bubble | Panel animates in |
| Empty | New conversation | Greeting + quick-question chips + Browse FAQ link |
| Typing | User composing | Enabled composer, char counter >400 |
| Thinking | Request in flight | Typing indicator, composer disabled |
| Streaming | Tokens arriving | Partial answer updates live, Stop button |
| Answered | Stream complete | Answer + citations + 👍/👎 + composer re-enabled |
| Rate-limited | 429 | "Reached today's limit, browse FAQ" banner |
| Degraded | Gemini+Groq both failing | "Showing FAQ results instead" banner |
| Offline | Network error | Retry banner, preserve input |
| Escalating | Trigger fired | `<TicketForm>` inline, composer hidden |
| Ticket Submitted | 201 from ticket endpoint | "Ticket #1234 created, email in 24h" |

### Widget visibility

| Page | Widget shown? |
|---|---|
| `/` (landing) | ✅ |
| `/auth/*` | ❌ distracting during login |
| `/home` | ✅ |
| `/events/new/*` (wizard) | ❌ distracting during creation |
| `/events/[id]/*` | ✅ |
| `/help` | ❌ chat is embedded in page |
| `/admin/*` | ✅ admins can test |

### `/help` page behavior

- Two-pane desktop, stacked mobile
- Left: category sidebar + search + article list
- Right: selected article OR embedded chat panel (toggle)
- Deep-linkable: `/help/events/creating-an-event`
- Each article has "Ask the bot about this" CTA → opens chat with contextual prefill

### Admin panel behavior

| Screen | Key behaviors |
|---|---|
| `/admin/faq` | Table + filters + bulk actions (publish/archive) + search |
| `/admin/faq/new` | Form: category, question, markdown answer w/ preview tab, tags, status |
| `/admin/faq/[id]` | Same form populated, updated_by/at display, delete w/ confirm |
| `/admin/faq/categories` | Inline editable list (name, icon, order) |
| `/admin/tickets` | Table, status filter, click → transcript modal read-only |

### Baseline a11y + loading/error states

- `Cmd/Ctrl + /` opens widget
- Focus trap, Esc closes
- `aria-live="polite"` on message list
- 4.5:1 contrast minimum
- 44×44px tap targets
- Skeletons for loading (no spinners)
- Friendly empty states with CTAs
- Inline errors with retry (no full-page crashes)

---

## 10. Testing Strategy

| Layer | Tests | Framework |
|---|---|---|
| Unit | `embed`, `retrieve`, `cache`, `ratelimit`, Zod schemas, markdown chunker, prompt builder | Vitest |
| Integration | `/api/chat` with mocked LLM, `/api/admin/faq` CRUD + re-embed, escalation e2e | Vitest + test Supabase |
| Component | `<ChatPanel>` state transitions, `<TicketForm>` validation, `<MessageList>` streaming | Vitest + RTL |
| E2E | Happy path Q→A. Escalation path. Admin creates FAQ → bot uses it. | Chrome MCP |

Required TDD unit tests:
- `chunker.test.ts` — splits under token limit, respects paragraph breaks
- `cache.test.ts` — normalization catches casing/punctuation variants
- `ratelimit.test.ts` — per-user and per-IP limits independent
- `retrieve.test.ts` — similarity threshold excludes irrelevant chunks
- `prompt.test.ts` — includes only published chunks, caps token budget
- `generate.test.ts` — fallback chain Gemini → Groq → keyword

Coverage target: ≥80% on `lib/chat/*` (matches Event CRUD standard).

---

## 11. Observability & Configuration

### Logging (MVP-minimal)

Per chat request, `console.log` (Vercel captures):
- Provider used (gemini/groq/fallback/cache)
- Cache hit/miss
- Latency ms
- Input/output token estimate
- Conversation ID + user ID

### Env vars (new)

```bash
# Already in env — used by this feature
GOOGLE_GENERATIVE_AI_API_KEY=<existing>
GROQ_API_KEY=<existing>
RESEND_API_KEY=<existing>

# New flags for chatbot
CHATBOT_MODE=full                      # full | faq-only | off
CHATBOT_DAILY_GLOBAL_CAP=200           # hard LLM-call ceiling per day
CHATBOT_SUPPORT_EMAIL=support@evenzi.com
```

`CHATBOT_MODE=off` is the production kill switch.

---

## 12. Rollout Plan

**Phase 0 — Design (this session):**
Spec + implementation plan + multi-agent review + ClickUp tasks. No code.

**Phase 1 — Implementation (when Figma lands):**
- Blocked: Frontend Dev (needs Figma)
- Parallel-startable: Data Model, Backend Dev, FAQ Content Drafting
- Implementation per plan, with TDD per task

**Phase 2 — Pre-launch:**
- Seed 25 FAQ articles (Claude drafts, user reviews)
- Internal QA dogfood — 1 week
- Fill gaps in FAQ based on real questions

**Phase 3 — Launch with MVP:**
- `CHATBOT_MODE=full`
- Daily check on Supabase: `SELECT COUNT(*) FROM chat_messages WHERE created_at > today`
- Weekly FAQ iteration based on escalated tickets

**Phase 4 — Post-launch:**
- Convert frequent ticket questions → FAQ entries
- Consider semantic cache if volume grows
- Begin admin analytics bot spec

---

## 13. Scope — In and Out

### In scope (this feature)

- RAG chatbot with Gemini + Groq fallback + graceful keyword degradation
- `<ChatWidget>` on most pages; `/help` page with FAQ + chat
- `/admin/faq/*` CRUD for articles and categories
- `/admin/tickets` read-only list
- Auto-embedding on admin save (atomic RPC)
- Email escalation via Resend
- Admin role added to `user_profiles`
- Middleware gate for `/admin/*` and `/api/admin/*`
- Rate limiting: per-user, per-IP, global
- Exact-match cache
- Graceful degradation to keyword search
- ~25 seed FAQ articles (Claude drafts, user reviews)
- Unit + integration + component + E2E tests
- A11y baseline + keyboard shortcuts

### Out of scope (future work)

See § 14.

---

## 14. Future Enhancements (captured for later)

| Enhancement | Unblocks when |
|---|---|
| Admin analytics bot ("how many users?") | Separate Phase 2 spec, tool-calling approach (not text-to-SQL) |
| Guest-side event-aware bot | Guest Management & RSVP feature ships |
| WhatsApp handoff for escalation | WhatsApp Invitations feature ships |
| Semantic cache (Tier B) | When LLM call volume exceeds free tier sustainably |
| Multi-turn conversation memory | Post-MVP — measure need from user feedback first |
| Voice input/output | Post-MVP |
| Multilingual support | Post-MVP — English only for now |
| Rich-text WYSIWYG editor for FAQ | Post-MVP — markdown sufficient |
| Version history UI for FAQ | Post-MVP — `updated_at`/`updated_by` only for now |
| LLM-powered FAQ drafting ("rewrite this plainer") | Post-MVP admin convenience |
| Real-time live chat with human agents | If the team grows |
| Chatbot analytics dashboard (charts, funnels) | Part of broader Admin Module |
| A/B testing of prompts | If measurable quality issues arise |
| Auto-learning: tickets → FAQs | Later iteration, requires review workflow |
| Paid LLM tiers | Only if free tiers prove insufficient |
| CAPTCHA integration | Only if bot abuse detected |

---

## 15. Dependencies & Related Work

### Depends on

- **Auth & Role Selection** (✅ done) — need to extend `user_profiles.role` enum to add `'admin'`
- **Reusable Component Library** (not started) — `<Button>`, `<Input>`, `<Modal>`, `<Toast>` ideally come from there. If not built when chatbot implementation starts, chatbot builds minimal versions inline and aligns with library later.
- **Supabase pgvector extension** — need to enable via migration

### Blocks (none)

This feature doesn't block any other MVP feature. Can ship anytime.

### Related specs

- `docs/superpowers/specs/2026-04-08-auth-role-selection-design.md` — auth/role system being extended
- `docs/superpowers/specs/2026-04-09-event-crud-design.md` — reference pattern for API/validation structure

---

## 16. Open Questions (for plan-review stage)

These are intentionally left for the multi-agent plan review to flag:

1. Is ivfflat the right pgvector index for ~100 chunks, or should we use hnsw?
2. Should `chat_rate_limits` use a TTL/vacuum strategy or just expire rows lazily?
3. Should the widget suppress on the event wizard, or just minimize automatically?
4. Is the Edge Runtime compatible with pgvector similarity queries from Supabase JS client?
5. Should admin users have a separate "test mode" that doesn't persist conversations?
6. Should we add a honeypot field to the ticket form as cheap anti-spam?

---

## Revision history

- 2026-04-14 — Initial spec, brainstormed with Claude Code, all 7 design sections approved by user.
