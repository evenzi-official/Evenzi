# Startup Free-Credits Landscape — Evenzi (June 2026)

> Research pass for infra planning. All amounts "verify on apply" — programs change. Relevance judged against Evenzi's stack (Supabase, Vercel, Cloudflare R2, Resend, Twilio, Claude/Gemini/Groq) and profile (very early-stage, India, likely unfunded, possibly pre-incorporation).

## Programs

| Program | What you get | Eligibility | How to apply | Relevance |
|---|---|---|---|---|
| **Cloudflare for Startups** ([link](https://www.cloudflare.com/startups/)) | Tier 3: **$10k credits** (R2 capped $10k, Workers AI capped $50k). Tier 2 $100k / Tier 1 $350k. Free unmetered CDN/DDoS/WAF/SSL/DNS regardless. | Tier 3: bootstrapped or <$1M raised, no min funding. Founded <10yrs, for-profit, live site + socials, **first-time applicant**, domain-matched email. | Self-serve, ~48h. Higher tiers need VC/accelerator. | **HIGH** — funds planned R2; $10k R2 cap = years of storage. |
| **Supabase free tier** ([pricing](https://supabase.com/pricing)) | 2 projects, 500MB DB, 5GB egress, 50k MAU auth, 1GB file storage, 500k edge-fn invocations. No startup credit program found. | Free. | Self-serve. | **HIGH** (current DB/Auth). Gotcha: idle projects pause after 7 days; **500MB DB** + **1GB storage** are the ceilings → push blobs to R2. |
| **Vercel for Startups** ([credits](https://vercel.com/startups/credits)) | up to **$30k** + 12mo Pro. Hobby free: 100GB transfer, 1M edge req, 1M fn/mo. | Series A or earlier, apply within 12mo of latest round. | VC/accelerator code preferred. | **HIGH** (free tier — hosts today). **MED** credits — needs a funding round. Hobby is non-commercial. |
| **AWS Activate** ([link](https://aws.amazon.com/startups/)) | Founders: **$1k**. Portfolio: up to **$100k** via provider. | Founders: unfunded, pre-Series B, no accelerator. Portfolio: needs Activate Provider org ID. | Founders self-serve; Portfolio via provider. | **MED** — not on AWS, but $1k free + S3 fallback option. |
| **Google for Startups Cloud** ([link](https://cloud.google.com/startup/benefits)) | up to **$350k** AI-first / $200k non-AI + Firebase credits. | Seed–Series A, <5yrs from incorporation, AI core. **Needs incorporation.** | Google Cloud apply; India accelerator route. | **MED-HIGH** — uses Gemini; big pool but incorporation-gated. |
| **Microsoft Founders Hub** ([link](https://www.microsoft.com/en-us/startups/)) | up to **$150k** Azure + GitHub Enterprise + Azure OpenAI. | **No funding/deck required**, solo OK. (US-leaning — verify India.) | Self-serve. | **MED** — not the stack, but big no-funding Azure pool. OpenAI only via Azure now. |
| **Anthropic Startup Program** ([link](https://www.anthropic.com/startups)) | up to **$25k** Claude credits (self-serve tier smaller), priority limits. +~$5 on signup. | Early-stage, traction signals, pre-Series B. Self-serve tiers no VC. Credits expire 12mo. | Self-serve Airtable, rolling. $25k+ via Anthology/Menlo. | **HIGH** — Claude is primary LLM, unfunded-OK. |
| **Twilio for Startups / AI Searchlight 2026** ([apply](http://twiliostartups.com/apply)) | **$5k** standard; AI Searchlight up to **$10k** one-time. SendGrid + Segment bundled. | Active Twilio/SendGrid account. | Self-serve. | **HIGH** — SMS/OTP provider; SendGrid could supplement Resend. |
| **Resend free tier** ([pricing](https://resend.com/pricing)) | **3,000 emails/mo, 100/day**, 1 domain, 1k contacts. Forever free. | Free. | Self-serve. | **HIGH** (current email). Gotcha: 100/day cap bites on mass invite-send. Pro $20/mo = 50k. |
| **Groq free tier** | All models, **no card**, ~30 RPM + per-model RPD/TPD caps. | Free. | Self-serve. | **MED** — fine for dev; limits too tight for prod scale. |
| **Google AI / Gemini free tier** | **No card**, ~1,500 RPD / 15 RPM / 1M TPM (model-dependent). | Free. | Self-serve. | **MED** — uses Gemini. Gotcha: free tier may train on inputs → **no guest PII**. |
| **NVIDIA Inception** ([link](https://www.nvidia.com/en-us/startups/)) | DLI credits, SDK, preferred pricing, partner cloud credits (up to $100k AWS / $150k Nebius). India-friendly. | **Incorporated**, <10yrs, ≥1 dev, working site. No funding required. | Self-serve, rolling. | **MED** — gateway to stacked cloud credits once incorporated. |
| **GitHub for Startups** | **$10k** / 12mo Enterprise. | Partner-affiliated + outside funding (≤Series B). | Via partner. | **LOW** — needs funding + partner. |
| **MongoDB for Startups** | **$3k** Atlas credits. | Early-stage. | Self-serve/partner. | **LOW** — Evenzi is Postgres. |
| **Stripe Atlas** | US incorporation ($500) → unlocks bundled perks. | Pay to incorporate (US C-corp). | Self-serve. | **LOW-MED** — only if incorporating in US. |

## Easy wins — apply now (no funding, self-serve)
- **Cloudflare Tier 3** ($10k, R2) · **Anthropic self-serve** (Claude) · **Twilio** ($5–10k) · **AWS Founders** ($1k) · **Microsoft Founders Hub** (Azure, verify India)
- Free tiers (no app): Supabase, Vercel Hobby, Resend, Groq, Gemini

## Needs incorporation / funding / accelerator
- Google for Startups Cloud ($350k, incorporation + AI-first) — India accelerator cohort is the friendly route
- Vercel credits (funding round window) · AWS Portfolio ($100k, provider) · GitHub (funding + partner) · NVIDIA Inception (incorporation, no funding) · Anthology Fund ($25k+, VC route)

## Gotchas
- **First-time-applicant / one-shot:** Cloudflare + GitHub — apply at the right tier, don't burn it.
- **Incorporation gate:** Google Cloud, NVIDIA, GitHub need a registered entity.
- **Credits expire:** Anthropic 12mo; most cloud 12–24mo — don't claim before you'll consume.
- **Free-tier traps:** Supabase pauses idle + 500MB DB cap; Vercel Hobby non-commercial, hard-stops; Resend 100/day; Gemini free trains on data (no PII).
- **Card often required** on cloud credit programs (overages bill to it). LLM/email free tiers don't.
- **OpenAI-via-Microsoft discontinued** — Azure OpenAI only.

## Recommendation for Evenzi (unfunded, pre/early-incorporation, India)
1. **Now:** Cloudflare Tier 3, Anthropic self-serve, Twilio, AWS Founders, Microsoft Founders Hub. Lean on free tiers.
2. **On incorporation:** add NVIDIA Inception + start Google for Startups (India accelerator).
3. **Hold:** Vercel/AWS Portfolio/GitHub until a funding round or accelerator affiliation.

**Architecture implication:** R2 for all blobs (photos, videos, invitation-card PNGs) — free tier 10GB + zero egress, $10k credit runway. Supabase for Postgres + Auth + metadata only (its 1GB storage / 500MB DB tier is the binding constraint).
