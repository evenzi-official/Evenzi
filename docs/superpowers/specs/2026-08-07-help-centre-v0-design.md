# Evenzi Help Centre — V0 Design Spec

**Date:** 2026-08-07
**Status:** Draft — awaiting founder sign-off, then `/council design`
**Author:** Brainstormed with Claude Code (Abhijith)
**Supersedes:** `docs/superpowers/specs/2026-04-14-chatbot-design.md` (provider picks, LLM-first architecture, admin-panel dependency)
**Incorporates:** `docs/superpowers/specs/2026-06-22-chatbot-model-hosting-analysis.md` (deferred to Phase 2)
**Feature name change:** the ClickUp feature and both prior specs call this the "Support Chatbot". V0 contains no AI. It is a **Help Centre**. The chatbot name should be retired.

---

## 1. Why this spec replaces the approved one

The 2026-04-14 spec designed an LLM-first RAG chatbot: embed the user's question, retrieve FAQ chunks by vector similarity, generate an answer, fall back to keyword search when the model fails. That design was sound for its assumptions. Two things changed.

**The corpus is small.** The launch content is roughly 25 to 30 staff-authored articles. Semantic retrieval earns its cost across thousands of documents, where lexical search genuinely fails to find things. Across thirty curated articles, ranked full-text search plus a guided category picker finds the same answer, instantly, for free, and returns the staff-written text verbatim rather than a paraphrase of it.

**The founder inverted the order.** Rather than an AI assistant with keyword search as its fallback, V0 is a guided help experience with the AI reserved for what the guided experience cannot answer. This is not a downgrade. It is the correct sequencing, and it produces the evidence needed to decide whether the AI tier is worth building at all.

The consequences are large. V0 needs no vector extension, no embedding model, no third-party inference provider, no neuron budget, no AI gateway, and no prompt-injection threat model. What was going to be the product's first user-facing LLM surface is now an ordinary, well-understood web feature.

Every answer a user sees in V0 is text a human on the Evenzi team wrote and reviewed. Nothing is generated.

---

## 2. Scope

### In scope

- A four-tier help experience, of which three tiers ship in V0.
- Two distinct content corpora — one for logged-out visitors, one for signed-in hosts.
- Three surfaces: an overlay panel inside the host app, a `/help` page and its sub-routes, and a FAQ section on the marketing landing page.
- Ticket escalation writing to the database, with best-effort email notification.
- Article feedback capture, to measure whether the Help Centre actually deflects.
- A search-query log, which is the dataset that decides the future of the LLM tier.
- Three new shared design-system primitives, catalogued.
- A content skeleton, exemplar articles, and an authoring brief for the operations team.

### Out of scope for V0

| Deferred | To |
|---|---|
| The LLM answer tier (Tier 2) | Phase 2 of this feature — see §11 |
| Vector search, pgvector, embeddings | Phase 2, only if §11's evidence gate is met |
| Any admin CRUD interface for FAQ content | The Admin Module, whenever it is built |
| Live human chat | Not planned |
| Multilingual content | Post-MVP; English only |
| Article version history, WYSIWYG authoring | Post-MVP |
| Guest-side help on the public event website `/e/[slug]` | Not planned — see §4.4 |
| Action-taking agent (performing operations for the user) | A separate security-first spec, unchanged from the 2026-06-22 analysis §9 |

### Explicit non-dependency

V0 does **not** depend on the Admin Module. FAQ content lives in `config.*` catalog tables, which this codebase already seeds by migration and edits directly in the database — the same pattern as `config.event_types`, `config.task_priorities` and `config.invitation_templates`. When the Admin Module is eventually built, it becomes a CRUD front-end over these exact tables with no schema change.

---

## 3. The four tiers

| Tier | Mechanism | Cost per use | Ships in V0 |
|---|---|---|---|
| **0 — Guided picker** | Category chips, then question rows, then a staff-written answer | Zero — content fetch only | Yes |
| **1 — Search** | Postgres full-text search plus trigram fuzzy matching, ranked, with a confidence threshold | Zero — one indexed query | Yes |
| **2 — Generated answer** | LLM grounded on Tier 1's own ranked results | Metered inference | **No — Phase 2** |
| **3 — Ticket** | Database row, best-effort email, on-screen reference | Zero | Yes |

A user falls through the tiers in order. Most never leave Tier 0. Tier 1 is available at every depth and is never buried behind the guided flow — the search field is present in every panel state.

Tier 2's absence must be invisible. Nothing in the V0 interface may hint at a missing capability, reserve visible space for it, or use the words "chat", "assistant", "ask me", or "bot".

---

## 4. Audiences, corpora and surfaces

### 4.1 Two corpora, not one filtered set

There are two bodies of content, written for two different readers. An article never appears in both.

**Public corpus.** For people who are not signed in. Generic and platform-level: what Evenzi is, what happens when you sign up, how the product works in broad terms, what it costs. The reader is deciding whether to sign up. Low jargon, no assumed product knowledge, reassurance-oriented.

**App corpus.** For signed-in hosts. Feature-level and operational: how each feature works, the dos and don'ts of each feature, pricing and plan policies, terms and conditions, and how user data is handled. The reader is already inside the product and stuck on something specific. Assumes familiarity with events and guest lists.

These are not one article shown twice with different visibility. "What does Evenzi cost?" for a prospect and "How do I upgrade my plan?" for a host are genuinely different articles, with different phrasing, length and calls to action. The interface must never offer an audience toggle or let one audience browse the other's content.

### 4.2 `audience` is curation, not security

An earlier draft made `audience` a row-level-security boundary — anon reads only public articles, authenticated reads only app articles. That was rejected.

None of this content is confidential. "How do I upgrade my plan" is not a secret from a logged-out visitor; it is merely not useful to them. Making it an RLS predicate would add a cross-table policy and a guard trigger to protect information that needs no protection, and would break the legitimate case of a support agent sending an article link to someone who is signed out.

So `audience` is a **curation column**. Each surface queries its own corpus. RLS remains the standard catalog pattern used by every other `config.*` table in this codebase: published rows are readable by `anon` and `authenticated`, writable only by `service_role`.

### 4.3 Three surfaces

| Surface | Corpus | Reader | Route |
|---|---|---|---|
| **A — Help panel** | App | Signed-in host | Overlay, triggered by `.help-fab` |
| **B — Help pages** | Whichever matches auth state | Both | `/help`, `/help/{category}`, `/help/a/{article}` |
| **C — Landing FAQ section** | Public | Prospect | Inline section within `app/page.tsx` |

`/help` is one route with two compositions — shared article rendering, different action ladder. It must not be one component tree with auth conditionals scattered through it.

### 4.4 Deliberately excluded: the guest event website

The Help Centre does not appear on `/e/[slug]`. That surface is the codebase's only `anon`-identity surface and required four council rounds to harden (decision-log entries D50 and D51). It serves wedding guests, whose entire job is a two-tap RSVP. A host-support affordance there is noise to the wrong audience on the most security-sensitive route in the product.

---

## 5. Data model

All new tables follow this codebase's established conventions: `uuid` primary keys with `gen_random_uuid()`, `created_at` and `updated_at` maintained by the shared `public.set_updated_at()` trigger, status as `text` with a `CHECK` constraint rather than a native Postgres enum (per decision D12), and foreign keys only to `auth.users` or `config.*` — never to another module's tables (maintenance rule 7).

### 5.1 Extension required

```sql
create extension if not exists pg_trgm;
```

One extension only. Postgres full-text search (`to_tsvector`, `ts_rank`, `websearch_to_tsquery`) is core functionality and needs nothing installed. `pg_trgm` adds fuzzy matching by splitting text into three-character fragments, so a query for "invatation" still reaches an article about invitations.

`unaccent` is available and not installed; it is not required for English-only V0 content but should be revisited when multilingual content lands.

`vector` (pgvector) is available and deliberately **not** installed. It belongs to Phase 2.

### 5.2 `config.faq_categories`

Curated catalog of help categories, scoped by audience.

```sql
create table config.faq_categories (
  id            uuid primary key default gen_random_uuid(),
  audience      text not null check (audience in ('public','app')),
  slug          text not null,
  name          text not null,
  description   text not null,
  icon_name     text not null,              -- Material Symbols glyph name
  display_order int  not null default 0,
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (audience, slug)
);
```

**Notes.** The unique constraint is on `(audience, slug)` rather than `slug` alone, so both corpora may independently own a "getting-started" category without collision. `description` is `not null` because every category surface in §7 renders it — a nullable description would produce an empty line in the interface. `icon_name` uses Material Symbols, consistent with decision D39's correction of the earlier Lucide seeding.

**Seed — app corpus.** Six categories, taken verbatim from `docs/ops/support-best-practices.md` §5.3, so the content the operations team already works from maps one-to-one onto the product:

| Slug | Name | Icon |
|---|---|---|
| `getting-started` | Getting Started | `rocket_launch` |
| `creating-events` | Creating Events | `event` |
| `managing-guests` | Managing Guests | `groups` |
| `invitations-rsvp` | Invitations & RSVP | `forward_to_inbox` |
| `account-billing` | Account & Billing | `account_circle` |
| `troubleshooting` | Troubleshooting | `build` |

The icons deliberately echo the product's tool rail, so a help category maps visually onto the area of the product it describes.

**Seed — public corpus.** Four categories, derived from `docs/ops/platform-policies.md`:

| Slug | Name | Icon |
|---|---|---|
| `about-evenzi` | About Evenzi | `celebration` |
| `how-it-works` | How It Works | `map` |
| `pricing-plans` | Pricing & Plans | `sell` |
| `privacy-data` | Privacy & Your Data | `shield_lock` |

### 5.3 `config.faq_articles`

```sql
create table config.faq_articles (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references config.faq_categories(id) on delete restrict,
  slug         text not null unique,
  question     text not null,
  answer       text not null,                 -- Markdown
  tags         text[] not null default '{}',  -- deliberate search synonyms
  status       text not null default 'draft'
                 check (status in ('draft','published','archived')),
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  search_tsv   tsvector generated always as (
                 setweight(to_tsvector('english', coalesce(question,'')), 'A') ||
                 setweight(to_tsvector('english', array_to_string(tags,' ')), 'B') ||
                 setweight(to_tsvector('english', coalesce(answer,'')), 'C')
               ) stored
);

create index idx_faq_articles_category_status on config.faq_articles(category_id, status, sort_order);
create index idx_faq_articles_tsv            on config.faq_articles using gin (search_tsv);
create index idx_faq_articles_question_trgm  on config.faq_articles using gin (question gin_trgm_ops);
```

**Notes.**

`slug` is globally unique, not scoped to category, because `/help/a/{slug}` is a flat route. Support agents will paste these URLs into replies; a flat namespace keeps them short and stable if an article is later re-categorised.

`search_tsv` is a **generated stored column**, so Postgres maintains it automatically on every insert and update — there is no trigger to forget and no possibility of the index drifting from the content. The three weights matter: a match on the question title (`A`) outranks a match on a synonym tag (`B`), which outranks a match buried in the answer body (`C`). This is what makes ranked results feel correct rather than arbitrary.

`tags` is the deliberate mitigation for lexical search's one real weakness. A user types "my link doesn't work"; the article is titled "Regenerating an RSVP link". Full-text search finds nothing, because the words do not overlap. Seeding `tags` with `{'link broken','rsvp link','link not working'}` closes that gap at authoring time, controllably, with no machine learning. The authoring brief in §9 makes tag-seeding a required field, not an optional one.

`audience` is **not** duplicated onto this table. It is reachable through `category_id`, and storing it here would be exactly the derivable-data drift that decision D7 forbids. Queries join to the category; the catalog is small enough that this costs nothing.

### 5.4 `public.support_tickets`

```sql
create table public.support_tickets (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,          -- human-quotable, e.g. EVZ-7K4M2
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text not null,
  topic_slug   text,                          -- category slug, nullable
  message      text not null,
  context      jsonb not null default '{}',   -- article/category the user came from
  page_url     text,
  status       text not null default 'open'
                 check (status in ('open','replied','closed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  replied_at   timestamptz
);

create index idx_support_tickets_status on public.support_tickets(status, created_at desc);
create index idx_support_tickets_user   on public.support_tickets(user_id, created_at desc);
```

**Notes.**

`user_id` is `not null`. Ticket filing requires an account — this is stated to logged-out visitors as a reason, not presented as a locked button (see §7, state B2). This also means every ticket is attributable, which removes an entire anonymous-spam surface without needing a CAPTCHA.

`reference` is a short human-quotable code shown on screen and used when following up. It is generated server-side. It is **not** the primary key, because a UUID is unreadable over the phone and unusable in a WhatsApp message.

`context` captures which article or category the user escalated from. This is the single most valuable field for content improvement — an article that repeatedly precedes a ticket is an article that is failing.

`topic_slug` is plain text, not a foreign key to `config.faq_categories`. A ticket must survive a category being retired or renamed; a hard foreign key would either block the retirement or cascade away support history.

### 5.5 `public.help_queries`

The search log. This is the table that decides the future of the LLM tier.

```sql
create table public.help_queries (
  id             bigint generated always as identity primary key,
  user_id        uuid references auth.users(id) on delete set null,  -- null when logged out
  audience       text not null check (audience in ('public','app')),
  query          text not null,
  result_count   int  not null,
  top_score      real,                        -- null when nothing matched
  resolved       boolean not null default false,  -- did the user open a result?
  escalated      boolean not null default false,  -- did this query end in a ticket?
  created_at     timestamptz not null default now()
);

create index idx_help_queries_created on public.help_queries(created_at desc);
create index idx_help_queries_misses  on public.help_queries(created_at desc) where result_count = 0;
```

**Notes.**

`bigint generated always as identity` is a deliberate exception to this codebase's uuid-primary-key convention, following the precedent set by `guest_lookup_attempts` in decision D51: this is an append-only ledger, nothing foreign-keys to it, and it is never addressed by a client.

`user_id` is `on delete set null` rather than `cascade`, so deleting an account does not destroy the aggregate signal about which questions the product fails to answer. The query text itself is user-typed and must be treated as potentially containing personal information — see §8.3.

The partial index on zero-result queries makes the "what are we failing to answer" report a fast query rather than a table scan.

### 5.6 `public.faq_article_feedback`

```sql
create table public.faq_article_feedback (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid not null references config.faq_articles(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  helpful     boolean not null,
  created_at  timestamptz not null default now(),
  unique (article_id, user_id)
);

create index idx_faq_feedback_article on public.faq_article_feedback(article_id, helpful);
```

**Notes.** The unique constraint on `(article_id, user_id)` makes the vote idempotent per user per article — a user changing their mind updates rather than inflating the count. For logged-out visitors `user_id` is null, and the constraint does not bind (null is never equal to null in a B-tree unique index), so anonymous votes are counted but not deduplicated. That is an accepted V0 tradeoff: the metric is directional, not forensic.

This table exists because `support-best-practices.md` §7.1 defines chatbot deflection rate as a tracked metric and §5.5 requires a monthly content review driven by article performance. Both are already published process. Without this table, neither is measurable.

### 5.7 Row-level security

| Table | Read | Write |
|---|---|---|
| `config.faq_categories` | `anon` + `authenticated`, where `enabled = true` | `service_role` only |
| `config.faq_articles` | `anon` + `authenticated`, where `status = 'published'` | `service_role` only |
| `public.support_tickets` | owner only (`user_id = auth.uid()`) | `service_role` only |
| `public.help_queries` | `service_role` only | `service_role` only |
| `public.faq_article_feedback` | `service_role` only | `service_role` only |

The catalog policies match the pattern established for the five website catalogs in decision D49 and tightened in D50 — a policy predicate on the enabled/published flag rather than an unconditional `true`.

**Mandatory, learned from decision D50.** Any `SECURITY DEFINER` function added by this feature must revoke execute explicitly from all three roles:

```sql
revoke all on function <fn> from public, anon, authenticated;
grant execute on function <fn> to service_role;
```

`revoke ... from public` alone is a no-op for `anon` and `authenticated` in Supabase, because those roles are granted execute directly through `ALTER DEFAULT PRIVILEGES` rather than through the `PUBLIC` pseudo-role. This has now bitten this project twice (`website_10`, `website_16`). Run `get_advisors` immediately after the migration — it is the only check that observes actually-granted privileges rather than the SQL intended to set them.

### 5.8 Documentation obligation

Per the standing maintenance rule, the same change that migrates these tables must also update `docs/data-model/DATA-MODEL.md` (table sections plus a new dated decision-log entry), `docs/data-model/ERD.md` (module map and full ERD), and `docs/data-model/evenzi-erd.drawio`. The database, the document and the ERD change together, in the same pull request.

---

## 6. Search behaviour (Tier 1)

Ranking combines full-text relevance with trigram similarity, so that both "different word, same meaning" and "same word, typed badly" contribute.

### 6.1 The query must use OR, not AND

`websearch_to_tsquery` and `plainto_tsquery` both join terms with **AND**. For support search that is far too strict: a single unmatched word returns nothing at all.

Verified against the live database on 2026-08-07. Article "Why didn't my guest get their invitation?" produces the lexemes `'didn':2 'get':6 'guest':5 'invit':8`. A user typing "my guest didnt get the invite" produces the query `'guest' & 'didnt' & 'get' & 'invit'` — the apostrophe-less `didnt` stems differently from `didn't`, so the AND match evaluates to **false** and the user sees nothing. Rewriting the same query with OR matches at rank 0.0456.

The tsquery is therefore built by OR-joining the lexemes. `ts_rank` then does the discrimination that AND was doing badly: articles matching more terms naturally float to the top, instead of near-misses being discarded outright.

### 6.2 The query

```sql
with q as (
  select replace(
           websearch_to_tsquery('english', :query)::text,
           ' & ', ' | '
         )::tsquery as tsq
)
select a.id, a.slug, a.question,
       ts_rank(a.search_tsv, q.tsq)                          as fts_score,
       similarity(a.question, :query)                        as trgm_score,
       ts_rank(a.search_tsv, q.tsq) * 2.0
         + similarity(a.question, :query)                    as combined
from   config.faq_articles a
join   config.faq_categories c on c.id = a.category_id
cross  join q
where  a.status = 'published'
  and  c.enabled  = true
  and  c.audience = :audience
  and  (a.search_tsv @@ q.tsq or a.question % :query)
order  by combined desc
limit  8;
```

`websearch_to_tsquery` is still the parser, because it tolerates the punctuation and quoting real users type without raising a syntax error — only its AND joins are rewritten. The `%` operator is `pg_trgm`'s similarity threshold test, which keeps typo-only matches in the candidate set even when full-text finds nothing.

Full-text is weighted at twice trigram because a stemmed word match is a stronger signal of meaning than character overlap. Character overlap is the safety net, not the primary signal.

### 6.3 Verified ranking behaviour

The same query run against four candidate articles on the live database:

| Article | FTS | Trigram | Combined |
|---|---|---|---|
| Why didn't my guest get their invitation? | 0.4931 | 0.5455 | **1.5316** |
| How do I import guests from a spreadsheet? | 0.1520 | 0.1290 | 0.4330 |
| How do I change my event date? | 0.0000 | 0.1373 | 0.1373 |
| What does Evenzi cost? | 0.0000 | 0.0408 | 0.0408 |

The correct answer scores roughly three and a half times the next candidate. That separation is where the confidence threshold sits.

### 6.4 The confidence threshold

**The confidence threshold is a product decision, not a technical one.** Below the threshold the user sees an honest "no match" state rather than three bad results. Showing weak results is worse than showing none: it teaches the user that search does not work here, and it suppresses the escalation path they actually need. The initial threshold is a tunable constant, calibrated against real queries during the dogfood week rather than guessed now.

Every search writes one `help_queries` row, including its score and whether the user subsequently opened a result.

---

## 7. Screens, states and interactions

The full state-by-state design — every state of all three surfaces, with the shell primitives that compose them, their empty, loading and error variants, the keyboard model, and the exact copy for the states where honesty is load-bearing — was produced by the UI/UX designer agent at plan phase and is reproduced in `docs/superpowers/specs/2026-08-07-help-centre-v0-ui-design.md`.

The points that constrain engineering rather than visual design:

**Panel presentation.** A docked panel bottom-right at 768px and above; a bottom sheet below, composed on the existing `.modal-scrim` sheet variant that twelve modals already use. Opaque surfaces only — no `backdrop-filter`, because event pages already carry two blurs and the panel is a reading surface.

**Panel state lives in `sessionStorage`, never in the URL.** Pushing history entries would make the browser Back button unwind help navigation instead of app navigation. On route change the panel closes but its position survives, so reopening lands where the user was. The one exception is mobile, where a single throwaway history entry is pushed so the Android hardware Back button closes the sheet rather than leaving the app.

**Accessibility contract.** Modal on mobile (`aria-modal="true"`, focus trapped, body scroll locked); companion on desktop (`aria-modal="false"`, not trapped, page stays operable). Escape closes both. Focus returns to the FAB on close. Focus on open lands on the panel title, not the search field — auto-focusing search raises the mobile keyboard and hides two-thirds of the panel before the user has decided whether to browse or type.

**Article pages are the forwarded surface.** `/help/a/{slug}` is what a support agent pastes into a WhatsApp reply, so it must be server-rendered, readable with no client JavaScript, free of `backdrop-filter`, and carry Open Graph tags. These are the only host-app routes that should be indexable.

---

## 8. Security and privacy

V0 is an ordinary web feature, not an AI surface. There is no prompt injection, no third-party inference, and no model to mislead. The real concerns are narrower and concrete.

### 8.1 Markdown rendering

Article bodies are Markdown authored by staff and rendered as HTML. Even trusted authors make mistakes, and the content table is a write target for anyone with database access.

- Render through a sanitiser with an explicit allow-list of tags. Raw HTML in Markdown is stripped, not passed through.
- No `javascript:` URLs. External links get `rel="noopener noreferrer"` and open in a new tab.
- This is defence in depth, not distrust of the authors: it means a compromised or careless content row cannot become stored cross-site scripting on every page of the product.

### 8.2 Ticket content

`support_tickets.message` is free text a user types when frustrated. Users routinely paste more than asked — including, occasionally, credentials.

- Owner-only read policy; no cross-user visibility.
- The "what we'll include" disclosure in the ticket form states exactly what metadata is attached, and states plainly that passwords and guest contact details are never included. Users disclose more when they can see what is being sent.
- Do not log ticket message bodies to the application log, where they would land in Vercel's log retention outside the database's access controls.

### 8.3 Search-query logging

`help_queries.query` is user-typed text and is retained. It may contain personal information incidentally — a user searching their own email address or phone number to find an account article.

- Restrict read access to `service_role`.
- The DPDP obligations in `platform-policies.md` §5 apply to this table like any other store of user data. It must be covered by the account-deletion path: `user_id` nulls on delete, and the query text is retained only in aggregate-useful form.
- Set an explicit retention window rather than keeping queries forever. Ninety days is sufficient for the Phase 2 evidence gate and for the monthly content review.

### 8.4 Ticket abuse

Because ticket filing requires an authenticated account, the anonymous-spam surface does not exist. A per-user rate limit is still warranted — a modest cap of five tickets per user per hour — to bound both accidental double-submission and a compromised account. No CAPTCHA is needed, and none should be added.

### 8.5 What is deliberately not a security control

`audience` is curation, not access control (§4.2). No Help Centre content is confidential. Any future content that genuinely must not be public belongs somewhere other than a help article.

---

## 9. Content

### 9.1 Content is the critical path

With no generated answers, the content *is* the product. A guided picker backed by mediocre articles is visibly mediocre. This was true of the RAG design too — retrieval-augmented generation would not have fixed weak content, it would have hidden it behind confident prose. Removing the model removes the disguise, which is a feature.

The launch target is roughly five published articles per category. Six app categories and four public categories at five each is fifty articles, reviewed under the two-person rule in `support-best-practices.md` §5.4. Shipping the interface against three articles produces a Help Centre that is empty in most categories, which teaches hosts that help does not work here. **Content readiness gates launch more tightly than code does.**

### 9.2 Division of labour

| Produced by Claude, before handoff | Defined by the operations team |
|---|---|
| Category structure for both corpora | The answers themselves |
| The full question list per category, mined from `support-best-practices.md` §3 and `platform-policies.md` | Corrections and additions to the question list |
| Two to three fully written exemplar articles per corpus, establishing tone, length and format | The remaining articles |
| The authoring brief — tone rules, length cap, Markdown conventions, required tag-seeding, review workflow | — |
| The accuracy gate list (§9.4) | — |

The build does not wait on finished articles. It waits on the content structure, which can be produced immediately.

### 9.3 Source assessment

The two existing operations documents are not equal as source material.

**`docs/ops/platform-policies.md` is close to ready.** Sections 2 through 8 are already user-facing policy prose covering acceptable use, account policies, data and privacy, DPDP compliance, content standards, support, and billing. It can be adapted into public-corpus articles with modest rewriting.

**`docs/ops/support-best-practices.md` must never be published as-is.** It is internal, staff-facing content. Section 3 documents resolution steps that name internal escalation paths; section 4 contains agent response templates; section 6 is an escalation matrix referencing ClickUp, Slack, the Ops Lead and the Founder. Mining it for the *questions* users ask is exactly right. Publishing its *answers* would tell a user to file a ClickUp P0 and escalate to the founder.

### 9.4 The accuracy gate

Both source documents describe capabilities the product does not currently have. The operations team will write from them in good faith and publish claims the product cannot honour. The authoring brief must carry an explicit do-not-promise list, checked against the live MVP status table in `CLAUDE.md`:

| Do not promise | Reality |
|---|---|
| WhatsApp invitation sending | `support-best-practices.md` §3.4 documents it as working; send is deliberately inert pending the WhatsApp planning session |
| A gallery of website templates | Only `cinematic-scroll` exists |
| Saving a designed invitation card | The designer is front-end only; nothing persists |
| An automatic email acknowledging a ticket | The email provider is unconfigured; see §10.2 |
| Support at `support@evenzi.com` | The owned domain is `evenzii.com`; see §10.1 |

Every article is checked against this table before publication. When a capability ships, its row is removed and the corresponding article is written.

---

## 10. Known gaps this spec depends on

### 10.1 The support address is inconsistent in three directions

`platform-policies.md` §7.1 and `support-best-practices.md` §2.2 publish `support@evenzi.com`. Six application files ship `mailto:evenzi.official@gmail.com` — a personal Gmail account — including the two authentication screens, where a user who cannot log in is exactly the user who needs support most:

- `app/auth/page.tsx:143`
- `app/auth/role-selection/page.tsx:58`
- `app/events/[id]/settings/GeneralSettingsForm.tsx:293`
- `app/events/[id]/settings/guests/GuestListContent.tsx:174`
- `app/events/[id]/settings/billing/page.tsx:142`
- `app/events/[id]/settings/admins/AdminsContent.tsx:168`

The domain the company actually owns is **evenzii.com**, with Google Workspace already wired.

**Resolution, founder-approved 2026-08-07:** create `support@evenzii.com`, correct both operations documents, and replace the Gmail address in all six application files. This address appears in the ticket-send-failure fallback and the logged-out contact card — the last working paths when everything else has failed — so it must be real before launch.

### 10.2 A submitted ticket currently notifies nobody

`RESEND_API_KEY` is deliberately unset, per `.cursor/rules/resend-deferred.mdc`. Submitting a ticket writes a database row and sends nothing. Meanwhile `platform-policies.md` §7.2 publishes a 24-hour first-response commitment, which the ticket form and its success state both restate on screen.

The design handles this honestly — the on-screen reference is the receipt, and no copy claims an email was sent. But honesty in the interface does not make the commitment true. Before launch, one of the following must be in place: the email provider configured, or a named person checking the tickets table at a defined cadence, or a minimal admin ticket list.

This blocks launch, not the build.

### 10.3 The Help FAB is unreachable on tablets and absent on phones

Two live defects, independent of this feature, verified against the current codebase on 2026-08-07.

**Collision.** `.help-fab` (`shell.css:723`) sits at `right: 24px`, `bottom: 84px`, `z-index: 30`. `.add-fab` (`shell.css:4109`) sits at `right: 20px`, `bottom: 92px`, `z-index: 60`. Both are 56×56, so they overlap by roughly 52×48 pixels and `.add-fab` wins the stacking order. On the Guests and Planning screens the help button is functionally unclickable between 769px and 1399px.

**Absence.** `shell.css:743` sets `.help-fab { display: none }` below 768px. On a mobile-first product, there is currently no route into help from any phone.

Both must be fixed in the same change, because making the FAB visible on mobile extends the collision to phones. The fix is a shared stacking contract — a `stacked` variant that offsets the help FAB above a page's primary FAB at every breakpoint, with `z-index` raised to sit below `.add-fab` but above page chrome. This should ship as its own change, ahead of the Help Centre, since it repairs a live defect.

Additionally, `/home` — the screen where a new host is most lost — mounts no help affordance at any width. Mounting the FAB once in the root layout, gated by pathname, fixes this and is also what allows panel state to survive client-side navigation.

### 10.4 There is no shared overlay wrapper

Twelve files hand-roll `.modal-scrim`. Four handle the Escape key. **None** implement focus return to the trigger, focus trapping, or a body scroll lock — `.no-scroll` exists in `shell.css:2298` but no React code ever sets it. There is no `lib/hooks/` directory.

The Help panel would be the thirteenth hand-roll, reproducing the same defects a thirteenth time, on the surface a frustrated user reaches when already stuck.

**Resolution, founder-approved 2026-08-07:** build `components/ui/OverlaySurface.tsx` as a separate ticket shipped before the Help Centre, migrate two or three existing modals to prove it, then have Help consume it. The remaining modals migrate in follow-up work.

### 10.5 No rich-text styling exists

`app/globals.css` imports Tailwind v4, whose preflight resets list markers, margins and padding. `shell.css` contains no `.prose` or equivalent — zero occurrences. Every FAQ answer is Markdown, and `support-best-practices.md` §5.1 explicitly instructs authors to use numbered lists for multi-step instructions. Rendered today, every step list would collapse into an unnumbered run-on block.

A tokenised `.prose` primitive is required, and must be catalogued in `designs/components.html` in the same change that adds it.

---

## 11. Phase 2 — the generated-answer tier

Deferred, not cancelled. Recorded here so the decision is not re-litigated from scratch.

### 11.1 The evidence gate

Phase 2 proceeds only when `help_queries` shows a sustained volume of queries that Tiers 0 and 1 fail to resolve, and inspection of those queries shows they are answerable from existing content that lexical search could not reach. If tag-seeding closes the gap, Phase 2 is unnecessary. If deflection is already at the 70% target in `support-best-practices.md` §1, Phase 2 is unnecessary.

This is the whole strategic reason for building V0 first: shipping RAG immediately would have meant guessing at corpus size, model and volume. Shipping this produces the measurement instead.

### 11.2 The architecture, if the gate is met

**Grounding comes from Tier 1, not from a vector store.** By the time Tier 2 fires, Tier 1 has already produced ranked candidates that merely scored below the confidence threshold. Those are still the best available context. Feeding the top five to the model requires no pgvector, no chunk table, no embedding model, and no embedding call — and it removes the one genuinely irreversible decision in the whole design, since changing an embedding model means re-embedding the entire corpus.

**Provider: Cloudflare Workers AI**, re-verified 2026-08-07. The free allocation is 10,000 neurons per day on both Free and Paid Workers plans, resetting at 00:00 UTC. Overage on Workers Paid is $0.011 per 1,000 neurons. Cloudflare states it does not train on, retain, or share Workers AI inputs and outputs. R2 is already in use on the same account, and the Cloudflare for Startups credits were the only startup-credit application that came through.

**Model: `@cf/qwen/qwen3-30b-a3b-fp8`**, founder-approved 2026-08-07. A 30-billion-parameter mixture-of-experts model with roughly 3 billion parameters active per token, priced at 4,625 neurons per million input tokens and 30,475 per million output. At a realistic 1,500-token prompt and 250-token answer that is approximately **14.6 neurons per answer, or about 687 answers per day** within the free allocation. Because Tier 2 only sees queries the first two tiers failed, that supports a total help volume several times higher.

**Two implementation constraints.** Qwen3 must run in non-thinking mode — output tokens cost more than six times input tokens for this model, so reasoning traces would multiply the real cost. This must be asserted by a test, not assumed. And a server-side daily counter should track spend independently of Cloudflare's own limit, so the kill switch is under Evenzi's control.

**Degradation ladder.** Rather than dropping straight from generated answers to keyword search, insert `@cf/ibm-granite/granite-4.0-h-micro` at approximately 4.9 neurons per answer — four times the headroom — as an intermediate tier when the daily budget passes 80%. Users get a real answer far deeper into a bad day.

**What stays out of Phase 2.** The action-taking agent — a model that performs operations on the user's behalf — remains a separate, security-first specification, unchanged from the 2026-06-22 analysis §9. Its risk is not capability but authority, and it must not be bolted onto the knowledge tier.

---

## 12. Build sequence

| Step | Deliverable | Gates on |
|---|---|---|
| 0 | FAB collision and mobile-visibility fix (§10.3) | Nothing — repairs a live defect, ship immediately |
| 1 | `components/ui/OverlaySurface.tsx` plus two migrated modals (§10.4) | Nothing |
| 2 | `.prose`, `.list-nav-row`, `.dock-panel` primitives plus the `.alert-banner` promotion, all catalogued (§10.5); shell-level 16px input floor below 768px | Nothing |
| 3 | Migrations: extension, five tables, RLS, seeds; DATA-MODEL, ERD and drawio updated | Founder sign-off on this spec |
| 4 | Search and content read APIs; ticket, feedback and query-log write APIs | Step 3 |
| 5 | `/help` and `/help/a/{slug}` pages, server-rendered | Steps 2 and 4 |
| 6 | Help panel, wiring the existing `.help-fab` | Steps 1, 2, 4 |
| 7 | Landing-page FAQ section (public corpus) | Step 5; sequenced after the app corpus per founder decision |
| 8 | Content authored and reviewed | Runs in parallel from step 3; **gates launch** |
| 9 | Support address created and corrected in all eight places (§10.1) | Nothing — ops task |
| 10 | Ticket-watching arrangement confirmed (§10.2) | **Gates launch** |

Step 5 deliberately precedes step 6: the article page is server-rendered, needs no overlay machinery, is the deep-link target support replies depend on, and proves the `.prose` primitive against real staff Markdown before that primitive is embedded in a 400-pixel panel where problems are harder to see.

---

## 13. Testing

| Layer | Coverage |
|---|---|
| Unit | Search ranking and threshold behaviour; reference-code generation and uniqueness; Markdown sanitisation, including a raw-HTML and a `javascript:` URL case; ticket validation schemas |
| Integration | Search returns only published articles of the requested audience; RLS denies cross-user ticket reads; feedback vote is idempotent per user per article; `help_queries` row written on every search |
| Component | Panel state machine across all states; back-chain correctness from both category and search entry; ticket form retains content on submit failure |
| End-to-end | Guided path from FAB to answer; search-to-answer path; no-match to ticket to success; `/help/a/{slug}` renders with JavaScript disabled |
| Accessibility | Escape closes; focus returns to the FAB; focus trapped on mobile and not trapped on desktop; TalkBack walk on a real Android device; keyboard-only traversal of both surfaces |
| Manual | `/help/a/{slug}` opened inside WhatsApp's Android in-app browser — the forwarded-article path this route exists to serve |

The WhatsApp in-app browser check cannot be automated and cannot be verified at plan time. It is owed before launch.

---

## 14. Open questions

1. **Who on the operations team owns content authoring, and by when?** The founder has identified two people; names to be recorded here. Content readiness gates launch (§9.1).
2. **What is the retention window for `help_queries`?** §8.3 proposes ninety days. Needs a ruling before the migration, since it determines whether a scheduled cleanup job is part of step 3.
3. **Does the landing-page FAQ section need coordination with whoever is currently working on `app/page.tsx`?** That file is marked in progress in `CLAUDE.md`.

---

## Revision history

- 2026-08-07 — Initial spec. Replaces the LLM-first architecture of 2026-04-14 with a tiered design whose generated-answer tier is deferred to Phase 2 behind an evidence gate. Founder decisions recorded: knowledge-only scope, tiers 0/1/3 in V0, two corpora split by audience, `config`/`public` schema split, ticket plus best-effort email escalation, `support@evenzii.com`, article feedback included, `OverlaySurface` as a prerequisite ticket, app corpus before public corpus, Qwen3-30b-a3b-fp8 as the Phase 2 model.
