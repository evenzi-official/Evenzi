# Evenzi Digital Invitations (WhatsApp) — Team Overview

**Status:** Not started. Part of Guest Management flow in Google Stitch.
**Priority:** P3
**Owner:** Abhijith (product), Dheeraj (engineering)
**Created:** 2026-04-16

---

## 1. What it is in one line

Hosts send digital invitations to guests via WhatsApp directly from Evenzi — each invitation includes event details and a personal RSVP link, delivered to the guest's phone in seconds.

---

## 2. Why we're building it

The traditional Indian wedding invitation process is time-consuming, expensive, and disconnected from modern reality. Printed cards get lost. WhatsApp forwards with details pasted in plain text look unprofessional and are hard to act on. Guests receive a message, intend to RSVP, forget, and then the host has to chase them down individually.

WhatsApp is the dominant messaging platform in India — with over 500 million users and near-100% open rates for messages from known contacts. It is where guests already live. Sending invitations through WhatsApp is not just convenient; it is the channel guests actually check.

By building invitation sending directly into Evenzi's Guest Management, we close the loop between the guest list and the invitation. Hosts know who has been invited, who hasn't, and who still hasn't responded — all from one screen. No more spreadsheets, no more manual follow-up tracking, no more re-copying event details for each message.

---

## 3. Who it serves

| Audience | What they do here | Supported in MVP? |
|---|---|---|
| **Event hosts** | Send WhatsApp invitations to guests from the Guest Management screen | Yes |
| **Guests** | Receive a WhatsApp message with event details and RSVP link | Yes |
| **Guests** | Click the RSVP link and submit their response | Yes (via RSVP feature) |

---

## 4. What users experience

### Host experience

From the Guest Management screen, the host sees their guest list with invitation status for each guest: Not Invited, Invited, or RSVP Received.

To send invitations, the host selects one or more guests — or taps "Invite All Uninvited" to send to everyone who hasn't been invited yet. They tap "Send Invitation."

Evenzi generates a pre-filled WhatsApp message for each guest:

> *"[Host name] is inviting you to [Event name] on [Date] at [Venue]. Please RSVP here: [unique link]"*

WhatsApp opens on the host's phone with the message pre-filled and the guest's number already populated. The host reviews the message and taps Send. The invitation status for that guest updates from Not Invited to Invited.

If a guest hasn't responded after a number of days, the host can select them again and re-send. The invitation history is tracked per guest.

### Guest experience

The guest receives a WhatsApp message from the host's number — a person they already know, not a random business account. The message has the key event details and a personal link.

The guest taps the link, lands on the event's RSVP page, and submits their response (attending, not attending, maybe). No account needed, no app to download.

---

## 5. Implementation approach

Two approaches are being evaluated:

| Approach | How it works | Pros | Cons |
|---|---|---|---|
| **WhatsApp deep link (MVP candidate)** | Evenzi opens `wa.me/` URL with pre-filled message; host taps Send in WhatsApp | Simple to build, no business verification needed, works on any phone | Host must manually tap Send for each guest; not scalable for very large lists |
| **WhatsApp Business API** | Evenzi sends messages automatically via WhatsApp's official business API | Fully automated, scales to hundreds of guests, supports templates | Requires WhatsApp Business verification, more complex setup, may have per-message costs |

The deep link approach is the MVP candidate — it gets invitations out the door without business verification and lets the host maintain personal contact with their guests. The Business API approach will be revisited post-MVP for hosts with large guest lists.

---

## 6. MVP scope

### In scope

| Capability | Notes |
|---|---|
| WhatsApp invitation with pre-filled message | Opens WhatsApp with event details + RSVP link pre-filled |
| Individual and bulk send | Send to one guest or "Invite All Uninvited" |
| Invitation status tracking | Per-guest status: Not Invited → Invited → RSVP Received |
| Re-send option | Host can re-send to guests who haven't responded |
| Unique RSVP link per guest | Each invitation contains a personalized link tied to that guest |

### Out of scope (post-MVP)

| Capability | Reason deferred |
|---|---|
| Automated sending (WhatsApp Business API) | Requires business verification; deep link is the MVP approach |
| Email invitations | Separate channel; WhatsApp covers the primary use case for India |
| SMS invitations | WhatsApp supersedes SMS for this audience |
| Custom invitation messages | Pre-generated template covers MVP; custom messages are post-MVP |
| Invitation design / PDF cards | Digital design invitation cards are a separate, larger effort |
| Automated follow-up reminders | Scheduled re-send logic; post-MVP |
| RSVP deadline enforcement | Automatic cutoff date with status lock; post-MVP |

---

## 7. How it works (non-technical)

When the host taps "Send Invitation" for a guest, Evenzi looks up the guest's phone number and builds a WhatsApp message containing the event name, date, venue, and a unique link. That link points to the RSVP page and is tied specifically to that guest — so when the guest submits their RSVP, Evenzi knows exactly who responded.

Evenzi then opens WhatsApp using a standard deep link (the `wa.me/` format that any website can use). WhatsApp opens with the message and recipient already set — the host just taps Send.

Because the host is the one pressing Send, the message comes from their personal WhatsApp number. To the guest, it looks like the host messaged them directly — which is the most natural and trusted experience.

After the host sends, Evenzi updates the invitation record for that guest to "Invited" and records the timestamp. If the guest later clicks the RSVP link and submits their response, the status updates to "RSVP Received" automatically.

---

## 8. Design reference

Digital Invitations are part of the Guest Management flow in Google Stitch. The relevant screens show the guest list with invitation status badges and the "Send Invitation" action.

Stitch project: `https://stitch.withgoogle.com/projects/3859360114226566614`

---

## 9. Timeline

| Phase | Status |
|---|---|
| Design (Stitch — Guest Management flow) | In progress |
| Spec & Architecture | Not started |
| Backend Development | Not started |
| Frontend Development | Not started |
| QA | Not started |

This feature is in the **Backlog** at P3 priority. It will be scheduled after Guest Management & RSVP (P1) is complete, since the invitation flow is built on top of the guest list and RSVP infrastructure.

---

## 10. Who's involved

| Role | Person | Responsibility |
|---|---|---|
| Product Owner | Abhijith | Scope, approach decision (deep link vs. API), approval |
| Lead Engineer | Dheeraj | Deep link implementation, RSVP link generation, status tracking |
| AI Dev Support | Claude Code | Frontend Guest Management UI, invitation flow |

---

## 11. Dependencies

| Dependency | Why it matters |
|---|---|
| **Guest Management & RSVP** | Guest list and RSVP infrastructure must exist before invitations can be sent |
| **Digital Presence (Event Website)** | The RSVP link in the invitation points to the public event website's RSVP page |
| **Event CRUD Wizard** | Event details (name, date, venue) that populate the invitation message come from event creation |
| **Reusable Component Library** | Guest list UI, status badges, and action buttons from shared component library |

---

## 12. Key documents

- Design: Google Stitch project (link above) — Guest Management flow
- Guest Management & RSVP overview: `docs/features/overviews/` (to be written)
- Digital Presence overview: `docs/features/overviews/digital-presence-overview.md`
- Implementation plan: `docs/superpowers/plans/` (to be created when sprint begins)

---

## 13. FAQ

**Does the host send manually or is it automated?**
In MVP, the host taps Send inside WhatsApp. Evenzi opens WhatsApp with the message pre-filled — the host just confirms and sends. Fully automated sending (where Evenzi sends without the host opening WhatsApp) requires the WhatsApp Business API, which is planned for post-MVP.

**What if the guest doesn't have WhatsApp?**
In MVP, WhatsApp is the only supported channel. Email invitations are planned for a future release. In practice, WhatsApp penetration in India is close to universal — the vast majority of guests will receive the invitation without issue.

**Can I track if the guest opened the WhatsApp message?**
WhatsApp read receipts (the blue ticks) are visible to the sender in their WhatsApp app, just like any message. Inside Evenzi, the tracked status is whether the guest has clicked the RSVP link and submitted their response — not whether they opened the WhatsApp message itself.

**Can I send a custom message?**
In MVP, the invitation message is auto-generated from the event data — the host cannot edit it before sending. Custom messages and branded invitation templates are post-MVP features.

**Can I send invitations to international guests?**
Yes. WhatsApp works internationally, and the deep link approach supports any phone number with a country code. Evenzi MVP is designed for India, so Indian numbers (+91) are the primary use case, but international guests can receive and respond to invitations without any issues.
