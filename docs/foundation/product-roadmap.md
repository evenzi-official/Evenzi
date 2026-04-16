# F3 — Evenzi Product Roadmap

**Document type:** Foundation Reference
**Version:** 1.0
**Date:** April 2026
**Audience:** Core team, stakeholders

---

## 1. Vision Statement

Evenzi will be India's most loved event planning platform — the single place where hosts create, manage, and celebrate every milestone, and where guests, vendors, and memories come together.

---

## 2. Guiding Principles

**1. Host-Centric Design**
Every feature is designed from the host's perspective first. If it doesn't make the host's life easier, we don't build it.

**2. Mobile-First, WhatsApp-Native**
India's primary communication channel is WhatsApp, and most users are on mobile. Features are designed for touch screens, low-bandwidth networks, and WhatsApp-first invitation flows.

**3. Progressive Complexity**
A first-time host can create an event in minutes. An experienced host can unlock advanced tools without the platform feeling overwhelming.

**4. Build to Validate, Not to Impress**
We ship the smallest thing that proves value. Features earn their place based on user feedback, not assumptions.

**5. Trust Through Simplicity**
A self-funded startup earns trust by being reliable, fast, and straightforward — not by adding feature bloat.

---

## 3. Phase Overview

```
Phase 1 — MVP (Apr–Sep 2026)
  Host-only, end-to-end event flow
  Weddings, birthdays, corporate

Phase 2 — Growth (Oct 2026–Mar 2027)
  Guest experience expansion
  Vendor marketplace (basic)
  Analytics + multi-language

Phase 3 — Scale (Apr 2027+)
  Full two-sided marketplace
  Booking + payments
  Mobile app
```

| Phase | Goal | Timeline | Key Milestone |
|-------|------|----------|---------------|
| Phase 1 — MVP | Complete host-only event flow | Apr–Sep 2026 | First real wedding on Evenzi |
| Phase 2 — Growth | Expand guest UX + begin vendor marketplace | Oct 2026–Mar 2027 | First vendor booking |
| Phase 3 — Scale | Full marketplace, mobile app, payments | Apr 2027+ | 10,000 events hosted |

---

## 4. Phase 1 — MVP (Current)

### Goal
Deliver a complete, polished, end-to-end event planning flow for a single host managing a single event type (wedding/birthday/corporate). No vendor role. No marketplace. No real-time features. Just one host, their event, their guests.

### Success Criteria
- A host can sign up, create an event, invite guests via WhatsApp, collect RSVPs, manage a budget, and publish a public event website — without leaving Evenzi.
- The platform is live on Vercel with no deployment errors.
- At least one real wedding has been planned end-to-end on Evenzi.
- Core flows work reliably on mobile (Android + iOS) on average Indian network speeds (4G/LTE).

---

### Sprint 1 (Active — April 2026)

| Task | Priority | Status | Notes |
|------|----------|--------|-------|
| Fix Vercel Deployment | P0 | Blocked (pre-existing) | Deploy pipeline broken; must fix before any release |
| Reusable Component Library | P0 | In Progress | 28 subtasks; design system foundation for all other modules |
| Auth & Role Selection | P0 | **Done** | Phone OTP + Google OAuth + Role Selection page complete |

---

### Sprint 2+ — Remaining Features

| Module | Description | Priority | Status | Depends On |
|--------|-------------|----------|--------|------------|
| Celebratory Curator (Event Creation Wizard) | 5-step wizard to create an event: name, date, type, venue, cover image | P0 | Functionally complete (UI polish pending) | Auth |
| Host Dashboard | Central hub showing all host events, quick stats, navigation | P0 | Shell exists — needs real data + full design | Event CRUD |
| Event Management Hub | Per-event control panel: overview, settings, quick links to all sub-features | P0 | Not Started | Event CRUD |
| Guest Management & RSVP | Add/import guests, manage RSVP status, guest list view | P1 | Not Started | Event CRUD |
| Digital Invitations (WhatsApp) | Generate and send WhatsApp invitation links to guests | P1 | Not Started | Guest Management |
| Planning Tools (Checklist + Budget) | Pre-built checklist templates + expense tracking with budget summary | P2 | Not Started | Event CRUD |
| Media & Memories (Photo Gallery) | Host-uploaded photo gallery per event | P2 | Not Started | Event CRUD |
| Digital Presence (Event Website) | Public-facing event page with details, RSVP link, gallery | P2 | Not Started | Event CRUD |
| Event Settings | Per-event privacy, visibility, date/venue edits | P1 | Not Started | Event CRUD |
| User Settings | Profile management, notification preferences, account deletion | P1 | Not Started | Auth |
| Support Chatbot | FAQ chatbot + admin escalation + support ticket flow | P1 | Planned (Figma-blocked for UI; backend can start) | Auth |
| Landing / Marketing Site | Public homepage, feature highlights, pricing, sign-up CTA | P2 | Not Started | None (standalone) |
| Admin Module | Developer panel: user management, FAQ editor, platform monitoring | P2 | Not Started | None (standalone) |

---

## 5. Phase 2 — Growth (Oct 2026–Mar 2027)

### Goal
Expand the guest experience beyond passive RSVP, introduce the vendor marketplace at a basic listing level, and broaden the platform's reach with multi-language support and advanced invitation channels.

### Features

| Feature | Description | Timeline |
|---------|-------------|----------|
| Vendor Role (Basic Listing) | Vendors can create a profile, list services, and be discovered by hosts | Q3 2026 |
| Guest-Aware Chatbot | Chatbot that can answer event-specific questions for guests (not just FAQ) | Q3 2026 |
| Real-Time RSVP Updates | Live RSVP count updates on host dashboard without page refresh | Q3 2026 |
| Analytics Dashboard | RSVP trends, guest demographics, engagement stats for hosts | Q4 2026 |
| Advanced WhatsApp Invitations | RSVP directly via WhatsApp bot reply; automated reminders | Q4 2026 |
| Email Invitation Channel | Send invitations via email as an alternative to WhatsApp | Q4 2026 |
| Multi-Language Support (Hindi) | Full UI localization in Hindi; English remains default | Q4 2026 |
| AI Photo Finder | Face-recognition-based photo discovery for guests in the event gallery | Q1 2027 |

---

## 6. Phase 3 — Scale (Apr 2027+)

### Goal
Build a full two-sided marketplace where hosts book and pay vendors directly through Evenzi, extend the platform to mobile, and expand event discovery so Evenzi becomes the default starting point for event planning in India.

### Features

| Feature | Description |
|---------|-------------|
| Full Vendor Role | Vendor profiles, portfolio, pricing tiers, availability calendar |
| Booking System | Hosts request bookings; vendors confirm/decline |
| Payments & Escrow | In-app payment with escrow protection for hosts and vendors |
| Event Discovery | Public event directory; SEO-optimized event pages |
| Seating Arrangements | Drag-and-drop seating chart builder |
| Custom Event Websites | Host-editable event pages with templates, custom domains |
| Mobile App (iOS + Android) | Native apps; push notifications; camera-first photo upload |
| Meal Preferences | Collect dietary restrictions and meal choices during RSVP |

---

## 7. Feature Dependency Map

```mermaid
flowchart TD
    AUTH[Auth & Role Selection\nDONE]
    COMP[Component Library\nIn Progress]
    WIZARD[Event Creation Wizard\nFunctionally Complete]
    DASH[Host Dashboard]
    HUB[Event Management Hub]
    GUESTS[Guest Management & RSVP]
    WA[Digital Invitations - WhatsApp]
    TOOLS[Planning Tools\nChecklist + Budget]
    MEDIA[Media & Memories\nPhoto Gallery]
    WEB[Digital Presence\nEvent Website]
    EVSET[Event Settings]
    USET[User Settings]
    CHATBOT[Support Chatbot]
    LANDING[Landing Site]
    ADMIN[Admin Module]

    AUTH --> WIZARD
    AUTH --> USET
    AUTH --> CHATBOT
    COMP --> WIZARD
    COMP --> DASH
    WIZARD --> DASH
    WIZARD --> HUB
    WIZARD --> GUESTS
    WIZARD --> TOOLS
    WIZARD --> MEDIA
    WIZARD --> WEB
    WIZARD --> EVSET
    GUESTS --> WA
```

---

## 8. Release Strategy

### Feature Flags
All new features ship behind a feature flag (environment variable or Supabase config toggle). This allows:
- Staged rollout to internal testers before general availability
- Instant disable of a feature without a deployment
- A/B testing on future growth features

### Staged Rollout
1. **Internal** — Abhijith + Dheeraj test the feature end-to-end
2. **Closed Beta** — 5–10 real event hosts from personal network
3. **Soft Launch** — Feature available to all signed-up users
4. **General Availability** — Promoted on landing page and social channels

### Feedback Loops
- Every shipped feature includes a lightweight in-app feedback prompt (thumbs up/down)
- Support chatbot tickets are reviewed weekly for recurring pain points
- ClickUp backlog is updated after every closed-beta round based on findings

### Versioning
- Semantic versioning for internal tracking: `v0.x` for MVP Phase 1, `v1.0` at Phase 1 completion, `v2.0` at Phase 2 completion
- No public changelog until v1.0

---

## 9. What We Are NOT Building (MVP Scope Exclusions)

These items are explicitly out of scope for MVP Phase 1. They are noted here to prevent scope creep and to give the team a clear "no" answer when these topics arise.

| Item | Reason for Deferral |
|------|---------------------|
| Vendor Role | Adds a second user type with its own full product surface; Phase 2 scope |
| AI Photo Finder | Requires ML infrastructure; Phase 2 scope |
| Real-Time Features (live RSVP) | WebSocket/Supabase Realtime adds complexity; Phase 2 scope |
| Event Discovery / Search | Public indexing requires moderation + SEO infrastructure; Phase 3 scope |
| Analytics Dashboard | No meaningful data to analyze until user base exists; Phase 2 scope |
| Guest Photo Upload | Moderation + storage complexity; Phase 2 scope |
| Seating Arrangements | Niche advanced feature; Phase 3 scope |
| Meal Preferences | Collected during RSVP — deferred with full RSVP expansion; Phase 3 scope |
| Custom Domains | DNS management complexity; Phase 3 scope |
| Email Invitations | WhatsApp is primary channel for India; Phase 2 scope |
| Multi-Language (Hindi) | Requires full i18n infrastructure; Phase 2 scope |
| Mobile App (iOS/Android) | PWA-first for MVP; native app is Phase 3 |
| Payments / Escrow | Requires RBI compliance + payment gateway integration; Phase 3 scope |
| Booking System | Depends on full vendor role; Phase 3 scope |
