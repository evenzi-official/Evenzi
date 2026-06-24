# Evenzi — Startup Credits Tracker

> Live status of every infrastructure-credit application. Companion to the research doc `docs/startup-credits-2026.md`.
> **Last updated:** 2026-06-13

> **Session decision (2026-06-13):** Applied to the two high-value, time-sensitive ones now — **Cloudflare** (first-time-only, funds R2) + **Anthropic** (primary LLM). **Twilio / AWS / Microsoft deferred** until UAT/PROD usage begins, so credits aren't burned during pre-launch (they expire 12–24 mo). Google $350k + NVIDIA wait on incorporation.

## Shared application identity (reuse on every form)

| Field | Value |
|---|---|
| Company | Evenzi |
| Website | https://www.evenzii.com |
| Application email | abhijith.pramod@evenzii.com |
| Founder | Abhijith Pramod (Founder / Product Owner) |
| Team size | 2 (Abhijith Pramod + Dheeraj, Lead Engineer) |
| Founded | 2026 |
| Funding | Bootstrapped / pre-seed — $0 raised |
| For-profit | Yes (subscription SaaS, free tier) |
| Incorporation | In progress with CA |
| GitHub | https://github.com/evenzi-official |
| LinkedIn | https://www.linkedin.com/company/evenzi/ |
| Stack | Next.js · Supabase · Vercel · Cloudflare R2 (planned) · Claude/Gemini/Groq · Twilio · Resend · PWA |

---

## Apply-now shortlist (self-serve, no funding required)

| Program | Status | Applied | Credit | Expiry | Next action |
|---|---|---|---|---|---|
| **Cloudflare for Startups (Tier 3)** | ✅ **Submitted** | 2026-06-13 | $10k (R2 cap $10k · Workers AI cap $50k) + free CDN/WAF/SSL/DNS | 12–24 mo from approval | Await decision email (~48h) → on approval, start using R2 |
| **Anthropic Startup Program** (self-serve Standard) | ✅ **Submitted** | 2026-06-13 | $1k–$5k Claude credits (+~$5 signup) | **12 mo from grant** | Await decision (~2–4 wks) → console.anthropic.com + abhijith.pramod@evenzii.com. On grant, burn it on chatbot + AI-highlights dev |
| **Twilio** | ⚠️ No self-serve credits | — | ~$15 auto signup credit only · Searchlight comp $5–10k | — | Evergreen credit grant **discontinued** (official: "we do not offer additional credits to startups at this time"). Just create the account for OTP → auto credit. **Optional:** AI Searchlight 2026 competition (working AI demo required, deadline **2026-09-11**) — park until post-MVP |
| **AWS Activate Founders** | ⏸️ Deferred (by decision) | — | $1k + $350 dev support | 24 mo | **Apply once UAT/PROD usage begins** — low value off-stack, don't burn the 24-mo clock pre-launch. Draft ready. aws.amazon.com/activate, Founders tier |
| **Microsoft for Startups Founders Hub** | ⏸️ Deferred (by decision) | — | $1k → $5k after business verification (≤$150k is investor-network-gated) | 12 mo tranches | **Apply once UAT/PROD usage begins.** Draft ready; verify India eligibility on form |

---

## Free tiers — no application (already usable)

| Service | Free tier | Watch-out |
|---|---|---|
| Supabase | 500MB DB · 1GB storage · 50k MAU · 5GB egress | Idle projects pause after 7 days; **push blobs to R2** |
| Vercel Hobby | 100GB transfer · 1M edge req/mo | Non-commercial; hard-stops |
| Resend | 3,000 emails/mo · 100/day | 100/day cap bites on mass invite-send → Pro $20 = 50k |
| Groq | All models, no card, ~30 RPM | Limits too tight for prod scale |
| Google AI / Gemini | ~1,500 RPD, no card | Free tier may train on inputs → **no guest PII** |

---

## Incorporation-gated — apply AFTER the entity is registered

| Program | Credit | Unlocks |
|---|---|---|
| Google for Startups Cloud | up to $350k (AI-first) / $200k | Needs incorporation + AI-first; India accelerator route is the friendly path |
| NVIDIA Inception | DLI credits + stacked partner-cloud credits (up to $100k AWS / $150k Nebius) | Needs incorporation, no funding required |

---

## Gotchas (don't blow these)

- **First-time-applicant only:** Cloudflare ✅(used) + GitHub for Startups — apply at the right tier, no re-roll.
- **Credits expire:** Anthropic 12 mo; cloud 12–24 mo. Don't claim before you'll consume.
- **Domain-matched business email** required by Cloudflare/AWS/MS — use `abhijith.pramod@evenzii.com`, never gmail.
- **Card often required** on cloud programs (overage billing, not a charge).
- **Incorporation** unlocks the big pools (Google $350k, NVIDIA) — revisit once the CA filing completes.
