# Evenzi Landing / Marketing Site — Team Overview

**Status:** Not started. Design pending.
**Owner:** Abhijith (product), Dheeraj (engineering)
**Priority:** P2 — MVP Phase 1 Backlog
**Created:** 2026-04-16

---

## 1. What it is in one line

The public-facing marketing website at evenzi.com — the first thing a prospective user sees, designed to explain what Evenzi does and convert visitors into sign-ups.

---

## 2. Why we're building it

Without a landing page, Evenzi has no front door. Anyone who visits the root URL sees nothing useful — or worse, gets redirected to a login screen with no context about what they are signing up for.

The landing page is the primary acquisition channel for new users, especially in the early stages when there is no word-of-mouth or app store presence. It needs to answer three questions in seconds:

1. What is Evenzi?
2. Is it for me?
3. How do I get started?

For the Indian wedding market specifically, trust matters. A polished, clear marketing page signals that Evenzi is a real product worth using — not a rough prototype. It also gives us a URL we can share with early users, couples we meet at events, and anyone else we want to onboard.

Beyond acquisition, the landing page is where we introduce pricing (even as a placeholder), which sets expectations before users sign up.

---

## 3. Who it serves

| Audience | What they get from the landing page |
|---|---|
| **Couples planning a wedding** | Understand that Evenzi is built for them, see the core features, get to sign-up quickly |
| **Event hosts (birthdays, corporate)** | See that Evenzi handles events broadly, not just weddings |
| **Curious visitors / referred users** | Enough information to decide whether to sign up |
| **Returning users** | Quick path to log in without wading through marketing content |

---

## 4. What users experience

A single scrollable public page, no login required. Sections flow from top to bottom:

**Navigation Bar**
Logo on the left. Links to key sections (Features, Pricing, FAQ) and a "Get Started" or "Log In" button on the right. Sticks to the top as the user scrolls.

**Hero Section**
A strong headline and sub-headline that communicates the value in plain language. A primary call-to-action button ("Plan your event — it's free") alongside a supporting visual or illustration. This is the highest-impact section of the page.

**Problem + Solution**
A brief, honest explanation of what makes wedding/event planning stressful, and how Evenzi addresses it. Conversational tone — not a marketing pitch, but a straightforward statement of what the product does.

**Feature Showcase**
Visual highlights of the key features: event creation, the event website, guest management and RSVPs, checklist and budgeting. Each feature gets an icon or screenshot and a two-line description. Not exhaustive — just enough to build confidence.

**Social Proof**
At launch this will be placeholder content (e.g. "Used by early couples across India" or "Join our growing community"). Will be replaced with real numbers and testimonials as they become available.

**Pricing**
A simple pricing table or section. At MVP launch, this will be a placeholder showing the Free tier with a note that paid plans are coming. The goal is to signal that Evenzi has a free tier so there is no barrier to signing up.

**FAQ**
Five to eight commonly asked questions about Evenzi — what it is, who it is for, whether it is free, what happens to event data, and similar. Collapses into accordions on mobile.

**Footer**
Links to About, Contact, Privacy Policy, Terms of Service. Social media links if available.

---

## 5. MVP scope

### Included in MVP
- Hero section with headline, sub-headline, and CTA
- Problem + Solution section
- Feature overview section (visual highlights)
- Social proof section (placeholder)
- Pricing section (Free tier placeholder, paid tiers TBD)
- FAQ section
- Footer with legal and contact links
- Responsive design (mobile + desktop)
- "Get Started" CTA links to the sign-up flow

### Not in MVP (post-MVP)
- Blog or content marketing pages
- SEO-optimised deep-linking to specific features
- A/B testing of headlines or CTAs
- Live chat widget on the landing page (in-app chatbot is a separate feature)
- Multi-language support (English only at launch)
- Animated scroll effects beyond basic transitions

---

## 6. How it works (non-technical)

The landing page is a static page — it does not require the user to be logged in, and it does not load any personal data. It is built as a public route in the app (the root `/` path) so that it is the first thing any visitor sees.

The "Get Started" and "Sign Up" buttons link to the existing authentication flow. "Log In" links to the same auth page where returning users can sign in with their phone number or Google.

The page is fully responsive — it looks and works well on mobile phones, tablets, and desktops. Given that the primary Indian user base is mobile-first, the mobile experience is prioritised.

---

## 7. Design & spec status

| Item | Status |
|---|---|
| Wireframes / Stitch screens | Not started |
| Copywriting | Not started |
| Spec document | Not started |
| Implementation | Not started |

The landing page design will be done in Google Stitch. Copy (headlines, descriptions, FAQ answers) will be written before or in parallel with design. This page should be one of the later things built in MVP Phase 1 — after the core product flows are working — so that feature screenshots or illustrations are accurate.

---

## 8. Timeline

| Milestone | Target |
|---|---|
| Copywriting draft | TBD |
| Design kickoff | TBD — after core product flows complete |
| Spec approval | TBD |
| Development | TBD |
| QA | TBD |
| Launch | With MVP Phase 1 |

---

## 9. Who's involved

| Role | Person | Responsibility |
|---|---|---|
| Product Owner | Abhijith | Strategy, copy direction, approval gates |
| Lead Engineer | Dheeraj | Architecture, performance, code review |
| AI Dev Support | Claude Code | Implementation, responsiveness, testing |
| Design | TBD | Stitch screens, visual direction |

---

## 10. Key documents

| Document | Location | Status |
|---|---|---|
| Feature overview (this doc) | `docs/features/overviews/landing-overview.md` | Current |
| Design spec | Not yet created | Pending |
| Copy doc | Not yet created | Pending |
| ClickUp task | TBD | Not yet created |

---

## 11. FAQ

**Q: Why is this P2 if it is the front door to the product?**
Because in early MVP, we are onboarding known users directly — not running paid acquisition campaigns. The core product flows (event creation, guest management, RSVPs) need to work well before we drive traffic to them. The landing page is important, but it does not block the product from being usable by our first users.

**Q: Will the landing page be the same as the homepage at `/`?**
Yes. The root URL (`/`) will show the marketing landing page to visitors who are not logged in. Logged-in users who visit `/` will be redirected to their dashboard.

**Q: What does the pricing section actually say at launch?**
At launch, pricing will be a placeholder: Free tier is clearly described, and paid tiers will show "Coming soon" or similar. We do not want to publish pricing before it is finalised, but we also do not want visitors to think Evenzi has no pricing at all.

**Q: Will the landing page be SEO-optimised?**
Basic SEO (page title, meta description, structured headings) will be included in MVP. Deep SEO work — keyword research, content pages, schema markup — is post-MVP.

**Q: How will social proof work before we have real users?**
Initially with honest placeholder language ("Built for couples planning their big day in India") or early-access framing. We will replace this with real numbers and testimonials as soon as we have them. We will not fabricate stats.

**Q: Does the landing page include a chatbot widget?**
No. The Support Chatbot (Feature 9) is an in-app feature for logged-in users. The landing page FAQ section covers common pre-signup questions statically. A chatbot on the marketing page is out of scope for MVP.

**Q: Will there be separate landing pages for different event types (wedding vs birthday vs corporate)?**
Not in MVP. One landing page covers all event types. Separate landing pages or audience-targeted content are post-MVP growth marketing work.
