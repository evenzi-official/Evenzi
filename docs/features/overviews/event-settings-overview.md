# Evenzi Event Settings — Team Overview

**Status:** Not started. Design pending.
**Owner:** Abhijith (product), Dheeraj (engineering)
**Priority:** P1 — MVP Phase 1 Backlog
**Created:** 2026-04-16

---

## 1. What it is in one line

The configuration panel for a single event — where a Host edits event details, changes the website template, controls visibility, closes RSVPs, and permanently deletes the event if needed.

---

## 2. Why we're building it

When a host creates an event, the details they enter are not set in stone. Venues change. Dates shift. A host might pick a template quickly during setup and want to switch to a better one once they have seen it live. They might also want to close RSVPs after the deadline passes, or take down an event entirely.

Without Event Settings, hosts are locked into whatever they entered at creation time with no way to update anything. That is not a usable product — events are living things that change frequently, especially in the months leading up to a wedding.

Event Settings also gives hosts meaningful control over their event's visibility. Not everyone wants their wedding website to be publicly searchable. The ability to switch between public and private (link-only) access is a basic privacy expectation.

---

## 3. Who it serves

| Audience | What they can do here | Supported in MVP? |
|---|---|---|
| **Hosts** | Edit, configure, and manage their own event | Yes — primary user |
| **Co-planners** | May be able to access a subset of settings in the future | Out of scope (post-MVP) |
| **Guests** | No access — this is host-only | N/A |

---

## 4. What users experience

Event Settings is accessed from within a specific event — via a Settings icon or tab in the Event Management Hub. The page is scoped entirely to that one event.

**Event Details**
The host can edit the event name, date and time, venue name and address, event description, and cover image. These fields mirror the ones filled in during event creation.

**Website Template**
A visual selector showing the available design templates. The host can switch templates at any time and preview how their event website will look before saving.

**Visibility**
A simple toggle: Public (the event website is accessible to anyone with the link and may appear in search results) or Private (the link still works, but the event is not publicly indexed). Default is Private.

**RSVP Management**
A control to close RSVPs. Once closed, the RSVP form on the event website shows a "RSVP window has closed" message instead of the form. This can be re-opened manually if needed.

**Danger Zone**
At the bottom of the page, clearly separated: options to cancel the event (marks it as cancelled and may notify guests — exact behaviour TBD) and delete the event (permanently removes the event and all data, with a confirmation step).

---

## 5. MVP scope

### Included in MVP
- Edit event name, date, venue, description, cover image
- Change website template
- Toggle event visibility (Public / Private)
- Close and re-open RSVP window
- Delete event (with confirmation)

### Not in MVP (post-MVP)
- Cancel event with automatic guest notifications
- Event duplication (clone an event as a starting point for a new one)
- Co-planner invitations and shared settings access
- Sub-event visibility per guest group (e.g. hide the reception from some invitees)
- Scheduled RSVP close (auto-close on a specific date)

---

## 6. How it works (non-technical)

Event Settings loads the saved configuration for the selected event and displays it in editable form. Changes are saved one section at a time or all at once — the exact save behaviour will be confirmed in the design phase.

Visibility changes take effect immediately. Switching to Private means the event website becomes inaccessible to non-guests the moment the host saves. Switching to Public makes it accessible again.

Closing RSVPs flips a flag in the database. The event website's RSVP form checks this flag every time a guest tries to submit — if RSVPs are closed, the form is replaced with a closed message.

Deleting an event triggers a two-step confirmation prompt (type the event name or click a confirm button). Once confirmed, all data connected to that event — guest list, RSVPs, checklist items, budget entries, media — is permanently removed. This cannot be undone.

---

## 7. Design & spec status

| Item | Status |
|---|---|
| Wireframes / Figma screens | Not started |
| Spec document | Not started |
| Data model | Partial (event table planned, not yet built) |
| Implementation | Not started |

Event Settings design is expected to follow the Event CRUD wizard and Event Management Hub, since it shares many of the same fields and components. It is blocked on those features being designed first.

---

## 8. Timeline

| Milestone | Target |
|---|---|
| Design kickoff | TBD — after Event CRUD and Event Management Hub |
| Spec approval | TBD |
| Development | TBD |
| QA | TBD |
| Launch | MVP Phase 1 |

---

## 9. Who's involved

| Role | Person | Responsibility |
|---|---|---|
| Product Owner | Abhijith | Requirements, approval gates, final sign-off |
| Lead Engineer | Dheeraj | Architecture, backend, code review |
| AI Dev Support | Claude Code | Implementation, testing, documentation |
| Design | TBD | Stitch screens, component specs |

---

## 10. Key documents

| Document | Location | Status |
|---|---|---|
| Feature overview (this doc) | `docs/features/overviews/event-settings-overview.md` | Current |
| Design spec | Not yet created | Pending |
| Implementation plan | Not yet created | Pending |
| ClickUp task | TBD | Not yet created |

---

## 11. FAQ

**Q: Is this the same as User Settings?**
No. Event Settings applies to one specific event — it controls things like the event name, date, and visibility. User Settings is account-wide and applies to the logged-in user across all events. They are separate pages accessed from different places in the app.

**Q: Where do I access Event Settings from?**
From within an event — through the Event Management Hub. There will be a Settings tab or icon in the event navigation. You cannot reach Event Settings from the main app navigation.

**Q: Can I change the website template after guests have already received the event link?**
Yes. Changing the template only affects how the event website looks — it does not change the URL or any of the event information. Guests who open the link after the change will see the new template. There is no notification sent to guests when a template changes.

**Q: What happens when I close RSVPs — do guests get notified?**
In MVP, closing RSVPs does not trigger a notification. The RSVP form simply shows a "closed" message to any guest who tries to submit after the fact. Notifications on RSVP close are a post-MVP enhancement.

**Q: If I delete an event, can I get it back?**
No. Deletion is permanent and irreversible. All data — guests, RSVPs, checklist items, budget entries, and any uploaded media — is deleted permanently. The app will show a clear warning and require confirmation before proceeding.

**Q: What is the difference between "Cancel event" and "Delete event"?**
Cancel marks the event as cancelled — it remains in the system, guests may be notified, and the host can still access the event record. Delete permanently removes all event data from the platform. The exact behaviour of the Cancel option (especially around guest notifications) is still to be decided during the design phase.

**Q: Can co-planners change Event Settings?**
Not in MVP. Co-planner access to events (including settings) is a post-MVP feature. In MVP, only the event owner (the host who created it) can access Event Settings.
