# Design ↔ Build ↔ ClickUp Gap Analysis — 2026-06-13

> Read-only audit. Cross-references three inventories: the `designs/` prototype folder, the Next.js working tree (this worktree), and the ClickUp ticket trees for all 15 feature parents (Workspace 90161512057 / Product space 90166506901).
>
> **Headline:** The ticket *structure* is largely complete — almost every feature already has the standard phase tree (Spec → Data Model → per-Component {UI/UX, Frontend, Backend, QA} → Integration → Docs → Release). The two real problems are **(A) status drift** — design and build work that is finished in reality but whose tickets are still `backlog` — and **(B) a small set of genuinely missing tickets.** This is mostly a "bring tickets in line with reality" job, not a "create lots of new tickets" job.

---

## How the design tickets are actually structured

The premise "each feature parent has a design ticket" is true, but design (UI/UX) tickets are **not direct children of the feature parent**. They live one level down, as a `UI/UX Design` dev-phase child **under each `Component:` task** (alongside Frontend, Backend, QA). A few standalone "Design X UI (Figma/Stitch)" tasks also exist in the Features list (all `done`). So:

- A feature with N components has N `UI/UX Design` tickets nested under those components.
- "Does this feature have a design ticket?" → yes, wherever its components exist with their dev-phase children.
- The gap is therefore rarely "design ticket missing" — it's "design ticket exists but is still `backlog` while the actual prototype in `designs/` is complete."

---

## Three-way status matrix (per feature)

Legend — **Design:** FULL / PARTIAL / NONE (in `designs/`). **Build:** BUILT / PARTIAL / PLACEHOLDER / NONE (real React in this worktree). **Tickets:** parent status + structural completeness.

| Feature | Design | Build | Parent ticket | Subtasks | Structural gap | Status drift? |
|---|---|---|---|---|---|---|
| User Auth & Role Selection (`86d2jwz1h`) | FULL | BUILT | **done** | 8 | None | Aligned ✅ |
| Reusable Component Library (`86d2jwz25`) | FULL | PARTIAL | backlog | 10 | Data Model absent (ok — UI lib); no Backend dev-children (ok) | **Yes** — design done, tickets backlog |
| Event CRUD 5-Step Wizard (`86d2jwz3x`) | FULL | BUILT | review | 15 | None | **Yes (severe)** — parent=review, all 15 children backlog |
| Host Dashboard (`86d2jwz6v`) | FULL | BUILT | review | 9 | None | **Yes (severe)** — parent=review, all 9 children backlog |
| Guest Management & RSVP (`86d2jwz90`) | FULL | PLACEHOLDER | backlog | 10 | None (Public RSVP page lives under Digital Presence) | **Yes** — design done, UI/UX tickets backlog |
| Digital Invitations via WhatsApp (`86d2jwza1`) | FULL (card personalizer) | PLACEHOLDER | backlog (PARKED) | **0** | **All phases missing — bare parent** | n/a |
| Planning Tools (Checklist & Budget) (`86d2jwzck`) | FULL | PLACEHOLDER | backlog | 7 | None (null priorities) | **Yes** — design done, UI/UX tickets backlog |
| Media & Memories (Photo Gallery) (`86d2jwzdk`) | FULL | PLACEHOLDER | backlog | 9 | Photo Viewer component has only 3 dev-children | **Yes** — design done, UI/UX tickets backlog |
| Digital Presence (Event Website) (`86d2jwzge`) | FULL | PARTIAL | backlog | 13 | **Invitation Card Designer component has 0 dev-children** | **Yes** — design done, UI/UX tickets backlog |
| Landing Section (Marketing Site) (`86d2k1kwh`) | NONE | BUILT (separate app) | in progress | 15 | **Data Modeling missing (Blog uses Supabase CMS)** | Build ahead of tickets |
| Admin Module (`86d2k1kye`) | NONE | PLACEHOLDER | backlog | 15 | None (cleanest tree) | Aligned |
| Event Management Hub (`86d2k1kz1`) | FULL (event-control) | BUILT | backlog | 6 | Data Model absent (ok — shell) | **Yes** — design + build done, tickets backlog |
| Event Settings (`86d2k1kzq`) | FULL (6 tabs) | PARTIAL | backlog | 8 | Uneven dev-child counts (3/4/5) | **Yes** — design done, UI/UX tickets backlog |
| User Settings (`86d2k1m04`) | FULL | PLACEHOLDER | backlog | 8 | None | **Yes** — design done, UI/UX tickets backlog |
| Support Chatbot (MVP) (`86d2n3jxv`) | NONE | NONE | backlog | 11 | Chat Engine 2 / Chat Widget 3 dev-children | Unblocked 2026-06-13 (Figma dependency removed) |

---

## A. Genuinely MISSING tickets (candidates to ADD)

| # | Where | What to add | Why | Priority |
|---|---|---|---|---|
| A1 | Digital Invitations (`86d2jwza1`) | **Decision, then either build a minimal tree or formally close/park.** Per CLAUDE.md the live scope = invitation CARD designer (personalizer) — a full prototype is DONE — while WhatsApp send/tracking lives in Guest Mgmt. The card designer is already represented as the **Invitation Card Designer** component under Digital Presence (A2). Recommendation: keep this parent **parked/closed**, add a one-line comment pointing to Digital Presence + Guest Mgmt, rather than duplicating a tree. | Bare parent (0 subtasks) is the biggest structural hole; needs an explicit decision so it isn't read as "untracked work." | High (decision) |
| A2 | Digital Presence → **Invitation Card Designer** component (0 dev-children) | Add the 4 dev-phase children: **UI/UX Design** (→ mark `done`, prototype shipped), **Frontend Dev**, **Backend Dev** (PNG/Satori export → Supabase Storage → hosted URL), **Component QA**. | A complete, reviewed prototype exists (`designs/pages/invitations/`) but has no dev tickets to track the React/export build. | High |
| A3 | Landing Section (`86d2k1kwh`) | Add **Data Modeling** ticket (Blog runs on Supabase CMS). | Only data-backed Landing surface (Blog) has no schema ticket. | Normal |
| A4 | Media & Memories → **Photo Viewer** component | Add the missing 4th dev-phase child (likely **Backend Dev** or **QA**). | Component has 3 of 4 standard dev-children. | Low |
| A5 | Support Chatbot → **Chat Engine** (2 children) & **Chat Widget** (3 children) | Backfill missing dev-phase children to the standard 4. | Under-populated vs standard hierarchy. | Low |
| A6 | Event Settings → **Privacy & Access** component (3 children) | Backfill the missing dev-phase child. | Uneven (sibling has 4–5). | Low |

> Note: the "missing Backend dev-child" on Component Library and Landing components is **acceptable by design** (pure UI / static content) and is NOT proposed for addition.

## B. STATUS DRIFT — tickets to bring in line with reality (no new tickets, just transitions)

This is the larger and higher-value cleanup. Designs (and in several cases real React) are finished, but tickets sit in `backlog`.

| # | Feature | Reality | Ticket reality | Proposed sync |
|---|---|---|---|---|
| B1 | Event CRUD (`86d2jwz3x`) | Full prototype + real React wizard + Supabase tables + RPC; parent already `review` | All 15 children `backlog` | UI/UX Design children → `done`; Frontend/Backend/Data Model → `review` or `done` (per build); Integration/Docs/Release as appropriate |
| B2 | Host Dashboard (`86d2jwz6v`) | Full prototype + real React `/home` + server data; parent already `review` | All 9 children `backlog` | Same pattern as B1 |
| B3 | Event Management Hub (`86d2k1kz1`) | Full prototype (`event-control`) + real React `/events/[id]` with server data | Parent + all children `backlog` | UI/UX Design → `done`; Frontend → `review`/`done`; parent → `in progress`/`review` |
| B4 | Guest Management & RSVP (`86d2jwz90`) | Full prototype DONE; React still placeholder | All children `backlog` | UI/UX Design children → `done`; rest stay `backlog`/`to do` |
| B5 | Planning Tools (`86d2jwzck`) | Full prototype DONE; React placeholder | All children `backlog`; null priorities | UI/UX Design children → `done`; set priorities |
| B6 | Media & Memories (`86d2jwzdk`) | Full prototype + v2 DONE; React placeholder | All children `backlog` | UI/UX Design children → `done` |
| B7 | Digital Presence (`86d2jwzge`) | Full prototype DONE (editor suite + templates); React partial | All children `backlog` | UI/UX Design children → `done`; Frontend partial → `to do`/`in progress` |
| B8 | Event Settings (`86d2k1kzq`) | Full prototype (6 tabs) DONE; React partial | All children `backlog` | UI/UX Design children → `done` |
| B9 | User Settings (`86d2k1m04`) | Full prototype DONE; React placeholder | All children `backlog` | UI/UX Design children → `done` |
| B10 | Component Library (`86d2jwz25`) | `components.html` + shell system effectively complete (the prototype catalog); React `components/ui` ~50% | All children `backlog` | UI/UX/spec children → `done`; Frontend → `in progress` |

## C. Tag / hygiene anomalies (low priority, optional)

- **Tag drift:** Landing Section uses `sprint:1/2/3` + `type:*` tags; every other feature uses `mvp-phase-1` + `feature`. Pick one convention.
- **Active Sprint list (`901614390914`) is empty** — all work tracked in the "Features" list directly. The session skills assume an Active Sprint list; either populate it or accept Features-list-as-board.
- **No sprint folder** in `docs/sprint/` yet (README says "none yet"). Affects Dheeraj digest flow, not tickets.
- **Several null priorities** (Planning parent + children).

---

## Recommended execution order (once approved)

1. **Decide A1** (Invitations parked vs tree) — unblocks A2 framing.
2. **B1–B3** status sync (Event CRUD, Dashboard, Hub) — these are `review`/built but show `backlog`; highest credibility cost.
3. **A2** (Invitation Card Designer dev-children) + **A3** (Landing Data Model).
4. **B4–B10** UI/UX-Design-children → `done` for all completed prototypes (batch).
5. **A4–A6 + C** hygiene — optional, low priority.

> All ticket writes are gated on Abhijith's approval. Nothing in this doc has been written to ClickUp.

---

## EXECUTED — 2026-06-13 (approved: A + B + C)

**Decisions taken:** A1 = build a real tree · B = UI/UX→done, dev→review for built features · C = standardize on `mvp-phase-1 + feature`.

### A — Tickets added
- **A1 — Digital Invitations (`86d2jwza1`):** built full tree (20 tasks). Spec, Data Model, Integration, Docs, Release + 3 components — **Card Gallery & Template Picker** (`86d3b4a2w`), **Card Personalizer** (`86d3b4a30`), **Card Export & Share** (`86d3b4a3b`) — each with UI/UX→Frontend→Backend→QA. UI/UX children set `done` (prototype shipped). Parent → `in progress`, priority `normal`.
- **A2 — Digital Presence → Invitation Card Designer (`86d2k1ptr`):** left bare on purpose; added a "superseded → see `86d2jwza1`" pointer comment (avoids duplicate tree).
- **A3 — Landing Section:** added `Data Modeling: Landing Section` (`86d3b4a5x`) for the Blog/Contact Supabase CMS.
- **A4–A6 (low-pri backfills): NOT done** — deferred (cosmetic; see "Remaining" below).

### B — Status drift synced (58 transitions, all succeeded)
- **Event CRUD (`86d2jwz3x`):** Data Model→done; 8 UI/UX→done; Step4 + Edit&Delete + Wizard-Shell FE/BE that were backlog→review.
- **Host Dashboard (`86d2jwz6v`):** Spec + Data Model→done; 4 UI/UX→done; Quick Stats FE/BE→review.
- **Event Mgmt Hub (`86d2k1kz1`):** Spec→done; 3 UI/UX→done; all 3 components FE+BE→review; parent backlog→review.
- **UI/UX Design → done** for all completed prototypes: Guest Mgmt (5), Planning (2), Media (3), Event Settings (3), User Settings (3), Component Library (6), Digital Presence host-editor components only (4).
- **Component Library parent** backlog→in progress.
- Sync comments posted on Event CRUD, Host Dashboard, Event Mgmt Hub parents.

### C — Hygiene
- **Landing parent (`86d2k1kwh`):** removed `sprint:1/2/3` + 6 `type:*` tags; added `feature` + `mvp-phase-1` (kept `review-later`).

### Follow-up pass — design-page coverage (2026-06-13, "update pls")
Closed the gap so every completed design page maps to a tracked ticket:
- **Event Settings — added 3 missing component trees** for designed tabs with no ticket: **Admins & Team** (`86d3b4cbr`), **Plan & Billing** (`86d3b4cbv`), **Registry** (`86d3b4cby`) — each with UI/UX→Frontend→Backend→QA; UI/UX children set `done`. (Designed tabs `guest-list`→Guest Mgmt and `website`→Digital Presence already have homes.)
- **Media → Photo Viewer (`86d2k1n3j`):** added the missing `UI/UX Design` child (`86d3b4cbz`), set `done` (lightbox prototype shipped).
- **Auth:** Phone OTP / Google OAuth / Session screens still have no component tickets — left as-is (parent `86d2jwz1h` is `done`, low impact).

### Remaining / deferred (optional, not done)
- **Landing CHILD tickets still carry `sprint:N` / `type:*` tags** — only the parent was normalized. ~15 children; can batch on request.
- **A5 dev-child backfills** — Chatbot→Chat Engine/Widget. Low priority.
- **Support Chatbot unblocked (2026-06-13)** — Figma dependency removed; ticket (`86d2n3jxv`) description + rollout updated; backend + UI can proceed from the design system.
- **Null priorities** on many component/dev subtasks — left as-is (inherit fine; cosmetic).
- **Active Sprint list (`901614390914`) empty** — decision pending: populate it, or accept the Features list as the board.
- **Digital Presence guest-facing components** (Guest Auth, Guest-Specific Views, RSVP Page) UI/UX left `backlog` — public guest site not designed yet (correct).
- **Notifications component (Event Settings) has a duplicate Frontend Dev child** — flagged by traversal; not auto-resolved.
