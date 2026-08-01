# Evenzi — Full Data Model ERD, Functions & Flows

> Visual companion to [`DATA-MODEL.md`](DATA-MODEL.md) (the canonical reference). Covers the whole live schema as of **v2026-07-30.1** — CORE + Planning + Guests + Media + Invitations + Event Hub + Event Settings + Event Website / Digital Presence Wave 1. Renders on GitHub / VS Code (Mermaid).
>
> **Known drift:** the `EVENT_WEBSITE_SETTINGS` entity block below (fields `website_enabled`/`website_slug`/`show_gallery`/etc.) predates the actual shipped shape — live columns are `website_password_enabled`/`website_password_hash`/`search_indexing_enabled`/`announcement_banner_enabled`/`announcement_banner_text`/`site_offline` (see `DATA-MODEL.md` D43/D47). Pre-existing drift, not introduced this session — flagged for a future cleanup pass, not fixed here to keep this change scoped to the new Digital Presence entities.
>
> **Schemas:** `config.*` = reference/catalog (admin-seeded, public-read) · `public.*` = live app data (owner-only RLS) · `auth.*` = Supabase-managed identity.

---

## 1. Domain Module Map

Nine modules, each owning its tables. Config seeds all child modules at event creation; Events Core is the FK anchor for every `public.*` table.

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
    CP[config_plans]
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

  subgraph INV["💌 Invitations  (public + config schemas)"]
    CIS[config_invitation_card_styles]
    CIT[config_invitation_templates]
    EIC[event_invitation_cards]
  end

  subgraph HUB["🎛️ Event Hub  (aggregation — no new tables)"]
    EHS[event_hub_summary view]
  end

  subgraph SETT["⚙️ Event Settings  (per-event 1:1 sidecars — public schema)"]
    EGS[event_general_settings]
    EWS[event_website_settings]
    EGST[event_guest_settings]
  end

  subgraph SITE["🌐 Event Website / Digital Presence — Wave 1  (public + config schemas)"]
    CWF[config_website_fonts]
    CWP[config_website_palettes]
    CWT[config_website_templates]
    CWPG[config_website_pages]
    CWST[config_website_section_types]
    EWD[event_website_design]
    EWPG[event_website_pages]
    EWS2[event_website_sections]
    ESB[event_story_blocks]
    EWPM[event_wedding_party_members]
    EQA[event_qa_items]
    ETP[event_travel_points]
    EST[event_stays]
  end

  CFG -. "seeds / defines" .-> CORE
  CFG -. "seeds" .-> PLN
  CFG -. "seeds" .-> GST
  CFG -. "seeds" .-> MED
  CFG -. "seeds" .-> INV
  CFG -. "configures" .-> SETT
  CFG -. "seeds" .-> SITE
  USR -- "owns" --> CORE
  CORE -- "parent FK" --> PLN
  CORE -- "parent FK" --> GST
  CORE -- "parent FK" --> MED
  CORE -- "parent FK" --> INV
  CORE -- "parent FK" --> SETT
  CORE -- "parent FK" --> SITE
  CORE -. "aggregated by" .-> HUB
  GST -. "aggregates" .-> HUB
  PLN -. "aggregates" .-> HUB
  INV -. "aggregates" .-> HUB

  classDef cfg fill:#e8eeff,stroke:#5b7fd4,color:#1e3a6e;
  classDef usr fill:#e8fef0,stroke:#47a86e,color:#144d2e;
  classDef core fill:#fff3e0,stroke:#e8941a,color:#6d3c00;
  classDef pln fill:#f3e8ff,stroke:#9b59d4,color:#4a1a7e;
  classDef gst fill:#ffe8ec,stroke:#d45b74,color:#6e1a2e;
  classDef med fill:#e8f8ff,stroke:#2e9fd4,color:#0a3d5e;
  classDef inv fill:#fff3e0,stroke:#e65100,color:#000;
  classDef hub fill:#e8fffe,stroke:#00897b,color:#004d40;
  classDef sett fill:#f0fdfa,stroke:#0d9488,color:#134e4a;

  class CUT,CET,CEST,CEC,CTP,CTS,CEXT,CRS,CGT,CAP,CP cfg;
  class UP,UPR usr;
  class E,ESE,EC core;
  class ET,ETA,EB,EXPT,EXP pln;
  class EG,EGSE,EGT,EGTL gst;
  class EM,EA,EMA,EMT,EMTL med;
  class CIS,CIT,EIC inv;
  class EHS hub;
  class EGS,EWS,EGST sett;
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
  CONFIG_PLANS {
    uuid id PK
    text slug UK "free|premium|elite"
    text name
    int max_guests
    int max_sub_events
    int max_media_mb
    bool invitations_enabled
    bool website_enabled
    bool collaborators_enabled
    bool custom_domain_enabled
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
    uuid plan_id FK "tier (restrict; default = free)"
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
    bool show_on_website "hub_01: website visibility toggle"
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

  %% ---------- INVITATIONS ----------
  CONFIG_INVITATION_CARD_STYLES {
    uuid id PK
    text slug UK
    text name
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }

  CONFIG_INVITATION_TEMPLATES {
    uuid id PK
    text slug UK
    text name
    uuid style_id FK
    text layout
    text preview_key
    text thumbnail_key
    text default_photo_key
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }

  EVENT_INVITATION_CARDS {
    uuid id PK
    uuid event_id FK
    uuid sub_event_id FK
    bool is_default
    uuid template_id FK
    bool is_custom
    text slot_eyebrow
    text slot_couple
    text slot_invite
    text slot_date
    text slot_time
    text slot_venue
    text slot_message
    text card_upload_key
    text photo_bg_key
    text share_token UK
    bool share_enabled
    text rendered_card_key
    text rendered_pdf_key
    text render_status
    uuid created_by FK
    uuid updated_by FK
    timestamptz created_at
    timestamptz updated_at
  }

  %% ---------- EVENT SETTINGS (per-event 1:1 sidecars) ----------
  EVENT_GENERAL_SETTINGS {
    uuid event_id PK_FK "1:1 sidecar (cascade)"
    uuid user_id FK "denorm for single-hop RLS (cascade)"
    text tagline
    bool tagline_visible
    bool discoverable
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_WEBSITE_SETTINGS {
    uuid event_id PK_FK "1:1 sidecar (cascade)"
    uuid user_id FK "denorm for single-hop RLS (cascade)"
    bool website_enabled
    text website_slug UK
    text website_password_hash "never projected to client"
    date website_expiry_date
    bool show_gallery
    bool show_rsvp
    bool show_program
    bool show_map
    timestamptz created_at
    timestamptz updated_at
  }
  EVENT_GUEST_SETTINGS {
    uuid event_id PK_FK "1:1 sidecar (cascade)"
    uuid user_id FK "denorm for single-hop RLS (cascade)"
    bool plus_ones_enabled
    smallint max_plus_ones_per_guest "0–10 (0 = no plus-ones)"
    bool per_sub_event_rsvp
    bool show_party_size
    bool collect_dietary
    timestamptz created_at
    timestamptz updated_at
  }

  %% ---------- EVENT WEBSITE / DIGITAL PRESENCE — WAVE 1 ----------
  %% Wave 2 (public site, guest_tokens, anon RLS) not migrated yet — not drawn here.
  CONFIG_WEBSITE_PAGES {
    uuid id PK
    text slug UK "home, story, schedule, venue-travel, wedding-party, gallery, qa, rsvp, registry, video"
    text tier "public | private"
    bool is_removable "false on home, rsvp"
  }
  CONFIG_WEBSITE_SECTION_TYPES {
    uuid id PK
    text slug UK "11 types: heading, photo, photogrid, schedule, person, hotel, qa, divider, map, countdown, video"
    jsonb field_schema
  }
  CONFIG_WEBSITE_TEMPLATES {
    uuid id PK
    text slug UK
    uuid default_palette_id FK "empty catalog until lineup locks"
    uuid default_font_id FK
  }
  EVENT_WEBSITE_DESIGN {
    uuid event_id PK_FK "1:1 sidecar (cascade)"
    uuid template_id FK "nullable — catalog starts empty"
    uuid palette_id FK
    uuid heading_font_id FK
    uuid body_font_id FK
    text cover_image_key
    text og_image_key
  }
  EVENT_WEBSITE_PAGES {
    uuid id PK
    uuid event_id FK "cascade"
    uuid page_id FK "config.website_pages"
    bool is_visible
  }
  EVENT_WEBSITE_SECTIONS {
    uuid id PK
    uuid event_id FK "denormalized, guard-trigger derived from page_id"
    uuid page_id FK "cascade"
    uuid section_type_id FK
    jsonb data "backs Registry + Video pages only"
  }
  EVENT_STORY_BLOCKS {
    uuid id PK
    uuid event_id FK "cascade — direct, no guard trigger"
    text block_type "heading | photo"
  }
  EVENT_WEDDING_PARTY_MEMBERS {
    uuid id PK
    uuid event_id FK "cascade"
    text side "bride | groom"
  }
  EVENT_QA_ITEMS {
    uuid id PK
    uuid event_id FK "cascade"
    text question
    text answer
  }
  EVENT_TRAVEL_POINTS {
    uuid id PK
    uuid event_id FK "cascade"
    text kind "airport | railway | bus"
  }
  EVENT_STAYS {
    uuid id PK
    uuid event_id FK "cascade"
    text name
  }

  %% ---------- EVENT HUB (aggregation view — read-only) ----------
  %% Note: event_hub_summary aggregates from events, event_guest_stats, event_task_progress,
  %%       event_budget_summary, event_sub_events, and event_invitation_cards.
  %%       Only the EVENTS anchor relationship is drawn to keep the ERD readable.
  EVENT_HUB_SUMMARY {
    uuid event_id PK "view — read-only"
    text event_name
    date primary_date
    text primary_venue
    int guest_total "from event_guest_stats"
    numeric task_percent "from event_task_progress"
    int task_done
    int task_total
    numeric budget_total "from event_budget_summary"
    numeric budget_spent
    numeric budget_percent "NULL when no budget set"
    int sub_event_count "active only (status != cancelled)"
    text default_card_share_token "from event_invitation_cards"
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
  CONFIG_PLANS ||--o{ EVENTS : "plan_id"

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
  EVENTS ||--|| EVENT_WEBSITE_DESIGN : "1:1"
  EVENTS ||--o{ EVENT_WEBSITE_PAGES : "has"
  EVENTS ||--o{ EVENT_WEBSITE_SECTIONS : "has (denorm)"
  EVENTS ||--o{ EVENT_STORY_BLOCKS : "has"
  EVENTS ||--o{ EVENT_WEDDING_PARTY_MEMBERS : "has"
  EVENTS ||--o{ EVENT_QA_ITEMS : "has"
  EVENTS ||--o{ EVENT_TRAVEL_POINTS : "has"
  EVENTS ||--o{ EVENT_STAYS : "has"

  CONFIG_WEBSITE_PAGES ||--o{ EVENT_WEBSITE_PAGES : "page_id"
  EVENT_WEBSITE_PAGES ||--o{ EVENT_WEBSITE_SECTIONS : "page_id (guard-trigger derives event_id)"
  CONFIG_WEBSITE_SECTION_TYPES ||--o{ EVENT_WEBSITE_SECTIONS : "section_type_id"
  CONFIG_WEBSITE_TEMPLATES |o--o{ EVENT_WEBSITE_DESIGN : "template_id (nullable)"

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

  CONFIG_INVITATION_CARD_STYLES ||--o{ CONFIG_INVITATION_TEMPLATES : "style_id"
  CONFIG_INVITATION_TEMPLATES |o--o{ EVENT_INVITATION_CARDS : "template (set null)"
  EVENTS ||--o{ EVENT_INVITATION_CARDS : "has"
  EVENT_SUB_EVENTS |o--o{ EVENT_INVITATION_CARDS : "tagged (set null)"

  EVENTS ||--|| EVENT_GENERAL_SETTINGS : "has general settings"
  EVENTS ||--|| EVENT_WEBSITE_SETTINGS : "has website settings"
  EVENTS ||--|| EVENT_GUEST_SETTINGS : "has guest settings"

  EVENTS ||--|| EVENT_HUB_SUMMARY : "aggregated by"
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
    EPL["enforce_plan_event_limit()<br/>BEFORE INSERT events → blocks at plan limit"]
  end

  subgraph RPC["RPCs (callable)"]
    direction TB
    CE["create_event_with_details() [DEFINER]<br/>1 txn: event + sub-events + 7 seed blocks<br/>step 8 = _seed_event_settings()"]
    TC["event_task_counts() [invoker]<br/>→ total/todo/done/overdue"]
    BK["bulk_set_task_status() [invoker]"]
    SE["_seed_event_settings() [DEFINER]<br/>3 settings rows; GRANT to service_role only"]
    FP["config.free_plan_id() [STABLE DEFINER]<br/>returns free plan UUID (column DEFAULT)"]
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
    V8["event_hub_summary<br/>(hub_03 — aggregates V1-V4 + sub_events + inv_cards)"]
    V9["event_general_settings_view<br/>(anon REVOKED)"]
    V10["event_website_settings_view<br/>(hash excluded; days_remaining computed; anon REVOKED)"]
    V11["event_guest_settings_view<br/>(effective_max_plus_ones computed; anon REVOKED)"]
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
| `config.free_plan_id` | fn | STABLE DEFINER, `set search_path` | returns free plan UUID; used as column DEFAULT on `events.plan_id`; REVOKE from public/anon/authenticated |
| `enforce_plan_event_limit` | trigger fn | DEFINER | BEFORE INSERT on `events` — blocks when owner's event count ≥ plan `max_events`; REVOKE from public |
| `create_event_with_details` | RPC | DEFINER | one-txn event create + 7 seed blocks (step 8 = `_seed_event_settings()`); owner from `auth.uid()` |
| `_seed_event_settings` | RPC | DEFINER, `set search_path` | seeds 3 settings sidecar rows at event creation; REVOKE from public/anon/authenticated; GRANT to service_role only |
| `event_task_counts` / `bulk_set_task_status` | RPC | invoker | toolbar counts / bulk status |
| 7 module views | view | `security_invoker` | derived numbers (progress, budget, guest stats, storage, counts) |
| `event_hub_summary` | view | `security_invoker` | hub_03 — single-query dashboard aggregate (joins 5 module views + sub_events + inv_cards) |
| `event_general_settings_view` | view | `security_invoker` | joins `events` for name/dates; `anon` REVOKED |
| `event_website_settings_view` | view | `security_invoker` | `website_password_hash` excluded; `website_days_remaining` computed (interval → string); `anon` REVOKED |
| `event_guest_settings_view` | view | `security_invoker` | `effective_max_plus_ones` computed (0 when disabled); `anon` REVOKED |
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
  J --> J2["SEED _seed_event_settings()<br/>(general/website/guest default rows — step 8)"]
  J2 --> K["RETURN {event_id, name, status, created_at}"]
  D -.-> note["all 7 seeds + insert<br/>commit/rollback together"]
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
