# Evenzi Platform Policies

**Document:** A1 — Platform Policies
**Team:** Admin & Operations
**Version:** 1.0 (April 2026)
**Status:** Active — Review quarterly

---

## 1. Introduction

This document defines the official policies that govern the Evenzi platform and its users. It is the primary reference for the Admin & Ops team when handling user issues, making enforcement decisions, and responding to policy-related questions.

**Who uses this document:**
- Support team members handling escalated tickets
- Ops team leads making enforcement calls
- Anyone onboarding to the Admin & Ops function

**When to refer to it:**
- A user violates platform rules and you need to know the response
- A user asks what data we collect or how to delete their account
- You need to decide whether to escalate, suspend, or terminate an account
- You are handling a billing, refund, or subscription question

All policies apply equally to all users regardless of account age, subscription tier, or region. Evenzi reserves the right to update these policies at any time. Users will be notified of material changes via email or in-app notification.

---

## 2. Acceptable Use Policy

### 2.1 What Evenzi Is For

Evenzi is a platform for planning and coordinating personal and professional events — primarily weddings and celebrations. Hosts use Evenzi to create events, manage guest lists, send invitations, track RSVPs, coordinate sub-events, and share memories.

Evenzi is intended for genuine event planning activity. Users agree to use the platform only for lawful purposes and in accordance with these policies.

### 2.2 Prohibited Uses

The following activities are strictly prohibited on Evenzi:

**Spam and solicitation**
- Sending unsolicited promotional messages to guests under the guise of event invitations
- Using the guest list or RSVP features to collect contacts for marketing purposes unrelated to the event
- Creating fake events to harvest phone numbers or email addresses from RSVPs

**Fraudulent or misleading activity**
- Creating events with false, misleading, or deceptive information
- Impersonating another person, organization, brand, or public figure
- Using another person's phone number or Google account to create an account
- Misrepresenting the nature, date, venue, or purpose of an event

**Content violations**
- Uploading adult, explicit, or inappropriate content to event covers, galleries, or descriptions
- Using Evenzi to distribute hate speech, harassment, or content that targets individuals
- Posting content that infringes on third-party intellectual property rights

**Technical abuse**
- Attempting to access accounts or data belonging to other users
- Using automated bots, scrapers, or scripts to interact with the platform
- Attempting to reverse-engineer or interfere with Evenzi's infrastructure

**Commercial misuse**
- Using Evenzi as a vendor marketplace without authorization (vendor features are not part of MVP)
- Reselling access to the platform or charging guests for RSVP or invitation services through Evenzi

### 2.3 Enforcement

Violations are handled on a severity basis:

| Severity | Examples | Response |
|----------|----------|----------|
| Minor | First-time content violation, unintentional misuse | Written warning via email |
| Moderate | Repeated violations, spam activity, false event info | Temporary account suspension (7–30 days) |
| Severe | Impersonation, data harvesting, security attacks | Permanent account termination |

**Process:**
1. Ops team reviews the flagged activity or incoming report
2. A determination is made based on the severity criteria above
3. The user is notified via email of the action taken and the reason
4. For suspensions, the user may appeal by replying to support@evenzi.com within 14 days
5. For terminations, the decision is final unless fraud on Evenzi's part is demonstrated

---

## 3. User Account Policies

### 3.1 Account Creation

- Each person may hold one Evenzi account
- Users must provide accurate identity information — real name, valid phone number, or genuine Google account
- Accounts created on behalf of a third party without their knowledge are not permitted
- Evenzi does not currently offer shared or team accounts (future roadmap consideration)

### 3.2 Phone Number Policy

- Phone number is the primary account identifier for users who register via OTP
- Only valid Indian mobile numbers (+91 prefix) are accepted for phone-based registration
- One phone number may be linked to only one account
- Users cannot change their phone number after account creation (contact support for edge cases)
- Phone numbers are used for authentication only — they are not shared with third parties

### 3.3 Role Selection

- During onboarding, users select their role: **Host** or **Guest**
- Role selection is permanent and cannot be changed after onboarding is complete
- If a user needs a different role (e.g., a guest who wants to become a host), they must contact support@evenzi.com — this will be handled on a case-by-case basis during MVP
- Note: Vendor role is not available in MVP Phase 1

### 3.4 Account Suspension

**Criteria for suspension:**
- Violation of the Acceptable Use Policy (moderate severity)
- Suspected fraudulent activity pending investigation
- Unresolved billing disputes (when paid tiers are live)
- User-requested temporary suspension

**Suspension process:**
1. Ops team documents the reason and sends the user a suspension notice via email
2. The user's account is disabled — they cannot log in or access their events
3. Guest RSVPs linked to suspended accounts remain intact (guests are not affected)
4. If the user appeals within 14 days and the appeal is upheld, the account is reinstated
5. If no appeal is filed within 14 days, the suspension is reviewed for permanent action

### 3.5 Account Deletion

Users may request deletion of their account at any time via account settings or by emailing support@evenzi.com.

**What happens when an account is deleted:**
- The user's profile, phone number, and email are removed from active records
- All events created by the user are permanently deleted, including all associated data: guest lists, RSVP responses, sub-event details, photos, and media
- Guests who received invitations to deleted events will no longer be able to access RSVP links
- Account data is held for 90 days in backup storage before permanent removal (see Section 4.4)
- Google OAuth token linkages are revoked

**What cannot be deleted:**
- Anonymized, aggregated usage data (event counts, feature usage metrics) — this data contains no personally identifiable information

### 3.6 Inactive Accounts

*This policy is a post-MVP consideration and will be finalized before enforcement.*

Proposed: Accounts with no activity (no logins, no event activity) for 18 consecutive months may be flagged as dormant. Users will receive an email notice 30 days before any action. Dormant accounts may be subject to automatic deletion after an additional 30-day grace period. Active subscription holders are exempt.

---

## 4. Data & Privacy Policy Framework

*This section outlines Evenzi's data practices. A full Privacy Policy document (separate from this ops reference) will be published on the platform before launch.*

### 4.1 Data We Collect

| Data Type | Source | Purpose |
|-----------|--------|---------|
| Phone number | User registration | Authentication (OTP) |
| Email address | Google OAuth / user profile | Account communication |
| Full name | User profile | Display within events |
| Event details | Host-created content | Core platform service |
| Guest contacts (phone/email) | Host imports | Invitation delivery |
| Photos and media | Host uploads | Event galleries |
| RSVP responses | Guest interaction | Host dashboard data |
| Device/browser info | Platform logs | Security, debugging |
| Usage patterns | Platform analytics | Product improvement |

### 4.2 How Data Is Used

Data collected on Evenzi is used exclusively to:
- Provide the event planning and coordination service
- Authenticate users and protect accounts
- Send event-related notifications (invitations, RSVPs, reminders)
- Improve the platform (aggregated, anonymized analytics only)

Evenzi does not sell user data. Evenzi does not use personal data for advertising. Data is not used for any purpose beyond delivering the Evenzi service.

### 4.3 Third-Party Services

The following third-party providers process user data as part of delivering the service:

| Provider | Purpose | Data Shared |
|----------|---------|-------------|
| Supabase | Database and authentication | All user and event data (stored in Supabase PostgreSQL) |
| Google | OAuth authentication | Email and name (if user chooses Google sign-in) |
| Twilio | Phone OTP delivery | Phone number only |
| Resend | Transactional email | Email address, notification content |

No other third-party services receive personal user data in MVP Phase 1. Integration with additional services will be disclosed in updated policy documentation.

### 4.4 Guest Data and Host Responsibility

Hosts who add guest contact information (phone numbers, names) to their events are responsible for ensuring they have appropriate consent from those guests to share their contact details with Evenzi for the purpose of receiving event invitations.

Evenzi processes guest contact data solely to send invitations and RSVP links on behalf of the host. Evenzi does not create guest accounts without explicit guest action.

### 4.5 Data Deletion

- Users may request deletion of all their personal data by deleting their account (see Section 3.5)
- Upon deletion, personal data is removed from active systems within 7 days
- Backup copies are purged within 90 days of the deletion request
- Anonymized aggregate data derived from the account is not subject to deletion

### 4.6 Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Active account data | Retained while account is active |
| Deleted account data | 90 days post-deletion (backup), then permanent removal |
| Event data (deleted events) | 30 days post-deletion, then permanent removal |
| Authentication logs | 12 months (security requirement) |
| Anonymized usage analytics | Indefinite |

---

## 5. India Digital Personal Data Protection (DPDP) Act 2023 Compliance

*This section outlines Evenzi's obligations under the Digital Personal Data Protection (DPDP) Act 2023 enacted by the Government of India. Compliance with this Act is a legal requirement given that Evenzi collects and stores personal data about guests (name, phone number, email) uploaded by hosts.*

### 5.1 Key Obligations Under the DPDP Act

**1. Purpose limitation**
Guest data uploaded by hosts may only be used for the specific event it was added to. It must never be used for marketing, re-targeting, profiling, or any purpose beyond delivering the Evenzi invitation and RSVP service for that event.

**2. Data principal rights**
Any person whose personal data is stored on Evenzi (including guests who have not registered an account) has the right to:
- Know what personal data Evenzi holds about them
- Request correction of inaccurate data
- Request erasure of their personal data

Guests may exercise these rights by contacting support@evenzi.com. The Ops team must escalate all such requests to Engineering for data lookup and action within 30 days.

**3. Consent mechanism**
Hosts must confirm they have the right to upload guest contact data before importing. A consent checkbox must appear at the point of guest import (CSV upload or manual add):

> *"I confirm I have obtained consent from these guests to share their contact information with Evenzi for this event."*

This checkbox is a required UI element. Hosts cannot proceed with guest import without checking it.

**4. Data processing notice on RSVP pages**
The public guest RSVP page must include a brief data notice visible to the guest:

> *"Your name and response will be shared with the event host only."*

This notice is a required UI element on all RSVP pages.

**5. Significant Data Fiduciary considerations**
At current scale, Evenzi is likely not a Significant Data Fiduciary (SDF) under the DPDP Act — SDF designation applies to platforms processing very large volumes of personal data. However, this classification must be reviewed by the Founder as the user base grows, as SDF status carries additional obligations (Data Protection Officer appointment, data audits, etc.).

**6. Breach notification**
If a data breach occurs affecting personal data of Indian users, affected data principals must be notified within 72 hours of the breach being confirmed. This is consistent with Evenzi's existing incident response policy (Section 9) and extends it to meet the DPDP Act's specific notification requirements.

**7. Data deletion on account closure**
When a host deletes their Evenzi account, all guest personal data associated with their events must be permanently deleted within 30 days. This applies to all guest records linked to that host's events — not just the host's own profile data.

**8. Data localisation**
Evenzi is currently hosted on Supabase in the ap-northeast-1 region (Tokyo, Japan). As of the DPDP Act 2023, there is no explicit data localisation mandate requiring Indian personal data to be stored within India. However, this should be monitored closely as implementing rules and government guidance are issued. The Founder should review this periodically.

### 5.2 Operational Implications for the Ops Team

- **Data access requests from guests:** Any guest (data principal) who contacts Evenzi to know what data is held about them must be escalated to Engineering. Target response: within 30 days.
- **Deletion requests from guests:** Must be processed within 30 days. Engineering must confirm deletion in writing to the Ops team, who will inform the requester.
- **Data processing register:** Maintain a simple register (spreadsheet) of all categories of personal data processed, the purpose, and the third-party processors involved. This is sufficient at current scale.
- **Privacy policy update:** The platform's public privacy policy must be updated to reflect DPDP compliance — specifically: purpose limitation, guest rights, the consent mechanism, and the RSVP data notice — before launch.
- **Pre-launch checklist item:** The consent checkbox on guest import and the data notice on RSVP pages are mandatory before Evenzi goes live with any real users.

---

## 6. Content Policy

### 6.1 Event Content Standards

All events created on Evenzi must represent genuine, real-world events. The following standards apply to all host-created content:

**Events must:**
- Be for a real, planned event with accurate details (date, name, location)
- Use event names, descriptions, and photos that accurately represent the event
- Be created by or with explicit permission from the event organizer

**Events must not:**
- Contain false, misleading, or fabricated event details
- Be created as test events and left live on the platform
- Be used as a vehicle for promoting commercial products or services

### 6.2 Cover Images and Photos

- All uploaded images must be event-related
- Adult, explicit, or inappropriate content is strictly prohibited
- Content that depicts or promotes violence, hate speech, or discrimination is prohibited
- Stock photos representing unrelated events are discouraged; authentic event photos preferred

### 6.3 Event Descriptions

- Descriptions must be in plain language and accurately describe the event
- No URLs or links to external commercial sites in event descriptions
- No content that targets, demeans, or harasses individuals

### 6.4 Admin Rights

The Evenzi Admin team reserves the right to:
- Remove any content that violates this Content Policy without prior notice
- Temporarily disable an event pending review if a complaint is received
- Notify the host of the specific policy violation and the content removed

Hosts may appeal content removal decisions by contacting support@evenzi.com within 7 days.

---

## 7. Support Policy

### 7.1 Support Channels

Evenzi provides support through two channels:

| Channel | Scope | Response Time |
|---------|-------|---------------|
| In-app chatbot (FAQ bot) | Common questions, self-service | Instant (automated) |
| Email: support@evenzi.com | Escalated issues, account actions, billing | Within 24 hours |

### 7.2 Response Time Commitment

- **Standard tickets:** First human response within 24 hours of ticket receipt
- **Urgent tickets** (account security, data requests, active service disruption): Prioritized response within 6 hours
- **Business hours:** Support team operates Mon–Sat, 9 AM–7 PM IST. Emails received outside hours are queued for next business day

### 7.3 Escalation Criteria

The following issue types require escalation beyond first-line support:

| Issue Type | Escalate To | Criteria |
|-----------|-------------|---------|
| Account security / unauthorized access | Ops Lead + Engineering | Any report of account compromise |
| Data breach or data loss | Ops Lead + Engineering + Founder | Immediately upon discovery |
| Legal or compliance requests | Founder | Data requests, law enforcement inquiries |
| Billing disputes (post-MVP) | Ops Lead | Unresolved after first response |
| Feature abuse investigations | Ops Lead | Patterns suggesting coordinated abuse |

### 7.4 Refund Policy

*Note: Evenzi is fully free in MVP Phase 1. This section is a placeholder for when paid tiers launch.*

When paid tiers are live:
- Pro-rated refunds will be issued within 7 days of a billing event if the user requests it
- Refunds are not issued for partial months beyond the 7-day window
- See Section 8 for full Subscription & Billing Policy

---

## 8. Subscription & Billing Policy

*Note: This section is a forward-looking placeholder. Evenzi is free in MVP Phase 1. Subscription tiers and pricing are TBD. This section will be finalized before paid features launch.*

### 8.1 Free Tier

- Evenzi will offer a free tier with defined limits (limits TBD — pending product decision)
- Free tier users have access to core event planning features
- No credit card required for free tier

### 8.2 Paid Tiers

- Paid tiers will be offered on monthly and annual billing cycles
- Annual plans will be offered at a discount vs. monthly
- Billing is processed at the start of each billing cycle

### 8.3 Cancellation Policy

- Users may cancel their paid subscription at any time
- Upon cancellation, access to paid features continues until the end of the current billing period
- No partial-month refunds after the 7-day refund window

### 8.4 Refund Policy

- Users may request a full refund within 7 days of any billing event
- After 7 days, no refunds are issued for the current billing period
- Refund requests must be submitted to support@evenzi.com with the registered email and billing date

### 8.5 Upgrade and Downgrade

- Plan upgrades take effect immediately; the user is charged a prorated amount for the remainder of the billing period
- Plan downgrades take effect at the end of the current billing period
- If a downgrade results in exceeding free tier limits (e.g., too many events), the user will be notified and given 30 days to reduce usage

---

## 9. Incident Response Policy

### 9.1 Security Breach

In the event of a confirmed security breach affecting user data:

1. Engineering team isolates the affected systems within 1 hour of confirmation
2. Ops Lead and Founder are notified immediately
3. Scope of the breach is assessed (what data, how many accounts, how long)
4. Affected users are notified by email within 72 hours of confirmation
5. Notification includes: what happened, what data was affected, what steps have been taken, what users should do
6. A post-incident report is prepared within 7 days

### 9.2 Service Downtime

In the event of unplanned service outage:

1. Engineering team begins remediation immediately upon detection
2. A status update is posted to the platform status page (to be set up — TBD)
3. For outages lasting more than 2 hours, all users receive an email notification
4. Root cause and restoration summary is communicated within 24 hours of resolution

### 9.3 Data Loss

In the event of data loss affecting user-generated content:

1. Engineering team assesses backup availability and restoration scope
2. Backup restoration procedure is executed (full procedure TBD with DevOps — to be documented before production launch)
3. Affected users are notified within 24 hours with details of what was lost and what was recovered
4. Users are offered manual support to re-upload or recreate lost content where possible

---

*Last updated: April 2026. Next scheduled review: July 2026.*
*Owner: Admin & Operations Team | Approved by: Abhijith (Founder)*
