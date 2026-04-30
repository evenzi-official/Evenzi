# Evenzi Celebratory Curator — Team Overview

**Status:** Functionally complete — UI polish pending
**Internal name:** Event CRUD (engineering) / Celebratory Curator (product)
**Owner:** Abhijith (product), Dheeraj (engineering)
**Created:** 2026-04-16

---

## 1. What it is in one line

A guided step-by-step wizard that walks Hosts through creating a full event — from choosing the event type and setting the date, down to the individual sub-events (Mehendi, Sangeet, Reception, etc.) — and stores everything so it can be managed and shared.

## 2. Why we're building it

Creating an event is the first thing a Host does in Evenzi. Get it right, and the whole rest of the product is unlocked — guest management, invitations, the event hub, planning tools. Get it wrong (confusing, too many fields at once, no structure) and the user quits before they've invested anything.

The Celebratory Curator solves this by breaking event creation into small, clear steps. Each step has a clear purpose. Users aren't faced with a wall of blank fields — they're guided through a conversation-style flow that feels appropriate for something as personal as a wedding or birthday celebration.

Beyond UX, the wizard captures enough structured data (event type, sub-event breakdown, dates, venues) to power every downstream feature: guest lists tied to specific sub-events, budget tracking per ceremony, RSVP flows that know which ceremonies a guest is invited to.

## 3. Why the name "Celebratory Curator"

Internal tooling calls this feature "Event CRUD" (create, read, update, delete — developer shorthand). The product name is **Celebratory Curator** because it reflects what the Host is actually doing: curating their celebration, not filling out a database form. It's a small but intentional detail — the language of the product should feel like it belongs to the occasion.

## 4. Who it serves

| Audience | How they use it | Supported in MVP? |
|---|---|---|
| **Hosts — Weddings** | Create a wedding with Mehendi, Sangeet, Ceremony, Reception sub-events | Yes — Wedding is the primary supported type |
| **Hosts — Birthdays, Corporate, etc.** | Create other event types with relevant sub-events | Partial — event type selection is shown; non-Wedding flows are "coming soon" |
| **Returning hosts** | Edit an existing event — re-enters the wizard pre-filled | Yes |
| **Guests** | Do not use this wizard — guests receive invitations after the event is created | N/A |

## 5. What users experience (step by step)

### Creating a new event

**Step 1 — Event Type Selection**
Visual cards showing event types: Wedding, Birthday, Corporate, and others. Each card has an icon and label. Selecting "Wedding" is the primary enabled path. Other types show "Coming Soon" badges. This step exists because event type determines which sub-events are available in Step 3.

**Step 2 — Basic Details**
Core information about the overall event:
- Event name (e.g., "Aarav & Priya's Wedding")
- Primary date
- Venue / location
- Expected guest capacity
- Description (optional)
- Cover image (optional, upload or URL)

**Step 3 — Sub-Events**
For a Wedding, the user sees sub-event options: Mehendi, Haldi, Sangeet, Wedding Ceremony, Reception, and others. They select which ceremonies are part of their wedding. Each selected sub-event can then be expanded to set its own date, time, and venue — because a Mehendi might be Thursday evening at the bride's house while the Reception is Saturday evening at a hotel.

**Step 4 — Review & Confirm**
A summary of everything entered: event type, name, date, venue, guest count, and a list of all sub-events with their individual details. Each section has an "Edit" link that jumps back to the relevant step without losing other data. When satisfied, the host clicks "Create Event."

**What happens after confirmation:**
- A success screen confirms the event was created
- Host is redirected to their dashboard, where the event appears as a card
- The event is now accessible for guest management, invitations, and other features

### Editing an existing event

From the Host Dashboard or Event Management Hub, hosts can click "Edit Event" on any event card. This re-opens the wizard with all fields pre-filled. Any step can be changed; confirming saves the updates. Deletions are also available with a confirmation prompt.

## 6. The data structure behind it

Each event in Evenzi isn't a flat record — it's a structured set of related pieces. Understanding this helps everyone on the team know what we're working with:

| What | What it stores |
|---|---|
| **Event** | The top-level container — name, host, type, status |
| **Event metadata** | Date, venue, guest count, cover image, description |
| **Sub-events** | Individual ceremonies linked to the event — each with their own date, time, venue |
| **Event types** | The lookup list (Wedding, Birthday, Corporate, etc.) |
| **Sub-event types** | The lookup list of ceremony types per event type (Mehendi, Sangeet, etc.) |

All five pieces are created in one atomic operation when the host confirms — meaning either the whole event is saved or nothing is, preventing half-created events.

## 7. MVP scope — what's in vs what's out

### In for MVP

- 4-step creation wizard (Event Type → Basic Details → Sub-Events → Review)
- Wedding event type fully enabled
- Sub-events: Mehendi, Haldi, Sangeet, Ceremony, Reception, others
- Per-sub-event date, time, and venue
- Edit event (re-opens wizard pre-filled)
- Delete event (with confirmation)
- Events appear on Host Dashboard after creation
- Mobile-responsive design

### Out of scope

- **Template selection** (planned as Step 4 / Step 5 in a future iteration) — would let hosts pick from common wedding structures like "3-day North Indian Wedding" and auto-populate sub-events
- **Drag-and-drop cover image upload** — current MVP supports URL input; drag-and-drop is a polish item
- **Collaborative editing** — multiple hosts editing the same event simultaneously
- **Recurring events** — not relevant for the Indian wedding/event market
- **Birthday, Corporate, and other event types** — architecture supports them; they just need sub-event type definitions and will be enabled post-MVP
- **Event status workflow** (Draft → Published → Completed) — partial in data model, not surfaced in UI yet

## 8. After the event — what comes next

The Celebratory Curator wizard is the beginning of the host's journey on Evenzi, not the end. After an event is complete, Evenzi continues to serve the host:

**Event website as a digital memory:**
The event website created through Evenzi remains live for a period based on the host's subscription plan — becoming a lasting digital record of the celebration. Friends and family who missed the event can view the details; the host has a permanent page to look back on.

**Printed event photo book / event magazine (Phase 2 — planned):**
Hosts will be able to order a physical printed keepsake through Evenzi — a curated photo book or event magazine of their celebration. This turns the digital event into a tangible memory. (This is a planned Phase 2 feature and is not in MVP.)

**Anniversary reminders (Phase 2 — planned):**
Evenzi will remind hosts on the anniversary of their wedding or event — a small but meaningful touch that keeps the platform relevant beyond the event itself. (Planned feature; not in MVP.)

---

## 8a. Vendor collaboration (Phase 2 — forward-looking)

In Phase 2, professional event managers (vendors) will be able to join an event as collaborators — taking over coordination while the host retains final approval. The Celebratory Curator wizard will support a vendor-managed mode where vendors set up the event details on behalf of the host, enabling a more professional service layer for large or complex events.

---

## 9. How it works (non-technical overview)

```
Host opens the Celebratory Curator wizard
    ↓
Step 1: Picks event type (Wedding)
    ↓
Step 2: Fills in basic details — name, date, venue, capacity, cover image
    ↓
Step 3: Selects sub-events (e.g., Mehendi, Sangeet, Reception)
         For each: sets date, time, venue
    ↓
Step 4: Reviews everything — can edit any section
    ↓
Confirms → all data saved together in one operation
    ↓
Redirected to dashboard — event card appears immediately
```

The wizard maintains state across steps — going back doesn't clear work. The confirm step creates everything at once, so the database is never left in a partial state.

## 10. Design

Screens are designed in Google Stitch. The wizard uses a step indicator at the top to show progress. Each step is focused — one question or group at a time — to avoid overwhelming the host. Visual feedback (selected state on cards, expanded sub-event panels) makes the experience feel interactive rather than form-like.

## 11. Timeline

| Phase | What happened | Status |
|---|---|---|
| **Data model** | 5-table schema designed, migrations written | Done |
| **Backend** | API routes, atomic RPC create/update/delete | Done |
| **Frontend** | 4-step wizard, state management, form validation | Done — functional |
| **UI polish** | Pixel-perfect Stitch design implementation | Pending (separate task) |
| **QA** | Full wizard flow testing | Pending alongside polish |
| **Production** | Ready to ship once UI polish complete | Pending |

## 12. Who's involved

| Role | Person | What they own |
|---|---|---|
| **Product owner** | Abhijith | Feature scope, sub-event list, UX approvals |
| **Engineering** | Dheeraj | Wizard implementation, database, API |
| **Implementation support** | Claude Code | Schema design, RPC, test support |
| **Design** | (to be assigned) | UI polish pass in Google Stitch / Figma |

## 13. Key documents

| Document | Audience | Purpose |
|---|---|---|
| This overview (`docs/features/overviews/celebratory-curator-overview.md`) | Everyone | High-level shareable reference |
| `app/` (event wizard routes) | Engineering | Wizard page source code |
| ClickUp feature task | Everyone | Subtask breakdown, status, assignments |

## 14. FAQ

**Q: Why is it called "Celebratory Curator" and not "Create Event"?**
A: "Create Event" is developer language. "Celebratory Curator" reflects what the host is actually doing — curating something personal and meaningful. Product language should match the occasion.

**Q: I only see Wedding as an option. Where are Birthdays and Corporate events?**
A: They're on the roadmap. The architecture already supports multiple event types — we just need to define the sub-event types for each and build out their flows. Wedding is the primary market for MVP. Other types will be unlocked post-MVP.

**Q: Can I add more ceremonies later after creating the event?**
A: Yes — editing an event re-opens the wizard pre-filled, including the sub-events step. You can add, edit, or remove sub-events at any time.

**Q: What happens if I close the browser halfway through the wizard?**
A: Nothing is saved until you reach Step 4 and confirm. Closing mid-wizard means starting over. (This is intentional for MVP — partial save/draft mode is a future enhancement.)

**Q: Can two hosts collaborate on the same event?**
A: Not in MVP. One account owns one event. Collaborative editing — multiple hosts on the same event — is planned for a future phase.

**Q: What's the "template selection" step mentioned as planned?**
A: A future Step 4 (or replacement for the current Step 3) that would let you pick from common wedding structures — "3-day North Indian Wedding," "Simple South Indian Ceremony," etc. — and auto-populate the right sub-events and approximate dates. Still in planning; not in this build.

**Q: How many events can I create?**
A: No limit is enforced in MVP. Subscription tiers with event limits are part of the pricing model that will be defined before launch.

---

## Contact

Questions about this feature? Ping Abhijith (product) or Dheeraj (engineering).
