# Evenzi — Project Overview & Feature Guide

> This is a living document. Update it whenever features are added, refined, or shipped.

**Last Updated:** 2026-04-08

---

## What is Evenzi?

Evenzi is a wedding and event planning SaaS platform built for the Indian market. It helps hosts plan, manage, and execute events end-to-end — from creating the event to sending invitations, tracking RSVPs, managing budgets, sharing photos, and publishing an event website.

### Vision

One platform where a host can:
1. Create an event (wedding, birthday, corporate, etc.)
2. Set up sub-events (mehendi, sangeet, ceremony, reception)
3. Build a guest list and send digital invitations via WhatsApp
4. Track RSVPs in real-time
5. Manage a planning checklist and budget
6. Upload and share event photos
7. Publish a public event website from a template

Later: vendors can list services, hosts can discover and book vendors, and the platform becomes a two-sided marketplace.

### Target Users

| Role | Description | MVP Status |
|------|-------------|------------|
| **Host / Event Owner** | Person planning the event (bride, groom, parents, corporate organizer) | In Scope |
| **Guest** | Invitee who receives invitation and RSVPs | In Scope (public pages) |
| **Vendor** | Service provider (photographer, caterer, decorator, venue) | Deferred (post-MVP) |

---

## Platform Features

### 1. Authentication & Role Selection

**What:** Users sign up / log in via Phone OTP (+91 India) or Google OAuth. After first login, they select their role — Host or Vendor.

**User Flow:**
1. Landing page → Click "Sign In" / "Get Started"
2. Auth page → Choose Sign Up or Log In tab
3. Enter phone number → Receive OTP → Verify
4. OR click "Continue with Google" → OAuth flow
5. First-time users → Role Selection screen (Host / Vendor)
6. Redirect to dashboard

**MVP Scope:**
- Phone OTP (India +91 region)
- Google OAuth
- Role selection (Host only — Vendor deferred)
- Session management with middleware route protection

**Current Status:** Phone OTP and Google OAuth are functional. Role selection screen is designed but not built.

**Design:** 3 variants in Stitch (light, dark, gradient). Login/Sign Up with tab-based interface.

---

### 2. Host Dashboard

**What:** The main hub after login. Shows all the host's events in a card grid with a hero CTA to create a new event.

**User Flow:**
1. Login → Land on dashboard
2. See hero section: "Ready to plan your next big celebration?"
3. See "Your Events" grid with event cards
4. Each card shows: cover image, event name, date, guest count, RSVP percentage
5. Click card → Event detail/management view
6. Click "Create New Event" → Event creation wizard

**MVP Scope:**
- Event cards grid with real data
- Hero/CTA section
- Empty state for new users (no events yet)
- Navigation sidebar

**Current Status:** Shell page exists at `/home` with placeholder content. Needs real event data.

**Design:** 2 variants in Stitch (dark theme with sidebar, light theme with cards).

---

### 3. Event CRUD (5-Step Creation Wizard)

**What:** Hosts create events through a guided 5-step wizard. Events can also be viewed, edited, and deleted.

**Step 1 — Event Type Selection:**
- Choose event type: Wedding, Birthday, Corporate Event, etc.
- Visual cards with images for each type

**Step 2 — Basic Details:**
- Event name, date, time, venue/location
- Description / notes
- Cover image upload

**Step 3 — Sub-Event Selection:**
- Select sub-events relevant to the event type
- Wedding example: Mehendi, Sangeet, Haldi, Ceremony, Reception
- Each sub-event can have its own date, time, venue

**Step 4 — Template Selection:**
- Choose a website template for the event's public page
- Preview templates before selecting
- Templates are pre-built designs (not custom editable)

**Step 5 — Review & Confirm:**
- Summary of all details entered
- Edit links per section to go back and modify
- Confirm to create the event

**Post-Creation:**
- Event detail view (read-only overview)
- Edit event (re-enters wizard with pre-filled data)
- Delete event (with confirmation dialog)

**MVP Scope:** Full 5-step wizard, event detail view, edit, delete.

**Current Status:** Not started. All 5 steps designed in Stitch.

**Design:** Full wizard flow in Stitch — type selection with visual cards, form inputs, sub-event grid, template gallery, review summary.

---

### 4. Guest Management & RSVP

**What:** Hosts manage their guest list, track who's coming, and guests can RSVP through a public page.

**Host Side:**
- Add guests (name, phone, email)
- Edit / remove guests
- View guest list in a sortable, searchable table
- See RSVP statistics: total invited, confirmed, declined, pending, maybe
- Bulk import guests via CSV

**Guest Side:**
- Receive invitation (via WhatsApp — see Feature 5)
- Open public RSVP page (no auth required)
- Submit RSVP: Yes / No / Maybe
- See event details on the RSVP page

**MVP Scope:**
- Guest CRUD (add, edit, delete)
- RSVP status tracking (pending, yes, no, maybe)
- RSVP statistics dashboard
- Public RSVP response page
- Bulk CSV import (P1)

**Current Status:** Not started. Guest Management dashboard designed in Stitch.

**Design:** Stitch shows guest list table with 154 guests, 65% RSVP bar, recent RSVPs section.

---

### 5. Digital Invitations (WhatsApp)

**What:** Hosts send digital invitations to guests via WhatsApp. Each invitation contains a link to the event details and RSVP page.

**User Flow:**
1. Host goes to Guest Management
2. Selects guest(s) to invite
3. Clicks "Send Invitation"
4. System generates invitation message with event details + RSVP link
5. Opens WhatsApp (via deep link or Business API) with pre-filled message
6. Guest receives WhatsApp message → clicks link → lands on RSVP page

**MVP Scope:**
- Send invitation to individual guest via WhatsApp
- Bulk send to all uninvited guests
- Invitation status tracking (sent / pending)
- Re-send option

**Current Status:** Not started. Needs WhatsApp Business API or deep link approach decision.

**Design:** Part of the Guest Management flow in Stitch.

---

### 6. Planning Tools (Checklist & Budget Tracker)

**What:** Hosts manage their event planning with a task checklist and expense/budget tracker.

**Checklist:**
- Add / edit / delete / check off planning items
- Pre-populated templates per event type (wedding checklist, birthday checklist)
- Manual items can be added
- Simple list — no due dates or assignees in MVP

**Budget Tracker:**
- Set total event budget
- Log expenses (amount, category, vendor name, date, notes)
- Categories: Venue, Catering, Decoration, Photography, Attire, Music/DJ, Invitations, Misc
- Dashboard: total budget, total spent, remaining
- Category breakdown (how much spent per category)

**MVP Scope:**
- Checklist CRUD with pre-populated templates
- Budget overview (total, spent, remaining)
- Expense logging with categories
- Category breakdown view

**Current Status:** Not started. Planning Tools dashboard designed in Stitch.

**Design:** Stitch shows checklist section, budget overview ($5,000 / $8,234 / $65,234), and timeline view.

---

### 7. Media & Memories (Photo Gallery)

**What:** Hosts upload and organize event photos. Guests can view the gallery.

**Host Side:**
- Upload photos (single or multiple, drag-and-drop)
- Organize into albums (e.g., "Ceremony", "Reception", "Candids")
- Delete photos
- View gallery grid

**Guest Side (post-MVP):**
- View shared photo gallery
- Upload their own photos (post-MVP)

**MVP Scope:**
- Photo upload (multi-file, drag-and-drop)
- Photo gallery grid view
- Album creation and management
- Photo viewer (lightbox)
- Recent uploads section

**Current Status:** Not started. Media & Memories dashboard designed in Stitch.

**Design:** Stitch shows Photo Albums grid, Videos section, Recent Uploads area.

**Technical Note:** Uses Supabase Storage for file hosting.

---

### 8. Digital Presence (Event Website)

**What:** Each event gets a public-facing website built from the template selected during event creation (Step 4 of wizard). It's a read-only, beautiful page guests can visit.

**Website Sections:**
- Event hero with cover image and names
- Date, time, venue details
- Sub-event schedule
- Photo gallery (from Media & Memories)
- RSVP button (links to RSVP page)

**MVP Scope:**
- Public URL at `/e/[slug]` or similar
- Template-based rendering (3-4 pre-built templates)
- Event details, schedule, photos, RSVP link
- Mobile-optimized

**Current Status:** Not started. Template selection screen designed in Stitch (Step 4).

**Design:** Stitch shows template gallery with preview thumbnails. Review screen shows how final website will look.

---

## Deferred Features (Post-MVP)

| Feature | Description | Reason for Deferral |
|---------|-------------|-------------------|
| **Vendor Role** | Vendors list services, manage bookings, coordinate with hosts | Large scope, needs separate design phase |
| **AI Photo Finder** | AI-powered face recognition to find your photos | Complex ML integration |
| **Real-time Updates** | Live RSVP updates, presence indicators | Nice-to-have, not core flow |
| **Event Discovery / Search** | Browse public events, search by type/location | Marketplace feature, post-MVP |
| **Analytics Dashboard** | Event insights, guest engagement metrics | Needs real usage data first |
| **Guest Photo Upload** | Guests contribute their own photos | Extension of Media feature |
| **Seating Arrangements** | Table/seat assignments for guests | Complex UI, post-MVP |
| **Meal Preferences** | Track dietary needs per guest | Enhancement to Guest Management |
| **Custom Event Website** | Edit CSS/themes, custom domains | Enhancement to Digital Presence |
| **Email Invitations** | Alternative to WhatsApp for non-Indian markets | Post-MVP channel |
| **Multi-language** | Support for Hindi, regional languages | Localization phase |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.5 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 18.3.1 + Tailwind CSS 4 |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (Phone OTP + Google OAuth) |
| File Storage | Supabase Storage |
| Deployment | Vercel |
| Testing | Vitest + React Testing Library |
| Email | Resend |
| Project Management | ClickUp |
| Design | Google Stitch + Figma |
| AI/Dev | Claude Code with superpowers plugin |

---

## Design Assets

- **Google Stitch:** Primary design tool. Most MVP screens designed here.
- **Figma:** Some screens, will eventually be primary.
- **Screens designed:**
  - Login / Sign Up (multiple variants)
  - Role Selection (3 variants: light, dark, gradient)
  - Host Dashboard (2 variants: dark sidebar, light cards)
  - Event Creation Wizard (all 5 steps)
  - Host Management Dashboard (6 section views):
    - Guest Management
    - Planning Tools
    - Media & Memories
    - Digital Presence
    - RSVP Statistics
    - Checklist View

---

## Database (Planned)

**Supabase Project ID:** `smjkbmkxweevqpvygabe` (region: ap-northeast-1)

**Current tables:** Only Supabase Auth tables (users, sessions, etc.)

**Planned tables for MVP:**

| Table | Purpose |
|-------|---------|
| `events` | Event data (name, date, type, venue, description, cover_image) |
| `event_types` | Lookup table for event types (wedding, birthday, corporate) |
| `sub_events` | Sub-event definitions per event (mehendi, sangeet, ceremony, reception) |
| `guests` | Guest list per event (name, phone, email, rsvp_status) |
| `rsvp_responses` | RSVP submissions from public page |
| `invitations` | Invitation tracking (sent, delivered, opened) |
| `checklist_items` | Planning checklist per event |
| `expenses` | Budget expenses per event (amount, category, vendor) |
| `photos` | Photo metadata per event (storage_path, album_id) |
| `albums` | Photo albums per event |
| `website_templates` | Pre-built website template definitions |
| `user_profiles` | Extended user data (role, display_name, avatar) |

All tables will have Row-Level Security (RLS) policies ensuring users can only access their own data.

---

## Project History

| Date | Milestone |
|------|-----------|
| 2026-03 | Project created. Auth system built (Phone OTP + Google OAuth). |
| 2026-04-06 | Agent Runner built — 15 agent specs, 4 pipelines, executor, token monitor, ClickUp integration. Merged to Dev-Vibe. |
| 2026-04-06 | AMC dashboard code parked on Dev-AMC. 9 mc_ tables dropped from Supabase. |
| 2026-04-06 | Runner infrastructure parked on Dev-Runner to focus on Evenzi core features. |
| 2026-04-08 | ClickUp workspace restructured — Ideas list, workflow tags, task templates (11 templates), MVP Phase 1 planned. |
| 2026-04-08 | Design screens inventory: Login, Role Selection, Dashboard, 5-step Wizard, 6 Management Dashboard views. |
| 2026-04-08 | Project renamed from "untitled-project" to "evenzi". Stale AMC/Runner refs cleaned from docs. |
| 2026-04-08 | `/end-session` skill created for automated session cleanup workflow. |
