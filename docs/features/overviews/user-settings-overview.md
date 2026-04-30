# Evenzi User Settings — Team Overview

**Status:** Not started. Design pending.
**Owner:** Abhijith (product), Dheeraj (engineering)
**Priority:** P1 — MVP Phase 1 Backlog
**Created:** 2026-04-16

---

## 1. What it is in one line

The place where a logged-in user manages their own account — their profile, notification preferences, connected sign-in methods, and subscription plan.

---

## 2. Why we're building it

Every user needs a place to manage who they are on the platform, independent of any specific event. Right now, once you sign up on Evenzi, there is no way to update your display name, change your profile photo, or control which notifications you receive. That creates problems:

- Users who signed up with a placeholder name have no way to fix it
- There is no way to opt out of notifications — which will become a real pain point once RSVP alerts and checklist reminders go out
- Users cannot see which plan they are on, or upgrade when they are ready

User Settings solves all of this. It is the account-level control panel — separate from any event, applying to the user's entire Evenzi experience.

---

## 3. Who it serves

| Audience | What they can do here | Supported in MVP? |
|---|---|---|
| **Hosts** | Edit profile, manage notifications, view account info, check subscription | Yes |
| **Vendors** | Same — account-level settings apply to any role | Out of scope (no Vendor role in MVP) |
| **Admins** | Managed separately through the Admin Module | No |

---

## 4. What users experience

A dedicated Settings page, accessible from the navigation (likely a profile icon or menu in the top corner). The page is divided into clear sections:

**Profile**
The user can update their display name and upload or change a profile photo. Phone number is shown but not editable (it is the auth identifier). Email is shown if signed in with Google.

**Notifications**
A set of toggles for each notification type — email alerts when a guest RSVPs, SMS/email reminders for checklist items, event countdown reminders. Users can turn each one on or off.

**Account**
Shows which sign-in method was used (Phone OTP or Google). For future email/password users, a change-password option would appear here. For OAuth users, this section is read-only.

**Subscription**
Displays the user's current plan (Free during MVP). An upgrade prompt or pricing comparison will appear here to drive conversions to paid tiers when those tiers are defined.

---

## 5. MVP scope

### Included in MVP
- Display name editing
- Profile photo upload
- Phone number and email display (read-only for auth fields)
- Notification preference toggles (email and SMS)
- Connected account display (which auth method is active)
- Current subscription plan display with upgrade prompt

### Not in MVP (post-MVP)
- Two-factor authentication
- Data export (download all your Evenzi data)
- Advanced notification schedules (e.g. "only send between 9am and 6pm")
- API access keys (for developer integrations)
- Account transfer or merge

---

## 6. How it works (non-technical)

When a user opens Settings, the app loads their existing profile data from the database and fills in the form fields. When they make a change and save, the update is written back to the database and takes effect immediately — no need to log out and back in.

Notification preferences are stored per-user in the database. Whenever the platform sends out a notification (such as a new RSVP), it checks these preferences first before sending. If a user has turned off email notifications, the email simply does not go out.

Profile photos are stored in a file storage service. When uploaded, the old photo is replaced. The new photo appears wherever the user's avatar is shown across the app.

---

## 7. Design & spec status

| Item | Status |
|---|---|
| Wireframes / Figma screens | Not started |
| Spec document | Not started |
| Data model | Not started |
| Implementation | Not started |

Design will be created in Google Stitch (primary design tool) once the Reusable Component Library is in place. This feature is blocked on the Component Library being available, as it uses shared form inputs, toggles, avatars, and page layouts.

---

## 8. Timeline

| Milestone | Target |
|---|---|
| Design kickoff | TBD — after Component Library |
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
| Feature overview (this doc) | `docs/features/overviews/user-settings-overview.md` | Current |
| Design spec | Not yet created | Pending |
| Implementation plan | Not yet created | Pending |
| ClickUp task | TBD | Not yet created |

---

## 11. FAQ

**Q: Is this the same as Event Settings?**
No. User Settings is account-wide — it applies to the logged-in user regardless of which event they are working on. Event Settings is per-event — it controls things like the event name, date, and visibility for a specific event. Think of User Settings as "my account" and Event Settings as "this event's configuration."

**Q: Can users change their phone number?**
Not in MVP. The phone number is the primary auth identifier, and changing it requires re-verification. This will be considered post-MVP when we have a proper account security flow.

**Q: What notification types will be supported at launch?**
The exact list is TBD pending design, but expected to include: new RSVP received, RSVP updated, checklist reminder, event countdown (e.g. "7 days to go"), and system announcements. Each will have an on/off toggle.

**Q: What happens to a user's settings if they delete their account?**
All data associated with the account — profile, settings, events, guest lists, checklist items — is permanently deleted. The user will be prompted to confirm before deletion proceeds.

**Q: Will Google OAuth users see a "Change Password" option?**
No. The password change option is only relevant for email/password accounts, which are not supported in MVP anyway. OAuth users will see their connected Google account listed under Account Info with no password fields shown.

**Q: What plan information will show up in MVP?**
During MVP, all users are on the Free plan. The Subscription section will display "Free Plan — Your current plan" along with a brief description of what's included and a placeholder upgrade prompt. Actual paid tiers and billing are post-MVP.

**Q: Can users control notifications per event?**
Not in MVP. Notification preferences are platform-wide. Per-event notification controls (e.g. "mute this specific event") are a post-MVP enhancement.
