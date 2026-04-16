# Event Management Hub — Feature Overview

**Product:** Evenzi
**Feature:** Event Management Hub
**Status:** Not Started — Planning Phase
**Last Updated:** April 2026
**Prepared by:** Evenzi Product Team

---

## One-Liner

The Event Management Hub is the home screen for every event — a single, organized command center where hosts access all event tools and see what's happening at a glance.

---

## Why We're Building It

When a host creates an event on Evenzi, they immediately need somewhere to go. Without a hub, managing an event would mean jumping between disconnected pages with no sense of where things stand.

The Event Management Hub solves this. It acts as the front door to every event — showing the host what tools are available, surfacing key stats without any digging, and making navigation feel natural and intuitive. Every feature in Evenzi (guests, invitations, planning tools, event website) is one tap away from this screen.

Think of it as each event having its own mini-dashboard inside Evenzi.

---

## Who It Serves

| Audience | Role |
|----------|------|
| Event Hosts | Primary users — navigate to features, monitor event health |
| Admin & Ops | Understanding how users move through the product |
| Marketing & Branding | Understanding the core product experience to communicate it |

In MVP Phase 1, the hub serves hosts only. Co-planner and team collaboration features are out of scope for now.

---

## What Users Experience

When a host clicks into any of their events from the dashboard, they land on the Event Management Hub for that event. Here is what they see:

**At the top:** The event name, date, and a breadcrumb trail so they always know where they are (Dashboard → Event Name → Hub).

**Stats bar:** A quick-glance summary row showing four key numbers:
- Total guests invited
- RSVP rate (percentage who have responded)
- Days until the event
- Budget status (amount spent vs. total budget)

**Feature grid:** A clean card-based menu with one card per feature module. Each card has an icon, a label, and a short description. Tapping any card takes the host directly into that feature.

| Card | What It Opens |
|------|--------------|
| Guest Management | Add guests, view RSVP status, import contacts |
| Digital Invitations | Create and send WhatsApp invitations |
| Planning Tools | Event checklist and budget tracker |
| Media & Memories | Upload and organize event photos |
| Event Website | Preview and customize the public event page |
| Event Settings | Edit event details, manage privacy, delete event |

The experience is designed to be fast and uncluttered — a host should be able to get from the main dashboard to any event feature in two taps.

---

## MVP Scope

### What's included

- Feature navigation grid (cards for all 6 feature areas)
- At-a-glance stats bar (guests, RSVP rate, days remaining, budget status)
- Breadcrumb navigation (Dashboard → Event Name → Feature)
- Event name and date displayed prominently

### What's not included in MVP

| Feature | Why Deferred |
|---------|-------------|
| Activity feed (recent changes) | Adds complexity; low priority for MVP |
| Event timeline view | Better suited for a later planning-focused phase |
| Co-planner collaboration | Multi-user support is a post-MVP scope |
| Per-event notifications | Requires notification infrastructure not yet built |
| Customizable hub layout | Nice-to-have; not essential for v1 |

---

## How It Works (Non-Technical)

When a host logs in to Evenzi and selects an event from their dashboard, the app loads the Event Management Hub for that specific event. The hub pulls live data from the database to show real-time stats — for example, the RSVP rate updates as guests respond, and the budget status reflects the latest expense entries.

Each card in the feature grid is simply a navigation shortcut. Tapping "Guest Management" takes the host to the guest list for that event. Tapping "Planning Tools" opens the checklist and budget tracker for that event. All features are scoped to the selected event — nothing bleeds across events.

The breadcrumb at the top always shows the full path, so if a host drills down into Guest Management and then wants to go back, they can tap the event name in the breadcrumb to return to the hub instantly.

---

## Timeline

| Phase | Target |
|-------|--------|
| Spec & Architecture | Sprint 2 |
| UI/UX Design (Stitch) | Sprint 2 |
| Frontend Development | Sprint 2–3 |
| Backend / Data Layer | Sprint 2–3 |
| QA & Testing | Sprint 3 |
| Release | MVP Phase 1 launch |

The hub is a dependency for all other event-level features. It must be ready before Guest Management, Planning Tools, and other modules can be fully integrated.

---

## Who's Involved

| Role | Responsibility |
|------|---------------|
| Abhijith (Product Owner) | Requirements, approval gates, final sign-off |
| Dheeraj (Lead Engineer) | Architecture, backend implementation, code review |
| Claude Code (AI Dev Support) | Frontend implementation, component development |
| Design | UI layout in Google Stitch |

---

## Key Documents

- Implementation plan: `docs/superpowers/plans/` (to be created)
- Design: Google Stitch (event hub screen — link TBD)
- CLAUDE.md project overview: `CLAUDE.md`
- Related feature: Host Dashboard (`app/home/`)

---

## Frequently Asked Questions

**Q: Is this the same as the main dashboard?**
No. The main dashboard shows all the host's events in one list. The Event Management Hub is specific to a single event — you enter it after selecting an event. Think of the dashboard as "all your events" and the hub as "this event."

**Q: Does this page load slowly because it has to pull stats?**
No. The stats shown on the hub are lightweight — guest count, RSVP count, budget totals. These are quick database queries and the page is designed to load fast even on mobile.

**Q: Can a guest see the Event Management Hub?**
No. The hub is only visible to the event host after logging in. Guests access the event through a separate public RSVP link, not through Evenzi's main app.

**Q: What happens if an event has no guests yet?**
The stats bar simply shows zeros — "0 guests invited," "0% RSVP rate," and so on. The feature cards are still fully accessible so the host can start adding guests or filling in other details.

**Q: Will the hub look different for different event types (wedding vs. birthday)?**
In MVP, the layout is the same for all event types. Future versions may tailor the hub experience based on event type — for example, hiding Media & Memories for corporate events.

**Q: Can I get back to the hub after going deep into a feature?**
Yes. The breadcrumb at the top of every page always shows the event name. Clicking it brings you straight back to the hub for that event.

**Q: Is the hub the only way to reach event features?**
In MVP, yes. All event-level features are accessed from the hub. Direct deep-link navigation to specific features may be added in a later phase.
