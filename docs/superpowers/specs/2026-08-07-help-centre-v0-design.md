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

### 5.1 Extensions

Postgres full-text search (`to_tsvector`, `ts_rank`) is core functionality and needs nothing installed. Only two extensions are involved.

**`pg_trgm` — already installed**, version 1.6, in the `extensions` schema. It provides fuzzy matching by splitting text into three-character fragments, which is what allows a misspelled query to still reach the right article.

It was installed during spec authoring on 2026-08-07 and initially landed in `public`; it was moved to `extensions` with `alter extension pg_trgm set schema extensions` so that it sits alongside `pgcrypto`, `pg_net` and `uuid-ossp`. That placement is deliberate and load-bearing: decision D51 records that a bare `digest(...)` call inside a `SECURITY DEFINER` function with `search_path = public` failed to resolve because `pgcrypto` lives in `extensions`. Any future definer function in this feature must schema-qualify `extensions.word_similarity(...)` for the same reason.

**`pg_cron` — new**, version 1.6.4, required for the ninety-day `help_queries` cleanup in §8.3. It ships in the same migration as the tables. A retention policy with no job to enforce it is a policy in name only. This is the project's first scheduled job, so §5.9 also specifies who verifies it is still running.

`unaccent` is available and not installed. It is not needed for English-only V0 content, but should be revisited when multilingual content lands.

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
-- Required first. array_to_string is STABLE, not IMMUTABLE, and Postgres
-- rejects a STABLE expression in a generated column. This wrapper is the
-- immutable equivalent. See the note below.
create function config.faq_tags_text(t text[]) returns text
  language sql immutable parallel safe as
  $$ select array_to_string(coalesce(t, '{}'::text[]), ' ') $$;

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
                 setweight(to_tsvector('english', config.faq_tags_text(tags)), 'B') ||
                 setweight(to_tsvector('english', coalesce(answer,'')), 'C')
               ) stored
);

create index idx_faq_articles_category_status on config.faq_articles(category_id, status, sort_order);
create index idx_faq_articles_tsv            on config.faq_articles using gin (search_tsv);
create index idx_faq_articles_question_trgm  on config.faq_articles using gin (question extensions.gin_trgm_ops);
```

**The immutable wrapper is not optional.** An earlier draft of this specification called `array_to_string(tags,' ')` directly inside the generated column. That fails at migration time with `42P17 generation expression is not immutable`, because `array_to_string` is marked `STABLE` in `pg_proc` — it depends on the element type's output function. Since this is the first statement of the migration, the whole slice would have failed. Verified against the live project on 2026-08-07: the direct form is rejected, the wrapper form creates and populates correctly.

**Do not substitute `array_to_tsvector(tags)`.** It is immutable and would therefore be accepted, but it neither stems nor lowercases, and it keeps a multi-word tag as a single lexeme. `array_to_tsvector(array['link broken'])` produces the one lexeme `'link broken'`, which does not match a search for "broken link". That would silently destroy the entire purpose of tag-seeding while appearing to work.

**Two operational constraints of stored generated columns**, worth recording because neither is obvious. The expression cannot be altered later — changing the weights means dropping the column, re-adding it and reindexing. And `create or replace` on `config.faq_tags_text` does **not** recompute already-stored rows; existing rows keep their old value until updated.

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
  topic_slug   text check (topic_slug is null or topic_slug = lower(trim(topic_slug))),
  message      text not null check (char_length(message) between 20 and 2000),
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
  ref            uuid not null unique default gen_random_uuid(),  -- client-facing handle
  user_id        uuid references auth.users(id) on delete set null,  -- null when logged out
  audience       text not null check (audience in ('public','app')),
  query          text not null check (char_length(query) between 1 and 300),
  result_count   int  not null,
  top_score      real,                        -- null when nothing matched
  resolved       boolean not null default false,  -- did the user open a result?
  escalated      boolean not null default false,  -- did this query end in a ticket?
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_help_queries_created on public.help_queries(created_at desc);
create index idx_help_queries_misses  on public.help_queries(created_at desc) where result_count = 0;
create index idx_help_queries_user    on public.help_queries(user_id) where user_id is not null;
```

**Notes.**

**`ref` exists because the D51 precedent does not fully transfer.** `guest_lookup_attempts` justified its `bigint` primary key on three properties: append-only, nothing foreign-keys it, never client-addressed. This table breaks two of them. `resolved` and `escalated` are set *after* insert, by a later user action, so the search response must hand a identifier back to the client and the client returns it. A sequential `bigint` is the worst possible identifier in that position — it is trivially enumerable, and because `user_id` is null for logged-out visitors there is no ownership predicate a route could check before applying the update. So the `bigint` stays as the storage key and `ref uuid` is the only identifier that ever leaves the database. The update route keys on `ref` and nothing else.

`updated_at` is present because the row is mutated twice after insert. Its absence would both deviate from the Conventions table and discard a useful signal — the interval between `created_at` and `updated_at` is time-to-resolution.

The `char_length` bound is a database-level constraint deliberately, not a duplicate of a client check. The 60-character query echo in the interface is display truncation only, so without this constraint the column is unbounded `text` on a retained table that may hold personal information.

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
create index idx_faq_feedback_user    on public.faq_article_feedback(user_id) where user_id is not null;
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

### 5.9 Remaining DDL

Everything the migration needs that is not a `create table`. This section exists because `DATA-MODEL.md` records triggers, policies and grants individually — down to the level of `trg_invitation_cards_updated` — so without literal statements here the documentation update in §5.8 could not be made mechanically.

**Timestamp triggers.** Four tables carry `updated_at` and therefore need the shared trigger. Never maintain `updated_at` in application code.

```sql
create trigger trg_faq_categories_updated  before update on config.faq_categories
  for each row execute function public.set_updated_at();
create trigger trg_faq_articles_updated    before update on config.faq_articles
  for each row execute function public.set_updated_at();
create trigger trg_support_tickets_updated before update on public.support_tickets
  for each row execute function public.set_updated_at();
create trigger trg_help_queries_updated    before update on public.help_queries
  for each row execute function public.set_updated_at();
```

**Schema exposure and grants.** Mandatory for any `config.*` table to be reachable through the auto-API at all. `config` is already an exposed schema, so only the object grants are new.

```sql
grant usage  on schema config to anon, authenticated;
grant select on config.faq_categories, config.faq_articles to anon, authenticated;
```

**Row-level security policies.** The matrix in §5.7 is the intent; this is the implementation. Read policies carry a predicate rather than an unconditional `true`, matching the tightening applied to the website catalogs in decision D50.

```sql
alter table config.faq_categories       enable row level security;
alter table config.faq_articles         enable row level security;
alter table public.support_tickets      enable row level security;
alter table public.help_queries         enable row level security;
alter table public.faq_article_feedback enable row level security;

create policy faq_categories_read on config.faq_categories
  for select to anon, authenticated using (enabled = true);

create policy faq_articles_read on config.faq_articles
  for select to anon, authenticated using (status = 'published');

create policy support_tickets_own on public.support_tickets
  for select to authenticated using (user_id = (select auth.uid()));
```

`help_queries` and `faq_article_feedback` get **no policy at all**. With row-level security enabled and no policy present, every client role is denied, and only `service_role` — which bypasses row-level security — can reach them. That is stronger than an owner-scoped policy and matches the treatment `guest_lookup_attempts` received in decision D51. It is deliberate, not an omission.

**Reference-code generator.** §13 requires a uniqueness test for `support_tickets.reference`, so the generator must exist. Generating it in application code would introduce a check-then-insert race; the codebase precedent is `trg_invitation_cards_share_token` from decision D38, a `BEFORE INSERT` definer trigger, and this follows it.

The alphabet deliberately excludes `0`, `O`, `1`, `I` and `5`/`S` confusions, because this code is read aloud and typed by hand. Format is `EVZ-` plus five characters, giving roughly 45 million combinations — ample, with a retry loop as the guard rather than a probability argument.

```sql
create function public.generate_ticket_reference() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRTUVWXYZ';
  candidate text;
  attempts  int := 0;
begin
  if new.reference is not null then return new; end if;
  loop
    candidate := 'EVZ-' || (
      select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '')
      from generate_series(1, 5)
    );
    exit when not exists (select 1 from public.support_tickets where reference = candidate);
    attempts := attempts + 1;
    if attempts >= 10 then
      raise exception 'could not allocate a unique ticket reference after % attempts', attempts;
    end if;
  end loop;
  new.reference := candidate;
  return new;
end; $$;

revoke all on function public.generate_ticket_reference() from public, anon, authenticated;

create trigger trg_support_tickets_reference before insert on public.support_tickets
  for each row execute function public.generate_ticket_reference();
```

The three-role revoke is not optional and not decoration. Decision D50 records that `revoke ... from public` alone is a no-op for `anon` and `authenticated` in Supabase, because those roles are granted execute directly through `ALTER DEFAULT PRIVILEGES`. This project has been bitten by that twice. Run `get_advisors` immediately after the migration — it observes actually-granted privileges rather than the SQL that intended to set them, and it is the only check that catches this class of gap.

**Retention job.** The project's first scheduled job.

```sql
select cron.schedule(
  'help_queries_retention',
  '17 3 * * *',
  $$delete from public.help_queries where created_at < now() - interval '90 days'$$
);
```

A cron job that silently stops leaves the retention policy unenforced with no signal, and nothing in this codebase currently monitors scheduled jobs. The check is one query, and it belongs to whoever owns the ticket-watching arrangement in §10.2:

```sql
select min(created_at) > now() - interval '91 days' as retention_holding
from   public.help_queries;
```

**Account deletion.** `DATA-MODEL.md` enumerates every cascading and set-null relationship, so the intended behaviour of all three `public.*` tables must be stated or that tree goes stale. The asymmetry below is deliberate and was chosen, not inherited.

| Table | On account deletion | Why |
|---|---|---|
| `support_tickets` | cascade — the ticket is deleted | It is correspondence with that person; retaining it after erasure serves nobody |
| `help_queries` | `user_id` nulls, **and the `query` text is redacted** | See §8.3 — nulling alone leaves text that may contain the person's own phone number or email, which is pseudonymisation, not anonymisation |
| `faq_article_feedback` | `user_id` nulls, row retained | A helpful/unhelpful vote carries nothing personal once detached |

The redaction in the middle row is a change from the original design, which nulled `user_id` and kept the text. Everything the Phase 2 evidence gate in §11.1 actually consumes — `audience`, `result_count`, `top_score`, `resolved`, `escalated` — survives redaction untouched.

---

## 6. Search behaviour (Tier 1)

Ranking combines full-text relevance with trigram similarity, so that both "different word, same meaning" and "same word, typed badly" contribute.

### 6.1 Two false starts, recorded so they are not repeated

Both were caught by executing SQL against the live project rather than by reading it, and both look correct on the page.

**AND is too strict.** `websearch_to_tsquery` and `plainto_tsquery` both join terms with AND, so one unmatched word returns nothing. The article "Why didn't my guest get their invitation?" yields lexemes `'didn' 'get' 'guest' 'invit'`; a user typing "my guest didnt get the invite" yields `'guest' & 'didnt' & 'get' & 'invit'` — the apostrophe-less `didnt` stems differently from `didn't`, the AND fails, and a perfect result is discarded.

**Rewriting the parsed query's text is worse.** The obvious repair — `replace(websearch_to_tsquery(...)::text, ' & ', ' | ')` — is unsafe, because `websearch_to_tsquery` supports a negation operator. `invite -whatsapp` parses to `'invit' & !'whatsapp'` and rewrites to `'invit' | !'whatsapp'`. A negated term ORed at the top level matches every document that *lacks* the term, so an exclusion inverts into a near-universal match. Verified: that query returns "How do I change my event date?" and "What does Evenzi cost?" as matches, most at `ts_rank` 0.0. It produces exactly the "several bad results" outcome §6.4 argues against, defeats the confidence threshold by leaving trigram as the only discriminating score, and is not GIN-indexable so it degrades to a sequential scan. A `-` is one keystroke away in a support search box.

### 6.2 Build the query from lexemes, not from parsed text

The fix is to never produce operators in the first place. `to_tsvector` performs no operator parsing — it treats `-` as punctuation — so extracting its lexemes and joining them with `|` makes the OR semantics **structural rather than textual**. There is nothing left to invert.

```sql
with q as (
  select (select string_agg(lexeme, ' | ')
          from unnest(to_tsvector('english', :query)))::tsquery as tsq
)
select a.id, a.slug, a.question,
       coalesce(ts_rank(a.search_tsv, q.tsq, 32), 0)          as fts_score,
       extensions.word_similarity(:query, a.question)         as trgm_score,
       coalesce(ts_rank(a.search_tsv, q.tsq, 32), 0) * 2.0
         + extensions.word_similarity(:query, a.question)     as combined
from   config.faq_articles a
join   config.faq_categories c on c.id = a.category_id
cross  join q
where  a.status = 'published'
  and  c.enabled  = true
  and  c.audience = :audience
  and  ((q.tsq is not null and a.search_tsv @@ q.tsq)
        or :query <% a.question)
order  by combined desc
limit  8;
```

Four things in that query are deliberate:

**`word_similarity`, not `similarity`.** This corrects a claim in an earlier draft. `similarity()` normalises trigram overlap across the whole string, so a short query against a long question is structurally penalised — the better-written the title, the worse a one-word typo scores. Verified: `similarity('Why didn''t my guest get their invitation?', 'invatation')` is **0.190**, below the default 0.3 threshold, so the `%` operator returns false and the article never enters the candidate set. The typo case the extension was justified by did not work. `word_similarity`, which scores the query against the best-matching window inside the question, returns **0.571** for the same pair and does catch it.

**The threshold is 0.5, not the 0.6 default.** `word_similarity`'s default `pg_trgm.word_similarity_threshold` is 0.6, and the verified typo score is 0.571 — so at the default, the `<%` operator still returns false and the fix would not work. The session must set `0.5`. This is not a tuning preference; at the default the typo path is dead.

**`ts_rank(..., 32)` applies length normalisation.** The default flag of `0` applies none, so a long answer accumulates rank simply by being long. With OR semantics that is a real inversion risk, since a long, weakly-matching answer can outrank a short, exactly-matching question.

**`q.tsq` can be null.** A query of only stopwords ("the and or of") produces no lexemes, `string_agg` returns null, and the cast yields null. Verified to degrade cleanly: the FTS branch is skipped by the explicit null guard and the row set falls through to trigram alone, which in that case matches nothing and produces the honest no-match state. Without the guard the whole `where` clause evaluates to null and the query silently returns zero rows for every input.

### 6.3 Verified behaviour across input classes

Run against a four-article corpus on the live project, 2026-08-07:

| Input | Lexeme query built | FTS hits | Best `word_similarity` |
|---|---|---|---|
| `my guest didnt get the invite` | `didnt \| get \| guest \| invit` | 2 | 0.706 |
| `invite -whatsapp` | `invit \| whatsapp` | **1** | 0.313 |
| `invatation` | `invat` | 0 | **0.571** — caught by trigram |
| `"rsvp link" broken` | `broken \| link \| rsvp` | 0 | 0.000 |
| `the and or of` | *(null)* | 0 | 0.231 |

The negated input now returns one sensible result instead of the entire corpus.

### 6.4 Two capabilities V0 does not have

Both follow from building the query from lexemes, and both are acceptable — but they are behaviour changes a builder or a tester would otherwise report as bugs.

**Negation is unsupported.** `-whatsapp` is treated as the plain term `whatsapp`, not as an exclusion. This is strictly better than the alternative, which inverted into a corpus-wide match.

**Phrase search is unsupported.** `"rsvp link"` becomes two ORed terms rather than an adjacency requirement; the `<->` operator never appears. For a corpus of roughly fifty short articles this costs very little, and restoring it would mean reintroducing operator parsing — the exact thing that produced the negation defect.

Neither should be advertised in placeholder text or help copy.

### 6.5 The confidence threshold

**The confidence threshold is a product decision, not a technical one.** Below it the user sees an honest "no match" state rather than several weak results. Showing weak results is worse than showing none: it teaches the user that search does not work here, and it suppresses the escalation path they actually need.

**Ship with `combined >= 0.8`.** An earlier draft left this as "a tunable constant, calibrated during the dogfood week" with no value, which would have forced a builder to invent one. The measured separation supports picking it now: on the verified corpus the correct answer scored well above 1.0 while every unrelated article scored below 0.45. The constant belongs in `lib/help/search.ts` as a single named export, not inline in the query, so calibration is a one-line change.

Two distinct thresholds exist and must not be confused. `pg_trgm.word_similarity_threshold = 0.5` governs whether a row enters the candidate set at all (§6.2); `combined >= 0.8` governs whether a candidate is confident enough to show. Both are calibrated during the dogfood week against real `help_queries` rows.

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

Article bodies are Markdown authored by staff and rendered as HTML on public, indexable pages. Even trusted authors make mistakes, and the content table is a write target for anyone with database access. This is defence in depth, not distrust of the authors: a careless or compromised content row must not become stored cross-site scripting across the product.

**Sanitisation runs server-side, in the render path.** This is not a preference. §7 requires `/help/a/{slug}` to be readable with client JavaScript disabled, so a browser-side pass cannot be the control — the server-rendered HTML would ship unsanitised to precisely the forwarded, indexable route the requirement exists for. Use `rehype-sanitize` with an explicit schema and `allowDangerousHtml: false` at the parser. No such dependency is currently in `package.json`.

**The allow-list must cover more than the obvious.** An earlier draft named only raw HTML, `javascript:` URLs and `rel="noopener noreferrer"`. Also required:

| Vector | Treatment |
|---|---|
| `data:` and `blob:` URIs | Blocked in `href` and `src` |
| `vbscript:` | Blocked |
| Entity-encoded schemes (`&#106;avascript:`) | Decoded before scheme checking, then blocked |
| SVG, including `<foreignObject>` | Not in the tag allow-list |
| `style` attributes | Stripped |
| `srcset` and `sizes` | Stripped |
| `on*` event handlers | Stripped |
| Markdown reference-style link definitions | Resolved and scheme-checked like inline links |

**A Content-Security-Policy backs it up.** `next.config.js` currently sets no headers at all, which makes the sanitiser a single point of control rather than one layer of several. Add at minimum, for `/help/*`:

```
default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'
```

### 8.2 Ticket content

`support_tickets.message` is free text a user types when frustrated. Users routinely paste more than asked — including, occasionally, credentials.

- Owner-only read policy; no cross-user visibility.
- The "what we'll include" disclosure in the ticket form states exactly what metadata is attached, and states plainly that passwords and guest contact details are never included. Users disclose more when they can see what is being sent.
- Do not log ticket message bodies to the application log, where they would land in Vercel's log retention outside the database's access controls.

### 8.3 Search-query logging

`help_queries.query` is user-typed text and is retained. It may contain personal information incidentally — a user searching their own email address or phone number to find an account article.

- Restrict read access to `service_role`.
- The DPDP obligations in `platform-policies.md` §5 apply to this table like any other store of user data. It must be covered by the account-deletion path: `user_id` nulls on delete, and the query text is retained only in aggregate-useful form.
- **Retention is ninety days**, founder-approved 2026-08-07. That is long enough for the Phase 2 evidence gate and for three cycles of the monthly content review, and short enough that the table never becomes a growing store of user-typed text. Because the window is fixed rather than indefinite, the migration must ship the cleanup with the table — a `pg_cron` job deleting rows older than ninety days. `pg_cron` is available on this project and not yet installed.

### 8.4 Ticket abuse

Because ticket filing requires an authenticated account, the anonymous-spam surface does not exist. A per-user rate limit is still warranted — a modest cap of five tickets per user per hour — to bound both accidental double-submission and a compromised account. No CAPTCHA is needed, and none should be added.

### 8.5 What is deliberately not a security control

`audience` is curation, not access control (§4.2). No Help Centre content is confidential. Any future content that genuinely must not be public belongs somewhere other than a help article.

This rule also belongs in the authoring brief (§9.2), because Brindo and Sree are the only people positioned to break it. A help article is world-readable the moment it is published, regardless of which corpus it sits in.

### 8.6 Every write bypasses row-level security

The most important control in this feature is not in §5.7's table, and stating it only there would be misleading.

All three `public.*` tables are `service_role`-write-only. `service_role` bypasses row-level security entirely. So the **only** write path is a Next.js route holding the service key, and the row-level-security matrix constrains reads alone. The route is the write control. If the route trusts the request body, there is no second line of defence behind it.

**Identity is derived server-side and never accepted from the client.**

| Field | Source |
|---|---|
| `support_tickets.user_id` | `supabase.auth.getUser()` on the server |
| `help_queries.user_id` and `.audience` | Server session and the route that was called |
| `faq_article_feedback.user_id` | `supabase.auth.getUser()` on the server |

If any of these were read from the request body, a user could file a ticket attributed to another account and forge query-log rows that skew the Phase 2 evidence gate in §11.1.

**`support_tickets.context` is assembled from an explicit key allow-list**, never spread from client-supplied JSON. This is the same discipline decision D50 applied to `_website_page_content`, where `jsonb_build_object` with named keys was chosen over `to_jsonb(row)` precisely because the latter leaked host UUIDs. Allowed keys: `article_slug`, `category_slug`, `surface`.

**`page_url` is stripped of query string and fragment before storage.** A user who searched their own phone number lands on `/help?q=…`; storing that URL carries the number into the ticket row through a field the form's disclosure describes only as "the page you were on".

**The `help_queries` update path keys on `ref` only** (§5.5), never on the sequential `id`, and updates nothing but `resolved` and `escalated`.

§13 must include an integration test that posts a foreign `user_id` and asserts the stored row carries the session's identity instead.

---

## 9. Content

### 9.1 Content is the critical path

With no generated answers, the content *is* the product. A guided picker backed by mediocre articles is visibly mediocre. This was true of the RAG design too — retrieval-augmented generation would not have fixed weak content, it would have hidden it behind confident prose. Removing the model removes the disguise, which is a feature.

The launch target is roughly five published articles per category. Six app categories and four public categories at five each is fifty articles, reviewed under the two-person rule in `support-best-practices.md` §5.4. Shipping the interface against three articles produces a Help Centre that is empty in most categories, which teaches hosts that help does not work here. **Content readiness gates launch more tightly than code does.**

### 9.2 Division of labour

Content authoring is owned by **Brindo and Sree** on the operations team, confirmed by the founder on 2026-08-07. The two-person review rule in `support-best-practices.md` §5.4 means each article is written by one of them and reviewed by the other before its status moves to `published`.

| Produced by Claude, before handoff | Defined by Brindo and Sree |
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

### 10.1 The support address is inconsistent in four directions

| Variant | Where |
|---|---|
| `support@evenzi.com` | `platform-policies.md` §7.1, `support-best-practices.md` §2.2, plus feature overviews — 23 occurrences |
| `evenzi.official@gmail.com` | seven application files |
| `support@evenzi.in` | `docs/foundation/team-structure.md`, `docs/foundation/user-flows.md` |
| `support@evenzii.com` | this specification only |

The seven application files carrying the personal Gmail account:

- `app/auth/page.tsx:143` — the screen a locked-out user reaches
- `app/auth/role-selection/page.tsx:58`
- `app/events/[id]/settings/GeneralSettingsForm.tsx:293`
- `app/events/[id]/settings/guests/GuestListContent.tsx:174`
- `app/events/[id]/settings/billing/page.tsx:142`
- `app/events/[id]/settings/admins/AdminsContent.tsx:168`
- **`components/layout/PageFooter.tsx:19`** — the footer `/help` itself mounts, so without this the Help Centre renders the wrong address in its own chrome

The domain the company actually owns is **evenzii.com**, with Google Workspace already wired.

**Resolution, founder-approved 2026-08-07:** create `support@evenzii.com` and sweep all four variants.

**This is a build-time input, not only a launch-time one.** The address is consumed by the ticket-send-failure fallback and the logged-out contact card — the last working paths when everything else has failed. A builder starting before the mailbox exists will hardcode something. Introduce a single `NEXT_PUBLIC_SUPPORT_EMAIL` constant in build step 0 or 2 so the address is one line to change and nothing hardcodes it again.

**The same sweep carries the feature rename.** §1 retires the "Support Chatbot" name, but `docs/features/chatbot-overview.md` still describes a Gemini-and-Groq LLM bot escalating via Resend, and `CLAUDE.md`'s MVP table still carries a "Support Chatbot" row. Both would otherwise stand as documentation of an abandoned design — and per §9.3 that document is exactly the kind of source an automated drafting tool would treat as authoritative.

### 10.2 A submitted ticket currently notifies nobody

`RESEND_API_KEY` is deliberately unset, per `.cursor/rules/resend-deferred.mdc`. Submitting a ticket writes a database row and sends nothing. Meanwhile `platform-policies.md` §7.2 publishes a 24-hour first-response commitment, which the ticket form and its success state both restate on screen.

The design handles this honestly — the on-screen reference is the receipt, and no copy claims an email was sent. But honesty in the interface does not make the commitment true.

An earlier draft offered three equal remedies: configure the provider, have a named person check the tickets table, or build a minimal admin ticket list. **Those are not equal, and the middle one is worse than it sounds.** Reads on `support_tickets` are owner-only plus `service_role`, and no admin module exists — so "a named person checks the table" means giving that person the Supabase dashboard, which is unrestricted read on *every* table, including `event_guests` with guest names, phone numbers and email addresses. §8.2 has already established that ticket bodies sometimes contain pasted credentials. That arrangement puts a support reader in front of the entire production dataset.

**The pre-launch gate is therefore one of two things:** configure the email provider, or build the minimal admin ticket list — a single read-only view over `support_tickets`. If dashboard access is used as a stopgap, it must be a named, time-bounded grant recorded in the decision log, not an informal arrangement, and preferably a dedicated Postgres role with `select` on `public.support_tickets` alone.

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
| 3 | Migrations: `pg_trgm` and `pg_cron` extensions, five tables, RLS, seeds, the ninety-day `help_queries` cleanup job; DATA-MODEL, ERD and drawio updated | Founder sign-off on this spec |
| 4 | Search and content read APIs; ticket, feedback and query-log write APIs | Step 3 |
| 5 | All four `/help` route compositions, server-rendered: `/help`, `/help?q={query}`, `/help/{category-slug}`, `/help/a/{article-slug}`. Plus the middleware public-path entry. | Steps **1**, 2 and 4 |
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
| Unit | Search ranking and threshold behaviour; reference-code generation, alphabet and collision retry; Markdown sanitisation covering raw HTML, `javascript:`, `data:`, `srcset`, `style`, SVG and an entity-encoded scheme (`&#106;avascript:`); ticket validation schemas |
| Integration | Search returns only published articles of the requested audience; RLS denies cross-user ticket reads; feedback vote is idempotent per user per article; `help_queries` row written on every search |
| **Regression — must not be dropped** | **Negation:** a query containing `-term` returns no *more* rows than the same query without it. This is the §6.1 defect that returned the entire corpus, and it is invisible without an explicit test. **Stopword-only input:** `the and or of` produces zero results and no error, not zero results for every subsequent query. **Typo:** `invatation` reaches the invitation article, which fails at the default `word_similarity_threshold` of 0.6 and only passes at 0.5. **Identity:** posting a foreign `user_id` to the ticket, feedback and query-log routes stores the session's identity instead (§8.6). |
| Component | Panel state machine across all states; back-chain correctness from both category and search entry; ticket form retains content on submit failure |
| End-to-end | Guided path from FAB to answer; search-to-answer path; no-match to ticket to success; `/help/a/{slug}` renders with JavaScript disabled |
| Accessibility | Escape closes; focus returns to the FAB; focus trapped on mobile and not trapped on desktop; TalkBack walk on a real Android device; keyboard-only traversal of both surfaces |
| Manual | `/help/a/{slug}` opened inside WhatsApp's Android in-app browser — the forwarded-article path this route exists to serve |

The WhatsApp in-app browser check cannot be automated and cannot be verified at plan time. It is owed before launch.

---

## 14. Open questions and resolved decisions

### Still open

**When will the content be ready?** Brindo and Sree own authoring, but no delivery date has been agreed with them. Because content readiness gates launch more tightly than code does (§9.1), this is the single largest schedule risk in the feature. The build can proceed to completion without it; the launch cannot. Agreeing a date, and a per-category order so the most-needed categories land first, should happen before step 3 of the build sequence rather than after.

### Resolved by the founder on 2026-08-07

- **Content owners are Brindo and Sree** on the operations team. Recorded in §9.2.
- **`help_queries` retention is ninety days**, with a `pg_cron` cleanup job shipping alongside the table. Recorded in §8.3.
- **The landing-page FAQ section is a handoff to Dheeraj**, not a Cursor task, and the founder has confirmed building on his page is fine. `app/page.tsx` is his — every commit since 2026-06-08 is his work, including the landing template integration, the mobile fixes and the Three.js mascot. This carries a design constraint the plan-phase UI pass did not know about: the page has a **scroll-driven animated mascot**, so an accordion cannot simply be inserted into it. Expanding rows change page height mid-scroll, which interacts with a scroll-choreographed timeline. Dheeraj should design the section's placement and expansion behaviour against that timeline rather than receiving a specification for it.

---

## Revision history

- 2026-08-07 — Initial spec. Replaces the LLM-first architecture of 2026-04-14 with a tiered design whose generated-answer tier is deferred to Phase 2 behind an evidence gate. Founder decisions recorded: knowledge-only scope, tiers 0/1/3 in V0, two corpora split by audience, `config`/`public` schema split, ticket plus best-effort email escalation, `support@evenzii.com`, article feedback included, `OverlaySurface` as a prerequisite ticket, app corpus before public corpus, Qwen3-30b-a3b-fp8 as the Phase 2 model.
