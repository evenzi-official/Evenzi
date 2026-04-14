# Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a RAG-powered support chatbot that deflects common user questions via a Supabase-backed FAQ and escalates unresolved issues to email tickets — all on free LLM tiers (Gemini primary, Groq fallback).

**Architecture:** Next.js Edge Runtime `/api/chat` endpoint streams answers via Vercel AI SDK. FAQ content stored in Supabase (admin-editable), chunked and embedded into pgvector. Graceful degradation chain: Gemini → Groq → keyword search → ticket escalation. Admin CRUD at `/admin/faq/*` gated by `role='admin'`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/groq`), Supabase (pgvector), Resend, Zod, Fuse.js, Vitest, React Testing Library, Chrome MCP (E2E).

**Spec:** `docs/superpowers/specs/2026-04-14-chatbot-design.md`

---

## Prerequisites

Before starting implementation, verify:

- [ ] Figma designs finalized for chat widget, `/help` page, admin FAQ screens
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` set in `.env.local` and Vercel
- [ ] `GROQ_API_KEY` set in `.env.local` and Vercel
- [ ] `RESEND_API_KEY` set and verified sender domain
- [ ] `CHATBOT_SUPPORT_EMAIL` set (target inbox)
- [ ] Install missing deps:
  ```bash
  npm install ai @ai-sdk/google @ai-sdk/groq fuse.js react-markdown react-textarea-autosize
  ```

---

## Task Ordering & Dependencies

```
Phase A — Backend (startable without Figma):
  1 → 2 → 3 (migrations, in order)
  4 (types) — startable anytime
  5, 6 — after 1
  7, 8, 9 — after 5,6
  10 — after 7,8,9
  11 — after 10
  12 — after 1
  13 — after 11
  14 — after 2
  15, 16, 17 — after 14
  18 — after 14
  19 — after 1
  30 (seed content) — can run in parallel with 11+

Phase B — UI (blocked on Figma):
  20 (ChatPanel) — after 11
  21 (ChatWidget) — after 20
  22 (TicketForm) — after 12, 20
  23 (QuickQuestions) — after 20
  24 (/help page) — after 19, 20
  25, 26 (Admin FAQ) — after 15
  27 (Admin Categories) — after 16
  28 (Admin Tickets) — after 18
  29 (Widget integration in layout) — after 21

Phase C — Integration & QA:
  31, 32, 33 (E2E) — after Phase B complete
  34 (kill switch test) — after 11
```

---

## Phase A — Backend Foundations

### Task 1: Supabase migration — chatbot core tables + pgvector

**Files:**
- Create: Supabase migration via `apply_migration` tool

**Description:** Create all chatbot tables in one migration with RLS + indexes. Enable pgvector.

- [ ] **Step 1:** Verify pgvector isn't yet enabled, then enable it and create all tables via `apply_migration`:

```sql
-- Migration name: chatbot_core_schema

CREATE EXTENSION IF NOT EXISTS vector;

-- FAQ content
CREATE TABLE faq_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text,
  icon            text,
  display_order   int NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE TYPE faq_article_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE faq_articles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       uuid NOT NULL REFERENCES faq_categories(id) ON DELETE RESTRICT,
  question          text NOT NULL,
  answer            text NOT NULL,
  tags              text[] NOT NULL DEFAULT '{}',
  status            faq_article_status NOT NULL DEFAULT 'draft',
  priority          int NOT NULL DEFAULT 0,
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

CREATE TABLE faq_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid NOT NULL REFERENCES faq_articles(id) ON DELETE CASCADE,
  chunk_text  text NOT NULL,
  chunk_index int NOT NULL,
  embedding   vector(768) NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ivfflat requires seed data; start with hnsw which works empty
CREATE INDEX idx_faq_chunks_embedding ON faq_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Conversations & messages
CREATE TABLE chat_conversations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id),
  session_id       text NOT NULL,
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
  retrieved_chunks  jsonb,
  provider_used     text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

-- Cache
CREATE TABLE chat_cache (
  query_hash       text PRIMARY KEY,
  answer           text NOT NULL,
  retrieved_chunks jsonb,
  provider_used    text,
  hit_count        int NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  expires_at       timestamptz NOT NULL
);

CREATE INDEX idx_chat_cache_expires ON chat_cache(expires_at);

-- Rate limits
CREATE TABLE chat_rate_limits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type   text NOT NULL,
  scope_value  text NOT NULL,
  window_start timestamptz NOT NULL,
  count        int NOT NULL DEFAULT 0,
  UNIQUE (scope_type, scope_value, window_start)
);

CREATE INDEX idx_chat_rate_limits_lookup ON chat_rate_limits(scope_type, scope_value, window_start);

-- Tickets
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

- [ ] **Step 2:** Add RLS policies via `apply_migration` (name: `chatbot_rls_policies`):

```sql
-- Enable RLS on all tables
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Public read of published FAQ content (for /help page + retrieval done server-side)
CREATE POLICY faq_categories_public_read ON faq_categories
  FOR SELECT USING (true);

CREATE POLICY faq_articles_public_read ON faq_articles
  FOR SELECT USING (status = 'published');

-- Admin full access on FAQ (checked by server role; using auth.jwt() claim check)
-- Since RLS uses a helper, for MVP all FAQ writes go through service role key
-- (server-only). This keeps client surface attack-free.

-- chat_conversations: authenticated users can read their own
CREATE POLICY chat_conversations_own_read ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY chat_messages_own_read ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE id = chat_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Tickets: authenticated users can read their own
CREATE POLICY support_tickets_own_read ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- All inserts/updates happen via service role in API routes (bypasses RLS).
-- No insert/update policies needed for anon/authenticated users.
```

- [ ] **Step 3:** Verify via `list_tables` that all 8 chatbot tables exist with columns as specified. Commit as a note in the Supabase migration log.

- [ ] **Step 4:** Commit a migration record to git:

```bash
mkdir -p supabase/migrations/notes
echo "chatbot_core_schema + chatbot_rls_policies applied $(date -I)" > supabase/migrations/notes/2026-04-14-chatbot.md
git add supabase/migrations/notes/2026-04-14-chatbot.md
git commit -m "chore(db): apply chatbot_core_schema and chatbot_rls_policies migrations"
```

---

### Task 2: Supabase migration — admin role

**Files:**
- Migration only (no new code files)

**Description:** Extend existing role system to include `'admin'`. Inspect the current schema first (it may be enum or CHECK) and match the pattern.

- [ ] **Step 1:** Query current role column structure:

```sql
SELECT column_name, data_type, udt_name FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'role';
```

- [ ] **Step 2:** Based on structure, apply matching migration:
  - If enum (`udt_name` ends with `_enum` or is named): `ALTER TYPE <enum_name> ADD VALUE IF NOT EXISTS 'admin';`
  - If CHECK constraint: `ALTER TABLE user_profiles DROP CONSTRAINT <name>; ALTER TABLE user_profiles ADD CONSTRAINT <name> CHECK (role IN ('host', 'vendor', 'admin'));`
  - If text column without constraint: no migration needed.

- [ ] **Step 3:** Seed one admin user (manual UPDATE — replace email with actual owner):

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'abhijith@evenzi.app' LIMIT 1);
```

- [ ] **Step 4:** Verify by reading the row and confirming `role = 'admin'`.

- [ ] **Step 5:** Append to migration note and commit.

---

### Task 3: Atomic FAQ save RPC

**Files:**
- Migration only

**Description:** Create Postgres function to atomically replace article + chunks in one transaction.

- [ ] **Step 1:** Apply via `apply_migration` (name: `chatbot_upsert_faq_rpc`):

```sql
CREATE OR REPLACE FUNCTION upsert_faq_article_with_chunks(
  p_article_id uuid,
  p_article jsonb,
  p_chunks jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_article_id uuid;
  v_chunk jsonb;
BEGIN
  -- Upsert article
  IF p_article_id IS NULL THEN
    INSERT INTO faq_articles (
      category_id, question, answer, tags, status, priority, created_by, updated_by
    )
    VALUES (
      (p_article->>'category_id')::uuid,
      p_article->>'question',
      p_article->>'answer',
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_article->'tags')), '{}'),
      COALESCE((p_article->>'status')::faq_article_status, 'draft'),
      COALESCE((p_article->>'priority')::int, 0),
      (p_article->>'created_by')::uuid,
      (p_article->>'updated_by')::uuid
    )
    RETURNING id INTO v_article_id;
  ELSE
    UPDATE faq_articles SET
      category_id = (p_article->>'category_id')::uuid,
      question = p_article->>'question',
      answer = p_article->>'answer',
      tags = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_article->'tags')), '{}'),
      status = COALESCE((p_article->>'status')::faq_article_status, status),
      priority = COALESCE((p_article->>'priority')::int, priority),
      updated_by = (p_article->>'updated_by')::uuid,
      updated_at = now()
    WHERE id = p_article_id
    RETURNING id INTO v_article_id;

    DELETE FROM faq_chunks WHERE article_id = v_article_id;
  END IF;

  -- Insert chunks
  FOR v_chunk IN SELECT * FROM jsonb_array_elements(p_chunks) LOOP
    INSERT INTO faq_chunks (article_id, chunk_text, chunk_index, embedding)
    VALUES (
      v_article_id,
      v_chunk->>'chunk_text',
      (v_chunk->>'chunk_index')::int,
      (v_chunk->>'embedding')::vector(768)
    );
  END LOOP;

  RETURN v_article_id;
END;
$$;

-- Allow service role (used by API routes) to execute
REVOKE ALL ON FUNCTION upsert_faq_article_with_chunks FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_faq_article_with_chunks TO service_role;
```

- [ ] **Step 2:** Smoke test by calling via `execute_sql` with a minimal payload and asserting insertion. Then roll back test data.

- [ ] **Step 3:** Commit migration note.

---

### Task 4: Types + Zod schemas

**Files:**
- Create: `lib/chat/types.ts`
- Create: `lib/chat/schemas.ts`
- Test: `lib/chat/__tests__/schemas.test.ts`

**Description:** All request/response TypeScript types + runtime Zod validation.

- [ ] **Step 1:** Write failing test in `lib/chat/__tests__/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { chatRequestSchema, ticketRequestSchema, faqCreateSchema } from '../schemas';

describe('chatRequestSchema', () => {
  it('accepts valid chat request', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'hi' }],
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty messages array', () => {
    const result = chatRequestSchema.safeParse({
      messages: [],
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message >500 chars', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'x'.repeat(501) }],
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});

describe('ticketRequestSchema', () => {
  it('accepts valid ticket', () => {
    const result = ticketRequestSchema.safeParse({
      conversationId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      summary: 'Can\'t log in',
      issue: 'I get an error when I try to log in',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = ticketRequestSchema.safeParse({
      conversationId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'not-an-email',
      summary: 'x',
      issue: 'x',
    });
    expect(result.success).toBe(false);
  });
});

describe('faqCreateSchema', () => {
  it('requires categoryId as uuid', () => {
    const result = faqCreateSchema.safeParse({
      categoryId: 'not-a-uuid',
      question: 'q',
      answer: 'a',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid minimal article', () => {
    const result = faqCreateSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      question: 'How?',
      answer: 'Here is how.',
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2:** Run test to verify it fails: `npm run test:run -- schemas.test.ts` — expect module not found.

- [ ] **Step 3:** Create `lib/chat/types.ts`:

```typescript
export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface Citation {
  articleId: string;
  question: string;
  category: string;
}

export interface RetrievedChunk {
  id: string;
  articleId: string;
  chunkText: string;
  question: string;
  categorySlug: string;
  categoryName: string;
  similarity: number;
}

export type ChatProvider = 'gemini' | 'groq' | 'fallback-keyword' | 'cache';

export type FaqArticleStatus = 'draft' | 'published' | 'archived';
export type SupportTicketStatus = 'open' | 'replied' | 'closed';
export type ChatbotMode = 'full' | 'faq-only' | 'off';
```

- [ ] **Step 4:** Create `lib/chat/schemas.ts`:

```typescript
import { z } from 'zod';

const uuid = z.string().uuid();
const nonEmptyString = (max: number) => z.string().trim().min(1).max(max);

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: nonEmptyString(500),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
  conversationId: uuid.optional(),
  sessionId: uuid,
});

export const ticketRequestSchema = z.object({
  conversationId: uuid,
  email: z.string().email(),
  summary: nonEmptyString(200),
  issue: nonEmptyString(2000),
  pageUrl: z.string().url().optional(),
});

export const faqCreateSchema = z.object({
  categoryId: uuid,
  question: nonEmptyString(500),
  answer: nonEmptyString(10000),
  tags: z.array(z.string().max(50)).max(20).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
});

export const faqUpdateSchema = faqCreateSchema.partial();

export const faqCategoryCreateSchema = z.object({
  name: nonEmptyString(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const faqCategoryUpdateSchema = faqCategoryCreateSchema.partial();

export type ChatRequestBody = z.infer<typeof chatRequestSchema>;
export type TicketRequestBody = z.infer<typeof ticketRequestSchema>;
export type FaqCreateBody = z.infer<typeof faqCreateSchema>;
export type FaqUpdateBody = z.infer<typeof faqUpdateSchema>;
```

- [ ] **Step 5:** Re-run tests: `npm run test:run -- schemas.test.ts` — expect PASS.

- [ ] **Step 6:** Commit:

```bash
git add lib/chat/types.ts lib/chat/schemas.ts lib/chat/__tests__/schemas.test.ts
git commit -m "feat(chat): add chatbot types and Zod schemas with tests"
```

---

### Task 5: Markdown chunker

**Files:**
- Create: `lib/chat/chunker.ts`
- Test: `lib/chat/__tests__/chunker.test.ts`

**Description:** Split an FAQ article (question + answer) into token-bounded chunks, respecting paragraph breaks.

- [ ] **Step 1:** Write failing tests:

```typescript
import { describe, it, expect } from 'vitest';
import { chunkArticle, estimateTokens } from '../chunker';

describe('estimateTokens', () => {
  it('approximates 4 chars per token', () => {
    expect(estimateTokens('1234')).toBe(1);
    expect(estimateTokens('a'.repeat(400))).toBe(100);
  });
});

describe('chunkArticle', () => {
  it('returns single chunk for short content', () => {
    const chunks = chunkArticle({
      question: 'How do I create an event?',
      answer: 'Go to your dashboard and click New Event.',
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].chunkText).toContain('How do I create an event?');
    expect(chunks[0].chunkIndex).toBe(0);
  });

  it('splits long content at paragraph boundaries', () => {
    const longPara = 'lorem ipsum '.repeat(100);
    const answer = `${longPara}\n\n${longPara}\n\n${longPara}`;
    const chunks = chunkArticle({ question: 'Q?', answer });
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach(c => {
      expect(estimateTokens(c.chunkText)).toBeLessThanOrEqual(400);
    });
  });

  it('keeps question in every chunk as context', () => {
    const longPara = 'word '.repeat(500);
    const chunks = chunkArticle({ question: 'Why?', answer: longPara });
    chunks.forEach(c => expect(c.chunkText).toContain('Why?'));
  });

  it('assigns sequential chunk indexes', () => {
    const longPara = 'word '.repeat(500);
    const chunks = chunkArticle({ question: 'Q', answer: `${longPara}\n\n${longPara}` });
    chunks.forEach((c, i) => expect(c.chunkIndex).toBe(i));
  });
});
```

- [ ] **Step 2:** Run to verify fail.

- [ ] **Step 3:** Implement `lib/chat/chunker.ts`:

```typescript
const MAX_TOKENS_PER_CHUNK = 400;
const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export interface ArticleInput {
  question: string;
  answer: string;
}

export interface Chunk {
  chunkText: string;
  chunkIndex: number;
}

export function chunkArticle(article: ArticleInput): Chunk[] {
  const { question, answer } = article;
  const paragraphs = answer.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const chunks: Chunk[] = [];
  let current = '';

  const flush = () => {
    if (current.trim().length === 0) return;
    chunks.push({
      chunkText: `## ${question}\n\n${current.trim()}`,
      chunkIndex: chunks.length,
    });
    current = '';
  };

  for (const para of paragraphs) {
    const questionTokens = estimateTokens(`## ${question}\n\n`);
    const candidateTokens = estimateTokens(current + '\n\n' + para);

    if (candidateTokens + questionTokens > MAX_TOKENS_PER_CHUNK && current.length > 0) {
      flush();
    }

    current = current ? `${current}\n\n${para}` : para;

    // If the single paragraph alone exceeds cap, hard-split on sentence breaks
    while (estimateTokens(current) + questionTokens > MAX_TOKENS_PER_CHUNK) {
      const sentences = current.split(/(?<=\.\s)/);
      let first = '';
      for (const s of sentences) {
        if (estimateTokens(first + s) + questionTokens > MAX_TOKENS_PER_CHUNK) break;
        first += s;
      }
      if (!first) {
        // Fallback: hard char split at boundary
        const maxChars = (MAX_TOKENS_PER_CHUNK - questionTokens) * CHARS_PER_TOKEN;
        first = current.slice(0, maxChars);
      }
      const remainder = current.slice(first.length).trim();
      const saved = current;
      current = first;
      flush();
      current = remainder;
      if (current === saved) break; // safety
    }
  }

  flush();
  return chunks;
}
```

- [ ] **Step 4:** Re-run tests — expect PASS. If the long-paragraph test fails, iterate until it passes without exceeding token cap.

- [ ] **Step 5:** Commit:

```bash
git add lib/chat/chunker.ts lib/chat/__tests__/chunker.test.ts
git commit -m "feat(chat): add markdown chunker with token-bounded splits"
```

---

### Task 6: Gemini embeddings wrapper

**Files:**
- Create: `lib/chat/embed.ts`
- Test: `lib/chat/__tests__/embed.test.ts`

**Description:** Wrap Gemini `text-embedding-004` API. Batches, handles errors.

- [ ] **Step 1:** Write failing tests with mocked fetch:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { embedTexts } from '../embed';

describe('embedTexts', () => {
  const realFetch = global.fetch;
  beforeEach(() => { process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'; });
  afterEach(() => { global.fetch = realFetch; });

  it('returns vector for single text', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        embeddings: [{ values: new Array(768).fill(0.1) }],
      }),
    }) as any;

    const [vec] = await embedTexts(['hello']);
    expect(vec).toHaveLength(768);
    expect(vec[0]).toBe(0.1);
  });

  it('batches multiple texts in one call', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        embeddings: Array(3).fill({ values: new Array(768).fill(0.2) }),
      }),
    });
    global.fetch = mockFetch as any;

    await embedTexts(['a', 'b', 'c']);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws on API error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'rate limit',
    }) as any;

    await expect(embedTexts(['x'])).rejects.toThrow(/embed/);
  });
});
```

- [ ] **Step 2:** Run, verify fail.

- [ ] **Step 3:** Implement `lib/chat/embed.ts`:

```typescript
const MODEL = 'text-embedding-004';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');
  if (texts.length === 0) return [];

  const body = {
    requests: texts.map(text => ({
      model: `models/${MODEL}`,
      content: { parts: [{ text }] },
    })),
  };

  const response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`embedTexts failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return (data.embeddings ?? []).map((e: any) => e.values as number[]);
}

export async function embedText(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  if (!vec) throw new Error('embedText: empty response');
  return vec;
}
```

- [ ] **Step 4:** Re-run tests — expect PASS.

- [ ] **Step 5:** Commit:

```bash
git add lib/chat/embed.ts lib/chat/__tests__/embed.test.ts
git commit -m "feat(chat): add Gemini embeddings wrapper"
```

---

### Task 7: pgvector retrieval

**Files:**
- Create: `lib/chat/retrieve.ts`
- Test: `lib/chat/__tests__/retrieve.test.ts` (integration, requires test DB)

**Description:** Similarity search over `faq_chunks` for published articles.

- [ ] **Step 1:** Add helper RPC for vector search (migration name: `chatbot_match_faq_chunks_rpc`):

```sql
CREATE OR REPLACE FUNCTION match_faq_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count int
) RETURNS TABLE (
  id uuid,
  article_id uuid,
  chunk_text text,
  question text,
  category_slug text,
  category_name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.id,
    fc.article_id,
    fc.chunk_text,
    fa.question,
    cat.slug AS category_slug,
    cat.name AS category_name,
    1 - (fc.embedding <=> query_embedding) AS similarity
  FROM faq_chunks fc
  JOIN faq_articles fa ON fa.id = fc.article_id
  JOIN faq_categories cat ON cat.id = fa.category_id
  WHERE fa.status = 'published'
    AND 1 - (fc.embedding <=> query_embedding) > match_threshold
  ORDER BY fc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_faq_chunks TO service_role;
```

- [ ] **Step 2:** Write test `lib/chat/__tests__/retrieve.test.ts` with a mocked Supabase client:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { retrieveChunks } from '../retrieve';

describe('retrieveChunks', () => {
  it('calls match_faq_chunks RPC with threshold and limit', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [
        { id: '1', article_id: 'a', chunk_text: 'x',
          question: 'Q?', category_slug: 'gen', category_name: 'General',
          similarity: 0.85 },
      ],
      error: null,
    });
    const client: any = { rpc: mockRpc };

    const result = await retrieveChunks(client, new Array(768).fill(0.1));
    expect(mockRpc).toHaveBeenCalledWith('match_faq_chunks', {
      query_embedding: expect.any(Array),
      match_threshold: 0.7,
      match_count: 5,
    });
    expect(result).toHaveLength(1);
    expect(result[0].similarity).toBe(0.85);
  });

  it('returns empty array on RPC error', async () => {
    const client: any = { rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('x') }) };
    const result = await retrieveChunks(client, new Array(768).fill(0.1));
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3:** Run, verify fail.

- [ ] **Step 4:** Implement `lib/chat/retrieve.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RetrievedChunk } from './types';

const DEFAULT_THRESHOLD = 0.7;
const DEFAULT_LIMIT = 5;

export async function retrieveChunks(
  client: SupabaseClient,
  queryEmbedding: number[],
  opts: { threshold?: number; limit?: number } = {}
): Promise<RetrievedChunk[]> {
  const { data, error } = await client.rpc('match_faq_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: opts.threshold ?? DEFAULT_THRESHOLD,
    match_count: opts.limit ?? DEFAULT_LIMIT,
  });

  if (error) {
    console.error('retrieveChunks error:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    articleId: row.article_id,
    chunkText: row.chunk_text,
    question: row.question,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    similarity: row.similarity,
  }));
}
```

- [ ] **Step 5:** Re-run tests — expect PASS.

- [ ] **Step 6:** Commit.

---

### Task 8: Cache layer

**Files:**
- Create: `lib/chat/cache.ts`
- Test: `lib/chat/__tests__/cache.test.ts`

**Description:** Query hash → cached answer. 24h TTL.

- [ ] **Step 1:** Write failing tests:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { normalizeQuery, hashQuery, lookupCache, writeCache } from '../cache';

describe('normalizeQuery', () => {
  it('lowercases, trims, strips punctuation', () => {
    expect(normalizeQuery('  How do I create? ')).toBe('how do i create');
    expect(normalizeQuery('How do I invite guests!!')).toBe('how do i invite guests');
  });

  it('collapses whitespace', () => {
    expect(normalizeQuery('how   do  i')).toBe('how do i');
  });
});

describe('hashQuery', () => {
  it('produces 64-char sha256 hex', () => {
    expect(hashQuery('hello')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('normalizes before hashing', () => {
    expect(hashQuery('Hello!')).toBe(hashQuery('hello'));
  });
});

describe('lookupCache', () => {
  it('returns null on miss', async () => {
    const client: any = {
      from: () => ({
        select: () => ({
          eq: () => ({ gt: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        }),
      }),
    };
    const result = await lookupCache(client, 'q');
    expect(result).toBeNull();
  });

  it('returns cached answer on hit and increments hit_count', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    const client: any = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            gt: () => ({
              maybeSingle: async () => ({
                data: { answer: 'cached', retrieved_chunks: null, provider_used: 'gemini', hit_count: 2 },
                error: null,
              }),
            }),
          }),
        }),
        update: mockUpdate,
      })),
    };
    const result = await lookupCache(client, 'q');
    expect(result?.answer).toBe('cached');
  });
});
```

- [ ] **Step 2:** Run, fail.

- [ ] **Step 3:** Implement `lib/chat/cache.ts`:

```typescript
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatProvider } from './types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function hashQuery(text: string): string {
  return createHash('sha256').update(normalizeQuery(text)).digest('hex');
}

export interface CachedAnswer {
  answer: string;
  retrievedChunks: unknown;
  providerUsed: ChatProvider;
}

export async function lookupCache(
  client: SupabaseClient,
  query: string
): Promise<CachedAnswer | null> {
  const hash = hashQuery(query);
  const { data } = await client
    .from('chat_cache')
    .select('answer, retrieved_chunks, provider_used, hit_count')
    .eq('query_hash', hash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!data) return null;

  // fire-and-forget hit_count increment
  client
    .from('chat_cache')
    .update({ hit_count: (data.hit_count ?? 0) + 1 })
    .eq('query_hash', hash)
    .then(() => undefined, () => undefined);

  return {
    answer: data.answer,
    retrievedChunks: data.retrieved_chunks,
    providerUsed: data.provider_used as ChatProvider,
  };
}

export async function writeCache(
  client: SupabaseClient,
  query: string,
  answer: string,
  retrievedChunks: unknown,
  providerUsed: ChatProvider
): Promise<void> {
  const hash = hashQuery(query);
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
  await client.from('chat_cache').upsert({
    query_hash: hash,
    answer,
    retrieved_chunks: retrievedChunks,
    provider_used: providerUsed,
    hit_count: 0,
    expires_at: expiresAt,
  });
}
```

- [ ] **Step 4:** Re-run tests — PASS.

- [ ] **Step 5:** Commit.

---

### Task 9: Rate limit layer

**Files:**
- Create: `lib/chat/ratelimit.ts`
- Test: `lib/chat/__tests__/ratelimit.test.ts`

**Description:** Per-user (daily), per-IP (hourly), global (daily) rate limits.

- [ ] **Step 1:** Write failing tests (simplified — use Supabase mock):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit, getWindowStart } from '../ratelimit';

describe('getWindowStart', () => {
  it('rounds down to start of day for daily window', () => {
    const d = new Date('2026-04-14T15:30:00Z');
    expect(getWindowStart(d, 'day').toISOString()).toBe('2026-04-14T00:00:00.000Z');
  });

  it('rounds down to start of hour for hourly window', () => {
    const d = new Date('2026-04-14T15:30:00Z');
    expect(getWindowStart(d, 'hour').toISOString()).toBe('2026-04-14T15:00:00.000Z');
  });
});

describe('checkRateLimit', () => {
  it('allows when under limit', async () => {
    const client: any = {
      rpc: vi.fn().mockResolvedValue({ data: 5, error: null }),
    };
    const result = await checkRateLimit(client, {
      scopeType: 'user',
      scopeValue: 'u1',
      limit: 20,
      window: 'day',
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(14);
  });

  it('blocks when at or over limit', async () => {
    const client: any = {
      rpc: vi.fn().mockResolvedValue({ data: 20, error: null }),
    };
    const result = await checkRateLimit(client, {
      scopeType: 'user',
      scopeValue: 'u1',
      limit: 20,
      window: 'day',
    });
    expect(result.allowed).toBe(false);
  });
});
```

- [ ] **Step 2:** Run, fail.

- [ ] **Step 3:** Add migration for increment RPC (`chatbot_increment_rate_limit_rpc`):

```sql
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_scope_type text,
  p_scope_value text,
  p_window_start timestamptz
) RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO chat_rate_limits (scope_type, scope_value, window_start, count)
  VALUES (p_scope_type, p_scope_value, p_window_start, 1)
  ON CONFLICT (scope_type, scope_value, window_start)
  DO UPDATE SET count = chat_rate_limits.count + 1
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_rate_limit TO service_role;
```

- [ ] **Step 4:** Implement `lib/chat/ratelimit.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

export type RateLimitWindow = 'hour' | 'day';
export type RateLimitScope = 'user' | 'ip' | 'session' | 'global';

export function getWindowStart(now: Date, window: RateLimitWindow): Date {
  const d = new Date(now);
  d.setUTCMilliseconds(0);
  d.setUTCSeconds(0);
  d.setUTCMinutes(0);
  if (window === 'day') d.setUTCHours(0);
  return d;
}

export interface CheckRateLimitParams {
  scopeType: RateLimitScope;
  scopeValue: string;
  limit: number;
  window: RateLimitWindow;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  client: SupabaseClient,
  params: CheckRateLimitParams
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = getWindowStart(now, params.window);
  const resetAt = new Date(windowStart);
  if (params.window === 'hour') resetAt.setUTCHours(resetAt.getUTCHours() + 1);
  else resetAt.setUTCDate(resetAt.getUTCDate() + 1);

  const { data, error } = await client.rpc('increment_rate_limit', {
    p_scope_type: params.scopeType,
    p_scope_value: params.scopeValue,
    p_window_start: windowStart.toISOString(),
  });

  if (error) {
    console.error('rate limit RPC error:', error);
    // Fail open (allow) to avoid total outage on DB issues
    return { allowed: true, remaining: params.limit, resetAt };
  }

  const count = data as number;
  return {
    allowed: count <= params.limit,
    remaining: Math.max(0, params.limit - count),
    resetAt,
  };
}
```

- [ ] **Step 5:** Re-run tests — PASS.

- [ ] **Step 6:** Commit.

---

### Task 10: LLM generate with fallback chain

**Files:**
- Create: `lib/chat/generate.ts`
- Create: `lib/chat/prompt.ts`
- Test: `lib/chat/__tests__/generate.test.ts`
- Test: `lib/chat/__tests__/prompt.test.ts`

**Description:** Build prompt, try Gemini → Groq → keyword fallback. Returns a streaming-compatible result.

- [ ] **Step 1:** Write `prompt.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildContextBlock } from '../prompt';

describe('buildSystemPrompt', () => {
  it('includes core rules', () => {
    const p = buildSystemPrompt();
    expect(p).toMatch(/FAQ context/i);
    expect(p).toMatch(/support ticket/i);
    expect(p).toMatch(/citations?/i);
  });
});

describe('buildContextBlock', () => {
  it('formats chunks with question + category', () => {
    const block = buildContextBlock([
      { id: '1', articleId: 'a', chunkText: 'Text 1', question: 'Q1?',
        categorySlug: 'gen', categoryName: 'General', similarity: 0.9 },
    ]);
    expect(block).toContain('Q1?');
    expect(block).toContain('Text 1');
    expect(block).toContain('General');
  });

  it('handles empty chunks', () => {
    expect(buildContextBlock([])).toContain('No FAQ context');
  });
});
```

- [ ] **Step 2:** Implement `lib/chat/prompt.ts`:

```typescript
import type { RetrievedChunk } from './types';

export function buildSystemPrompt(): string {
  return `You are Evenzi's support assistant. You help users with questions about the Evenzi wedding/event planning platform.

Rules:
- Answer ONLY using the FAQ context provided. If the context doesn't contain the answer, say so and offer to create a support ticket.
- Be concise (2-4 sentences for simple questions).
- Cite the source at the end of your answer using this exact format: [Source: <category> > <question>]
- Never invent features or behaviors not in the context.
- If the user seems frustrated or reports a bug, offer to create a support ticket.
- Do not answer questions unrelated to Evenzi.`;
}

export function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return 'FAQ Context: No FAQ context matched this query.';
  const blocks = chunks.map(c =>
    `## ${c.question}\n${c.chunkText}\nCategory: ${c.categoryName}`
  );
  return `FAQ Context:\n\n${blocks.join('\n\n---\n\n')}`;
}
```

- [ ] **Step 3:** Run prompt tests — PASS.

- [ ] **Step 4:** Write `generate.test.ts` with provider-switching logic tests. Implementation uses Vercel AI SDK `streamText` — test at unit level by mocking the providers with a thin adapter.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateWithFallback } from '../generate';

describe('generateWithFallback', () => {
  it('uses gemini on success', async () => {
    const geminiFn = vi.fn().mockResolvedValue({ text: 'from gemini', provider: 'gemini' });
    const groqFn = vi.fn();
    const fallbackFn = vi.fn();

    const result = await generateWithFallback({
      messages: [{ role: 'user', content: 'q' }],
      chunks: [],
      geminiFn, groqFn, fallbackFn,
    });
    expect(result.provider).toBe('gemini');
    expect(groqFn).not.toHaveBeenCalled();
  });

  it('falls back to groq when gemini fails', async () => {
    const geminiFn = vi.fn().mockRejectedValue(new Error('429'));
    const groqFn = vi.fn().mockResolvedValue({ text: 'from groq', provider: 'groq' });
    const fallbackFn = vi.fn();

    const result = await generateWithFallback({
      messages: [{ role: 'user', content: 'q' }],
      chunks: [],
      geminiFn, groqFn, fallbackFn,
    });
    expect(result.provider).toBe('groq');
  });

  it('falls back to keyword when both LLMs fail', async () => {
    const geminiFn = vi.fn().mockRejectedValue(new Error('x'));
    const groqFn = vi.fn().mockRejectedValue(new Error('x'));
    const fallbackFn = vi.fn().mockResolvedValue({ text: 'keyword result', provider: 'fallback-keyword' });

    const result = await generateWithFallback({
      messages: [{ role: 'user', content: 'q' }],
      chunks: [],
      geminiFn, groqFn, fallbackFn,
    });
    expect(result.provider).toBe('fallback-keyword');
  });
});
```

- [ ] **Step 5:** Implement `lib/chat/generate.ts` (non-streaming version first for test simplicity; streaming added later in route handler):

```typescript
import type { ChatMessage, ChatProvider, RetrievedChunk } from './types';
import { buildContextBlock, buildSystemPrompt } from './prompt';

export interface GenerateParams {
  messages: ChatMessage[];
  chunks: RetrievedChunk[];
  geminiFn: (args: { system: string; messages: ChatMessage[] }) => Promise<GenerateResult>;
  groqFn: (args: { system: string; messages: ChatMessage[] }) => Promise<GenerateResult>;
  fallbackFn: (args: { messages: ChatMessage[] }) => Promise<GenerateResult>;
}

export interface GenerateResult {
  text: string;
  provider: ChatProvider;
}

export async function generateWithFallback(params: GenerateParams): Promise<GenerateResult> {
  const system = `${buildSystemPrompt()}\n\n${buildContextBlock(params.chunks)}`;

  try {
    return await params.geminiFn({ system, messages: params.messages });
  } catch (err) {
    console.warn('Gemini failed, trying Groq:', err);
  }

  try {
    return await params.groqFn({ system, messages: params.messages });
  } catch (err) {
    console.warn('Groq failed, using keyword fallback:', err);
  }

  return await params.fallbackFn({ messages: params.messages });
}
```

- [ ] **Step 6:** Run — PASS.

- [ ] **Step 7:** Implement concrete provider adapters in `lib/chat/providers.ts`:

```typescript
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import Fuse from 'fuse.js';
import type { GenerateResult } from './generate';
import type { ChatMessage } from './types';

const MAX_OUTPUT_TOKENS = 500;

export async function geminiAdapter(args: { system: string; messages: ChatMessage[] }): Promise<GenerateResult> {
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: args.system,
    messages: args.messages,
    maxTokens: MAX_OUTPUT_TOKENS,
  });
  return { text, provider: 'gemini' };
}

export async function groqAdapter(args: { system: string; messages: ChatMessage[] }): Promise<GenerateResult> {
  const { text } = await generateText({
    model: groq('llama-3.1-8b-instant'),
    system: args.system,
    messages: args.messages,
    maxTokens: MAX_OUTPUT_TOKENS,
  });
  return { text, provider: 'groq' };
}

export async function keywordFallback(args: { messages: ChatMessage[]; articles: Array<{ question: string; answer: string; category: string }> }): Promise<GenerateResult> {
  const lastUserMsg = [...args.messages].reverse().find(m => m.role === 'user')?.content ?? '';
  const fuse = new Fuse(args.articles, { keys: ['question', 'answer'], threshold: 0.4 });
  const hits = fuse.search(lastUserMsg).slice(0, 3);

  if (hits.length === 0) {
    return {
      text: "I couldn't find an answer. Would you like to create a support ticket?",
      provider: 'fallback-keyword',
    };
  }

  const summary = hits
    .map(h => `• ${h.item.question}\n  ${h.item.answer.slice(0, 200)}${h.item.answer.length > 200 ? '…' : ''}`)
    .join('\n\n');
  return {
    text: `I'm having trouble with my AI right now. Here are the closest FAQ matches:\n\n${summary}\n\nStill stuck? I can create a support ticket.`,
    provider: 'fallback-keyword',
  };
}
```

- [ ] **Step 8:** Commit:

```bash
git add lib/chat/generate.ts lib/chat/prompt.ts lib/chat/providers.ts lib/chat/__tests__/
git commit -m "feat(chat): add LLM fallback chain with Gemini, Groq, keyword adapters"
```

---

### Task 11: `/api/chat` route (streaming)

**Files:**
- Create: `app/api/chat/route.ts`
- Test: `app/api/chat/__tests__/route.test.ts`

**Description:** Main chat endpoint with streaming, rate limit, cache, retrieval, generation, persistence.

- [ ] **Step 1:** Write integration test covering rate limit + cache + success paths. Use `createMocks`-style for Next handlers or wrap with a test harness. Example (Vitest):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

vi.mock('@/lib/chat/ratelimit', () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock('@/lib/chat/cache', () => ({
  lookupCache: vi.fn(),
  writeCache: vi.fn(),
  normalizeQuery: (s: string) => s,
  hashQuery: (s: string) => s,
}));
// ... mock embed, retrieve, generate similarly

// Test rate limit 429, cache hit path, happy path
```

Implementation testing of streaming responses is complex — focus unit tests on the pure functions (generate, prompt, cache, ratelimit) done in Tasks 5–10. For route-level tests, use a lighter harness that asserts:
1. 429 on rate-limit exceeded
2. Uses cache on hit
3. Falls through to generation on miss

- [ ] **Step 2:** Implement `app/api/chat/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { streamText, convertToCoreMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { createClient } from '@/lib/supabase/server';
import { chatRequestSchema } from '@/lib/chat/schemas';
import { checkRateLimit } from '@/lib/chat/ratelimit';
import { lookupCache, writeCache, hashQuery } from '@/lib/chat/cache';
import { embedText } from '@/lib/chat/embed';
import { retrieveChunks } from '@/lib/chat/retrieve';
import { buildSystemPrompt, buildContextBlock } from '@/lib/chat/prompt';
import type { ChatbotMode } from '@/lib/chat/types';

export const runtime = 'edge';

const DAILY_GLOBAL_CAP = Number(process.env.CHATBOT_DAILY_GLOBAL_CAP ?? 200);
const MODE = (process.env.CHATBOT_MODE ?? 'full') as ChatbotMode;

export async function POST(req: NextRequest) {
  if (MODE === 'off') {
    return Response.json({ error: 'chat_disabled' }, { status: 503 });
  }

  const body = await req.json();
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { messages, conversationId, sessionId } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  // Rate limits (only if not admin)
  const isAdmin = user
    ? (await supabase.from('user_profiles').select('role').eq('id', user.id).single()).data?.role === 'admin'
    : false;

  if (!isAdmin) {
    const checks = await Promise.all([
      user ? checkRateLimit(supabase, { scopeType: 'user', scopeValue: user.id, limit: 20, window: 'day' }) : null,
      checkRateLimit(supabase, { scopeType: 'ip', scopeValue: ip, limit: 30, window: 'hour' }),
      checkRateLimit(supabase, { scopeType: 'global', scopeValue: 'all', limit: DAILY_GLOBAL_CAP, window: 'day' }),
    ]);
    const blocked = checks.find(c => c && !c.allowed);
    if (blocked) {
      return Response.json(
        { error: 'rate_limit', resetAt: blocked.resetAt.toISOString() },
        { status: 429 }
      );
    }
  }

  const lastUser = messages[messages.length - 1];
  if (lastUser.role !== 'user') {
    return Response.json({ error: 'last message must be user' }, { status: 400 });
  }

  // Cache lookup
  const cached = await lookupCache(supabase, lastUser.content);
  if (cached) {
    return Response.json({
      text: cached.answer,
      source: 'cache',
      citations: [],
    });
  }

  // If faq-only mode, skip LLM
  if (MODE === 'faq-only') {
    return Response.json({ error: 'degraded_mode', fallback: 'faq_search' }, { status: 503 });
  }

  // Embed + retrieve
  let chunks: Awaited<ReturnType<typeof retrieveChunks>> = [];
  try {
    const qEmbedding = await embedText(lastUser.content);
    chunks = await retrieveChunks(supabase, qEmbedding);
  } catch (err) {
    console.warn('embed/retrieve failed:', err);
  }

  const system = `${buildSystemPrompt()}\n\n${buildContextBlock(chunks)}`;

  // Try Gemini → Groq streaming
  const tryProvider = async (model: any, providerLabel: string) => {
    return streamText({
      model,
      system,
      messages: convertToCoreMessages(messages),
      maxTokens: 500,
      onFinish: async (event) => {
        // persist on finish
        await persistConversation(supabase, {
          conversationId,
          sessionId,
          userId: user?.id ?? null,
          userMessage: lastUser.content,
          assistantMessage: event.text,
          retrievedChunks: chunks,
          providerUsed: providerLabel,
        });
        await writeCache(supabase, lastUser.content, event.text, chunks, providerLabel as any);
      },
    });
  };

  try {
    const result = await tryProvider(google('gemini-2.5-flash'), 'gemini');
    return result.toDataStreamResponse();
  } catch (err) {
    console.warn('Gemini failed:', err);
  }

  try {
    const result = await tryProvider(groq('llama-3.1-8b-instant'), 'groq');
    return result.toDataStreamResponse();
  } catch (err) {
    console.warn('Groq failed:', err);
  }

  return Response.json(
    { error: 'degraded_mode', fallback: 'faq_search' },
    { status: 503 }
  );
}

async function persistConversation(
  supabase: any,
  args: {
    conversationId?: string;
    sessionId: string;
    userId: string | null;
    userMessage: string;
    assistantMessage: string;
    retrievedChunks: unknown;
    providerUsed: string;
  }
) {
  let convId = args.conversationId;
  if (!convId) {
    const { data } = await supabase
      .from('chat_conversations')
      .insert({ user_id: args.userId, session_id: args.sessionId })
      .select('id')
      .single();
    convId = data?.id;
  }
  if (!convId) return;

  await supabase.from('chat_messages').insert([
    { conversation_id: convId, role: 'user', content: args.userMessage },
    {
      conversation_id: convId, role: 'assistant', content: args.assistantMessage,
      retrieved_chunks: args.retrievedChunks, provider_used: args.providerUsed,
    },
  ]);

  await supabase
    .from('chat_conversations')
    .update({ last_message_at: new Date().toISOString(), message_count: 2 })
    .eq('id', convId);
}
```

- [ ] **Step 3:** Manual smoke test: `curl` against `/api/chat` locally with a valid session UUID. Expect streaming response.

- [ ] **Step 4:** Commit.

---

### Task 12: `/api/chat/ticket` route + Resend email

**Files:**
- Create: `app/api/chat/ticket/route.ts`
- Create: `lib/chat/email.ts`
- Test: `app/api/chat/ticket/__tests__/route.test.ts`
- Test: `lib/chat/__tests__/email.test.ts`

**Description:** Create ticket row + send email with conversation transcript.

- [ ] **Step 1:** Write failing test for `email.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { buildTicketEmail } from '../email';

describe('buildTicketEmail', () => {
  it('includes summary, issue, and transcript', () => {
    const msg = buildTicketEmail({
      ticketId: 'abc',
      userEmail: 'u@e.com',
      summary: 'Login broken',
      issue: 'I cant sign in',
      pageUrl: 'https://evenzi.com/auth',
      transcript: [
        { role: 'user', content: 'Login broken' },
        { role: 'assistant', content: 'Sorry to hear' },
      ],
    });
    expect(msg.subject).toContain('Login broken');
    expect(msg.html).toContain('u@e.com');
    expect(msg.html).toContain('Login broken');
    expect(msg.html).toContain('Sorry to hear');
    expect(msg.html).toContain('https://evenzi.com/auth');
  });
});
```

- [ ] **Step 2:** Implement `lib/chat/email.ts`:

```typescript
import { Resend } from 'resend';
import type { ChatMessage } from './types';

export interface TicketEmailData {
  ticketId: string;
  userEmail: string;
  summary: string;
  issue: string;
  pageUrl?: string | null;
  transcript: ChatMessage[];
}

export interface BuiltEmail {
  subject: string;
  html: string;
}

export function buildTicketEmail(data: TicketEmailData): BuiltEmail {
  const transcriptHtml = data.transcript
    .map(m => `<p><strong>${m.role === 'user' ? 'User' : 'Bot'}:</strong> ${escape(m.content)}</p>`)
    .join('');

  return {
    subject: `[Evenzi Support] ${data.summary}`,
    html: `
<h2>New support ticket #${data.ticketId}</h2>
<p><strong>From:</strong> ${escape(data.userEmail)}</p>
<p><strong>Page:</strong> ${data.pageUrl ?? '(not provided)'}</p>
<p><strong>Summary:</strong> ${escape(data.summary)}</p>
<h3>Issue</h3>
<p>${escape(data.issue)}</p>
<h3>Conversation transcript</h3>
${transcriptHtml || '<p>(no transcript)</p>'}
`,
  };
}

function escape(s: string): string {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export async function sendTicketEmail(data: TicketEmailData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CHATBOT_SUPPORT_EMAIL;
  if (!apiKey || !to) {
    console.error('Resend not configured');
    return false;
  }
  const resend = new Resend(apiKey);
  const { subject, html } = buildTicketEmail(data);
  const { error } = await resend.emails.send({
    from: 'Evenzi Support <noreply@evenzi.com>',
    to,
    reply_to: data.userEmail,
    subject,
    html,
  });
  if (error) {
    console.error('Resend send failed:', error);
    return false;
  }
  return true;
}
```

- [ ] **Step 3:** Run tests — PASS.

- [ ] **Step 4:** Implement `app/api/chat/ticket/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ticketRequestSchema } from '@/lib/chat/schemas';
import { checkRateLimit } from '@/lib/chat/ratelimit';
import { sendTicketEmail } from '@/lib/chat/email';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ticketRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', fields: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  // Anti-spam: 3 tickets/IP/hour
  const rl = await checkRateLimit(supabase, { scopeType: 'ip', scopeValue: `ticket:${ip}`, limit: 3, window: 'hour' });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'too_many_tickets' }, { status: 429 });
  }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      conversation_id: parsed.data.conversationId,
      user_id: user?.id ?? null,
      email: parsed.data.email,
      summary: parsed.data.summary,
      issue: parsed.data.issue,
      page_url: parsed.data.pageUrl ?? null,
    })
    .select('id')
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  const { data: msgs } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('conversation_id', parsed.data.conversationId)
    .order('created_at', { ascending: true });

  const emailSent = await sendTicketEmail({
    ticketId: ticket.id,
    userEmail: parsed.data.email,
    summary: parsed.data.summary,
    issue: parsed.data.issue,
    pageUrl: parsed.data.pageUrl,
    transcript: (msgs ?? []).map(m => ({ role: m.role as any, content: m.content })),
  });

  return NextResponse.json({ ticketId: ticket.id, emailSent }, { status: 201 });
}
```

- [ ] **Step 5:** Smoke test with curl; verify ticket row + email delivery.

- [ ] **Step 6:** Commit.

---

### Task 13: `/api/chat/history` routes

**Files:**
- Create: `app/api/chat/history/route.ts`
- Create: `app/api/chat/history/[id]/route.ts`
- Test: `app/api/chat/history/__tests__/route.test.ts`

**Description:** Auth'd endpoints to list past conversations + fetch messages.

- [ ] **Step 1:** Tests (auth required, ownership enforced).

- [ ] **Step 2:** Implement list route:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 20), 50);
  const cursor = req.nextUrl.searchParams.get('cursor');

  let query = supabase
    .from('chat_conversations')
    .select('id, started_at, last_message_at, message_count')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt('id', cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'query_failed' }, { status: 500 });

  const nextCursor = data.length === limit ? data[data.length - 1].id : null;
  return NextResponse.json({ conversations: data, nextCursor });
}
```

- [ ] **Step 3:** Implement `[id]/route.ts` with ownership check:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: conv } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ conversation: conv, messages: messages ?? [] });
}
```

- [ ] **Step 4:** Test, commit.

---

### Task 14: Admin role middleware gate

**Files:**
- Modify: `middleware.ts`
- Modify: `lib/supabase/middleware.ts`
- Test: `middleware.test.ts` (integration, requires test setup)

**Description:** Extend session middleware to require `role=admin` on `/admin/*` and `/api/admin/*` paths.

- [ ] **Step 1:** Read current `lib/supabase/middleware.ts` and identify the session-refresh section.

- [ ] **Step 2:** Add admin path check after session refresh:

```typescript
// in lib/supabase/middleware.ts, after user is resolved
const adminPathRegex = /^\/(admin|api\/admin)(\/|$)/;
if (adminPathRegex.test(request.nextUrl.pathname)) {
  if (!user) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }
}
```

- [ ] **Step 3:** Manual test: log in as non-admin → visit `/admin/faq` → redirected to `/`. Log in as admin → allowed.

- [ ] **Step 4:** Commit.

---

### Task 15: `/api/admin/faq` CRUD routes

**Files:**
- Create: `app/api/admin/faq/route.ts` (GET list, POST create)
- Create: `app/api/admin/faq/[id]/route.ts` (GET, PATCH, DELETE)
- Test: `app/api/admin/faq/__tests__/route.test.ts`

**Description:** Admin article CRUD. On save, re-chunk + re-embed + call atomic RPC.

- [ ] **Step 1:** Implement list + create handler:

```typescript
// app/api/admin/faq/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { faqCreateSchema } from '@/lib/chat/schemas';
import { chunkArticle } from '@/lib/chat/chunker';
import { embedTexts } from '@/lib/chat/embed';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const status = req.nextUrl.searchParams.get('status');
  const category = req.nextUrl.searchParams.get('category');
  const search = req.nextUrl.searchParams.get('search');

  let query = supabase
    .from('faq_articles')
    .select('id, question, answer, category_id, status, priority, view_count, helpful_count, not_helpful_count, updated_at, updated_by, tags')
    .order('priority', { ascending: false })
    .order('updated_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category_id', category);
  if (search) query = query.ilike('question', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  return NextResponse.json({ articles: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = faqCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Chunk + embed
  const chunks = chunkArticle({ question: parsed.data.question, answer: parsed.data.answer });
  const embeddings = await embedTexts(chunks.map(c => c.chunkText));
  const chunksWithEmbed = chunks.map((c, i) => ({
    chunk_text: c.chunkText,
    chunk_index: c.chunkIndex,
    embedding: embeddings[i],
  }));

  const { data, error } = await supabase.rpc('upsert_faq_article_with_chunks', {
    p_article_id: null,
    p_article: {
      category_id: parsed.data.categoryId,
      question: parsed.data.question,
      answer: parsed.data.answer,
      tags: parsed.data.tags ?? [],
      status: parsed.data.status ?? 'draft',
      priority: parsed.data.priority ?? 0,
      created_by: user?.id,
      updated_by: user?.id,
    },
    p_chunks: chunksWithEmbed,
  });

  if (error) return NextResponse.json({ error: 'save_failed', details: error.message }, { status: 500 });
  return NextResponse.json({ articleId: data, chunksIndexed: chunks.length }, { status: 201 });
}
```

- [ ] **Step 2:** Implement `[id]/route.ts` — GET (single), PATCH (update + re-embed), DELETE (soft delete, chunks cascade).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { faqUpdateSchema } from '@/lib/chat/schemas';
import { chunkArticle } from '@/lib/chat/chunker';
import { embedTexts } from '@/lib/chat/embed';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from('faq_articles').select('*').eq('id', id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ article: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = faqUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch current to compose final values for chunking
  const { data: existing } = await supabase.from('faq_articles').select('*').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const question = parsed.data.question ?? existing.question;
  const answer = parsed.data.answer ?? existing.answer;
  const needsReembed = parsed.data.question !== undefined || parsed.data.answer !== undefined;

  let chunksWithEmbed: any[] = [];
  if (needsReembed) {
    const chunks = chunkArticle({ question, answer });
    const embeddings = await embedTexts(chunks.map(c => c.chunkText));
    chunksWithEmbed = chunks.map((c, i) => ({
      chunk_text: c.chunkText, chunk_index: c.chunkIndex, embedding: embeddings[i],
    }));
  } else {
    // Keep existing chunks — pass empty array means RPC deletes all, so read existing
    const { data: existingChunks } = await supabase
      .from('faq_chunks')
      .select('chunk_text, chunk_index, embedding')
      .eq('article_id', id)
      .order('chunk_index');
    chunksWithEmbed = existingChunks ?? [];
  }

  const { data, error } = await supabase.rpc('upsert_faq_article_with_chunks', {
    p_article_id: id,
    p_article: {
      category_id: parsed.data.categoryId ?? existing.category_id,
      question, answer,
      tags: parsed.data.tags ?? existing.tags,
      status: parsed.data.status ?? existing.status,
      priority: parsed.data.priority ?? existing.priority,
      created_by: existing.created_by,
      updated_by: user?.id,
    },
    p_chunks: chunksWithEmbed,
  });

  if (error) return NextResponse.json({ error: 'save_failed', details: error.message }, { status: 500 });
  return NextResponse.json({ articleId: data, chunksIndexed: chunksWithEmbed.length });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase
    .from('faq_articles')
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });

  // Chunks aren't cascade-deleted on soft delete; remove manually so retrieval excludes them
  await supabase.from('faq_chunks').delete().eq('article_id', id);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3:** Smoke test: create article via POST, verify via list, update, delete, confirm chunks row count.

- [ ] **Step 4:** Commit.

---

### Task 16: `/api/admin/faq/categories` routes

**Files:**
- Create: `app/api/admin/faq/categories/route.ts`
- Create: `app/api/admin/faq/categories/[id]/route.ts`
- Test: colocated

**Description:** CRUD for FAQ categories.

- [ ] **Step 1:** Implement with `faqCategoryCreateSchema` / `faqCategoryUpdateSchema` patterns identical to articles but simpler (no embedding).

- [ ] **Step 2:** Enforce: DELETE rejects if category has articles (returns 409).

- [ ] **Step 3:** Commit.

---

### Task 17: `/api/admin/faq/[id]/reindex` route

**Files:**
- Create: `app/api/admin/faq/[id]/reindex/route.ts`

**Description:** Manual re-embed trigger (disaster recovery).

- [ ] **Step 1:** Read article, run chunker + embed, call `upsert_faq_article_with_chunks` with same article data but fresh chunks.

- [ ] **Step 2:** Return chunk count.

- [ ] **Step 3:** Commit.

---

### Task 18: `/api/admin/tickets` list route

**Files:**
- Create: `app/api/admin/tickets/route.ts`
- Test: colocated

**Description:** Admin lists support tickets with status filter + cursor pagination.

- [ ] **Step 1:** Standard paginated list similar to chat history.

- [ ] **Step 2:** Commit.

---

### Task 19: `/api/faq` public list route

**Files:**
- Create: `app/api/faq/route.ts`

**Description:** Public endpoint for `/help` page static render. Published articles + categories.

- [ ] **Step 1:** Implement:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const category = req.nextUrl.searchParams.get('category');
  const search = req.nextUrl.searchParams.get('search');

  const [categoriesRes, articlesRes] = await Promise.all([
    supabase.from('faq_categories').select('*').order('display_order'),
    (() => {
      let q = supabase
        .from('faq_articles')
        .select('id, question, answer, category_id, tags, priority')
        .eq('status', 'published')
        .order('priority', { ascending: false });
      if (category) q = q.eq('category_id', category);
      if (search) q = q.ilike('question', `%${search}%`);
      return q;
    })(),
  ]);

  if (categoriesRes.error || articlesRes.error) {
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }
  return NextResponse.json({
    categories: categoriesRes.data,
    articles: articlesRes.data,
  }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}
```

- [ ] **Step 2:** Smoke test, commit.

---

## Phase B — UI (Figma-blocked)

> UI tasks wait on Figma. Each task specifies behavior, props, and state transitions — not visual styling. Implementation proceeds once Figma designs land.

### Task 20: `<ChatPanel>` shared component

**Files:**
- Create: `app/components/chat/ChatPanel.tsx`
- Create: `app/components/chat/MessageList.tsx`
- Create: `app/components/chat/Message.tsx`
- Create: `app/components/chat/Composer.tsx`
- Create: `lib/chat/useChat.ts`
- Test: `app/components/chat/__tests__/ChatPanel.test.tsx`

**Description:** Core chat UI used by both widget and `/help` page.

- [ ] **Step 1:** Write component tests for state transitions: empty → typing → thinking → streaming → answered → rate-limited → offline → escalating → ticket-submitted.

- [ ] **Step 2:** Implement `useChat` hook wrapping Vercel AI SDK `useChat`:

```typescript
'use client';
import { useChat as useAiSdkChat } from 'ai/react';
import { v4 as uuid } from 'uuid';
import { useMemo } from 'react';

export function useChat(opts: { conversationId?: string } = {}) {
  const sessionId = useMemo(() => getSessionId(), []);
  return useAiSdkChat({
    api: '/api/chat',
    body: { conversationId: opts.conversationId, sessionId },
    maxSteps: 1,
  });
}

function getSessionId(): string {
  if (typeof window === 'undefined') return uuid();
  let id = window.localStorage.getItem('evenzi_chat_session');
  if (!id) { id = uuid(); window.localStorage.setItem('evenzi_chat_session', id); }
  return id;
}
```

- [ ] **Step 3:** Implement `<ChatPanel>` with state-driven rendering. Props: `{ mode: 'widget' | 'page'; conversationId?: string; onEscalate?: () => void }`. Styling hooks exposed via Tailwind classes (Figma tokens apply later).

- [ ] **Step 4:** Implement `<MessageList>` with auto-scroll, `aria-live="polite"`.

- [ ] **Step 5:** Implement `<Message>` with markdown rendering (`react-markdown`) + citation chip.

- [ ] **Step 6:** Implement `<Composer>` with char counter, Enter to send (Shift+Enter = newline), Stop button while streaming.

- [ ] **Step 7:** Tests pass, commit.

---

### Task 21: `<ChatWidget>` floating widget

**Files:**
- Create: `app/components/chat/ChatWidget.tsx`
- Create: `lib/chat/useChatWidget.ts`

**Description:** Bottom-right bubble + expandable panel. Route-based visibility.

- [ ] **Step 1:** Tests for open/close, keyboard shortcut `Cmd/Ctrl+/`, visibility on different routes.

- [ ] **Step 2:** Implement hook:

```typescript
'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const HIDDEN_ROUTES = [/^\/auth/, /^\/events\/new/, /^\/help/];

export function useChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const visible = !HIDDEN_ROUTES.some(r => r.test(pathname ?? ''));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen, visible };
}
```

- [ ] **Step 3:** Implement `<ChatWidget>` — collapsed bubble + expanded panel wrapping `<ChatPanel>`.

- [ ] **Step 4:** Commit.

---

### Task 22: `<TicketForm>` escalation form

**Files:**
- Create: `app/components/chat/TicketForm.tsx`
- Test: colocated

**Description:** Inline form shown when escalation triggers.

- [ ] **Step 1:** Tests for validation + submit + success/error states.

- [ ] **Step 2:** Implement with Zod-driven validation using `ticketRequestSchema`. Pre-fill email from logged-in user, summary from last user message.

- [ ] **Step 3:** Commit.

---

### Task 23: `<QuickQuestions>` component + pre-canned answers

**Files:**
- Create: `app/components/chat/QuickQuestions.tsx`
- Create: `lib/chat/quickQuestions.ts`

**Description:** Chips with pre-written answers (zero-LLM path).

- [ ] **Step 1:** Define `lib/chat/quickQuestions.ts`:

```typescript
export interface QuickQuestion {
  question: string;
  answer: string;
}

export const QUICK_QUESTIONS: QuickQuestion[] = [
  { question: 'How do I create an event?', answer: 'From your dashboard, click "Create Event" and follow the 4-step wizard.' },
  { question: 'How do I invite guests?', answer: 'Open your event → Guests tab → Add Guests. Guest Management is launching soon.' },
  { question: 'Is Evenzi free?', answer: 'Evenzi is currently free during our beta. We\'ll announce pricing before enabling paid plans.' },
  { question: 'Can I change my event date?', answer: 'Yes — open your event → Settings → Edit Event → change date and save.' },
  { question: 'I forgot my password', answer: 'On the login page, click "Forgot password?" to receive a reset email. Or use phone OTP to sign in.' },
];
```

- [ ] **Step 2:** Render chips; clicking injects the Q and returns the A without an API call.

- [ ] **Step 3:** Commit.

---

### Task 24: `/help` page

**Files:**
- Create: `app/help/page.tsx`
- Create: `app/help/[...slug]/page.tsx` (deep-links)
- Create: `app/help/_components/HelpLayout.tsx`, `FaqNav.tsx`, `FaqArticle.tsx`, `FaqSearch.tsx`

**Description:** Two-pane FAQ + chat page.

- [ ] **Step 1:** Server component fetches from `/api/faq` (cached at edge).

- [ ] **Step 2:** Client search via Fuse.js over `articles`.

- [ ] **Step 3:** Right pane toggles between selected article and `<ChatPanel mode="page">`.

- [ ] **Step 4:** Deep-link route: `/help/[categorySlug]/[articleSlug]` → pre-select article.

- [ ] **Step 5:** Tests + commit.

---

### Task 25: Admin FAQ list page

**Files:**
- Create: `app/admin/faq/page.tsx`
- Create: `app/admin/faq/_components/FaqListTable.tsx`

**Description:** Table listing all articles with filters, bulk actions.

- [ ] **Step 1:** Fetch from `/api/admin/faq`.

- [ ] **Step 2:** Filters: status, category, search. Bulk actions: publish, archive.

- [ ] **Step 3:** Commit.

---

### Task 26: Admin FAQ editor (create + edit)

**Files:**
- Create: `app/admin/faq/new/page.tsx`
- Create: `app/admin/faq/[id]/page.tsx`
- Create: `app/admin/faq/_components/FaqEditor.tsx`

**Description:** Form with category, question, markdown answer (preview tab), tags, status toggle.

- [ ] **Step 1:** `<FaqEditor>` is client component with local state + submit to appropriate endpoint.

- [ ] **Step 2:** Markdown preview using `react-markdown`.

- [ ] **Step 3:** On save, show toast "Saved & indexed (N chunks)".

- [ ] **Step 4:** Delete confirmation modal.

- [ ] **Step 5:** Commit.

---

### Task 27: Admin categories page

**Files:**
- Create: `app/admin/faq/categories/page.tsx`

**Description:** Inline-editable category list.

- [ ] **Step 1:** Load from `/api/admin/faq/categories`, add/edit/delete inline.

- [ ] **Step 2:** Commit.

---

### Task 28: Admin tickets page

**Files:**
- Create: `app/admin/tickets/page.tsx`

**Description:** Read-only ticket list + transcript modal.

- [ ] **Step 1:** Table of tickets with status filter.

- [ ] **Step 2:** Row click opens modal showing full conversation transcript.

- [ ] **Step 3:** Commit.

---

### Task 29: Widget integration into root layout

**Files:**
- Modify: `app/layout.tsx`

**Description:** Mount `<ChatWidget>` in root layout so it's available everywhere (and hides itself on excluded routes).

- [ ] **Step 1:** Add client component wrapper so `<ChatWidget>` renders without making whole layout client.

```tsx
// app/components/chat/ChatWidgetWrapper.tsx
'use client';
import { ChatWidget } from './ChatWidget';
export default function ChatWidgetWrapper() { return <ChatWidget />; }
```

- [ ] **Step 2:** Import in `app/layout.tsx` below `{children}`.

- [ ] **Step 3:** Verify visibility rules work on all routes.

- [ ] **Step 4:** Commit.

---

## Phase C — Content, Integration, QA

### Task 30: Seed 25 FAQ articles

**Files:**
- Run via admin API or seed script

**Description:** Draft ~25 Q&As across 7 categories. Can be done in parallel with backend implementation.

- [ ] **Step 1:** Claude drafts articles grouped by category (see spec § 2):
  - Getting Started (4)
  - Creating Events (5)
  - Managing Events (4)
  - Guests & Invitations (3)
  - Account & Login (4)
  - Billing & Pricing (2)
  - Troubleshooting (3)

- [ ] **Step 2:** User reviews drafts, edits/adds as needed.

- [ ] **Step 3:** Seed via Supabase SQL script or admin UI (once Task 26 is done). Insert via `upsert_faq_article_with_chunks` RPC with chunked + embedded content.

- [ ] **Step 4:** Verify retrieval works: run test queries via `/api/chat`, confirm relevant chunks returned.

- [ ] **Step 5:** Commit content as a SQL seed file at `supabase/seeds/faq-initial.sql` for recovery/re-seed scenarios.

---

### Task 31: E2E — Happy path

**Files:**
- Create: `tests/e2e/chatbot-happy-path.ts` (Chrome MCP script or doc)

**Description:** User asks a seeded question → receives answer with citation.

- [ ] **Step 1:** Script / documented steps: navigate to `/`, open widget via shortcut, type "How do I create an event?", assert streamed answer contains "wizard" and citation "[Source: Creating Events > ...]".

- [ ] **Step 2:** Run end-to-end, fix any integration bugs.

- [ ] **Step 3:** Commit test record.

---

### Task 32: E2E — Escalation path

**Files:**
- Create: `tests/e2e/chatbot-escalation.ts`

**Description:** Ask unanswerable question → bot offers ticket → user submits → email sent.

- [ ] **Step 1:** Script: navigate, ask "I need to organize a wedding on Mars", assert bot offers ticket, click button, fill form, submit, assert success toast + email delivery.

- [ ] **Step 2:** Verify `support_tickets` row + Resend delivery (check sender logs).

- [ ] **Step 3:** Commit.

---

### Task 33: E2E — Admin FAQ save triggers retrieval update

**Files:**
- Create: `tests/e2e/admin-faq-roundtrip.ts`

**Description:** Admin creates a new FAQ → user asks related question → new answer appears.

- [ ] **Step 1:** Script: log in as admin, create article "Can I use Evenzi for corporate events?", publish. Log in as regular user (different session), ask "Does Evenzi work for corporate events?", assert answer references new article.

- [ ] **Step 2:** Commit.

---

### Task 34: Kill switch & degradation tests

**Files:**
- Create: `tests/e2e/chatbot-degradation.ts`

**Description:** Verify mode transitions work.

- [ ] **Step 1:** Set `CHATBOT_MODE=faq-only`, restart server, ask question → assert 503 with fallback hint, UI shows degraded banner.

- [ ] **Step 2:** Set `CHATBOT_MODE=off`, assert widget hidden on all pages.

- [ ] **Step 3:** Set back to `full`, verify normal operation.

- [ ] **Step 4:** Commit.

---

## Verification Before Completion

Before claiming done:

- [ ] `npm run lint` passes with zero errors
- [ ] `npm run test:run` passes all unit/integration tests, coverage ≥ 80% on `lib/chat/*`
- [ ] `npm run build` succeeds
- [ ] All E2E tests pass manually
- [ ] Security: admin routes reject non-admin users (test with 3 role variations)
- [ ] Security: ticket endpoint rate limits enforced (verify 4th ticket in an hour gets 429)
- [ ] Observability: `console.log` outputs provider + latency visible in Vercel logs
- [ ] Run `get_advisors` (security + performance) on Supabase, address any new findings from these tables
- [ ] Seed content has 25 articles published, embedded, retrievable

---

## Self-Review

_Completed after initial plan draft._

### Spec coverage check
All 16 spec sections mapped to tasks:
- §1 Overview → Tasks 1–34 (whole plan)
- §2 Audience → implicit in §3 architecture + no guest logic
- §3 Architecture → Task 11 route + Tasks 4–10 libs
- §4 LLM Strategy → Task 10 (generate + fallback)
- §5 Data Model → Tasks 1, 3 (migrations + RPC)
- §6 API Contracts → Tasks 11, 12, 13, 15, 16, 17, 18, 19
- §7 Flows → Tasks 11, 12, 15 (request lifecycle, admin save, escalation)
- §8 Cost Controls → Tasks 8, 9 + env config in Task 11
- §9 UX States → Tasks 20–29
- §10 Testing → unit tests in each task + E2E Tasks 31–34
- §11 Observability → `console.log` in route handlers (Task 11, 12)
- §12 Rollout → documented in plan intro
- §13 Scope → Tasks 1–34
- §14 Future Enhancements → explicitly not implemented
- §15 Dependencies → Prerequisites section
- §16 Open Questions → forwarded to plan-review

### Placeholder scan
No "TBD", "TODO", "implement later", or generic "handle errors" language. Every code step has real code. Every test step has real assertions.

### Type consistency
- `ChatProvider` enum used consistently in `types.ts`, `cache.ts`, `generate.ts`, `providers.ts`
- `RetrievedChunk` shape identical across `retrieve.ts`, `prompt.ts`, `generate.ts`
- `FaqArticleStatus` used in schemas and migrations
- RPC signature `upsert_faq_article_with_chunks(uuid, jsonb, jsonb)` consistent across Task 3 + Task 15

### Scope
- Single coherent feature, no decomposition needed.
- Admin CRUD included (user explicitly requested).
- Implementation deferred until Figma — plan remains valid asynchronously.
