# Evenzi — Full Data Model ERD, Functions & Flows

> Visual companion to [`DATA-MODEL.md`](DATA-MODEL.md) (the canonical reference). Covers the whole live schema as of **v2026-06-16.3** — CORE + Planning + Guests + Media. Renders on GitHub / VS Code (Mermaid).
>
> **Schemas:** `config.*` = reference/catalog (admin-seeded, public-read) · `public.*` = live app data (owner-only RLS) · `auth.*` = Supabase-managed identity.

---

## 1. Domain Module Map

Six modules, each owning its tables. Config seeds all child modules at event creation; Events Core is the FK anchor for every `public.*` table.

```mermaid
flowchart TB
  subgraph CFG["⚙️ Config / Catalog  (config schema)"]
    CUT[config_user_types]
    CET[config_event_types]
    CEST[config_event_sub_types]
    CEC[config_event_checklists]
    CTP[config_task_priorities]
    CTS[config_task_statuses]
    CEXT[config_expense_types]
    CRS[config_rsvp_statuses]
    CGT[config_guest_tags]
    CAP[config_album_presets]
  end

  subgraph USR["👤 Identity / Users"]
    UP[user_profiles]
    UPR[user_preferences]
  end

  subgraph CORE["📅 Events Core"]
    E[events]
    ESE[event_sub_events]
    EC[event_collaborators]
  end

  subgraph PLN["📋 Planning"]
    ET[event_tasks]
    ETA[event_task_assignees]
    EB[event_budgets]
    EXPT[event_expense_types]
    EXP[event_expenses]
  end

  subgraph GST["👥 Guest Management"]
    EG[event_guests]
    EGSE[event_guest_sub_events]
    EGT[event_guest_tags]
    EGTL[event_guest_tag_links]
  end

  subgraph MED["📸 Media & Memories"]
    EM[event_media]
    EA[event_albums]
    EMA[event_media_albums]
    EMT[event_media_tags]
    EMTL[event_media_tag_links]
  end

  CFG -. "seeds / defines" .-> CORE
  CFG -. "seeds" .-> PLN
  CFG -. "seeds" .-> GST
  CFG -. "seeds" .-> MED
  USR -- "owns" --> CORE
  CORE -- "parent FK" --> PLN
  CORE -- "parent FK" --> GST
  CORE -- "parent FK" --> MED

  classDef cfg fill:#e8eeff,stroke:#5b7fd4,color:#1e3a6e;
  classDef usr fill:#e8fef0,stroke:#47a86e,color:#144d2e;
  classDef core fill:#fff3e0,stroke:#e8941a,color:#6d3c00;
  classDef pln fill:#f3e8ff,stroke:#9b59d4,color:#4a1a7e;
  classDef gst fill:#ffe8ec,stroke:#d45b74,color:#6e1a2e;
  classDef med fill:#e8f8ff,stroke:#2e9fd4,color:#0a3d5e;

  class CUT,CET,CEST,CEC,CTP,CTS,CEXT,CRS,CGT,CAP cfg;
  class UP,UPR usr;
  class E,ESE,EC core;
  class ET,ETA,EB,EXPT,EXP pln;
  class EG,EGSE,EGT,EGTL gst;
  class EM,EA,EMA,EMT,EMTL med;
```

**Arrow key:** `-->` live FK dependency · `-.->` dashed = catalog→per-event **copy** at creation (not a live FK).

---

## 2. Entity-Relationship Diagram (all tables, all columns)

```mermaid
erDiagram
  %% ---------- AUTH (Supabase-managed) ----------
  AUTH_USERS {
    uuid id PK
    text email "verified"
    text phone "verified"
    jsonb raw_user_meta_data "Google name/avatar"
  }

  %% ---------- CONFIG (catalog tables — admin-seeded, public-read) ----------
  CONFIG_USER_TYPES {
    uuid id PK
    text slug UK
    text name
    text description
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }
  CONFIG_EVENT_TYPES {
    uuid id PK
    text slug UK
    text name
    text description
    text icon_name
    text image_url
    jsonb field_schema
    jsonb features
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }
  CONFIG_EVENT_SUB_TYPES {
    uuid id PK
    uuid event_type_id FK
    text slug
    text name
    text icon_name
    int display_order
    bool is_default
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }
  CONFIG_EVENT_CHECKLISTS {
    uuid id PK
    uuid event_type_id FK
    text title
    text description
    text default_priority_slug FK "slug ref → config.task_priorities"
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }
  CONFIG_TASK_PRIORITIES {
    uuid id PK
    text slug UK
    text name
    text description
    text icon_name
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }
  CONFIG_TASK_STATUSES {
    uuid id PK
    text slug UK
    text name
    text description
    text icon_name
    text category "open|done|dropped"
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }
  CONFIG_EXPENSE_TYPES {
    uuid id PK
    text slug UK
    text name
    text description
    text icon_name
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }
  CONFIG_RSVP_STATUSES {
    uuid id PK
    text slug UK
    text name
    text category "pending|attending|declined|tentative"
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }
  CONFIG_GUEST_TAGS {
    uuid id PK
    text slug UK
    text name
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }
  CONFIG_ALBUM_PRESETS {
    uuid id PK
    text slug UK
    text name
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }

  %% ---------- IDENTITY ----------
  USER_PROFILES {
    uuid id PK_FK "= auth.users.id (cascade)"
    text role_slug FK "→ config.user_types(slug)"
    text display_name
    text avatar_url
    text email "verified mirror"
    text phone "verified mirror"
    text auth_provider "phone|google|email"
    text location
    bool onboarding_completed
    timestamptz created_at
    timestamptz updated_at
  }
  USER_PREFERENCES {
    uuid user_id PK_FK "1:1 (cascade)"
    bool email_alerts
    bool push_notifications
    bool sms_alerts
    timestamptz created_at
    timestamptz updated_at
  }

  %% ---------- CORE ----------
  EVENTS {
    uuid id PK
    uuid user_id FK "owner (transferable, cascade)"
    uuid created_by FK "creator (set null on delete)"
    uuid event_type_id FK "restrict"
    text name
    date primary_date
    text primary_venue
    int guest_capacity
    text cover_image_url
    text description
    jsonb event_details
    text status "draft|active|completed|cancelled"
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at "soft delete"
  }
  EVENT_SUB_EVENTS {
    uuid id PK
    uuid event_id FK "cascade"
    uuid event_sub_type_id FK "null=custom (set null)"
    text custom_name
    date event_date
    time start_time
    time end_time
    text venue
    int guest_count
    text status "tbc|confirmed|cancelled"
    int display_order
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_COLLABORATORS {
    uuid id PK
    uuid event_id FK "cascade"
    uuid user_id FK "null until accepted (cascade)"
    text invited_email
    text invited_phone
    text role
    text status "pending|active"
    timestamptz invited_at
    timestamptz accepted_at
    timestamptz created_at
    timestamptz updated_at
  }

  %% ---------- PLANNING: tasks ----------
  EVENT_TASKS {
    uuid id PK
    uuid event_id FK "cascade"
    uuid template_id FK "set null (null=host-added)"
    uuid sub_event_id FK "set null (null=whole event)"
    text title
    text description
    uuid priority_id FK "restrict"
    uuid status_id FK "restrict"
    date due_date
    int display_order
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_TASK_ASSIGNEES {
    uuid id PK
    uuid event_id FK "guard-derived from task (cascade)"
    uuid task_id FK "cascade"
    uuid user_id FK "owner or active collaborator (cascade)"
    uuid assigned_by FK "set null on delete"
    timestamptz created_at
  }

  %% ---------- PLANNING: budget ----------
  EVENT_BUDGETS {
    uuid event_id PK_FK "1:1 (cascade)"
    numeric total_amount
    text currency
    uuid modified_by FK "set null on delete"
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_EXPENSE_TYPES {
    uuid id PK
    uuid event_id FK "cascade"
    text name
    text icon_name
    bool is_custom
    text source_slug "provenance text; NOT an FK"
    bool enabled
    int display_order
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_EXPENSES {
    uuid id PK
    uuid event_id FK "cascade"
    uuid sub_event_id FK "set null (null=whole event)"
    uuid expense_type_id FK "restrict"
    text title
    text description
    text vendor_name
    numeric amount
    text receipt_key "R2 private bucket key"
    date expense_date
    uuid created_by FK "set null on delete"
    timestamptz created_at
    timestamptz updated_at
  }

  %% ---------- GUESTS ----------
  EVENT_GUESTS {
    uuid id PK
    uuid event_id FK "cascade"
    text name
    text email
    text phone
    uuid rsvp_status_id FK "restrict"
    bool invited
    int party_size
    text notes
    uuid created_by FK "set null on delete"
    int display_order
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_GUEST_SUB_EVENTS {
    uuid id PK
    uuid event_id FK "guard-derived from guest (cascade)"
    uuid guest_id FK "cascade"
    uuid sub_event_id FK "cascade"
    timestamptz created_at
  }
  EVENT_GUEST_TAGS {
    uuid id PK
    uuid event_id FK "cascade"
    text name
    bool is_custom
    text source_slug "provenance text; NOT an FK"
    uuid created_by FK "set null on delete"
    int display_order
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_GUEST_TAG_LINKS {
    uuid id PK
    uuid event_id FK "guard-derived from guest (cascade)"
    uuid guest_id FK "cascade"
    uuid tag_id FK "cascade"
    timestamptz created_at
  }

  %% ---------- MEDIA ----------
  EVENT_MEDIA {
    uuid id PK
    uuid event_id FK "cascade"
    text kind "photo|video"
    text storage_key "R2 private key"
    text thumbnail_key "R2 thumb/video poster"
    text name
    text original_filename
    text content_type
    bigint byte_size "advisory; server-stamped"
    int width
    int height
    int duration_sec "null unless kind=video"
    uuid sub_event_id FK "set null (null=whole event)"
    timestamptz taken_at "EXIF date"
    bool published "website gallery selector"
    uuid created_by FK "set null on delete"
    uuid updated_by FK "last editor; set null on delete"
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_ALBUMS {
    uuid id PK
    uuid event_id FK "cascade"
    text name
    bool is_custom
    text source_slug "provenance text; NOT an FK"
    uuid cover_media_id FK "set null on delete"
    int display_order
    uuid created_by FK "set null on delete"
    uuid updated_by FK "last editor; set null on delete"
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_MEDIA_ALBUMS {
    uuid id PK
    uuid event_id FK "guard-derived from media (cascade)"
    uuid media_id FK "cascade"
    uuid album_id FK "cascade"
    timestamptz created_at
  }
  EVENT_MEDIA_TAGS {
    uuid id PK
    uuid event_id FK "cascade"
    text name
    uuid created_by FK "set null on delete"
    uuid updated_by FK "last editor; set null on delete"
    int display_order
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_MEDIA_TAG_LINKS {
    uuid id PK
    uuid event_id FK "guard-derived from media (cascade)"
    uuid media_id FK "cascade"
    uuid tag_id FK "cascade"
    timestamptz created_at
  }

  %% ===== RELATIONSHIPS =====
  AUTH_USERS ||--|| USER_PROFILES : "1:1"
  AUTH_USERS ||--|| USER_PREFERENCES : "1:1"
  AUTH_USERS ||--o{ EVENTS : "owns (user_id)"
  AUTH_USERS |o--o{ EVENTS : "created (created_by)"
  AUTH_USERS |o--o{ EVENT_COLLABORATORS : "member"
  AUTH_USERS |o--o{ EVENT_TASK_ASSIGNEES : "assignee"

  CONFIG_USER_TYPES ||--o{ USER_PROFILES : "role_slug"
  CONFIG_EVENT_TYPES ||--o{ CONFIG_EVENT_SUB_TYPES : "defines"
  CONFIG_EVENT_TYPES ||--o{ CONFIG_EVENT_CHECKLISTS : "defines"
  CONFIG_EVENT_TYPES ||--o{ EVENTS : "categorizes"
  CONFIG_TASK_PRIORITIES ||--o{ CONFIG_EVENT_CHECKLISTS : "default_priority_slug"
  CONFIG_TASK_PRIORITIES ||--o{ EVENT_TASKS : "priority_id"
  CONFIG_TASK_STATUSES ||--o{ EVENT_TASKS : "status_id"
  CONFIG_RSVP_STATUSES ||--o{ EVENT_GUESTS : "rsvp_status_id"
  CONFIG_EVENT_CHECKLISTS |o--o{ EVENT_TASKS : "seeds (set null)"
  CONFIG_EVENT_SUB_TYPES |o--o{ EVENT_SUB_EVENTS : "seeds (set null)"
  CONFIG_EXPENSE_TYPES ..> EVENT_EXPENSE_TYPES : "seeds (copy)"
  CONFIG_GUEST_TAGS ..> EVENT_GUEST_TAGS : "seeds (copy)"
  CONFIG_ALBUM_PRESETS ..> EVENT_ALBUMS : "seeds (copy)"

  EVENTS ||--o{ EVENT_SUB_EVENTS : "has"
  EVENTS ||--o{ EVENT_COLLABORATORS : "has"
  EVENTS ||--o{ EVENT_TASKS : "has"
  EVENTS ||--|| EVENT_BUDGETS : "1:1"
  EVENTS ||--o{ EVENT_EXPENSE_TYPES : "has"
  EVENTS ||--o{ EVENT_EXPENSES : "has"
  EVENTS ||--o{ EVENT_GUESTS : "has"
  EVENTS ||--o{ EVENT_GUEST_TAGS : "has"
  EVENTS ||--o{ EVENT_MEDIA : "has"
  EVENTS ||--o{ EVENT_ALBUMS : "has"
  EVENTS ||--o{ EVENT_MEDIA_TAGS : "has"

  EVENT_SUB_EVENTS |o--o{ EVENT_TASKS : "tagged"
  EVENT_SUB_EVENTS |o--o{ EVENT_EXPENSES : "tagged"
  EVENT_SUB_EVENTS |o--o{ EVENT_GUEST_SUB_EVENTS : "invited-to"
  EVENT_SUB_EVENTS |o--o{ EVENT_MEDIA : "tagged"

  EVENT_TASKS ||--o{ EVENT_TASK_ASSIGNEES : "assigned"
  EVENT_EXPENSE_TYPES ||--o{ EVENT_EXPENSES : "categorizes"

  EVENT_GUESTS ||--o{ EVENT_GUEST_SUB_EVENTS : "M:N functions"
  EVENT_GUESTS ||--o{ EVENT_GUEST_TAG_LINKS : "M:N tags"
  EVENT_GUEST_TAGS ||--o{ EVENT_GUEST_TAG_LINKS : "M:N"

  EVENT_MEDIA ||--o{ EVENT_MEDIA_ALBUMS : "M:N albums"
  EVENT_ALBUMS ||--o{ EVENT_MEDIA_ALBUMS : "M:N"
  EVENT_ALBUMS |o--|| EVENT_MEDIA : "cover (set null)"
  EVENT_MEDIA ||--o{ EVENT_MEDIA_TAG_LINKS : "M:N tags"
  EVENT_MEDIA_TAGS ||--o{ EVENT_MEDIA_TAG_LINKS : "M:N"
```

**Legend:** `||--o{` one-to-many · `||--||` one-to-one · `|o--o{` optional (nullable FK) · `..>` dashed = catalog→per-event **copy** at event creation (not a live FK). All columns shown per entity. **Modularity rule:** every module FK points only to core (`events`, `event_sub_events`, `auth.users`) or `config.*` — never another module's tables.

---

## 3. Functions, triggers & views (the "logic" layer)

```mermaid
flowchart LR
  subgraph TRG["Triggers (BEFORE row)"]
    direction TB
    SUA["set_updated_at()<br/>every table → updated_at"]
    SUB["stamp_updated_by()<br/>media/albums/media-tags → updated_by"]
    STC["stamp_*_created_by()<br/>expenses/guests/media/tags"]
    GRD["guard fns (SECURITY DEFINER)<br/>event_task_assignee_before · media_album_before<br/>guest/media link guards · album_cover_before<br/>→ derive event_id, reject cross-event"]
    DRS["default_guest_rsvp()<br/>→ pending if null"]
  end

  subgraph RPC["RPCs (callable)"]
    direction TB
    CE["create_event_with_details() [DEFINER]<br/>1 txn: event + sub-events + seed tasks<br/>+ expense-types + budget + guest-tags + albums"]
    TC["event_task_counts() [invoker]<br/>→ total/todo/done/overdue"]
    BK["bulk_set_task_status() [invoker]"]
  end

  subgraph VW["Views (security_invoker = on)"]
    direction TB
    V1["event_task_progress"]
    V2["event_budget_summary"]
    V3["event_expense_breakdown"]
    V4["event_guest_stats"]
    V5["event_sub_event_guest_counts"]
    V6["event_media_storage"]
    V7["event_album_counts"]
  end

  subgraph PLN["[PLANNED]"]
    direction TB
    P1["handle_new_user() — signup hook"]
    P2["can_access_event() — owner∪collaborator∪admin"]
    P3["link_pending_collaborators()"]
    P4["delete_user_account()"]
  end

  classDef planned fill:#f5f5f5,stroke:#bbb,stroke-dasharray:4 3,color:#666;
  class PLN,P1,P2,P3,P4 planned;
```

| Object | Kind | Security | Purpose |
|---|---|---|---|
| `set_updated_at` | trigger fn | — | stamp `updated_at` on every table |
| `stamp_updated_by` | trigger fn | DEFINER | stamp `updated_by` (media/albums/media-tags) on UPDATE |
| `stamp_*_created_by` | trigger fns | DEFINER | server-stamp `created_by` (never client-trusted) |
| `*_before` guards | trigger fns | DEFINER | derive `event_id` from parent + reject cross-event refs |
| `default_guest_rsvp` | trigger fn | DEFINER | default RSVP → `pending` |
| `create_event_with_details` | RPC | DEFINER | one-txn event create + 6 seed blocks; owner from `auth.uid()` |
| `event_task_counts` / `bulk_set_task_status` | RPC | invoker | toolbar counts / bulk status |
| 7 views | view | `security_invoker` | derived numbers (progress, budget, guest stats, storage, counts) |
| `handle_new_user` · `can_access_event` · `link_pending_collaborators` · `delete_user_account` | fn | [PLANNED] | signup seed · access check · invite-link · account deletion |

---

## 4. Flow — event creation (`create_event_with_details`, one transaction)

```mermaid
flowchart TD
  A["API: POST /api/events<br/>(server, user session)"] --> B["rpc create_event_with_details(...)"]
  B --> C{"auth.uid() null?"}
  C -- yes --> X["RAISE 'not authenticated'"]
  C -- no --> D["INSERT events<br/>user_id = created_by = auth.uid()<br/>event_details from p_metadata jsonb"]
  D --> E["INSERT event_sub_events (from p_sub_events)"]
  E --> F["SEED event_tasks ← config.event_checklists<br/>status=pending, priority=default_priority_slug"]
  F --> G["SEED event_expense_types ← config.expense_types"]
  G --> H["INSERT event_budgets (total 0)"]
  H --> I["SEED event_guest_tags ← config.guest_tags<br/>(is_custom=false, created_by=null)"]
  I --> J["SEED event_albums ← config.album_presets<br/>(is_custom=false, created_by=null)"]
  J --> K["RETURN {event_id, name, status, created_at}"]
  D -.-> note["all 6 seeds + insert<br/>commit/rollback together"]
```

---

## 5. Flow — RLS access model & signup

```mermaid
flowchart TD
  subgraph NOW["Owner-only (live)"]
    R1["authenticated request"] --> R2{"event-child row?"}
    R2 -- yes --> R3["EXISTS(events.user_id = auth.uid())<br/>inlined on every public.* table"]
    R2 -- "config.* catalog" --> R4["SELECT using(true); no write policy<br/>(admin via service_role)"]
    R3 --> R5["link/join tables: event_id is<br/>guard-trigger-derived → single-hop check"]
  end
  subgraph LATER["[PLANNED] cutover"]
    L1["can_access_event(event_id)<br/>= owner ∪ active collaborator ∪ admin"]
    L2["one coordinated migration swaps<br/>ALL event-children at once"]
    L1 --> L2
  end
  NOW -.->|"collaborator pass"| LATER

  subgraph SIGNUP["Signup → identity [PLANNED hook]"]
    S1["auth.users INSERT (phone OTP / Google)"] --> S2["handle_new_user()"]
    S2 --> S3["INSERT user_profiles + user_preferences<br/>(copy verified email/phone/name)"]
    S3 --> S4["link_pending_collaborators()<br/>match verified email/phone → pending invites"]
    S4 --> S5["role-select sets role_slug (once)"]
  end
  classDef planned fill:#f5f5f5,stroke:#bbb,stroke-dasharray:4 3,color:#666;
  class LATER,L1,L2,SIGNUP,S1,S2,S3,S4,S5 planned;
```

---

## 6. Flow — account deletion cascade (`delete_user_account` [PLANNED])

```mermaid
flowchart TD
  D0["delete_user_account(user_id)<br/>service_role + confirm self/admin"] --> D1["purge R2 objects by prefix<br/>events/{eventId}/… (media, receipts, invites)"]
  D1 --> D2["DELETE auth.users(id)"]
  D2 --> C1["CASCADE: user_profiles, user_preferences"]
  D2 --> C2["CASCADE: events owned by user →<br/>sub_events, tasks+assignees, budget,<br/>expense_types+expenses, guests+links,<br/>media+albums+links, media_tags+links, collaborators"]
  D2 --> C3["CASCADE: event_collaborators / task_assignees<br/>where user_id = them (others' events stay)"]
  D2 --> C4["SET NULL: *.created_by / created/modified/updated_by<br/>(events they made for clients survive)"]
  classDef planned fill:#f5f5f5,stroke:#bbb,stroke-dasharray:4 3,color:#666;
  class D0,D1,D2,C1,C2,C3,C4 planned;
```

---

## Maintenance

This file is **derived** from `DATA-MODEL.md` — when the schema changes, update `DATA-MODEL.md` first (source of truth), then refresh these diagrams. Keep the entity list and relationships in sync with the live DB. Add any new table to both the Module Map (Section 1) and the full ERD (Section 2).
