# 00 — Feature Map

> Full inventory: 16 product features + 4 infrastructure concerns. Source of truth for sprint scoping.
>
> Last update: 2026-05-03

---

## Product features (16)

| # | Feature | ClickUp ID | Priority | Code state | ClickUp status | T-shirt | Subtask count | Linked specs |
|---|---------|-----------|----------|------------|----------------|---------|---------------|--------------|
| F1 | Fix Vercel Deployment | [86d2jmkn4](https://app.clickup.com/t/86d2jmkn4) | P0 | DONE — live at evenzi.vercel.app | done | S | 0 | — |
| F2 | Auth & Role Selection | [86d2jwz1h](https://app.clickup.com/t/86d2jwz1h) | P0 | DONE | done | M | 8 | [auth-role-selection-design](../superpowers/specs/2026-04-08-auth-role-selection-design.md) |
| F3 | Event CRUD (5-Step Wizard) | [86d2jwz3x](https://app.clickup.com/t/86d2jwz3x) | P0 | DONE — in review | review | XL | 14 | [event-crud-design](../superpowers/specs/2026-04-09-event-crud-design.md) |
| F4 | Host Dashboard | [86d2jwz6v](https://app.clickup.com/t/86d2jwz6v) | P0 | DONE — in review | review | M | 9 | none yet |
| F5 | Reusable Component Library | [86d2jwz25](https://app.clickup.com/t/86d2jwz25) | P0 | Not started | backlog | L | 10 | none yet |
| F6 | Event Management Hub | [86d2k1kz1](https://app.clickup.com/t/86d2k1kz1) | P0 | Not started | backlog | M | ~16 | none yet |
| F7 | Guest Management & RSVP | [86d2jwz90](https://app.clickup.com/t/86d2jwz90) | P1 | Not started | backlog | L | 10 | none yet |
| F8 | User Settings | [86d2k1m04](https://app.clickup.com/t/86d2k1m04) | P1 | Not started | backlog | M | ~20 | none yet |
| F9 | Event Settings | [86d2k1kzq](https://app.clickup.com/t/86d2k1kzq) | P1 | Not started | backlog | M | 8 | none yet |
| F10 | Support Chatbot | [86d2n3jxv](https://app.clickup.com/t/86d2n3jxv) | P1 | Spec done — Figma blocked | backlog | M | 28 | [chatbot-design](../superpowers/specs/2026-04-14-chatbot-design.md) + [plan](../superpowers/plans/2026-04-14-chatbot-implementation.md) |
| F11 | Landing Section (Marketing Site) | [86d2k1kwh](https://app.clickup.com/t/86d2k1kwh) | P2 | In progress (content blocked) | in progress | L | 13 | none yet |
| F12 | Planning Tools (Checklist + Budget) | [86d2jwzck](https://app.clickup.com/t/86d2jwzck) | P2 | Not started | backlog | L | ~15 | none yet |
| F13 | Media & Memories (Photo Gallery) | [86d2jwzdk](https://app.clickup.com/t/86d2jwzdk) | P2 | Not started | backlog | M | ~25 | none yet |
| F14 | Digital Presence (Event Website) | [86d2jwzge](https://app.clickup.com/t/86d2jwzge) | P2 | Not started | backlog | L | ~30 | none yet |
| F15 | Admin Module (Developer Panel) | [86d2k1kye](https://app.clickup.com/t/86d2k1kye) | P2 | Not started | backlog | L | ~50 | none yet |
| F16 | Digital Invitations (WhatsApp) | [86d2jwza1](https://app.clickup.com/t/86d2jwza1) | P3 | Parked (depends on F11+F7) | backlog | M | 0 | none yet |

## Infrastructure concerns (4) — NEW

These are NOT product features. They are cross-cutting platform concerns. Each gets a decision spec (this folder) + ONE implementation task in the **Ops** ClickUp list. No full feature hierarchy.

| # | Concern | Doc | Why it matters | Touches features |
|---|---------|-----|----------------|------------------|
| I1 | Image & Video Storage | [03-image-storage.md](./03-image-storage.md) | **LOCKED — Cloudflare R2.** Store-and-retrieve only; processing happens app-side. Private buckets + signed URLs. Custom domain `cdn.evenzi.com`. Free tier covers MVP. | F3, F4, F8, F11, F13, F14, F16 |
| I2 | Subscription & Billing | [04-subscription-billing.md](./04-subscription-billing.md) | Platform must support tiered pricing + feature gates + usage limits even before pricing specifics are locked. Adding billing later = painful | F8 (User Settings), F15 (Admin), every feature with limits (gallery photos, guests, events) |
| I3 | Modular Architecture | [05-modular-architecture.md](./05-modular-architecture.md) | Each feature ships as an independent module talking to a thin Evenzi core (star schema). Defines module boundaries, APIs, deployment story | All — this is how features compose |
| I4 | Scalability | [06-scalability.md](./06-scalability.md) | Current Next.js + Supabase architecture's growth ceiling, bottlenecks, what to monitor, when to migrate | All |

## Out of MVP (parked, post-launch)

| Item | Why parked |
|---|---|
| Vendor role + flows | Different user type, expands scope significantly |
| AI Photo Finder | High effort, low MVP signal |
| Real-time features (live RSVP, presence) | Needs websockets / Supabase Realtime engineering investment |
| Event Discovery / Search | Marketplace dynamics, post-launch when there's content |
| Analytics dashboard | Needs data first — premature |

## Standard 8-phase model (every feature)

Every feature follows the same lifecycle. This is the basis for the gap matrix in `01-feature-gap-matrix.md`.

```
Planning → UI Design → Data Modeling → Backend → Frontend → Integration → Testing → Deployment
```

Phase definitions:

| Phase | Owner | Output |
|-------|-------|--------|
| **Planning** | Abhijith | Spec doc in `docs/superpowers/specs/`, ClickUp Spec & Architecture subtask done |
| **UI Design** | Abhijith | Stitch + Figma frames signed off, design tokens extracted |
| **Data Modeling** | Abhijith | Schema doc, Supabase tables + migrations, RLS policies |
| **Backend** | Abhijith | API routes / RPCs / edge functions, with Zod validation |
| **Frontend** | Dheeraj | React components built against shared library + APIs |
| **Integration** | Dheeraj | E2E test of feature flow, data round-trips |
| **Testing** | Dheeraj | Vitest unit/integration coverage, manual QA pass |
| **Deployment** | Abhijith | Migration applied, env vars set, Vercel deploy verified |

## See also
- **[00b — Platform User Flow (snowflake)](./00b-platform-flow.md)** — visual map of the whole-platform user journey, personas, decision points, sad paths, module preview.

## How this map drives sprint planning

1. Pick features for the sprint
2. For each, look up its row in `01-feature-gap-matrix.md` to see what phase it's at
3. Plan tasks for the next 1-2 unblocked phases
4. Cross-check `02-dependency-graph.md` to confirm no upstream blocker
5. Cross-check this map's "Touches" column for infrastructure concerns to surface in the spec
