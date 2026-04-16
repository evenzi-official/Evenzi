# Planning Tools (Checklist + Budget Tracker) — Feature Overview

**Product:** Evenzi
**Feature:** Planning Tools — Event Checklist & Budget Tracker
**Status:** Not Started — Design in Google Stitch
**Last Updated:** April 2026
**Prepared by:** Evenzi Product Team

---

## One-Liner

Planning Tools gives every event host two essential organizers in one place: a customizable checklist to stay on top of every task, and a budget tracker to know exactly where the money is going.

---

## Why We're Building It

Planning a wedding or major event in India involves dozens of decisions, hundreds of vendors, and budgets that can easily spiral out of control. Most people manage this in their heads, through scattered WhatsApp conversations, or in rough Excel files.

Evenzi's Planning Tools feature gives hosts two practical instruments that make the process dramatically less stressful:

- A **checklist** so nothing falls through the cracks, starting pre-filled with the tasks most relevant to their event type
- A **budget tracker** so hosts always know how much they've committed, what's left, and where their money is going

Together, these tools transform a chaotic planning process into something manageable and visible — all inside the same app where the guest list and invitations already live.

---

## Who It Serves

| Audience | How They Use It |
|----------|----------------|
| Event Hosts | Primary users — track tasks and manage event spending |
| Admin & Ops | Understanding how hosts use organizational tools; informing support workflows |
| Marketing & Branding | A strong differentiation story: Evenzi is not just invitations, it's full event command |

---

## What Users Experience

### Planning Checklist

When a host opens Planning Tools for their event, they immediately see a checklist pre-filled with tasks relevant to their event type.

**Pre-filled templates by event type:**

| Event Type | Sample Checklist Items |
|------------|----------------------|
| Wedding | Book venue, Send invitations, Book photographer, Book caterer, Finalize menu, Book DJ/band, Arrange florist, Book makeup artist, Plan honeymoon, Confirm guest count |
| Birthday | Book venue, Order cake, Send invitations, Arrange entertainment, Plan catering, Buy decorations |
| Corporate | Book venue, Confirm speakers, Send invitations, Arrange AV equipment, Organize catering, Print materials |

Weddings get approximately 30 pre-filled items covering the full planning arc from engagement to day-of logistics.

**What hosts can do with the checklist:**
- Check off items as they complete them
- Add custom items not on the template
- Delete items that are not relevant to their event
- See a progress bar showing percentage of checklist complete (e.g., "14 of 30 tasks done — 47%")

The checklist is intentionally simple. There are no due dates, no assignees, and no subtasks in MVP. It is a practical to-do list, not a project management system.

---

### Budget Tracker

The Budget Tracker helps hosts understand their event spending at a glance.

**Setting up the budget:**
The host enters their total event budget when they first open the Budget Tracker (this can be updated at any time).

**Logging expenses:**
For each expense, the host enters:
- Amount (in INR)
- Category
- Vendor name (optional)
- Notes (optional)

**Expense categories:**

| Category | Examples |
|----------|---------|
| Venue | Hall rental, outdoor space, resort booking |
| Catering | Food, beverages, staffing |
| Decoration | Flowers, lighting, stage, furniture |
| Photography | Photographer, videographer, drone |
| Attire | Wedding outfits, accessories |
| Music / DJ | Band, DJ, sound system |
| Invitations | Printed cards, digital invitations |
| Miscellaneous | Anything that doesn't fit above |

**Budget dashboard — what hosts see:**

- **Total Budget** — the number they set (e.g., ₹8,00,000)
- **Amount Spent** — sum of all logged expenses (e.g., ₹5,20,000)
- **Remaining Balance** — what's left (e.g., ₹2,80,000)
- **Category breakdown** — a visual chart showing spend per category so hosts can see at a glance that 40% went to catering, 25% to decoration, and so on

Hosts can edit any expense entry or delete it if logged incorrectly.

---

## MVP Scope

### What's included

**Checklist:**
- Pre-populated templates for Wedding, Birthday, and Corporate event types
- Check off, add, and delete items
- Progress bar (% complete)

**Budget Tracker:**
- Set and update total event budget
- Log expenses with amount, category, vendor name, notes
- Budget overview: Total / Spent / Remaining
- Category breakdown chart
- Edit and delete individual expense entries

### What's not included in MVP

| Feature | Why Deferred |
|---------|-------------|
| Receipt / document attachments | File storage complexity; post-MVP |
| Vendor contacts within budget tool | Vendors module is post-MVP |
| Due dates on checklist items | Adds calendar complexity; post-MVP |
| Shared checklist (co-planners) | Multi-user collaboration is post-MVP |
| Export budget to Excel | Post-MVP utility feature |
| Payment tracking (paid vs. pending) | Accounting-level feature; post-MVP |
| Budget alerts / notifications | Post-MVP (notification infrastructure needed) |

---

## How It Works (Non-Technical)

**Checklist:** When a host creates a new event and selects an event type (e.g., Wedding), Evenzi automatically populates their checklist with a set of standard planning tasks for that event type. These items are stored in the database linked to the event. When the host checks off an item, the status updates instantly and the progress bar recalculates. Adding a custom item creates a new record; deleting one removes it from the list.

**Budget Tracker:** The total budget is a single number stored against the event. Each expense the host logs is saved as an individual record with its amount, category, and optional notes. Evenzi calculates the totals automatically — the "Amount Spent" is always the live sum of all expense records, and the "Remaining Balance" is always the budget minus that sum. The category chart is generated from these same records, grouped by category.

If expenses exceed the budget, the tracker clearly shows the overrun (e.g., "Over budget by ₹45,000") so the host can see the situation clearly. Evenzi does not block or restrict the host — it simply shows the numbers honestly.

---

## Timeline

| Phase | Target |
|-------|--------|
| Design review (Stitch) | Sprint 2 |
| Data model & schema | Sprint 2 |
| Backend API (checklist + budget) | Sprint 3 |
| Frontend — Checklist UI | Sprint 3 |
| Frontend — Budget Tracker UI | Sprint 3–4 |
| QA & Testing | Sprint 4 |
| Release | MVP Phase 1 launch |

---

## Who's Involved

| Role | Responsibility |
|------|---------------|
| Abhijith (Product Owner) | Checklist template content, budget category decisions, approval gates |
| Dheeraj (Lead Engineer) | Backend API, data schema, calculations logic |
| Claude Code (AI Dev Support) | Frontend components, chart rendering, checklist UI |
| Design | Planning Tools screens in Google Stitch |

---

## Key Documents

- Design: Google Stitch (checklist + budget screens — link TBD)
- Implementation plan: `docs/superpowers/plans/` (to be created)
- Related feature: Event Management Hub (navigation entry point)
- CLAUDE.md project overview: `CLAUDE.md`

---

## Frequently Asked Questions

**Q: Can I use Planning Tools for any event type, or just weddings?**
All event types are supported. The checklist template that loads automatically will differ based on the event type selected when the host first creates the event. Wedding hosts get a wedding-specific checklist, birthday hosts get a birthday checklist, and so on. The budget tracker works identically across all event types.

**Q: Can I share the checklist or budget with someone who's helping me plan?**
Not in MVP. The co-planner collaboration feature — where multiple people can access and edit the same event — is planned for a post-MVP release. In MVP, only the event owner can view and edit Planning Tools.

**Q: Can I export my budget to Excel or PDF?**
This is planned for a post-MVP release. In MVP, the budget lives inside Evenzi. You can view and manage it within the app, but there is no export option yet.

**Q: What if my expenses go over my budget? Will Evenzi stop me?**
No. Evenzi will clearly show you that you are over budget and by how much, but it will not block you from logging additional expenses. The tracker is a visibility tool, not a financial controller. The decision of how to respond is always yours.

**Q: Are the checklist templates editable? What if some items don't apply to me?**
Yes, fully editable. The pre-filled items are a starting point, not a fixed requirement. You can delete any item that isn't relevant, add as many custom items as you need, and rename or reorganize freely. Many hosts will end up with a checklist that looks quite different from the default template — that's exactly the intent.

**Q: How many expense entries can I log?**
There is no enforced limit in MVP. You can log as many individual expense entries as needed to accurately track your event spending.

**Q: Does the budget tracker handle multiple currencies?**
No. The budget tracker is designed for Indian events and uses INR (Indian Rupees) only in MVP. Multi-currency support is not in scope for the foreseeable future.
