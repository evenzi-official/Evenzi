# Evenzi Admin Module — Team Overview

**Status:** Not started. Scope being defined.
**Owner:** Abhijith (product), Dheeraj (engineering)
**Priority:** P2 — MVP Phase 1 Backlog
**Created:** 2026-04-16

---

## 1. What it is in one line

An internal panel for the Evenzi team to view all users and events, manage FAQ content for the support chatbot, handle escalated support tickets, and control feature flags — without needing direct database access.

---

## 2. Why we're building it

Right now, if we want to see who signed up on Evenzi, we have to open the Supabase dashboard and run a SQL query. If a user reports a problem and we want to look at their event data, we have to dig through the database manually. If we need to update a FAQ answer in the chatbot, there is no interface for it — we would have to edit data directly.

This is fine during development, but it is not sustainable once real users are on the platform. The Admin Module gives the Evenzi team a proper interface to:

- **See what is happening** — user growth, active events, support tickets
- **Manage content** — FAQ articles that power the support chatbot
- **Handle support** — read and respond to escalated conversations from users
- **Control the product** — enable or disable features without a code deployment

Without this, the team is flying blind. Every operational question requires a developer to query the database, which is slow, error-prone, and does not scale.

---

## 3. Who it serves

| Audience | What they use it for |
|---|---|
| **Abhijith (Product Owner)** | Monitor user growth, review support tickets, manage FAQs, control feature flags |
| **Dheeraj (Lead Engineer)** | Debug user issues, check system health, manage feature flags for testing |
| **Future support staff** | Handle escalated tickets and respond to users |

This panel is internal only. Regular users (Hosts, Vendors) have no access and no awareness of it.

---

## 4. What users experience

The Admin Module lives at `/admin/*` — a set of protected pages visible only to users with the admin role. There is no public link to it. The admin role is assigned directly in the database (not something users can select themselves).

**User Management**
A searchable, paginated table of all registered users. Columns include: name, phone number / email, role (Host / Vendor), sign-up date, and account status. Admins can search by phone or email to look up a specific user quickly.

**Event Management**
A searchable table of all events on the platform. Columns include: event name, host name, event date, guest count, RSVP count, visibility (Public / Private), and status. Useful for monitoring what events are being created and identifying any that need attention.

**FAQ Management**
A content management interface for the FAQ articles that power the support chatbot. Admins can add new articles, edit existing ones, delete outdated ones, and organise them into categories. This is the same FAQ content that users see when they interact with the chatbot.

**Support Tickets**
A list of escalated conversations from the chatbot. When the chatbot cannot resolve a user's question, the conversation is escalated to a human. Admins can read the full conversation, see the user's details, and respond. Ticket statuses: Open, In Progress, Resolved.

**Feature Flags**
A simple on/off panel for platform-wide feature toggles. Examples: enable or disable the chatbot, turn on a new feature for all users, or roll back a feature without redeploying code. In MVP, this will be a basic list of flags — no percentage rollouts or user-group targeting.

**System Health (Basic)**
A lightweight status panel showing whether key integrations are reachable — Supabase, email service, and any external APIs. Not a full monitoring dashboard, just a quick sanity check.

---

## 5. MVP scope

### Included in MVP
- User list with search (phone, email) and basic filtering
- Event list with search and status display
- FAQ management (create, edit, delete articles and categories)
- Support ticket inbox (read, respond, change status)
- Feature flags (on/off per feature)
- Basic system health indicators
- All routes protected behind admin role check

### Not in MVP (post-MVP)
- Full analytics dashboard (event creation trends, RSVP rates, user retention)
- Billing and subscription management
- Content moderation queue (for user-uploaded photos)
- Audit logs (who changed what and when)
- Admin role hierarchy (super-admin vs. support agent vs. read-only)
- Bulk actions (e.g. delete multiple users, export user list)

---

## 6. How it works (non-technical)

Every route under `/admin` checks whether the logged-in user has the admin role before loading any content. If not, they are redirected away — the admin panel is completely invisible to regular users.

The admin role is not something users can set themselves. It is assigned directly in the user database by the development team. In MVP, only Abhijith and Dheeraj will have admin access.

Data displayed in the admin panel is read directly from the platform database — the same database that powers the app. This means the admin view is always up to date. When an admin makes a change (such as editing a FAQ article), the change takes effect immediately in the app.

Feature flags work as a simple database table — each flag has a name and an on/off value. Parts of the app check these flags when deciding whether to show a feature. Toggling a flag in the admin panel takes effect for all users within seconds, with no code change or redeployment needed.

---

## 7. Design & spec status

| Item | Status |
|---|---|
| Wireframes / screens | Not started |
| Spec document | Not started — scope still being defined |
| Data model | Partial (user and event tables planned; feature flags table not yet designed) |
| Implementation | Not started |

The Admin Module scope is still being finalised. Key open questions: what user data is visible by default, how tickets are structured and assigned, and what the initial feature flag list will be. These will be resolved during the spec phase.

---

## 8. Timeline

| Milestone | Target |
|---|---|
| Scope finalisation | TBD |
| Design kickoff | TBD |
| Spec approval | TBD |
| Development | TBD |
| QA | TBD |
| Launch | MVP Phase 1 |

---

## 9. Who's involved

| Role | Person | Responsibility |
|---|---|---|
| Product Owner | Abhijith | Scope decisions, approval gates, final sign-off |
| Lead Engineer | Dheeraj | Architecture, security, access control, code review |
| AI Dev Support | Claude Code | Implementation, testing, documentation |
| Design | TBD | Admin UI screens (functional over decorative) |

---

## 10. Key documents

| Document | Location | Status |
|---|---|---|
| Feature overview (this doc) | `docs/features/overviews/admin-module-overview.md` | Current |
| Design spec | Not yet created | Pending |
| Implementation plan | Not yet created | Pending |
| ClickUp task | TBD | Not yet created |

---

## 11. FAQ

**Q: Who can access the Admin Module?**
Only users with the admin role. In MVP, that is Abhijith and Dheeraj. The admin role is assigned directly in the database — users cannot self-assign it, and there is no visible link to `/admin` in the regular app.

**Q: Is this the same as the AMC dashboard that was parked?**
No. The AMC (Agent Management Console) was a pipeline monitoring dashboard for the internal AI agent runner — it monitored LLM task pipelines, token usage, and ClickUp integrations. The Admin Module is for managing Evenzi as a product — users, events, FAQs, and support tickets. They are entirely different tools.

**Q: Can regular users see that the Admin Module exists?**
No. There are no links to `/admin` in the regular app UI. Even if a user guessed the URL and tried to access it, they would be redirected immediately by the role check.

**Q: Why are FAQ management and support tickets in the Admin Module?**
Because both require human review and editing by the Evenzi team. FAQ articles need to be kept accurate and up to date. Support tickets need a human to read and respond. Putting both in the Admin Module means the team has one place to do all operational work.

**Q: What are feature flags used for in practice?**
Common uses: turning on a feature for internal testing before rolling it out to all users, quickly disabling a feature that is causing problems without a code deployment, and gradually introducing new features. In MVP, the initial flag list will be small — likely just the chatbot and one or two other features.

**Q: Will there be any analytics in the Admin Module?**
Basic counts only in MVP — total users, total events, open ticket count. A full analytics dashboard (charts, trends, retention metrics) is explicitly post-MVP.

**Q: What happens if an admin makes a mistake — like deleting a FAQ article?**
In MVP, there is no undo. Deletions are permanent. We will add a soft-delete or audit log post-MVP. For now, admins should treat destructive actions with care.
