# Evenzi Support Best Practices

**Document:** A2 — Support Best Practices
**Team:** Admin & Operations
**Version:** 1.0 (April 2026)
**Status:** Active — Living document, update as new patterns emerge

---

## 1. Introduction

This guide is the operating manual for everyone who handles support at Evenzi. Whether you are a new team member picking up your first ticket or an ops lead reviewing escalation criteria, this document tells you how support works, what good looks like, and exactly what to do for every common issue type.

### How Support Works at Evenzi

Support runs on a two-layer model:

1. **Chatbot (first line):** The Evenzi FAQ bot handles the most common questions automatically — no human required. Users get an instant answer and move on. This is the preferred outcome.
2. **Email (second line):** When a user has a problem the chatbot can't resolve, they reach a human at support@evenzi.com. This is where your work begins.

The goal of the support function is not just to close tickets — it is to make users feel genuinely helped. A user who contacts support and gets a fast, clear, human response becomes a loyal user. A user who gets a slow, generic reply churns.

### What Success Looks Like

| Metric | Target |
|--------|--------|
| Chatbot deflection rate | ≥ 70% of issues resolved by chatbot without human contact |
| First human response time | ≤ 24 hours from ticket receipt |
| Average resolution time | ≤ 48 hours for standard issues |
| User satisfaction (CSAT) | ≥ 85% (to be measured once volume justifies it) |

---

## 2. Support Channels

### 2.1 Chatbot (First Line)

The Evenzi chatbot is an FAQ bot embedded on the platform (support chatbot feature — planned). It is trained on a library of help articles covering the most common questions.

**What it handles:**
- How to create an event
- How to invite guests
- How RSVP links work
- Login and OTP questions
- Account and subscription questions
- General "how do I…" questions

**What it cannot handle:**
- Account-specific issues (locked accounts, data requests)
- Billing disputes
- Bug reports requiring engineering action
- Sensitive or emotional situations

When the chatbot cannot resolve an issue, it presents the user with an option to submit an email ticket to support@evenzi.com. All tickets created this way arrive with the user's question pre-populated.

### 2.2 Email (Second Line)

**Address:** support@evenzi.com

All tickets that require human judgment land here. Tickets are handled in order of receipt, with urgent issues (security, data loss, active billing errors) prioritized.

**Ticket flow:**
1. User submits email or chatbot escalates to email
2. Auto-reply is sent immediately (see Template 7 in Section 4)
3. Support agent picks up the ticket within 24 hours
4. Agent resolves or escalates per Section 6 (Escalation Matrix)
5. Resolution confirmation sent to user (see Template 9 in Section 4)
6. Ticket is closed and categorized for monthly review

---

## 3. Common Issue Categories & Resolution Steps

### 3.1 Login / Auth Issues

**Description:** User cannot access their account. Covers OTP failures, Google login problems, and locked accounts.

**Common user messages:**
- "I didn't receive the OTP"
- "My OTP is not working"
- "I can't log in with Google"
- "I created my account but now it says no account found"

**Resolution steps:**

*OTP not received:*
1. Ask the user to confirm the exact phone number they entered (with or without country code)
2. Check if there is a known Twilio / SMS delivery issue (check engineering status channel)
3. Advise the user to check for the OTP in DND-blocked messages — some carriers in India filter OTPs if DND is active
4. If using +91 and DND is a concern, advise the user to whitelist the Evenzi sender number (if available)
5. Ask the user to try again after 5 minutes (OTPs expire in 60 seconds; rate limiting applies)
6. If still failing after two attempts, escalate to engineering with the phone number and timestamp

*Google login failing:*
1. Ask the user to clear browser cache and cookies and retry
2. Ask which browser they are using — recommend Chrome or Safari for best compatibility
3. If they see an error code (e.g., "access blocked" or "redirect URI mismatch"), escalate to engineering immediately — this is a configuration issue
4. If the user's Google account email does not match the email on their Evenzi profile, explain that each Google account creates a separate Evenzi identity

*Account not found:*
1. Ask the user to confirm whether they registered with a phone number or Google
2. If phone: confirm the exact number they used originally
3. If Google: confirm the exact Google account email
4. Check if there is a duplicate or previously deleted account on that identifier
5. If no account exists, guide the user to re-register

**Escalation criteria:** Any suspected unauthorized account access, any persistent OTP failure beyond two attempts, any Google OAuth error code.

---

### 3.2 Event Creation Issues

**Description:** User is experiencing problems creating or editing an event through the 5-step creation wizard.

**Common user messages:**
- "My event keeps disappearing / not saving"
- "I can't add a sub-event (Mehendi / Sangeet)"
- "My cover image won't upload"
- "The wizard is stuck on step 3"

**Resolution steps:**

*Event not saving:*
1. Ask the user which step of the wizard they were on when the issue occurred
2. Ask them to try again in an incognito window to rule out browser extension conflicts
3. Ask if they were on a stable internet connection — Evenzi requires an active connection to save
4. Check engineering for any known backend or Supabase issues at that time
5. If reproducible, file a bug in ClickUp (see Section 3.6)

*Sub-event not showing or missing:*
1. Confirm the user is looking under "Sub-Events" in their event management hub
2. Sub-events are added from within an existing event — not from the main creation wizard. Walk the user through the correct flow
3. If sub-events are disappearing after being added, this is a bug — escalate to engineering

*Cover image not uploading:*
1. Confirm the file is a JPEG or PNG and under the size limit (check current limit with engineering — TBD)
2. Ask the user to try a different image to rule out a corrupt file
3. Ask them to try on a different browser or device
4. If the issue persists with multiple images, it is likely a storage configuration issue — escalate to engineering

**Escalation criteria:** Any data loss (event disappeared), any wizard step that does not advance regardless of browser/device, any image upload failure across multiple file types.

---

### 3.3 Guest Management Issues

**Description:** Problems with adding, importing, or managing guests on an event.

**Common user messages:**
- "My CSV import failed"
- "A guest's phone number is showing as wrong"
- "The RSVP link I sent isn't working"
- "A guest says they never got the invitation"

**Resolution steps:**

*CSV import failing:*
1. Send the user the CSV template (standard format: Name, Phone, Email — confirm current column order with engineering)
2. Ask them to check that phone numbers are in the correct format: 10 digits, no spaces, no country code prefix (the system adds +91 automatically)
3. Check for special characters in names — advise removing them if present
4. If the import fails even with a correctly formatted file, escalate to engineering with the CSV attached (check for PII first — remove before sharing)

*Wrong phone numbers:*
1. Guests cannot be edited after a CSV import in MVP (confirm current behavior with engineering)
2. If a number was entered incorrectly, advise the host to delete that guest and re-add them manually
3. If the platform is altering correctly-entered numbers, that is a bug — escalate

*RSVP link not working:*
1. Confirm the event is still live (not deleted or archived)
2. Check if the link has expired — RSVP links have a validity window (confirm duration with engineering)
3. Ask the host to regenerate the RSVP link and resend
4. If the regenerated link also fails, escalate to engineering

**Escalation criteria:** Any guest data altered by the system, RSVP link failures after regeneration, CSV imports failing with correctly formatted files.

---

### 3.4 WhatsApp Invitation Issues

**Description:** Problems with sending or receiving WhatsApp invitations.

**Common user messages:**
- "The WhatsApp message didn't send"
- "My guest says the link in the WhatsApp message expired"
- "The guest didn't receive the invitation"

**Resolution steps:**

*Message not sending:*
1. Clarify that Evenzi's WhatsApp feature generates a pre-filled WhatsApp message that the host sends from their own WhatsApp — Evenzi does not send WhatsApp messages directly on the host's behalf (confirm current implementation with engineering)
2. If the "Share via WhatsApp" button is not working, ask the user to try on mobile (WhatsApp deep links work best on mobile devices)
3. If the button produces an error, escalate to engineering

*Link expired:*
1. RSVP links in WhatsApp messages can expire based on the event's RSVP deadline or system link expiry
2. Advise the host to generate a fresh RSVP link and resend
3. If the RSVP deadline has passed, the host can extend it from the event settings

*Guest did not receive:*
1. The host, not Evenzi, sends WhatsApp messages — so "not received" usually means the message was not sent yet, was sent to the wrong number, or was blocked by the recipient
2. Ask the host to verify the guest's phone number in the guest list
3. Advise the host to send the message manually if the deep link approach is unreliable on their device

**Escalation criteria:** WhatsApp button producing errors (not just not working), link generation failing.

---

### 3.5 Account & Billing Issues

**Description:** Questions about account management, subscriptions, data, and deletion.

**Common user messages:**
- "What plan am I on?"
- "How do I delete my account?"
- "I want all my data removed"
- "Can I get a refund?"

**Resolution steps:**

*Plan questions:*
1. In MVP Phase 1, Evenzi is fully free — there are no paid tiers yet
2. Inform the user that paid plans are coming but no charges have been made
3. Once paid tiers launch, plan details will be visible in Account Settings

*Account deletion:*
1. Confirm the user understands that deletion is permanent and all event data will be removed
2. Direct them to Account Settings → Delete Account, or process the deletion manually if they cannot access their account
3. Confirm the 90-day data retention period (see Platform Policies, Section 3.5) and that their data will be purged after that window
4. Send a deletion confirmation email after processing

*Data requests (user wants all their data):*
1. This is an escalation — the user has the right to request a copy of all data associated with their account
2. Escalate to Ops Lead immediately (see Section 6, Escalation Matrix)
3. Acknowledge receipt to the user within 24 hours
4. Data export capability is TBD in current MVP — Ops Lead will coordinate with engineering

*Refund request:*
1. In MVP Phase 1, Evenzi is free — no charges have been made, so no refunds are applicable
2. Acknowledge the request and explain this clearly
3. When paid tiers are live: pro-rated refunds are available within 7 days of billing — refer to Platform Policies Section 7.4

**Escalation criteria:** Any data request, any billing dispute (when paid tiers launch), any account deletion where the user cannot access their account.

---

### 3.6 Bug Reports

**Description:** User has encountered something broken that is not covered by the above categories.

**Common user messages:**
- "Something isn't working right"
- "I found a bug"
- "[Feature X] used to work and now it doesn't"
- "The page keeps crashing"

**Resolution steps:**
1. Collect the following information from the user:
   - What they were trying to do
   - What happened (vs. what they expected)
   - Which device and browser they were using
   - Whether it is reproducible (does it happen every time?)
   - Any error message or screenshot
2. Attempt to reproduce the issue internally if possible
3. File a bug ticket in ClickUp:
   - List: **QA & Bugs**
   - Tags: `bug`, `mvp-phase-1`
   - Title format: `[BUG] Short description — user-reported`
   - Include: user-provided steps to reproduce, device/browser, screenshot if available
   - Priority: based on impact (P0 = platform broken, P1 = major feature broken, P2 = minor issue)
4. Acknowledge the user and provide the ticket reference number
5. Update the user when the bug is resolved (use Template 9)

**Escalation criteria:** P0 bugs (platform-wide outage), any bug involving data loss or security.

---

## 4. Response Templates

Copy and adapt these templates. Always personalize: use the user's name, reference their specific issue, and do not send a template that does not match the situation.

---

**Template 1 — OTP Not Received**

> Subject: Re: OTP Issue — Let's Get You Back In
>
> Hi [Name],
>
> Sorry to hear you're having trouble with the OTP! Here are a few things to try:
>
> 1. Make sure you're entering your number as 10 digits without the +91 prefix (e.g., 9876543210)
> 2. OTPs expire after 60 seconds — please request a fresh one and enter it right away
> 3. If your number has DND active, some SMS messages can get blocked. Try whitelisting Evenzi's sender ID if your carrier supports it
>
> If none of the above works, reply to this email with your phone number and I'll look into it directly.
>
> Warm regards,
> [Your Name]
> Evenzi Support

---

**Template 2 — Account Not Found**

> Subject: Re: Account Not Found — Here's What to Check
>
> Hi [Name],
>
> No worries — let's sort this out! Evenzi accounts are tied to either a specific phone number or a Google account, so the most common reason for "account not found" is a slight mismatch.
>
> Could you confirm:
> - Did you originally sign up with a phone number or Google?
> - If phone: what is the exact 10-digit number you used?
> - If Google: what is the email address on that Google account?
>
> Once I have this, I can check on my end and help you get back in.
>
> Warm regards,
> [Your Name]
> Evenzi Support

---

**Template 3 — How to Reset / Re-login**

> Subject: Re: Login Help — Here's What to Do
>
> Hi [Name],
>
> Here's how to get back into Evenzi:
>
> **If you registered with your phone number:**
> 1. Go to evenzi.com and tap "Login"
> 2. Enter your registered mobile number (10 digits, no country code)
> 3. Enter the OTP sent to your phone
>
> **If you registered with Google:**
> 1. Go to evenzi.com and tap "Continue with Google"
> 2. Select the Google account you used when you first signed up
>
> If you're still having trouble after trying these steps, reply here and I'll help you directly.
>
> Warm regards,
> [Your Name]
> Evenzi Support

---

**Template 4 — RSVP Link Expired**

> Subject: Re: RSVP Link — Here's the Fix
>
> Hi [Name],
>
> RSVP links do have an expiry, so if the link has expired, here's how to get a fresh one:
>
> 1. Log in to Evenzi and open your event
> 2. Go to Guest Management
> 3. Select the guest(s) and use the "Resend Invitation" option — this generates a new, valid link
>
> If your event's RSVP deadline has passed, you may need to extend it in Event Settings before new links will work.
>
> Let me know if this doesn't do the trick!
>
> Warm regards,
> [Your Name]
> Evenzi Support

---

**Template 5 — How to Delete Account**

> Subject: Re: Account Deletion Request
>
> Hi [Name],
>
> I'm sorry to see you go. Before I proceed, I want to make sure you're aware that deleting your account is permanent — all your events, guest lists, RSVPs, and photos will be removed and cannot be recovered.
>
> If you'd still like to proceed, you can delete your account in:
> Account Settings → Privacy → Delete Account
>
> Or, if you'd prefer I process it on your end, just confirm in your reply and I'll handle it within 24 hours.
>
> Your data will be fully purged from our systems within 90 days of deletion.
>
> Warm regards,
> [Your Name]
> Evenzi Support

---

**Template 6 — Refund Request (for when paid tiers launch)**

> Subject: Re: Refund Request
>
> Hi [Name],
>
> Thank you for reaching out. I've located your account and the billing details.
>
> [If within 7-day window:]
> You are within the 7-day refund window, so I'm happy to process a full refund for your most recent billing. You can expect it to appear in your account within 5–7 business days.
>
> [If outside 7-day window:]
> Unfortunately, your billing date falls outside our 7-day refund window, so a refund is not available for this cycle. Your subscription will remain active until [end date], and you can cancel at any time to avoid future charges.
>
> If you have further questions, I'm here to help.
>
> Warm regards,
> [Your Name]
> Evenzi Support

---

**Template 7 — Auto-Reply (Ticket Received)**

> Subject: We received your message — we'll be in touch within 24 hours
>
> Hi there,
>
> Thanks for reaching out to Evenzi Support! We've received your message and a member of our team will get back to you within 24 hours.
>
> In the meantime, you might find an answer faster in our Help Center (coming soon).
>
> We appreciate your patience.
>
> Warm regards,
> The Evenzi Support Team
> support@evenzi.com

---

**Template 8 — Escalation Acknowledgment**

> Subject: Re: Your Evenzi Support Request — Update
>
> Hi [Name],
>
> Thank you for your patience. I wanted to let you know that your issue is being reviewed by our team and we are looking into it carefully.
>
> [Briefly describe what is happening, e.g.:]
> We are investigating the login issue you reported and expect to have an update for you within [timeframe].
>
> I'll follow up as soon as I have more information. If anything changes on your end in the meantime, please reply to this email.
>
> Warm regards,
> [Your Name]
> Evenzi Support

---

**Template 9 — Resolution Confirmation**

> Subject: Re: Your Evenzi Support Request — Resolved
>
> Hi [Name],
>
> Great news — your issue has been resolved! Here's a quick summary of what was done:
>
> [Briefly describe the resolution, e.g.:]
> Your account has been re-activated / The RSVP link has been regenerated / The bug has been fixed in the latest update.
>
> You should be able to [describe expected outcome] now. Please give it a try and let me know if everything looks good.
>
> If you have any other questions, we're always here at support@evenzi.com.
>
> Warm regards,
> [Your Name]
> Evenzi Support

---

## 5. FAQ Management (Chatbot Content)

The FAQ chatbot is only as good as its content. It is the support team's responsibility to keep it accurate and current.

### 5.1 How to Add a New FAQ Article

1. Log in to the Evenzi admin panel at `/admin/faq` (requires Admin role)
2. Click "New Article"
3. Fill in:
   - **Title:** A clear question in the user's own words (e.g., "Why didn't I receive my OTP?")
   - **Category:** Select from the category list (see 5.3)
   - **Body:** Clear, step-by-step answer. Use numbered lists for multi-step instructions. Keep it under 300 words
   - **Status:** Set to "Draft" — do not publish without review
4. Submit for review

### 5.2 When to Add a New Article

Add a new FAQ article when:
- The same question appears in **3 or more tickets** within a calendar month
- A new feature launches that users are likely to have questions about
- A policy changes and users need to be informed

Do not add articles for:
- One-off edge cases unlikely to affect other users
- Issues that are being fixed (don't document bugs as expected behavior)

### 5.3 Article Categories

| Category | Use For |
|----------|---------|
| Getting Started | Account creation, login, onboarding |
| Creating Events | Event wizard, sub-events, event settings |
| Managing Guests | CSV import, guest list, individual management |
| Invitations & RSVP | WhatsApp invitations, RSVP links, responses |
| Account & Billing | Account settings, plans, deletion, data |
| Troubleshooting | Common errors, browser issues, known workarounds |

### 5.4 Review Before Publishing

Every article must be reviewed by a second team member before being set to "Published." The reviewer checks:
- Is the answer technically accurate? (Confirm with engineering if needed)
- Is it written in a warm, clear, conversational tone?
- Does it match current platform behavior?

### 5.5 Monthly Review Cycle

On the first Monday of each month:
1. Pull the list of all published articles
2. Review any article that relates to a feature that changed in the previous month
3. Check for articles flagged as "outdated" by support agents
4. Update or archive articles that are no longer accurate
5. Review top 10 chatbot queries — if a common query has no article, add one

---

## 6. Escalation Matrix

| Issue Type | First Line | Escalate To | Target Timeline | Tools |
|------------|------------|-------------|-----------------|-------|
| OTP not received | Support agent | Engineering (if persists > 2 attempts) | 6 hours | ClickUp bug + Slack |
| Google OAuth error | Support agent | Engineering (immediately if error code) | 4 hours | ClickUp bug + Slack |
| Event data lost | Support agent | Ops Lead + Engineering | 2 hours | ClickUp P0 bug |
| RSVP link failure (post-regen) | Support agent | Engineering | 24 hours | ClickUp bug |
| Account compromise / unauthorized access | Support agent | Ops Lead + Engineering + Founder | 1 hour | Direct call |
| Data request (export/deletion) | Support agent | Ops Lead | 24 hours | Email + ClickUp |
| Security breach (any) | Any team member | Ops Lead + Engineering + Founder | Immediately | Direct call |
| Service outage | Any team member | Engineering + Ops Lead | Immediately | Direct call |
| Legal / law enforcement inquiry | Support agent | Founder | Immediately | Direct call |
| Billing dispute (paid tiers) | Support agent | Ops Lead | 24 hours | Email thread |
| Feature abuse / coordinated activity | Support agent | Ops Lead | 24 hours | ClickUp + documentation |

---

## 7. Metrics to Track

Support metrics should be reviewed monthly by the Ops Lead and reported to the Founder.

### 7.1 Chatbot Deflection Rate

**Definition:** Percentage of chatbot sessions that resolve without the user escalating to email.
**Formula:** (Chatbot sessions resolved ÷ Total chatbot sessions) × 100
**Target:** ≥ 70%
**If below target:** Review top 5 unresolved chatbot queries and add or improve FAQ articles

### 7.2 Average First Response Time

**Definition:** Average time between ticket receipt and first human reply.
**Formula:** Sum of first response times ÷ Total tickets in period
**Target:** ≤ 24 hours
**If above target:** Review team capacity and queue distribution

### 7.3 Average Resolution Time

**Definition:** Average time from ticket open to ticket closed.
**Formula:** Sum of resolution times ÷ Total tickets in period
**Target:** ≤ 48 hours for standard tickets
**Track separately:** Escalated tickets (target: ≤ 5 business days)

### 7.4 Top 5 Recurring Ticket Topics (Monthly Review)

Every month, categorize all closed tickets and identify the top 5 most common issue types. Use this to:
- Prioritize new FAQ articles (if chatbot can absorb the volume)
- Flag product issues to engineering (if recurring issues stem from bugs or UX friction)
- Adjust training for new support team members

### 7.5 User Satisfaction (CSAT)

Once ticket volume justifies it, add a one-question CSAT survey to the Resolution Confirmation email (Template 9):

> "Did we resolve your issue? 👍 Yes / 👎 No"

**Target:** ≥ 85% positive responses.

---

*Last updated: April 2026. This document is a living reference — update it whenever new issue patterns emerge or platform behavior changes.*
*Owner: Admin & Operations Team | Approved by: Abhijith (Founder)*
