# Evenzi Host Dashboard — Team Overview

**Status:** Shell live with real data — full design implementation pending
**Owner:** Abhijith (product), Dheeraj (engineering)
**Created:** 2026-04-16

---

## 1. What it is in one line

The Home base for every Host — the first screen after login, where all their events live, and the starting point for every action in Evenzi.

## 2. Why we're building it (and why it matters)

The Host Dashboard is the most seen screen in the entire product. Every logged-in host sees it on every visit. It's the answer to "where do I start?"

In a product like Evenzi — where hosts might have one active wedding to plan and two others in early stages — the dashboard has to do three things at once:

1. **Show you where you are.** All your events, at a glance. Status, dates, guest counts.
2. **Make the next action obvious.** Whether that's continuing to set up an existing event or creating a new one.
3. **Set the emotional tone.** This is a wedding planning app. The dashboard should feel warm, celebratory, and personal — not like a project management tool.

Getting this screen right is not optional. First impressions in any app are formed in seconds. A cluttered, confusing, or cold dashboard sends the message "this isn't the app for my special event." A clean, beautiful dashboard says "we get it."

The current state (shell with real data) is a functional foundation. The full design implementation will bring it up to the quality standard Evenzi's brand deserves.

## 3. Who it serves

| Audience | What they see | Supported in MVP? |
|---|---|---|
| **Hosts with events** | Grid of event cards — real data, each card linking into the Event Management Hub | Yes — functional |
| **New hosts (no events yet)** | Empty state with clear CTA: "Create your first event" | Yes |
| **Hosts on mobile** | Responsive layout — same content, adapted for smaller screens | Yes |
| **Guests** | Guests do not use the Host Dashboard — they receive invitations | N/A |
| **Vendors** | Vendor dashboard is a separate, deferred feature | Deferred |

## 4. What hosts experience

### On every visit after login

The dashboard is the first thing a host sees after logging in. The experience should feel like opening a planning folder you know and trust — immediately oriented, not disorienting.

**Hero section**
At the top: a warm headline like "Ready to plan your next big celebration?" with a prominent "Create New Event" button. This ensures the most common action is never more than one click away, regardless of where the host is in the page.

**Events grid**
Below the hero: all the host's events displayed as cards in a responsive grid. Each event card shows:
- Cover image (or a placeholder if none was uploaded)
- Event name
- Primary date
- Guest count
- RSVP percentage (how many guests have responded vs total invited)

**Clicking an event card** opens the Event Management Hub for that event — the place where all the detailed management happens (guest lists, sub-events, invitations, settings).

**Empty state (new users)**
Hosts who haven't created any events yet see an illustrated empty state with a clear message explaining what Evenzi is for and a single CTA button to launch the Celebratory Curator wizard. No confusion about what to do next.

**Navigation sidebar**
A persistent sidebar (or bottom nav on mobile) gives quick access to key sections: Dashboard, Events, Account. This sidebar will expand as more features are added.

## 5. What the dashboard is not (in MVP)

The dashboard is intentionally scoped to event cards and navigation for MVP. Some things that might look natural here are deliberately excluded:

- **No analytics widgets** — "3 events active, 47 RSVPs received" style stats. Useful eventually; not essential for MVP.
- **No calendar view** — seeing all events on a timeline. A great post-MVP addition.
- **No notifications inbox** — task reminders, RSVP alerts, etc. Deferred until notification infrastructure is in place.
- **No recent activity feed** — "Priya confirmed her RSVP" style updates. Post-MVP.

This scope focus means the current build ships faster and the UX stays clean.

## 6. MVP scope — what's in vs what's out

### In for MVP

- Events grid with real data from the database
- Event cards: cover image, name, date, guest count, RSVP percentage
- Click card → Event Management Hub
- Hero section with CTA
- "Create New Event" button (launches Celebratory Curator)
- Empty state for hosts with no events
- Navigation sidebar / mobile nav
- Mobile-responsive layout
- Full design implementation (pending — separate task)

### Out of scope

- Analytics/stats widgets
- Calendar view
- Notifications inbox
- Recent activity feed
- Drag-and-drop event card reordering
- Pinning/starring events
- Filtering events by type or status
- Multi-account / household sharing (post-MVP)

## 7. Current state vs finished state

| Aspect | Current state | Finished state |
|---|---|---|
| **Data** | Real — shows actual events from the database | Same |
| **Functionality** | Works — create, view, navigate to events | Same |
| **Design** | Functional shell — layout correct, basic styling | Pixel-perfect implementation of Google Stitch designs |
| **Empty state** | Basic placeholder | Illustrated, on-brand empty state |
| **Animations** | None | Subtle entrance animations on cards |
| **Mobile** | Responsive but basic | Fully polished mobile experience |

The gap between current and finished is design quality, not functionality. The backend and navigation are solid.

## 8. How it works (non-technical overview)

```
Host logs in
    ↓
Session verified by middleware
    ↓
Dashboard page loads
    ↓
Database queried: "Give me all events belonging to this host"
    → Includes event name, date, cover image, guest count, RSVP stats
    ↓
Events rendered as cards in a responsive grid
    ↓
Host clicks an event card
    ↓
Navigated to Event Management Hub for that event
```

The dashboard only loads events that belong to the logged-in host — no cross-contamination between accounts. Data fetching happens on the server (before the page reaches the browser), which means the cards appear immediately without a loading spinner.

## 9. Design

Two variants were designed in Google Stitch:
- **Dark theme** — sidebar navigation, event cards on a deep background, gold/amber accent colors
- **Light theme** — event cards in a bright grid, clean sidebar, Evenzi's primary palette

The final implementation will follow one of these variants (or a refined combination). The design prioritizes the event cards as the hero element of the page — large, visual, immediately scannable.

## 10. Timeline

| Phase | What happened | Status |
|---|---|---|
| **Shell build** | Dashboard page with real event data, navigation | Done |
| **Event cards** | Cards showing real data from database | Done |
| **Empty state** | Basic empty state with CTA | Done — needs design polish |
| **Full design implementation** | Pixel-perfect Stitch design | Pending (separate sprint task) |
| **QA** | Full flow — multiple events, empty state, mobile | Pending alongside design |
| **Production** | Ready to ship with design complete | Pending |

## 11. Who's involved

| Role | Person | What they own |
|---|---|---|
| **Product owner** | Abhijith | Scope, design direction, approvals |
| **Engineering** | Dheeraj | Dashboard implementation, data queries |
| **Implementation support** | Claude Code | Query patterns, component support |
| **Design** | (to be assigned) | Full design implementation from Stitch specs |

## 12. Key documents

| Document | Audience | Purpose |
|---|---|---|
| This overview (`docs/features/overviews/host-dashboard-overview.md`) | Everyone | High-level shareable reference |
| `app/home/` | Engineering | Dashboard page source code |
| Google Stitch project | Design + Product | Visual design variants |
| ClickUp feature task | Everyone | Subtask breakdown, status, assignments |

## 13. FAQ

**Q: Is the dashboard live right now?**
A: Yes — there's a working version connected to real data. What's "pending" is the full visual design implementation (the pixel-perfect version matching the Stitch designs). The functional shell works.

**Q: What does "Host Dashboard" cover vs "Event Management Hub"?**
A: The Host Dashboard is the top-level view — all your events as cards. The Event Management Hub is what you get when you click into one specific event — that's where guest lists, sub-events, invitations, and settings live. Think of it as: Dashboard = your bookshelf, Hub = one open book.

**Q: Why does each event card show an RSVP percentage?**
A: Because RSVP status is one of the most anxiety-inducing parts of event planning. "How many people have replied? How many haven't?" A quick percentage on the card gives the host a real-time pulse without clicking into the event.

**Q: Can I see events from all my family members in one dashboard?**
A: Not in MVP. Each account has its own dashboard. Multi-account or household views are post-MVP.

**Q: Will the dashboard look the same on mobile?**
A: Yes — responsive layout is part of the spec. The grid adapts to smaller screens (typically one column on mobile vs a 2-3 column grid on desktop), and navigation shifts to a bottom bar.

**Q: What happens to the dashboard after all the features are built?**
A: Over time, the dashboard will grow to include a notification inbox, quick-stats bar, and possibly a calendar view. Each of these is a separate feature that will be added in later sprints. The card grid will always be the anchor.

**Q: Can I customize the dashboard — pin certain events, change the layout?**
A: Not in MVP. Post-MVP enhancements like pinning, reordering, and filtering events by status are on the roadmap.

---

## Contact

Questions about this feature? Ping Abhijith (product) or Dheeraj (engineering).
