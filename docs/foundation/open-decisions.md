# Evenzi — Open Decisions

> These items were identified during the document review session (2026-04-16) and require a team discussion before the document suite is finalised and shared externally.

---

## Decision 1 — Free Tier Limits

**What needs to be decided:** The exact walls that trigger an upgrade from free to paid.

The walls are defined in concept (storage cap, feature gates, data expiry, event count) but no numbers exist yet.

**Discussion questions:**
- How many events can a free user create? (1 lifetime? 1 per year?)
- What is the storage cap for photos on the free tier? (500MB? 1GB?)
- How many days does the event website stay live on the free tier? (30 days? 90 days?)
- Which features are paid-only vs. free? (WhatsApp invitations? Photo book ordering? Event website?)

**Why it matters:** Investors will ask. Team members building the billing system need this. Marketing needs it to write pricing copy.

---

## Decision 2 — Pricing Tiers

**What needs to be decided:** At least a hypothesis for subscription pricing. Even rough numbers are better than TBD.

**Suggested framework to discuss:**
- Free tier: [limits from Decision 1]
- Individual Pro: ₹X/month or ₹X/event — for one-time hosts planning a single wedding or birthday
- Professional: ₹X/month — for event managers running multiple events per year
- Vendor plan: ₹X/month — Phase 2, when vendor collaboration launches

**Why it matters:** Without pricing, the BRD revenue model section and the PPT investor slide are incomplete. Every person who reads the documents will ask.

---

## Decision 3 — Event Magazine / Photo Book Product Name

**What needs to be decided:** What is the printed photo book product called within Evenzi?

Current placeholder in Brand Guidelines: **"Evenzi Memories"** (tentative, internal only).

**Discussion questions:**
- Does "Evenzi Memories" feel right?
- Should it be a sub-brand (e.g., "Memories by Evenzi") or just a feature name ("Photo Book")?
- Who handles fulfilment — which print partner in India? (Canvera, Picsbook, Zookal, or other?)

**Why it matters:** The product name appears in marketing copy, the BRD revenue section, and the PPT. Needs to be locked before external sharing.

---

## Decision 4 — WhatsApp Invitation Approach for MVP

**What needs to be decided:** Which WhatsApp integration method ships in MVP?

| Option | How it works | Pros | Cons |
|--------|-------------|------|------|
| **Deep Link** | Host clicks "Send" in Evenzi → WhatsApp opens with pre-filled message → Host presses send manually | Simple to build, no API approval needed, works immediately | Host must manually press send; no delivery tracking; can't automate reminders |
| **WhatsApp Business API** | Evenzi sends the message automatically on the host's behalf | Fully automated; delivery tracking; future reminders possible | Requires WhatsApp Business API approval (weeks); templates must be approved; adds cost |

**Recommendation to discuss:** Start with Deep Link for MVP (zero barrier, faster to ship). Migrate to Business API in Phase 2 when invitation volume justifies the setup cost.

**Why it matters:** The Digital Invitations feature overview and BRD describe the flow differently depending on which approach is chosen.

---

## Decision 5 — Vendor Plan Name

**What needs to be decided:** What is the professional vendor account type called?

When the vendor collaboration feature launches (Phase 2), vendors will have a separate account type with higher capacity and different features.

**Options to discuss:**
- "Vendor Plan"
- "Professional Plan"
- "Manager Plan"
- "Studio Plan" (if targeting event management companies)

**Why it matters:** The name appears in the BRD, product roadmap, user types document, and eventually the pricing page.

---

## How to Use This Document

1. Schedule a team discussion covering all 5 decisions
2. Fill in the answers directly in this document
3. Once decisions are made, the following docs need minor updates:
   - `docs/foundation/brd.md` — pricing tiers, freemium walls
   - `docs/foundation/product-roadmap.md` — vendor plan name
   - `docs/foundation/user-types-scope.md` — pricing per user type
   - `docs/marketing/product-positioning.md` — pricing copy
   - `docs/presentations/evenzi-ppt-script.docx` — Slide 8 and Slide 13 placeholders
   - `docs/features/overviews/digital-invitations-overview.md` — WhatsApp approach

4. After decisions are locked → document suite is ready to share with the full team.

---

*Created: 2026-04-16 | Owner: Abhijith | Status: Pending discussion*
