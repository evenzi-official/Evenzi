# Guest Management & RSVP — Feature Overview

**Product:** Evenzi
**Feature:** Guest Management & RSVP
**Status:** Not Started — Design in Google Stitch
**Last Updated:** April 2026
**Prepared by:** Evenzi Product Team

---

## One-Liner

Guest Management gives event hosts a complete tool to build their guest list, track RSVPs in real time, and give guests a simple, no-login page to confirm attendance.

---

## Why We're Building It

For any Indian wedding or major event, managing hundreds of guests is one of the most stressful parts of the planning process. Most hosts today use WhatsApp forwards, phone calls, and Excel spreadsheets to track who's coming — a system that's fragmented, error-prone, and exhausting.

Evenzi's Guest Management feature brings everything into one place. Hosts can build their guest list, send invitations, and watch RSVPs come in without chasing people manually. Guests get a clean, friction-free experience — no app download required, just a link.

This feature is central to Evenzi's value proposition for hosts. It directly answers the question: "Who's actually coming?"

---

## Who It Serves

| Audience | How They Use It |
|----------|----------------|
| Event Hosts | Build guest list, track RSVPs, send invitations |
| Guests | Receive invitation link, view event details, submit RSVP |
| Admin & Ops | Understanding invitation and RSVP flows for support |
| Marketing & Branding | One of Evenzi's strongest differentiators to communicate |

---

## What Users Experience

### The Host's Experience

After opening an event from the Event Management Hub, the host navigates to Guest Management. Here's what they can do:

**Building the guest list:**
Hosts add guests one at a time by entering a name, phone number, and optional email address. For larger guest lists, they can upload a CSV file (a spreadsheet) to import dozens or hundreds of guests at once.

**The guest list table:**
All guests are displayed in a searchable, sortable table. Hosts can search by name, filter by RSVP status, or sort alphabetically. Each row shows the guest's name, contact info, and current RSVP status.

**RSVP statuses:**

| Status | Meaning |
|--------|---------|
| Pending | Invited but has not responded yet |
| Confirmed (Yes) | Guest has said they are attending |
| Declined (No) | Guest has said they are not attending |
| Maybe | Guest is uncertain |

**Stats dashboard:**
At the top of the guest list, a summary bar shows five numbers at a glance:

- Total Invited
- Confirmed
- Declined
- Pending
- Maybe

This gives hosts an instant read on how the event is shaping up. The Stitch design shows a real-world example: 154 guests, 65% RSVP response rate.

**Sending invitations:**
Once guests are added, a single button allows the host to send the WhatsApp invitation to all guests who haven't received one yet. The invitation contains a unique RSVP link for each guest.

**Editing and removing guests:**
Hosts can click into any guest's record to update their details or remove them from the list entirely.

---

### Non-Tech-Savvy Guest Handling

A significant portion of Indian wedding guests are elderly relatives who may not be comfortable clicking a link in WhatsApp or filling out an online form. Evenzi addresses this in two ways:

**Host manual RSVP entry:**
Hosts can mark any guest's RSVP status directly in Evenzi — Yes, No, or Maybe — without requiring the guest to self-submit. This is the ideal flow for elderly relatives: the host simply asks by phone (or in person), then records the answer themselves in the guest list. No action is required from the guest at all.

**Dead-simple RSVP page:**
For guests who are comfortable with a smartphone, the public RSVP link opens a page with minimal friction — the guest's name pre-populated where possible, and a single tap to respond Yes, No, or Maybe. There are no accounts, no passwords, and no steps beyond that single tap.

Both paths lead to the same outcome: the host's dashboard reflects an accurate RSVP count regardless of how the response was captured.

---

### The Guest's Experience

Guests do not need to download an app or create an account. Here's their entire experience:

1. They receive a WhatsApp message with a unique RSVP link
2. They open the link in their phone's browser
3. They see the event details: couple's names (or event title), date, venue, and sub-event schedule
4. They tap one button: Yes / No / Maybe
5. A confirmation screen thanks them
6. The link stays active — they can return any time to update their response

The guest RSVP page is clean, mobile-first, and designed to work on even basic Android browsers. No friction, no barriers.

---

## MVP Scope

### What's included

- Add, edit, and remove guests (name, phone, optional email)
- Searchable, sortable guest list table
- RSVP status tracking (Pending / Yes / No / Maybe)
- Dashboard stats (Total, Confirmed, Declined, Pending, Maybe)
- CSV bulk import for uploading a spreadsheet of guests
- Send WhatsApp invitation with unique per-guest RSVP link
- Public RSVP page (no login required for guests)
- RSVP confirmation screen
- Guest can update their RSVP via the same link
- Manual RSVP entry by host (on behalf of guests)

### What's not included in MVP

| Feature | Why Deferred |
|---------|-------------|
| Meal preferences | Adds data complexity; not critical for v1 |
| Seating arrangements | Significant scope; dedicated post-MVP feature |
| +1 / plus-one tracking | Adds RSVP flow complexity |
| WhatsApp two-way chat | Requires WhatsApp Business API integration |
| SMS / email invitation delivery | Only WhatsApp in MVP; SMS/email post-MVP |
| Guest check-in at venue | Venue operations feature; out of MVP scope |
| Multiple RSVP rounds | Single round per event in MVP |

---

## How It Works (Non-Technical)

When a host adds a guest, Evenzi stores their name and contact details linked to that specific event. When the host clicks "Send Invitations," Evenzi generates a unique link for each guest and sends them a WhatsApp message through an integrated messaging service.

Each guest link is tied to that guest's record. When the guest opens the link and submits their RSVP, Evenzi updates their status in the host's guest list in real time. The host can refresh their Guest Management screen at any point and see the latest responses.

For bulk imports, the host downloads a CSV template, fills it in with guest names and phone numbers, and uploads it back to Evenzi. The system reads each row and creates guest records automatically, saving significant manual data entry.

The public RSVP page is accessible to anyone with the link — no password, no account. It's a lightweight page that loads quickly on mobile networks, designed specifically for the Indian market where mobile internet speeds can vary.

---

## Privacy & Data

When importing or adding guest contacts, hosts confirm they have the guests' consent to share their information with Evenzi. A consent checkbox is required before any guest import can proceed.

Guest data is used only for the specific event it was added to — never for marketing, profiling, or any other purpose. When a guest receives an RSVP link, the page includes a brief data notice: *"Your name and response will be shared with the event host only."*

Guests can request that their data be deleted at any time by contacting support@evenzi.com. Deletion requests are processed within 30 days in compliance with the India Digital Personal Data Protection (DPDP) Act 2023.

---

## Timeline

| Phase | Target |
|-------|--------|
| Design review (Stitch) | Sprint 2 |
| Data model & schema | Sprint 2 |
| Backend API (guest CRUD, RSVP) | Sprint 3 |
| Frontend (host-side guest list) | Sprint 3 |
| Public RSVP page | Sprint 3 |
| CSV import | Sprint 3 |
| QA & Testing | Sprint 4 |
| Release | MVP Phase 1 launch |

---

## Who's Involved

| Role | Responsibility |
|------|---------------|
| Abhijith (Product Owner) | Requirements, RSVP flow decisions, approval gates |
| Dheeraj (Lead Engineer) | Backend API, database schema, WhatsApp integration |
| Claude Code (AI Dev Support) | Frontend components, RSVP page, CSV import UI |
| Design | Guest list and RSVP page screens in Google Stitch |

---

## Key Documents

- Design: Google Stitch (guest list table, RSVP page — link TBD)
- Implementation plan: `docs/superpowers/plans/` (to be created)
- Related feature: Digital Invitations (WhatsApp delivery layer)
- Related feature: Event Management Hub (navigation entry point)

---

## Frequently Asked Questions

**Q: Do guests need to create an Evenzi account to RSVP?**
No. The RSVP page is fully public. Guests just open the link and tap a button. There is no sign-up, no password, and no app download required. This was a deliberate design decision to remove all friction from the guest side.

**Q: Can I import my guest list from Excel or Google Contacts?**
CSV import is supported in MVP, which means any Excel or Google Sheets file can be exported as a CSV and uploaded directly. Direct import from phone contacts or Google Contacts is planned for a post-MVP release.

**Q: What does the RSVP page look like for guests?**
The page shows the event title, the couple's names (or event name), the date, the venue, and a brief schedule of sub-events (if the host has added them). Below this, guests see three buttons: Yes, No, Maybe. After tapping, they see a confirmation message. The page is clean, minimal, and optimized for mobile.

**Q: Can guests change their RSVP after they've submitted?**
Yes. The unique link remains active until the host manually closes the event or RSVP window. Guests can return to their link at any time and update their response. The host's dashboard will reflect the latest status.

**Q: What if a guest doesn't have WhatsApp?**
In MVP, WhatsApp is the only delivery channel for invitation links. Delivery via SMS or email will be added post-MVP. Hosts can also share the unique RSVP link manually through any channel they prefer (iMessage, email, copy-paste, etc.).

**Q: How many guests can I add?**
There is no hard limit enforced in MVP. Practical limits may apply based on the subscription tier in later versions, but for MVP all hosts have full access to the guest list regardless of size.

**Q: What happens to the RSVP data after the event?**
RSVP data is stored securely in Evenzi's database and remains accessible to the host in their event history. Data retention policies will be defined before the production launch.
