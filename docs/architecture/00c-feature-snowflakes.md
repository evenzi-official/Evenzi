# 00c — Feature-Level Snowflakes

> Per-feature deep flow diagrams. Each of the 16 features gets a 4-level ASCII snowflake showing screens → components → actions → states. Integration points, sad paths, and data tables surfaced for spec phase.
>
> **Companion docs:**
> - [00b — Platform flow](./00b-platform-flow.md) — whole-platform snowflake (zoom out)
> - [01 — Gap matrix](./01-feature-gap-matrix.md) — phase status (zoom out by phase)

---

## Legend

```
├── major screen / state
│   ├── component / sub-screen
│   │   ├── action / decision
│   │   │   └── outcome / sub-state
```

`Entry` = route or trigger · `Zone` = auth zone · `Status` = ClickUp status · `→` = uses · `←` = used by · `⊗` = infra dependency

---

## F1 — Fix Vercel Deployment

`Entry: n/a (infra)` · `Zone: —` · `Status: done` · `Persona: dev`

```
vercel deployment
├── build pipeline
│   ├── Vercel project linked to GitHub
│   ├── auto-deploy on push to main
│   └── env vars synced (Supabase, Cloudflare R2, etc.)
├── runtime
│   ├── edge functions (middleware)
│   ├── serverless functions (API routes)
│   └── static assets
└── monitoring
    ├── deploy logs
    └── runtime errors → (future: Sentry)
```

**Integration:** ⊗ all features deploy through this · → none · ← none
**Sad paths:** build fails → no rollback strategy doc; secret leak → no rotation playbook
**Data:** none

---

## F2 — Auth & Role Selection

`Entry: /auth` · `Zone: Public → Host` · `Status: done` · `Persona: Visitor → Host`

```
auth
├── /auth landing
│   ├── tab: Phone OTP
│   │   ├── enter phone (+91 validated)
│   │   ├── click Send OTP
│   │   │   ├── Twilio sends SMS
│   │   │   └── error: rate-limit / Twilio fail
│   │   ├── enter 6-digit code
│   │   └── verify
│   │       ├── ✓ → session created
│   │       └── ✗ → 3 retries then lockout (gap: not implemented)
│   ├── tab: Google OAuth
│   │   ├── click Continue with Google
│   │   ├── redirect to Google consent
│   │   └── /auth/callback
│   │       ├── exchange code for session
│   │       └── error: no role assigned → /auth/role-selection
│   └── tab switching preserves entered phone
├── /auth/role-selection
│   ├── card: Host
│   │   └── click → user_profiles.role = 'host' → /home
│   └── card: Guest [DISABLED in MVP]
│       └── tooltip: "Coming soon"
└── session lifecycle
    ├── refresh on every navigation (middleware)
    ├── logout → clear cookies → /
    └── expired → redirect to /auth with ?next=<original>
```

**Integration:** → F4 (Host Dashboard, post-auth landing) · ← all features (auth required) · ⊗ Supabase Auth
**Sad paths:** OTP retries no lockout; OAuth user closing browser mid-role-select; no email/password fallback if Twilio outage
**Data:** `auth.users` (Supabase managed); `user_profiles` (id, role, display_name, avatar_url, email, phone, auth_provider)

---

## F3 — Event CRUD (5-Step Wizard)

`Entry: /events/create` · `Zone: Host` · `Status: review` · `Persona: Host`

```
event-crud
├── /events/create — wizard
│   ├── progress bar (Step n of 5)
│   ├── Step 1: Event Type
│   │   ├── card grid: Wedding (enabled), Birthday/Corporate/etc (disabled MVP)
│   │   ├── click card → state.eventType set
│   │   └── Next disabled until selected
│   ├── Step 2: Basic Details
│   │   ├── name (required)
│   │   ├── date picker (required, ≥ today)
│   │   ├── venue (optional)
│   │   ├── guest capacity (optional, max 100k)
│   │   ├── dynamic metadata fields (form_schema-driven; e.g. partner names for Wedding)
│   │   └── validate via Zod step2Schema
│   ├── Step 3: Sub-Events
│   │   ├── checklist of preset sub-events (Wedding: Mehendi, Sangeet, Ceremony, Reception)
│   │   ├── add custom sub-event (name, date, venue)
│   │   └── must select ≥ 1
│   ├── Step 4: Template Selection [P1 — partial in MVP]
│   │   ├── gallery of website templates (placeholders for now)
│   │   └── click → state.templateId set
│   └── Step 5: Review & Confirm
│       ├── summary of all data
│       ├── edit links per section (jumps back to step)
│       └── Confirm → POST /api/events
│           ├── server: create_event_with_details RPC (atomic insert)
│           │   ├── insert events row
│           │   ├── insert event_metadata rows
│           │   └── insert event_sub_events rows
│           └── return event id → /events/<id>/success
├── /events/<id> — detail view (server component)
│   ├── auth + ownership check
│   ├── event header (cover image, title, date, venue)
│   ├── sub-events timeline
│   ├── metadata block
│   └── actions: Edit, Delete, Manage (→ F6 Hub)
├── /events/<id>/success — post-create
│   ├── confetti / success animation
│   ├── next steps card (Add Guests, Plan, Customize Site)
│   └── cookie/auth bug — currently redirects to /home (KNOWN ISSUE)
└── /events/<id>/edit
    ├── re-enter wizard with state pre-filled
    ├── shows "Editing" indicator
    └── on save: update via RPC, return to detail view
```

**Integration:** → I1 cover image upload · → F6 Hub (Manage button) · ← F4 dashboard cards · ⊗ Supabase RPC
**Sad paths:** wizard abandoned mid-flow (no draft save); user deleted account but events remain (cascade rule undefined); success-screen cookie bug
**Data:** `events`, `event_types` (6 rows, 1 enabled), `sub_event_types`, `event_metadata`, `event_sub_events`

---

## F4 — Host Dashboard

`Entry: /home` · `Zone: Host` · `Status: review` · `Persona: Host`

```
host-dashboard
├── /home — server component
│   ├── auth + role guard (redirect /auth if not host)
│   ├── header / sidebar
│   │   ├── Evenzi logo
│   │   ├── nav: My Events (current), Settings, Logout
│   │   └── user avatar dropdown
│   ├── hero section
│   │   ├── greeting: "Ready to plan your next event?"
│   │   └── CTA: Create Event → /events/create
│   ├── events grid (client component EventsGrid)
│   │   ├── fetches events for auth.uid()
│   │   ├── empty state: illustration + "Create your first event"
│   │   └── populated: card grid
│   │       ├── event card
│   │       │   ├── cover image (R2 signed URL)
│   │       │   ├── title + date
│   │       │   ├── guest count badge
│   │       │   ├── RSVP stats (read from F7)
│   │       │   ├── click → /events/<id>
│   │       │   └── (gap: no quick-actions menu yet)
│   │       └── ... more cards
│   └── footer (chatbot widget — F10)
└── responsive
    ├── mobile: single-column grid
    └── desktop: 3-column grid
```

**Integration:** ← F2 (post-auth landing) · → F3 (Create CTA) · → F6 (card click → Hub) · → F7 (reads RSVP stats) · ⊗ I1 R2 signed URLs
**Sad paths:** RSVP stats may lag if F7 not built (currently shows 0); no pagination if 50+ events; no search/filter
**Data:** reads `events`, `event_sub_events` (for sub-event chips), future: `rsvp_responses` aggregates

---

## F5 — Reusable Component Library

`Entry: imported by every feature` · `Zone: —` · `Status: backlog` · `Persona: dev`

```
component-library  (lib/ui/ or @evenzi/ui)
├── design tokens
│   ├── colors (primary, secondary, success, error, warning, neutral scale)
│   ├── typography (heading scale, body, caption, font families)
│   ├── spacing (4px base, 8/12/16/24/32/48/64)
│   ├── radii / shadows / motion timing
│   └── exported as CSS variables + Tailwind config
├── form controls
│   ├── Button (primary/secondary/ghost/danger; sm/md/lg; icon/loading states)
│   ├── Input / TextField (label, error, helper, prefix/suffix icons)
│   ├── Select / Combobox
│   ├── Checkbox / Radio / Switch
│   ├── DatePicker / DateRange
│   ├── FileUpload (drag-drop, multi-file, progress)
│   └── Textarea (auto-grow option)
├── cards & containers
│   ├── Card (header, body, footer slots)
│   ├── Modal / Dialog (sm/md/lg/full; focus trap; ESC to close)
│   ├── Sheet / Drawer (left/right/bottom)
│   ├── Tabs (controlled/uncontrolled)
│   └── Accordion
├── feedback & overlays
│   ├── Toast / Notification (success/error/info/warning; auto-dismiss)
│   ├── Banner (page-level message)
│   ├── Alert / Inline message
│   ├── Tooltip
│   ├── Loading Skeleton (text/card/avatar variants)
│   └── Spinner / Progress (linear / circular)
├── data display
│   ├── Table (sortable, paginated, selectable rows)
│   ├── Badge / Status pill
│   ├── Avatar (image, initials, group/stack)
│   ├── EmptyState (illustration + title + CTA)
│   └── Stat / Metric card
└── navigation
    ├── Sidebar (collapsible, mobile drawer)
    ├── TopBar (logo, nav, user menu)
    ├── Breadcrumbs
    ├── Pagination
    └── Mobile bottom nav (Phase 2)
```

**Integration:** ← every visible feature
**Sad paths:** components built ad-hoc per feature → inconsistent UI; tokens diverge from Stitch/Figma
**Data:** none (UI library)

---

## F6 — Event Management Hub

`Entry: /events/<id>` (Manage button) or `/events/<id>/manage` · `Zone: Host` · `Status: backlog` · `Persona: Host`

```
event-hub
├── /events/<id>/manage — shell
│   ├── breadcrumbs: Home > <Event Name>
│   ├── secondary nav (sticky)
│   │   ├── Overview (default)
│   │   ├── Guests (F7)
│   │   ├── Planning (F12)
│   │   ├── Media (F13)
│   │   ├── Digital Presence (F14)
│   │   └── Settings (F9)
│   └── content area (renders active tab)
├── Overview tab (default landing)
│   ├── event hero (cover, title, date, countdown)
│   ├── quick stats row
│   │   ├── guests invited
│   │   ├── RSVPs received (yes/no/maybe pie)
│   │   ├── tasks completed (from F12)
│   │   ├── budget spent (from F12)
│   │   └── photos uploaded (from F13)
│   ├── upcoming sub-events timeline
│   ├── activity feed (last 10 events: RSVPs, photo uploads, etc.)
│   └── quick actions
│       ├── Add Guest
│       ├── Send Invitation
│       ├── Upload Photo
│       └── Edit Event
└── deep-link routes
    ├── /events/<id>/manage/guests → F7
    ├── /events/<id>/manage/planning → F12
    ├── /events/<id>/manage/media → F13
    ├── /events/<id>/manage/digital → F14
    └── /events/<id>/manage/settings → F9
```

**Integration:** ← F4 dashboard card · ← F3 wizard success · → F7, F9, F12, F13, F14 (all child features)
**Sad paths:** Hub becomes dependency bottleneck — every nested feature needs Hub shell; what if user navigates directly to /events/.../guests without going through Hub?
**Data:** reads aggregates from `events`, `guests`, `tasks`, `expenses`, `media`, `rsvp_responses`

---

## F7 — Guest Management & RSVP

`Entry: /events/<id>/manage/guests` (host) · `/e/<slug>/rsvp` (guest) · `Zone: Host + Guest` · `Status: backlog` · `Persona: Host + Guest`

```
guest-management
├── HOST side: /events/<id>/manage/guests
│   ├── stats card (top)
│   │   ├── total invited
│   │   ├── RSVP yes / no / maybe / pending (with %)
│   │   └── progress bar
│   ├── action bar
│   │   ├── Add Guest button
│   │   ├── Bulk Import (CSV)
│   │   ├── Send Invitations (→ F16)
│   │   ├── Search box
│   │   └── Filter (by RSVP status, sub-event, tag)
│   ├── guest list table
│   │   ├── columns: name, contact, RSVP, sub-events, tags, actions
│   │   ├── row click → guest detail drawer
│   │   ├── bulk select → bulk actions (delete, retag, send invite)
│   │   └── pagination (50/page)
│   ├── guest detail drawer (right sheet)
│   │   ├── name, contact (phone/email)
│   │   ├── RSVP status per sub-event
│   │   ├── tags (family, work, etc.)
│   │   ├── notes (host private)
│   │   ├── invitation history (sent at, opened, RSVP'd)
│   │   └── actions: Edit, Resend Invite, Delete
│   └── add/edit guest modal
│       ├── name (required)
│       ├── phone OR email (≥1 required)
│       ├── plus-one toggle [P2]
│       ├── tags (multi-select)
│       └── sub-event opt-in (which sub-events to invite to)
├── GUEST side: /e/<slug>/rsvp?token=<magic>
│   ├── magic-link verifies guest identity (signed token)
│   ├── event header
│   ├── RSVP form
│   │   ├── per sub-event: Yes / No / Maybe
│   │   ├── dietary preference (free text)
│   │   ├── notes for host (free text)
│   │   ├── plus-one details (if invited)
│   │   └── submit
│   ├── confirmation
│   │   ├── summary of submitted RSVP
│   │   └── link to view event details (→ F14)
│   └── update RSVP (re-open form before deadline)
└── CSV import flow
    ├── upload CSV (template: name, phone, email, tags)
    ├── preview + validation (duplicate detection, format errors)
    ├── confirm → bulk insert
    └── summary: X added, Y skipped, Z errored
```

**Integration:** → F16 (send invitations) · ← F4 (RSVP stats card) · ← F14 (RSVP form embedded in event website) · ⊗ Supabase RLS for guest-only-read
**Sad paths:** RSVP after deadline (gap: no deadline configured); duplicate guests (same phone, different name); plus-one logic deferred but conceptually entangled with capacity
**Data:** `guests` (event_id, name, phone, email, tags, notes), `rsvp_responses` (guest_id, sub_event_id, status, dietary, notes, submitted_at), `invitations` (guest_id, sent_at, channel, opened_at)

---

## F8 — User Settings

`Entry: /settings` · `Zone: Host` · `Status: backlog` · `Persona: Host`

```
user-settings
├── /settings — shell
│   ├── sidebar nav: Profile, Account, Notifications, Billing
│   └── content area
├── Profile tab
│   ├── avatar (upload, R2 → I1)
│   ├── display name (editable)
│   ├── bio (optional, public on event websites)
│   └── social links (optional)
├── Account tab
│   ├── email (verified status; change requires re-verify)
│   ├── phone (verified status; change requires OTP)
│   ├── password (n/a — no password auth)
│   ├── connected accounts (Google linked/unlinked)
│   ├── language preference
│   ├── timezone
│   └── danger zone
│       ├── export my data (GDPR/DPDP)
│       └── delete account (cascade to all events; confirm flow)
├── Notifications tab
│   ├── email preferences
│   │   ├── RSVP alerts (per event toggle)
│   │   ├── product updates
│   │   └── marketing
│   ├── WhatsApp preferences
│   │   ├── RSVP alerts
│   │   └── reminders
│   └── in-app preferences (sound, badge)
└── Billing tab (depends on I2 Subscription)
    ├── current plan (Free / Pro / Premium)
    ├── usage meters
    │   ├── events created (X / unlimited or limit)
    │   ├── guests across events (X / 100 free, etc.)
    │   ├── storage used (X GB / 1 GB free, etc.)
    │   └── photos uploaded (X / 50 free per event, etc.)
    ├── upgrade / downgrade button
    ├── payment method (Stripe / Razorpay)
    ├── invoices history
    └── cancel subscription
```

**Integration:** → I1 (avatar upload) · → I2 (subscription) · ← F3 F4 F7 etc (display name shown) · ← F2 (account state)
**Sad paths:** account deletion mid-event (cascade undefined); email change while OAuth-linked (which wins?); subscription downgrade with usage over new limit
**Data:** updates `user_profiles`; reads `subscriptions`, `invoices` (from I2); `notification_preferences`

---

## F9 — Event Settings

`Entry: /events/<id>/manage/settings` · `Zone: Host` · `Status: backlog` · `Persona: Host`

```
event-settings
├── shell (within F6 Hub)
│   ├── sub-tabs: General, Privacy, Notifications, Danger
│   └── save button (sticky bottom)
├── General tab
│   ├── name (editable; affects URL slug warning)
│   ├── date / time
│   ├── venue (with map preview)
│   ├── description (rich text, public on website)
│   ├── cover image (upload → R2)
│   ├── theme color (affects website + invitations)
│   └── timezone
├── Privacy & Access tab
│   ├── website visibility
│   │   ├── public (anyone with link)
│   │   ├── password-protected (set password)
│   │   ├── invited-guests-only (magic link required)
│   │   └── private (host preview only — pre-launch)
│   ├── RSVP deadline (date)
│   ├── guest-list visibility (public / private to host)
│   ├── photo upload permissions (host-only / guests-too / approval-required)
│   └── allow guest comments / messages
├── Notifications tab
│   ├── notify host on every RSVP
│   ├── daily digest of activity
│   ├── reminder schedule (X days before each sub-event)
│   └── recipient overrides (different email for this event)
└── Danger zone
    ├── archive event (soft-hide, keep data)
    ├── duplicate event (clone settings to new event)
    └── delete event (hard delete, confirm with name typing)
```

**Integration:** ← F6 Hub · → I1 (cover upload) · ← F7 (RSVP deadline gate) · ← F14 (privacy controls govern public site)
**Sad paths:** changing slug post-launch breaks shared invitation links; downgrading visibility from public to private mid-event; cascading effects of delete on guest list, photos, website
**Data:** updates `events` row + `event_settings` (1:1 with events) for all the per-event flags

---

## F10 — Support Chatbot (MVP FAQ Bot)

`Entry: bottom-right widget (every page)` · `/help` (full page)` · `/admin/faq` (admin)` · `Zone: Public + Host + Admin` · `Status: backlog (Figma blocked)` · `Persona: Visitor + Host + Admin`

```
chatbot
├── Widget (every page)
│   ├── floating chat icon (bottom-right)
│   ├── click → expand chat panel
│   ├── greeting + suggested questions
│   ├── input box with send button
│   └── conversation history (per session)
├── Chat engine (RAG)
│   ├── user query → embed (Gemini API)
│   ├── pgvector similarity search → top-N FAQ articles
│   ├── construct prompt with context
│   ├── primary: Gemini 2.5 Flash (free tier)
│   ├── fallback: Groq Llama 3.1 8B (free tier)
│   ├── final fallback: keyword search (no LLM)
│   └── stream response
├── /help — full page
│   ├── search box
│   ├── browse by category
│   ├── popular articles
│   └── escalation form ("still need help?")
├── /admin/faq — admin CRUD
│   ├── list FAQ articles (search, filter by category)
│   ├── create / edit article (markdown)
│   ├── auto-embed on save
│   ├── delete
│   └── reorder / promote
├── /admin/tickets — escalation queue
│   ├── list unresolved tickets (status: open / in-progress / resolved)
│   ├── click → ticket detail
│   ├── reply (sends email via Resend)
│   └── close
└── Escalation
    ├── trigger: low confidence answer + "still need help"
    ├── form captures: question, email, context
    ├── creates ticket in DB
    ├── notifies admin via email
    └── auto-reply to user with ticket number
```

**Integration:** ← every page (widget) · → I2 admin gating (admin-only routes) · ⊗ Supabase pgvector · ⊗ Gemini + Groq APIs · ⊗ Resend email
**Sad paths:** quota exhausted on Gemini (degrades to Groq, then keyword) — but if all 3 fail? show "contact us" form; admin replies bounce; user spam queries
**Data:** `faq_articles` (id, category, question, answer, embedding, sort_order), `chat_sessions` (id, user_id, started_at), `chat_messages` (session_id, role, content, embedded_articles), `tickets` (id, question, email, status, assigned_admin, resolution)

---

## F11 — Landing Section (Marketing Site)

`Entry: /` · `Zone: Public` · `Status: in progress (content blocked)` · `Persona: Visitor`

```
landing-section
├── shared layout
│   ├── top nav (logo, Features, Pricing, Blog, FAQ, Sign in, Get Started CTA)
│   ├── footer (links, social, legal)
│   └── mobile hamburger nav
├── /  — Home Page
│   ├── hero (headline, subheadline, CTA, hero image/video)
│   ├── value proposition (3-column features summary)
│   ├── how it works (3-step animation)
│   ├── feature highlights (linked cards)
│   ├── testimonials [P2 — needs content]
│   ├── pricing teaser → /pricing
│   ├── FAQ teaser → /faq
│   └── final CTA + footer
├── /about — About
│   ├── story / mission
│   ├── team (photos + bios)
│   └── press / media
├── /features — Features
│   ├── feature category sections
│   ├── per-feature: visual + description + CTA
│   └── deep-dive blog links
├── /pricing — Pricing
│   ├── plan comparison table
│   ├── tier cards (Free, Pro, Premium)
│   ├── FAQ snippet
│   └── enterprise contact
├── /blog — Blog
│   ├── /blog (listing — Supabase CMS)
│   ├── /blog/<slug> (article page)
│   └── categories / tags
├── /faq — FAQ (JSON config)
│   ├── search
│   ├── expandable sections by category
│   └── escalation to F10 chatbot
├── /contact — Contact
│   ├── contact form (subject, name, email, message)
│   └── support info
└── /legal/* — Legal
    ├── /legal/terms
    ├── /legal/privacy
    └── /legal/cookies
```

**Integration:** → F2 (Sign in / Get Started CTAs) · ← F15 (Admin CMS edits content) · ⊗ Supabase (Blog only) · ⊗ I1 (CMS images)
**Sad paths:** content not finalized → all pages blocked on copywriting; SEO not configured pre-launch; analytics not wired
**Data:** `blog_posts` (Supabase CMS), `faq_items` (JSON config file initially, table later), other pages = JSON config

---

## F12 — Planning Tools (Checklist + Budget Tracker)

`Entry: /events/<id>/manage/planning` · `Zone: Host` · `Status: backlog` · `Persona: Host`

```
planning-tools
├── shell (within F6 Hub)
│   ├── sub-tabs: Checklist, Budget
│   └── shared: filter by sub-event
├── Checklist tab
│   ├── overview stats
│   │   ├── total tasks / completed
│   │   ├── progress bar
│   │   └── overdue count
│   ├── add task
│   │   ├── title (required)
│   │   ├── due date (optional)
│   │   ├── sub-event (optional, link to specific sub-event)
│   │   ├── assignee (host or co-planner)
│   │   ├── category (Vendors, Decor, Logistics, etc.)
│   │   └── priority
│   ├── task list
│   │   ├── group by: status / due date / sub-event / category
│   │   ├── checkbox to mark complete
│   │   ├── click → task detail drawer
│   │   └── drag to reorder
│   ├── task detail drawer
│   │   ├── notes (markdown)
│   │   ├── subtasks (nested)
│   │   ├── attachments → R2
│   │   ├── activity log
│   │   └── delete / archive
│   └── templates
│       ├── pre-built templates per event type (Wedding, Birthday)
│       └── custom template save
├── Budget tab
│   ├── overview stats
│   │   ├── total budget
│   │   ├── spent / remaining
│   │   ├── over/under indicator per category
│   │   └── pie chart by category
│   ├── set budget
│   │   ├── total amount
│   │   └── per-category allocation (optional)
│   ├── add expense
│   │   ├── amount + currency
│   │   ├── category (Venue, Catering, Decor, etc.)
│   │   ├── vendor name
│   │   ├── date paid
│   │   ├── receipt photo → R2
│   │   ├── notes
│   │   └── linked sub-event (optional)
│   ├── expense table
│   │   ├── filter / sort / search
│   │   ├── totals row
│   │   └── export CSV
│   ├── expense detail drawer (mirror task drawer)
│   └── reports
│       ├── monthly view
│       ├── per-vendor breakdown
│       └── budget vs actual
└── shared: due-date reminders → email + WhatsApp
```

**Integration:** → I1 (receipts, attachments) · ← F6 (Overview shows progress) · ← F9 (notification settings)
**Sad paths:** no budget set vs unlimited budget UX; multi-currency expenses; co-planner permissions undefined
**Data:** `tasks` (event_id, sub_event_id?, title, due_date, status, assignee, category, priority), `expenses` (event_id, amount, currency, category, vendor, date_paid, receipt_url, notes, sub_event_id?)

---

## F13 — Media & Memories (Photo + Video Gallery)

`Entry: /events/<id>/manage/media` (host) · `/e/<slug>/gallery` (guest)` · `Zone: Host + Guest` · `Status: backlog` · `Persona: Host + Guest`

```
media-gallery
├── HOST side: /events/<id>/manage/media
│   ├── overview stats
│   │   ├── photos uploaded
│   │   ├── videos uploaded
│   │   ├── storage used (vs tier limit)
│   │   └── most recent
│   ├── upload zone
│   │   ├── drag-drop area
│   │   ├── file picker (multi)
│   │   ├── per file: progress bar, status (pending/uploading/processing/done/error)
│   │   ├── allowed: images (JPG/PNG/HEIC/WebP) + videos (MP4/MOV/WebM)
│   │   ├── client-side resize for images > 4096px
│   │   ├── multipart upload for videos > 50MB
│   │   ├── pre-signed URL flow → R2 (I1)
│   │   └── post-upload: server processes variants (Sharp), persists media row
│   ├── albums / sub-event grouping
│   │   ├── auto: group by sub-event
│   │   ├── manual: create custom album
│   │   └── reorder
│   ├── gallery grid
│   │   ├── thumbnail (R2 signed URL)
│   │   ├── click → lightbox
│   │   ├── lightbox: full-size, swipe, download, delete (host only)
│   │   ├── select multiple → bulk delete / move
│   │   └── filter by date / album / uploader
│   └── settings
│       ├── allow guest uploads (yes/no — drives F9 toggle)
│       ├── moderation (host approves before public; default off)
│       └── download permission (host-only / guests / public)
├── GUEST side: /e/<slug>/gallery
│   ├── public gallery (if event_settings allows)
│   ├── lightbox view
│   ├── download (if permitted)
│   ├── upload (if permitted)
│   │   ├── magic-link auth required
│   │   └── photos go to "pending moderation" queue if enabled
│   └── reactions / comments [P2]
└── moderation queue (host)
    ├── pending uploads from guests
    ├── approve / reject / delete
    └── batch actions
```

**Integration:** ⊗ I1 (R2 — gallery + videos buckets) · ← F6 Overview · ← F9 (visibility, permissions) · ← F14 (gallery embedded on website)
**Sad paths:** quota exceeded mid-upload; video upload interrupted (resume?); guest uploads NSFW (moderation gap); no offline photo backup beyond R2
**Data:** `media` table (see I1 schema), `albums` (event_id, name, sort_order), `media_albums` (junction)

---

## F14 — Digital Presence (Event Website)

`Entry: /events/<id>/manage/digital` (host) · `/e/<slug>` (guest)` · `Zone: Host + Guest` · `Status: backlog` · `Persona: Host + Guest`

```
digital-presence
├── HOST side: /events/<id>/manage/digital
│   ├── builder shell
│   │   ├── left: page tree
│   │   ├── center: live preview iframe
│   │   ├── right: properties panel
│   │   └── top: device toggle (mobile/tablet/desktop), Publish button
│   ├── theme engine
│   │   ├── pick palette (5-10 presets)
│   │   ├── custom color overrides
│   │   ├── font picker (3-5 curated pairings)
│   │   └── apply to entire site
│   ├── template gallery
│   │   ├── browse templates by event type
│   │   ├── preview before applying
│   │   └── apply (replaces page tree)
│   ├── page editor
│   │   ├── default pages: Home, Story, Schedule, Venue, Gallery, RSVP
│   │   ├── add custom page
│   │   ├── reorder / hide / delete
│   │   └── per page: edit content (rich text + media + components)
│   ├── invitation card designer [P2 — separate sub-feature]
│   │   ├── canvas editor
│   │   ├── templates
│   │   ├── customize text, colors, photo
│   │   └── export as PNG / shareable link
│   ├── publish flow
│   │   ├── slug picker (e.g. /e/aarav-ishani-wedding)
│   │   ├── conflict check
│   │   ├── confirm visibility (from F9 settings)
│   │   └── publish → public URL live
│   └── analytics [P2]
│       ├── visits
│       ├── RSVP conversions
│       └── most viewed pages
├── GUEST side: /e/<slug>
│   ├── verify visibility (public / password / magic-link)
│   ├── render configured pages
│   │   ├── Home (hero, story, countdown)
│   │   ├── Schedule (sub-events timeline)
│   │   ├── Venue (map, directions)
│   │   ├── Story (long-form rich text)
│   │   ├── Gallery → embed F13
│   │   ├── RSVP → embed F7
│   │   └── custom pages
│   └── footer (subtle Evenzi branding; removable on Premium tier)
└── custom domain [P3]
    ├── add custom domain in settings (e.g. aaravsweds.com)
    ├── verify ownership (DNS)
    └── auto-SSL via Cloudflare
```

**Integration:** ← F3 wizard Step 4 (template selection) · → F7 (RSVP embed) · → F13 (gallery embed) · ← F9 (privacy settings) · → I1 (page assets, hero images)
**Sad paths:** template change destroys customization; slug collision; private→public visibility flip mid-event; custom domain DNS verification fails
**Data:** `event_websites` (event_id, theme, slug, status, custom_domain), `event_pages` (website_id, slug, type, content_jsonb, sort_order)

---

## F15 — Admin Module (Developer/Admin Panel)

`Entry: /admin` · `Zone: Admin` · `Status: backlog` · `Persona: Internal admin`

```
admin-module
├── /admin — auth shield
│   ├── verify role=admin in user_profiles
│   ├── 2FA recommended (not enforced MVP)
│   └── audit log on every action
├── shared layout
│   ├── sidebar nav: Dashboard, Users, Events, CMS, System Health, Logs, Feature Flags, Content Moderation
│   └── top bar: search, admin user menu
├── Dashboard
│   ├── platform metrics: MAU, DAU, events created, RSVPs submitted
│   ├── revenue (when subscriptions live)
│   ├── error rate (last 24h)
│   └── recent signups feed
├── User Management
│   ├── search users (name, email, phone)
│   ├── user table
│   ├── user detail
│   │   ├── account info
│   │   ├── role override (host/admin)
│   │   ├── subscription override
│   │   ├── usage stats
│   │   ├── audit history
│   │   └── danger: suspend, delete, impersonate (with logs)
│   └── bulk actions (suspend N users)
├── Event Oversight
│   ├── all events table (search, filter)
│   ├── event detail with admin lens (full data, even private)
│   ├── force-delete event
│   └── flagged events queue (from content moderation)
├── CMS (for Landing Section content)
│   ├── manage blog posts (CRUD)
│   ├── edit FAQ items
│   ├── edit pricing copy
│   ├── edit feature descriptions
│   └── manage testimonials
├── System Health
│   ├── Vercel deploy status
│   ├── Supabase connection / DB load
│   ├── R2 storage usage
│   ├── LLM API quotas (Gemini, Groq)
│   └── Resend email volume
├── Logs & Audit
│   ├── filter by user / action / date
│   ├── export
│   └── retention policy (90 days?)
├── Feature Flags
│   ├── list flags
│   ├── toggle on/off (global or per-user-cohort)
│   └── rollout % (1%, 10%, 50%, 100%)
└── Content Moderation
    ├── reports queue (from F13 photo reports, etc.)
    ├── auto-flag rules (placeholder for ML later)
    └── action: warn / remove / suspend
```

**Integration:** ⊗ touches everything (admin oversight) · → F11 CMS · → F2 user-role overrides · → I2 subscription overrides
**Sad paths:** admin impersonates → audit log gap could obscure; CMS publish without approval gate; feature flag accidentally disabled in prod
**Data:** reads/writes ALL tables; new: `admin_audit_log`, `feature_flags`, `flag_assignments`, `moderation_reports`

---

## F16 — Digital Invitations (WhatsApp + link-based)

`Entry: /events/<id>/manage/guests → "Send Invitations"` · `Zone: Host` · `Status: backlog (depends on F11+F7)` · `Persona: Host (sender), Guest (receiver)`

```
invitations
├── HOST side: send flow
│   ├── pick recipients (subset of guest list — F7)
│   │   ├── all guests
│   │   ├── filter by tag / RSVP status / sub-event
│   │   └── manual select
│   ├── pick channel
│   │   ├── WhatsApp (Twilio Business API or wa.me link generation)
│   │   ├── Email (Resend)
│   │   └── SMS (later)
│   ├── pick template
│   │   ├── invitation card (designed in F14)
│   │   ├── message template (handlebars: {{name}}, {{event_name}}, {{rsvp_link}})
│   │   └── preview before sending
│   ├── timing
│   │   ├── send now
│   │   └── schedule for later
│   ├── send
│   │   ├── for each recipient: generate signed RSVP link
│   │   ├── send via channel
│   │   ├── persist `invitations` row
│   │   └── webhook callback → mark delivered
│   └── tracking
│       ├── delivered / opened / RSVP'd
│       └── bounces / failures
└── GUEST side
    ├── receives WhatsApp message with card image + link
    ├── clicks link → /e/<slug>/rsvp?token=<magic>
    └── (handled by F7 + F14)
```

**Integration:** ← F7 (recipient list) · ← F14 (invitation card design) · ⊗ Twilio / WhatsApp Business API · ⊗ Resend (email)
**Sad paths:** WhatsApp template not approved (Twilio approval can take days); rate limits on bulk send; bounce handling; opt-out enforcement (compliance)
**Data:** `invitations` (event_id, guest_id, channel, template_id, status, sent_at, opened_at, rsvp_at), `invitation_templates` (event_id, channel, body, card_url)

---

## Cross-feature integration matrix

A condensed view of which features depend on which (full DAG in [02-dependency-graph.md](./02-dependency-graph.md)):

```
                   Depends on / Uses                                  Used by
F1  Vercel    ←   (none)                                          → ALL
F2  Auth      ←   F1, ⊗Supabase Auth                              → F4, F8, all Host/Admin
F3  CRUD      ←   F2, F5, ⊗Supabase RPC, ⊗I1 covers               → F4, F6, F11 wizard step 4
F4  Dashboard ←   F2, F3, F5, F7 (stats)                          → F6 (card click)
F5  CompLib   ←   (none)                                          → ALL UI
F6  Hub       ←   F2, F3, F4, F5                                  → F7-F14 (children)
F7  Guests    ←   F3, F5, F6, F16 (invites)                       → F4 stats, F14 RSVP embed
F8  UserSet   ←   F2, F5, ⊗I1 avatar, ⊗I2 billing                 → All (display name)
F9  EvtSet    ←   F3, F5, F6                                      → F7, F14, F13 perms
F10 Chatbot   ←   F5, ⊗pgvector, ⊗Gemini/Groq, ⊗Resend            → all pages (widget)
F11 Landing   ←   F5, F15 CMS                                     → F2 (CTA)
F12 Planning  ←   F3, F5, F6, ⊗I1 attachments                     → F6 stats
F13 Media     ←   F3, F5, F6, ⊗I1 R2                              → F6 stats, F14 gallery
F14 Digital   ←   F3, F5, F6, F7 RSVP, F13 gallery, ⊗I1 assets    → guests (public site)
F15 Admin     ←   F2, F5, all DB tables                           → F11 (CMS)
F16 Invites   ←   F7, F14 (cards), ⊗Twilio, ⊗Resend               → F7 (status updates)
```

## Build-order implication

Reading the integration matrix, the build order is forced into:

1. **Foundation** (no deps): F1 ✓, F2 ✓, F5
2. **First wave** (need F2+F5): F3 ✓, F4 ✓
3. **Hub layer** (needs F3+F4): F6
4. **Hub children** (need F6+F5): F7, F8, F9, F12, F13, F14 (some parallelizable)
5. **Cross-cutting** (need many): F10, F11, F15, F16

Detailed sequencing in `02-dependency-graph.md`.

---

## Sad paths catalogue (consolidated, for spec phase)

Every feature spec must address its rows here:

| Feature | Sad path |
|---|---|
| F2 | OTP retry policy / lockout |
| F2 | OAuth user closes browser before role select |
| F3 | Wizard abandoned mid-flow (no draft save) |
| F3 | User deletes account → orphan events |
| F3 | Success-screen cookie/redirect bug |
| F4 | RSVP stats lag if F7 unbuilt |
| F4 | No pagination at >50 events |
| F7 | RSVP after deadline (deadline not configured) |
| F7 | Duplicate guest detection |
| F7 | Plus-one logic vs capacity |
| F8 | Account deletion mid-event cascade |
| F8 | Subscription downgrade with usage over limit |
| F9 | Slug change breaks shared links |
| F9 | Public→private flip mid-event |
| F10 | All 3 LLM tiers fail simultaneously |
| F10 | Admin replies bounce |
| F11 | Content not finalized (current blocker) |
| F11 | SEO not configured pre-launch |
| F12 | No-budget vs unlimited-budget UX |
| F12 | Multi-currency |
| F13 | Quota exceeded mid-upload |
| F13 | Video upload interrupt / resume |
| F13 | NSFW guest uploads (moderation gap) |
| F14 | Template change destroys customization |
| F14 | Slug collision |
| F14 | Custom domain DNS verification |
| F15 | Admin impersonate audit gap |
| F15 | Feature flag accidentally killed in prod |
| F16 | WhatsApp template not approved |
| F16 | Bulk send rate limits |
| F16 | Opt-out compliance |

These get tracked as their own checklist items during each feature's spec phase.
