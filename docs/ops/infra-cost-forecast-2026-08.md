# Infra Inventory & Aug-End V0 Launch Cost Forecast

> **Owner:** Abhijith · **Date:** 2026-07-29 · **Purpose:** Full inventory of every infra/service Evenzi runs, sized against Aug-end V0 launch scale, to answer "what does the Cloudflare $10k/12mo credit actually need to cover, and what else costs money at launch?"
>
> **Launch scale assumption (founder-confirmed 2026-07-29):** small pilot — **5–10 events/month**, ~500–1,500 guests/month total. Numbers below use **8 events/mo, ~1,000 guests/mo** as the working midpoint, with a low/high band.
>
> **Currency:** all figures shown as USD (₹INR) using **₹95.5/USD** — the same conversion rate already used in the project's [`wedding-media-cost-forecaster.html`](../media/wedding-media-cost-forecaster.html) tool, kept consistent here. INR figures are rounded to the nearest ₹10–100 for readability.

---

## 1. Full service inventory

| # | Service | Purpose | Current tier | Usage-based? | Credit/free runway | Est. monthly cost at pilot scale |
|---|---|---|---|---|---|---|
| 1 | **Vercel** (Team `evenzi`) | Next.js app hosting | Hobby (free) | Yes, above free caps | None applied | **$0–40 (₹0–3,820)** — see §2.1 |
| 2 | **Supabase** (`smjkbmkxweevqpvygabe`) | Postgres DB + Auth | Free tier | Yes, above free caps | None applied | **$0 (₹0)** — see §2.2 |
| 3 | **Cloudflare R2 + Stream** | Photo/video storage & delivery (Media & Memories) | Pay-as-you-go | Yes | **$10k/12mo (₹9.55L)** (Startups Tier 3, submitted 2026-06-13, awaiting approval) | **$5–30 (₹480–2,870)** — see §2.3 |
| 4 | **Resend** | Transactional email | Free (3k/mo, 100/day) | Yes, above free caps | None applied | **$0 (₹0)** — see §2.4 |
| 5 | **Twilio** | Phone OTP SMS (+91 host auth) | Pay-as-you-go | Yes | Evergreen credits discontinued; ~$15 (₹1,430) signup credit only | **$5–20 (₹480–1,910)** — see §2.5 |
| 6 | **Anthropic / OpenAI / Google Gemini / Groq** | LLM routing (dev tooling today; chatbot P1 planned, not yet shipped) | Free tiers / pay-as-you-go | Yes | Anthropic $1–5k (₹0.96L–4.78L) submitted 2026-06-13, awaiting grant | **$0 production (₹0)** — see §2.6 |
| 7 | **ClickUp** | Team PM (task intake/pipeline) | Existing paid plan | No (seat-based) | N/A | Unchanged — not launch-scale-sensitive |
| 8 | **Domain + business email** (`evenzii.com`, `abhijith.pramod@evenzii.com`) | Domain registration + mailbox | Existing | No | N/A | **~$1–12 (₹95–1,150)** — renewal + mailbox amortized |
| 9 | **GitHub** | Source control + Pages (design prototypes) | Free | No | N/A | **$0 (₹0)** |
| 10 | **Figma / Stitch** | Design tooling | Existing plans | No | N/A | Unchanged — not launch-scale-sensitive |

**Bottom line: total new/variable infra burn at pilot scale ≈ $10–100/month (₹960–9,550/mo)**, driven almost entirely by whether Vercel needs to move off Hobby. Everything usage-based (Cloudflare, Supabase, Resend) stays inside free tiers or single-digit dollars at 5–10 events/month — the $10k (₹9.55L) Cloudflare credit is not a near-term constraint at this scale (see §2.3).

---

## 2. Per-service detail

### 2.1 Vercel — the one line that actually moves

Hobby tier is **free but ToS-restricted to non-commercial use** (100GB transfer, 1M edge requests/mo — both comfortably enough for pilot traffic). Evenzi is a commercial SaaS (free-tier product, but a for-profit company), which is the actual trigger for Pro, not traffic volume.

- **If we stay on Hobby through the pilot:** $0/mo (₹0), but carries ToS risk (Vercel can require an upgrade or restrict the account once it's clearly a commercial deployment).
- **If we move to Pro at launch:** $20/mo (₹1,910) per seat. Team `evenzi` has 2 members (Abhijith + Dheeraj) → **$20–40/mo (₹1,910–3,820)**.

**Recommendation:** budget for Pro (~$20–40/mo, ₹1,910–3,820) starting launch week — the ToS exposure isn't worth the amount saved, and Pro also removes the "non-commercial" ambiguity before any press/marketing push (competitor-study outreach, WhatsApp virality) sends a traffic spike.

### 2.2 Supabase — comfortably free at this scale

Free tier: 500MB DB, 1GB storage, 50k MAU, 5GB egress. At 8 events/mo × ~125 guests avg:
- **MAU:** hosts + guests who create accounts — nowhere near 50k.
- **DB size:** events/guests/tasks/budget rows are small text/numeric data (media bytes live in R2, not Postgres) — 500MB holds tens of thousands of event-rows worth of data.
- **Egress:** API traffic at this scale is low single-digit GB/mo.

**Watch-out (already flagged in `startup-credits-tracker.md`):** free-tier projects **auto-pause after 7 days idle**. Irrelevant once real traffic is flowing daily, but relevant if there's a launch delay after setup. **Recommendation:** stay on free tier through the pilot; move to Pro ($25/mo, ₹2,390 — removes auto-pause, adds backups) at the point real users depend on uptime, likely launch day itself rather than pre-launch.

### 2.3 Cloudflare R2 + Stream — the credit comfortably covers pilot + beyond

Using the rates already validated in [`media-storage-platform-analysis.md`](../media/media-storage-platform-analysis.md): R2 storage $0.015/GB (₹1.43/GB, free egress), Stream $5/1k min stored (₹480/1k min) + $1/1k min delivered (₹95.5/1k min).

Rough pilot-scale load (8 events/mo, ~125 guests/event):
- **Photos:** ~300 optimized photos/event × ~3MB avg ≈ 0.9GB/event → ~7.2GB/mo new storage → **storage cost ~$0.11/mo (₹10.50)**, growing linearly (~$1.30/mo, ₹124 by month 12 if nothing is ever deleted).
- **Video:** ~15 min raw footage/event stored + moderate guest viewing (assume ~150 total view-minutes/event across guests) → storage **~$0.001/event**, delivery **~$0.15/mo (₹14)** at 8 events.
- **Total Cloudflare spend at pilot scale: well under $5/mo (₹480)**, realistically **$5–30/mo (₹480–2,870)** once you add Workers/Image Transform usage and buffer for higher-than-modeled video viewing.

Against a **$10k/12-month credit (₹9.55L; ~$833/mo, ₹79,600/mo budget)**, pilot-scale usage burns **under 4% of the monthly allowance**. The credit is not a launch blocker — it's runway for the *growth* phase (10x–50x this pilot volume), not the pilot itself. **Open item unchanged from before:** the Startups application is still awaiting approval (submitted 2026-06-13) — confirm approval status before assuming the credit is live; until approved, R2 bills to the card at the same negligible pilot-scale rates above.

### 2.4 Resend — free tier holds

3,000 emails/mo free, capped at 100/day. At pilot scale (password resets, notifications, maybe digest emails), volume is likely 200–500/mo — comfortably under the monthly cap. **Watch-out:** the **100/day** cap (not just 3k/mo) could bite if a marketing push or bulk notification clusters sends into one day. **Recommendation:** no action now; upgrade to Pro ($20/mo, ₹1,910 → 50k/mo, no daily cap concern) only if a specific campaign needs a same-day burst.

### 2.5 Twilio — the one genuine unknown, needs a live-rate check

OTP SMS for host phone auth (+91). Evergreen startup credits are discontinued — this is pay-as-you-go from day one, and **India SMS via Twilio requires DLT (Distributed Ledger Technology) template registration**, which affects both cost and setup lead time.

Pilot estimate: ~100–300 signups/mo × 1–2 OTP attempts ≈ 200–600 SMS/mo. **I don't have a current confirmed India-route SMS rate** (varies by DLT template + carrier route, roughly $0.006–0.03/SMS historically, i.e. ~₹0.57–2.87/SMS, but this needs a live Twilio console check, not an assumption) → ballpark **$5–20/mo (₹480–1,910)**, but this is the one line in this forecast I'd flag as **verify before budgeting**, not compute-and-trust. **Action item:** pull the actual India SMS rate from the Twilio console (or Twilio pricing page) and confirm DLT registration is complete before launch — a stalled DLT template blocks OTP entirely, which is a bigger risk than the rupee cost.

### 2.6 LLM providers — $0 production cost at V0

The multi-LLM stack (Anthropic/OpenAI/Gemini/Groq/Ollama) currently serves **dev tooling only** — the Agent Runner is parked (per CLAUDE.md), and the customer-facing **Support Chatbot is planned (P1, unblocked) but not yet built**. No production LLM calls ship with V0. This line goes from $0 to non-trivial the moment the chatbot ships — **flag for a follow-up forecast pass when that feature moves from "planned" to "in progress."** The pending Anthropic startup credit ($1–5k, submitted 2026-06-13) would offset dev-tooling usage once granted, not production traffic.

---

## 3. Summary — what this means for the Aug-end launch plan

| Question | Answer |
|---|---|
| Is infra cost a launch blocker? | **No.** Total new variable spend at pilot scale is **~$10–100/month (₹960–9,550/mo)**, dominated by the Vercel Hobby→Pro decision, not by usage. |
| Does the $10k (₹9.55L) Cloudflare credit matter for V0? | Not as a constraint — pilot-scale media usage burns under 4% of the monthly credit allowance. It matters for the **growth phase after V0 proves out**, not the pilot itself. |
| What's the one real open item? | **Twilio India SMS rate + DLT registration status** — needs a live check, not an estimate, before launch. |
| What should ship in the launch plan doc? | This table (§1) + the Vercel Pro recommendation (§2.1) + the Twilio action item (§2.5) as a pre-launch checklist line. |

**Not covered here (deliberately out of scope):** growth-phase forecasting (10x–50x pilot volume) — revisit once the pilot has real usage data to extrapolate from, rather than modeling further hypotheticals now.
