# Evenzi Digital Presence (Event Website) — Team Overview

**Status:** Not started. Template selection designed in Google Stitch (Step 4 of event creation wizard).
**Priority:** P2
**Owner:** Abhijith (product), Dheeraj (engineering)
**Created:** 2026-04-16

---

## 1. What it is in one line

Every event on Evenzi automatically gets a beautiful public website — guests can visit it without an account to see event details, browse photos, and RSVP.

---

## 2. Why we're building it

Until now, couples planning a wedding either sent a long WhatsApp message with all the details, created a basic PDF invitation, or paid someone to build a website that becomes outdated the moment plans change. None of these options update automatically, look consistent, or connect to an RSVP system.

Evenzi's Digital Presence feature gives every event a live, mobile-optimized webpage that stays up to date automatically as the host manages their event. Change the venue? The website updates. Add a new sub-event? It appears on the schedule. Upload photos? They show in the gallery.

For hosts, this eliminates the need to communicate every change to every guest separately. For guests, it creates a single place to check all event details — on any device, at any time, without downloading an app or logging in.

For Evenzi as a product, the public event website is one of the most visible parts of the platform. Every guest who visits one is a potential future host. It is organic marketing at zero additional cost.

---

## 3. Who it serves

| Audience | What they do here | Supported in MVP? |
|---|---|---|
| **Event hosts** | Choose a template during event creation; event website is generated automatically | Yes |
| **Guests** | Visit the public URL to view event details, gallery, sub-event schedule, and RSVP | Yes |
| **Anyone with the link** | View the event page — no account required | Yes |

---

## 4. What users experience

### Host experience

During event creation (Step 4 of the Celebratory Curator wizard), the host is shown 3–4 pre-built design templates: options like Elegant, Modern, Floral, and Classic. They tap one to preview it, then confirm. That's the only design decision required.

After the event is created, the website is live immediately at a public URL — for example, `evenzi.com/e/aarav-ishani-wedding`. The host can share this link with anyone. As the host updates their event — adding venue details, uploading photos, adding sub-events — the website reflects those changes automatically.

The host can take the website offline at any time from Event Settings, which makes the page inaccessible to visitors without deleting any data.

### Guest experience

A guest who receives the event link opens a well-designed page on their phone or browser. The top of the page has a hero section with the cover photo, couple or host names, and a tagline. Below that they see:

- A countdown timer to the event date
- Date, time, and venue details
- A schedule of sub-events (e.g., Mehendi on Saturday at 6pm, Ceremony on Sunday at 11am)
- A photo gallery populated by the host
- An RSVP button that links to the guest's personalized RSVP page

No login, no download, no friction.

---

## 5. MVP scope

### In scope

| Capability | Notes |
|---|---|
| Public URL for every event | Generated at event creation; shareable immediately |
| Template selection | 3–4 pre-built templates chosen during event creation wizard (Step 4) |
| Auto-populated content | All sections pull live from the event data — no manual updates |
| Hero section | Cover image, host/couple names, tagline |
| Event details section | Date, time, venue |
| Sub-event schedule | List of sub-events with their times and locations |
| Countdown timer | Live countdown to the event date |
| Photo gallery section | Powered by Media & Memories feature |
| RSVP button | Links to the guest's RSVP page |
| Mobile-optimized | Fully responsive design for all screen sizes |
| Take website offline | Toggle in Event Settings |

### Out of scope (post-MVP)

| Capability | Reason deferred |
|---|---|
| Custom CSS or theme editing | Significant UI complexity; templates cover MVP needs |
| Custom domain names | DNS management and SSL provisioning; post-MVP |
| User-editable page sections | Drag-and-drop page builder; separate product scope |
| Social sharing preview cards (OG tags) | Partial — basic OG tags may be included, rich previews are post-MVP |
| Password-protected event pages | Access control complexity; post-MVP |
| Event discovery / search | Out of scope for MVP entirely |

---

## 6. How it works (non-technical)

When a host creates an event and picks a template, Evenzi records that template choice alongside the event. The public URL is generated from the event name and a short unique ID.

When anyone visits the URL, Evenzi looks up the event, gathers all the associated data (details, sub-events, photos, RSVP configuration), and renders the chosen template with that data. The page is always current because it pulls from the same database the host uses to manage their event.

Templates are pre-built designs maintained by the Evenzi team — they are not customizable by users in MVP. The host's only design choice is which template to apply.

If the host turns the website offline from Event Settings, visitors to the URL will see a polite message that the page is temporarily unavailable, rather than a broken link.

---

## 7. Design reference

Template selection is designed in Google Stitch as Step 4 of the event creation wizard (Celebratory Curator). The Stitch screens show the template picker UI with preview cards.

The templates themselves (Elegant, Modern, Floral, Classic) are yet to be fully designed — final template designs will be completed before frontend development begins.

Stitch project: `https://stitch.withgoogle.com/projects/3859360114226566614`

---

## 8. Timeline

| Phase | Status |
|---|---|
| Template selection design (Stitch) | Done (Step 4 of event wizard) |
| Template designs (4 templates) | Not started |
| Spec & Architecture | Not started |
| Data Modeling | Not started |
| Frontend Development | Not started |
| Backend Development | Not started |
| QA | Not started |
| Integration with Media & Memories | Not started |
| Integration with Guest RSVP | Not started |

This feature is in the **Backlog**. It depends on the Event CRUD Wizard, Media & Memories, and Guest RSVP features being in place first.

---

## 9. Who's involved

| Role | Person | Responsibility |
|---|---|---|
| Product Owner | Abhijith | Template decisions, scope, approval gates |
| Lead Engineer | Dheeraj | URL routing, server-side rendering, backend |
| AI Dev Support | Claude Code | Template implementation, frontend components |

---

## 10. Dependencies

| Dependency | Why it matters |
|---|---|
| **Event CRUD Wizard (Step 4)** | Template selection happens during event creation |
| **Media & Memories** | Photo gallery section of the website pulls from the gallery feature |
| **Guest Management & RSVP** | The RSVP button links to the guest RSVP flow |
| **Event Settings** | Hosts control website visibility from Event Settings |
| **Reusable Component Library** | Page layout components (hero, countdown, schedule) built from shared library |

---

## 11. Key documents

- Design: Google Stitch project (link above) — template picker in event wizard Step 4
- Event CRUD Wizard overview: `docs/features/overviews/` (to be written)
- Implementation plan: `docs/superpowers/plans/` (to be created when sprint begins)

---

## 12. FAQ

**Can I customize the website design?**
In MVP, you choose from 3–4 pre-built templates during event creation. The template controls all colors, fonts, and layout. Full customization — editing sections, changing colors, moving elements — is a post-MVP feature.

**Can I use my own domain name?**
Not in MVP. Your event website will be at a URL like `evenzi.com/e/your-event-name`. Custom domain support (e.g., `aarav-and-ishani.com`) is planned for a future release.

**Do guests need an account to view the website?**
No. The event website is fully public. Anyone with the link can view it — no login, no Evenzi account, no app download required.

**When does the website go live?**
Immediately after the host completes event creation. There's no publish button or waiting period. As soon as the event exists in Evenzi, the website is live and shareable.

**Can I take the website offline temporarily?**
Yes. From Event Settings, the host can toggle the website offline. Visitors will see a "temporarily unavailable" message rather than the event page. The event data is not deleted — the host can turn it back on at any time.

**Does it work on mobile phones?**
Yes. The event website is built mobile-first. It's designed to look and work great on any screen — phone, tablet, or desktop.

**What if I change the event venue or date after sharing the link?**
The website updates automatically. Guests who visit after you make a change will see the updated information immediately. There's no need to re-share the link or notify guests manually about the update.
