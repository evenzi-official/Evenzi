# Evenzi Chatbot — Model & Hosting Analysis (NVIDIA / open models / RAG / action-agent)

**Date:** 2026-06-22
**Type:** Analysis / feasibility (NOT an implementation spec)
**Author:** Brainstormed with Claude Code (Abhijith)
**Status:** For review — feeds a decision on whether/how to revise the approved chatbot design
**Scope note:** §1–§8 = the NVIDIA/open-model/RAG analysis. §9.6 = a full web landscape sweep (Cloudflare, free-inference, in-house, RAG frameworks, startup credits) that **revises the §8 provider picks** — read §9.6.7 for the final recommended architecture.
**Relates to:**
- `docs/superpowers/specs/2026-04-14-chatbot-design.md` (approved design — RAG, Gemini+Groq, ₹0)
- `docs/superpowers/plans/2026-04-14-chatbot-implementation.md` (implementation plan)
- `docs/features/chatbot-overview.md` (team overview)
- ClickUp feature `86d2n3jxv` (30 subtasks)

---

## 1. Why this analysis exists

The Support Chatbot already has an **approved design** (2026-04-14): a RAG-grounded FAQ bot using Google Gemini's free tier (primary) → Groq's free tier (fallback) → keyword search (degraded), at **₹0/month**. Phase 0 is DONE; implementation is unblocked.

This session revisits two questions raised by the founder:

1. **"A chatbot trained on Evenzi data"** — what does "trained" actually mean here, and is the approved approach right?
2. **"NVIDIA has open models — can we use them?"** — should the model provider change, and does self-hosting open models make sense?

A third capability also surfaced and is in scope for this analysis:

3. **"Take it a step ahead — use the model to *do things* in the platform."** — an **action-taking agent**, not just a Q&A bot.

This document is **analysis only**. It does not write code, change the approved spec, or alter ClickUp. Its output is a recommendation the team can accept, reject, or modify.

---

## 2. Decompose: this is two subsystems, not one

| # | Subsystem | What it does | Status |
|---|---|---|---|
| **A** | **Knowledge bot** | Answers user questions from Evenzi's help content. Read-only. | ~90% specced (2026-04-14). This analysis only revisits *model + hosting + embeddings*. |
| **B** | **Action agent** | Performs platform operations on the user's behalf via tool-calling (e.g. "change my event date" → calls `PATCH /api/events/[id]`). | New. Deferred to Phase 2 in the existing spec. Analyzed here at feasibility level. |

These have **different data-sensitivity, different security models, and different hosting economics**, so they get different recommendations. Blurring them is the main planning risk.

---

## 3. "Trained on Evenzi data" — RAG, not fine-tuning

Two very different things hide behind the word "trained":

| | **Fine-tuning / training** | **RAG / grounding** (recommended) |
|---|---|---|
| How knowledge gets in | Adjust the model's weights on Evenzi text | Fetch relevant Evenzi docs at question-time, hand them to a frozen model to answer *from* |
| Updating a fact | Re-train (slow, costly) | Edit a row in the DB (instant) |
| Infra | GPUs for training | None beyond inference |
| Failure mode | Confidently hallucinates facts | Says "not in my docs" and escalates |
| Who maintains it | ML engineer | Anyone, via `/admin/faq` |

**Verdict: RAG, unchanged from the approved spec.** The founder's own description — "documents the model is hooked up to, users prompt, get answers" — *is* RAG. Fine-tuning is the wrong tool for an FAQ bot: support answers must be accurate and editable without a deploy, which is exactly what RAG gives and fine-tuning fights. Fine-tuning is only worth revisiting much later to tune *tone/format*, never to teach *facts*.

This decision is independent of which model or host we pick.

---

## 4. The hosting decision space — three tiers

Running an LLM is a choice among three tiers. The earlier framing (NVIDIA-hosted-vs-self-host) missed the pragmatic middle, which HuggingFace and aggregators occupy.

| Tier | What it is | Examples | Open models? | Cost at low volume | Ops burden | Data stays in-house? |
|---|---|---|---|---|---|---|
| **1. Serverless third-party** | Call someone else's always-on API, pay per token (or free tier) | Gemini/Groq free tiers (current plan), **OpenRouter**, **HF Inference Providers**, Together, Fireworks | ✅ incl. NVIDIA Nemotron, Llama | ~₹0 to single-digit $/mo | None | ❌ transits provider |
| **2. Managed dedicated** | Your own model endpoint on a rented GPU, scale-to-zero | **HF Inference Endpoints** | ✅ any open model | Hourly GPU (pauses when idle) | Low | ⚠️ isolated, but on provider infra |
| **3. Fully self-hosted** | Open weights on a GPU you control | vLLM / NVIDIA NIM | ✅ | Always-on GPU bill | High | ✅ fully |

**Key insight:** Tier 1 buys you *open models + near-zero cost + zero-ops* — the same privacy posture as the current Gemini/Groq plan, just with open weights available. **Only Tier 3 gives true data-in-house, and it's the only tier with a real recurring cost at low traffic.**

---

## 5. NVIDIA-specific findings (verified mid-2026)

### 5.1 NVIDIA's *hosted* endpoint (build.nvidia.com) is prototyping-only
- The **credit system was retired (Sept 2025)**; it's now rate-limited (~40 RPM, unofficial) and explicitly **for prototyping/dev/eval only**.
- **Production use requires an NVIDIA AI Enterprise (NVAIE) license** (~$4,500/GPU/yr, or ~$1/GPU/hr in cloud). NVIDIA does **not** sell direct credit-card per-token hosted inference.
- It *is* OpenAI-compatible (works with the Vercel AI SDK).
- **Implication:** great for free prototyping/evaluation of Nemotron; **cannot be the production ₹0 path** the way Gemini/Groq free tiers can.

### 5.2 NVIDIA Inception gives no guaranteed free compute
- Inception's confirmed value = **preferred GPU pricing (discount), free DLI training credits, technical support, VC intros, co-marketing**. The widely-quoted "$100K free credits" figures are third-party and partly conflate AWS Activate.
- Eligibility requires being **legally incorporated** (<10 yrs old, ≥1 developer, working website). **Evenzi is pre-incorporation** (in progress with CA), so Inception is not accessible yet *and* wouldn't hand us free GPUs even when it is.
- **Implication:** do not plan around "free NVIDIA credits." Treat Inception as a future discount + support channel, not a compute grant.

### 5.3 The legally-free self-host path: open weights on vLLM (skip NIM)
- NVIDIA's **NIM** containers are the turnkey option but need **NVAIE for production**.
- The Nemotron open weights can instead run on **vLLM (Apache 2.0)** or HF TGI directly — **no NVAIE license required**, OpenAI-compatible out of the box. Your only obligations are the model's open-weight license.
- **Implication:** if/when we self-host, vLLM + open Nemotron weights is the cost-correct route; NIM is a convenience we'd pay for, not a requirement.

### 5.4 The models are genuinely good and self-hostable
| Model | Size | Fits | Good for |
|---|---|---|---|
| **Llama-3.1-Nemotron-Nano-4B** | 4B | single <24GB GPU | leanest FAQ bot |
| **NVIDIA-Nemotron-Nano-2 (9B)** | 9B | single 24GB GPU (L4/A10G) | **sweet spot** — RAG + native tool-calling + 128K context; NVIDIA's own reference RAG agent uses it |
| **Llama-3.3-Nemotron-Super-49B** | 49B | 1×80GB / 2×GPU | higher-quality agentic reasoning |
| **Nemotron 3 Super (120B-A12B MoE)** | 120B/12.7B active | multi-GPU | top-tier agentic, tool-calls |

All are open-weight (NVIDIA Open Model License; Llama-derived ones add the Llama Community License). The 9B Nano-2 is the natural target for both the knowledge bot and the action-agent if we ever self-host.

### 5.5 Embeddings — and a forced decision
- The approved spec uses Google **`text-embedding-004` (768-dim)** with pgvector. **That model is now deprecated** by Google (→ `gemini-embedding-001`). So the embedding choice must be revisited *regardless of the chat-model decision*.
- NVIDIA's **`llama-3.2-nv-embedqa-1b-v2`** is Matryoshka — it can emit **768-dim to match the existing pgvector column**, available both hosted and self-hosted, 26 languages.
- A **reranker NIM** (`llama-3.2-nv-rerankqa-1b-v2`) exists and NVIDIA's benchmarks claim ~30% fewer wrong answers. Optional Phase-2 quality lever.
- **Embedding lock-in caveat:** switching embedding models requires **re-embedding the entire FAQ corpus** (different semantic space), even at the same dimension. At ~25 articles this is cheap — but it's a real migration step, so pick the embedding model deliberately and don't churn it.

---

## 6. Serverless open-model hosts (the practical middle)

Verified mid-2026. For a low-traffic bot (~300 calls/day, ~1.5K in + 0.5K out tokens):

| Provider | Hosts Nemotron? | Free tier | ~8B price (/1M tok) | Est. $/mo at our volume | OpenAI-compat | Data stance |
|---|---|---|---|---|---|---|
| **Groq** (in stack) | ❌ (Llama/Qwen/GPT-OSS) | 30 RPM, **14,400 req/day** | $0.05 / $0.08 | **~$1 (or ₹0 on free tier)** | ✅ | no training; ZDR option |
| **OpenRouter** | ✅ **broadest** (Super, Ultra, Nano) | `:free` variants (20 RPM) | $0.02 / $0.03 | **~$0.40** | ✅ | default no-logging; ZDR |
| **HF Inference Providers** | ⚠️ only Nemotron-Nano-8B | $0.10/mo free; $2/mo on PRO | pass-through | low single-$ | ✅ | HF doesn't store, but downstream provider governs |
| **Together** | ⚠️ Ultra serverless; 70B dedicated-only | none ($5 min) | ~$0.18 blended | ~$3.25 | ✅ | retains by default; ZDR opt-out |
| **Fireworks** | ⚠️ catalog-listed, dedicated-only | $1 credits | ~$0.20 blended | ~$3.60 | ✅ | zero-retention default |
| **HF Inference Endpoints** (Tier 2) | ✅ self-deploy | none | hourly: T4 $0.50/hr … H100 $10/hr | depends on idle time | n/a | no payloads stored; SOC2 |

**Takeaways:**
- For **₹0 + Llama**: Groq's free tier already covers our volume (it's in the stack today).
- For **cheapest + access to NVIDIA Nemotron without self-hosting**: **OpenRouter** (~$0.40/mo, broadest Nemotron serverless coverage, drop-in OpenAI-compatible).
- **Privacy caveat for aggregators:** HF Inference Providers and OpenRouter route to a *downstream* provider whose policy ultimately governs the inference. Fine for a public FAQ bot; **not** the path for guest PII or the action-agent.

---

## 6.5 Domain / shared-host providers (Hostinger et al.) — what's leverageable

Evenzi's domain sits with a provider (Hostinger in the example) that markets VPS, "cloud hosting," Node.js hosting, self-hosted n8n, and one-click "AI agent" products. Verified mid-2026: **none of this changes the model-hosting decision, because these providers have no GPU.**

| Offering | Verdict | Why |
|---|---|---|
| **Business email** (e.g. `support@evenzi.com`, ~$1–2/mo per inbox) | ✅ **Use it** | The chatbot escalation flow needs a support inbox. Cheap, concrete. |
| **Domain / DNS** | ✅ Minor | Subdomains (`help.`, `chat.`) if wanted. |
| **CPU VPS** (Hostinger KVM, up to 8 vCPU / 32GB, ~$26/mo — **AMD EPYC, no GPU**) | 🟡 Non-GPU bits only | Could host n8n / cron / webhook receivers / a small CPU embedding model. **Not** the LLM. App is already on Vercel + Supabase, so need is limited. |
| **Self-host the LLM on VPS (1-click Ollama)** | ❌ | Technically supported, but CPU-only inference of a 9B model = low single-digit tokens/sec. Unusable for interactive chat; does **not** deliver data-in-house in any practical sense. |
| **"Managed AI Agents" / OpenClaw / "Agents"** | ❌ Trap | These route to external clouds (Claude/Gemini/GPT) via prepaid **nexos.ai** credits — i.e. **Tier-1 serverless with a markup**, and data still leaves. Calling Groq/OpenRouter directly is cheaper and simpler. |
| **Self-hosted n8n** | 🟡 Later | Bring-your-own-LLM workflow engine. Possible orchestration backbone for the **action agent**, but the model still comes from an API or a GPU host elsewhere. |

**Conclusion:** A domain/shared-host provider is good for the **support email inbox** (which the spec needs) and, optionally, a cheap always-on CPU box for automation/orchestration. It is **not** a model-hosting option. The LLM decision stays exactly as in §4–§6: Tier-1 serverless (Groq/OpenRouter) now, Tier-3 GPU self-host only when the action agent justifies it — and that GPU will come from a GPU cloud (Lambda/RunPod/etc.), not a domain host.

## 7. The trifecta, resolved

The founder wanted all of: **free credits · data-in-house · best open models.** Verified reality:

- **Free NVIDIA credits** — not a thing (credits retired; Inception ≠ compute grant; we're pre-incorporation). ❌
- **Best open models** — yes, and reachable *without* self-hosting via OpenRouter/HF. ✅
- **Data-in-house** — only via Tier-3 self-host, which costs ~$300–550/mo for an always-on small GPU. ✅ but $$$

**The resolution is to split by subsystem:**

- The **knowledge bot** answers from *public help content*. Its data sensitivity is low, so paying for true data-in-house buys almost nothing. → **Use cheap/free serverless open models (Tier 1).** Cost ≈ ₹0–$1/mo.
- The **action agent** touches *real user/event data and performs writes*. Here data-in-house and model control matter. → **Self-host Nemotron on vLLM (Tier 3) becomes justified** — and by the time we build it, incorporation + a small GPU budget likely exist.

This dissolves the apparent conflict: we don't need to pick one binding constraint, because the two subsystems have opposite needs.

---

## 8. Recommendation (phased)

### Phase 1 — Knowledge bot (implement the existing spec, with 3 small revisions)
Keep the approved RAG architecture, `/help` page, `/admin/faq`, escalation, rate limits, degradation — all unchanged. Revise only:

1. **Chat model/provider:** keep **Groq free tier** as the zero-cost default (already wired via `@ai-sdk/groq`). Optionally add **OpenRouter** as a second provider to unlock **NVIDIA Nemotron** answers for ~$0.40/mo and richer fallback. Both are OpenAI-compatible — fits the existing fallback-chain design.
2. **Embeddings:** the spec's `text-embedding-004` is deprecated — **must change anyway.** Pick one deliberately (`gemini-embedding-001`, or NVIDIA `llama-3.2-nv-embedqa-1b-v2` at 768-dim to keep the pgvector column). Lock it; re-embedding later is a migration.
3. **NVIDIA hosted endpoint** = free **prototyping/eval** tool only, never the production path.

Net: still ~₹0–$1/mo, zero-ops, and we get to *evaluate* Nemotron quality cheaply before committing to anything heavier.

### Phase 2 — Action agent (new spec required)
When we build "do things in the platform":
- **Model:** self-host **Nemotron Nano-2 (9B)** on **vLLM** (single 24GB GPU, native tool-calling, no NVAIE license) — *if* data-in-house is required at that point; otherwise OpenRouter-hosted Nemotron with a strict data policy.
- **The model is the easy part.** The hard part is security (see §9). The Phase-2 spec must lead with the security model, not the model choice.
- **Trigger to self-host:** incorporation done (Inception discount available) **and** the agent handling real PII/writes **and** measurable volume. Until all three, stay serverless.

### What NOT to do
- ❌ Don't fine-tune a model on Evenzi data.
- ❌ Don't plan around "free NVIDIA Inception credits."
- ❌ Don't stand up an always-on GPU for a read-only public FAQ bot.
- ❌ Don't route guest PII or write-actions through an aggregator (OpenRouter/HF Providers) whose downstream provider governs the data.

---

## 9. Action-agent feasibility (the real hard part)

Tool-calling is well-supported (Nemotron Nano-2, Llama models all do it). The risk is **not capability — it's safety**. A model that can call `PATCH /api/events/[id]` or `DELETE` is a new, powerful attack surface. The future Phase-2 spec must answer:

| Concern | Requirement |
|---|---|
| **Auth** | The agent acts *as the logged-in user* — every tool call goes through the same RLS/ownership checks as the UI. No service-role shortcuts. |
| **Action whitelist** | Only an explicit, small set of safe tools is exposed (e.g. update event date, add sub-event). Destructive ops (delete event, billing) excluded or double-gated. |
| **Human confirm before write** | The agent *proposes* an action; the user confirms in the UI before any mutation commits. No silent writes. |
| **Prompt injection** | User text (and any retrieved content) can try to hijack tool calls. Tools must validate args server-side with Zod; the model's tool choice is never trusted blindly. |
| **Audit** | Every agent-initiated action logged with conversation + user + before/after. |
| **Scope creep** | Start with 2–3 read-mostly actions; expand only after the safety model is proven. |

This is a meaningful spec in its own right and should not be bolted onto the knowledge-bot work.

---

## 9.6 Wide landscape sweep (2026-06-22) — findings that revise §8

A full web sweep (5 parallel research agents, each adversarially verified) across Cloudflare's AI stack, the broader free-inference landscape, private/in-house options, RAG frameworks, and startup-credit programs surfaced findings that **refine the §8 recommendation**. The phasing and the build-not-fine-tune verdict stand; the *provider choice* changes.

### 9.6.1 Cloudflare is the strongest knowledge-bot path (and we already use it)
Evenzi already uses **R2** and has **applied for Cloudflare for Startups** credits. Cloudflare offers the whole RAG stack, and it beats the original Gemini/Groq plan:

| Piece | Cloudflare offering | Verified facts |
|---|---|---|
| **LLM generation** | **Workers AI** | **10,000 Neurons/day free** (both Free & Paid plans); beyond = $0.011/1k Neurons. OpenAI-compatible (`/ai/v1/...`), SSE streaming, ~300 req/min. Catalog incl. Llama 3.1/3.3/4, Mistral, Qwen, **Nemotron-3-120B**, Gemma, DeepSeek. |
| **Cost-control layer** | **AI Gateway** | **Free** caching (exact-match) + rate-limiting + observability + automatic retries + provider fallback + **spend limits** (GA 2026-06-05). Sits in front of *any* provider via base-URL swap. |
| **Embeddings** | Workers AI `bge-*` | `bge-base-en-v1.5` = **768-dim** (matches existing pgvector column); also 384/1024 options. Hosted + OpenAI-compatible `/v1/embeddings`. |
| **Vectors** | (skip Vectorize) | Vectorize free tier is **dimension-based and tiny** (~6,510 vectors @768-dim) + eventually-consistent writes. **Keep Supabase pgvector** — already in place, co-located with event data. |
| **Credits** | Cloudflare for Startups | Current ceiling **$350k**; Tier 3 = **$10k** (no min funding). Covers Workers AI (sub-cap reportedly $50k), R2, Vectorize. ~48h review. |

**Data policy (the decisive part):** Cloudflare states verbatim it **does not train on or retain** Workers AI inputs/outputs (no consent given), and doesn't expose your content to other customers. Inputs persist only if you write them to storage. Compliance: SOC 2 Type II, ISO 27001, GDPR-aligned. Callable from the Vercel-hosted Next.js app over plain REST (no Worker required).

### 9.6.2 Correction to the approved spec: the planned *primary* model leaks data
**Google Gemini's *free* tier uses your inputs to train/improve products AND has human reviewers, with no opt-out on the free tier** (Google API terms, eff. 2026-03-23; escape = pay/Vertex). The approved 2026-04-14 spec uses **Gemini free tier as the primary chat model** — for a bot ingesting user-typed questions (potential PII), that is the **worst data policy** of the ten providers surveyed. This should change regardless of the NVIDIA question.

By contrast, **Cloudflare Workers AI and Cerebras** publish explicit **no-retention / no-train** policies and are free at our volume.

### 9.6.3 Free-inference shortlist (verified, for a ~300-calls/day bot)
| Provider | Free tier | Production-allowed? | Data policy | Verdict |
|---|---|---|---|---|
| **Cloudflare Workers AI** | 10k Neurons/day | Yes | **No-train/no-retain** | **Best free + private** |
| **Cerebras** | 5 RPM, 1M tok/day | Yes (on `gpt-oss-120b`) | **No-retain (explicit)** | Strong free fallback; ~8k ctx cap |
| **DeepInfra** | pay-per-token (~$0.35/mo) | Yes | No-train | Best cheap paid fallback |
| Groq (in stack) | 14,400 req/day | Yes | No-train; ZDR toggle | Fine fallback (no Nemotron) |
| Gemini free | high RPD | Prototype-grade | **Trains on inputs, human review, no opt-out** | ❌ Avoid for user-question ingestion |
| SambaNova / GitHub Models / Cohere trial | 20–150/day or 1k/mo | Mostly prototype-only | mixed | ❌ Too small for 300/day |

### 9.6.4 "Data-in-house" for the action-agent is achievable WITHOUT buying a GPU
- **Cost reality:** at Evenzi's volume (~12M tok/mo), a dedicated GPU never pays off — breakeven is **~15–100M tok/mo**, plus ~10–20 hr/mo of self-host ops (worth $750–3,000/mo in eng time). Below breakeven, pay-per-token / serverless wins decisively.
- **The privacy bar has cheaper rungs than self-hosting:**
  - **Cloudflare Workers AI** — no-train/no-retain, data on Cloudflare (not a downstream reseller). Satisfies "not used/retained outside" at ₹0.
  - **Self-serve ZDR** (no sales call): **Groq** (console toggle), **Fireworks** (default on open models), **Together** (toggle).
  - **Hyperscaler-in-tenant:** **AWS Bedrock / Azure** keep data in *your own* cloud account/region, no-train by default.
  - **Serverless GPU scale-to-zero** (if a specific open model is required): **Modal** ($30/mo free credit, strong no-train + SOC 2) or **Beam** ($30/mo) — pennies for a bursty agent.
  - **Strict self-host** (literal on-prem, only if ever mandated): a single 24GB box ~$66–500/mo depending on trust tier (Vast.ai cheapest/least-trusted → RunPod Secure / Lambda first-party).
- **Supabase native:** pgvector is GA; **embeddings run free in Edge Functions** (`gte-small`, 384-dim, in-region Tokyo) with automatic-embedding background jobs. **LLM hosting on Supabase is invite-only/experimental** — not a generation option yet.

### 9.6.5 Build, don't adopt
A custom build on the **Vercel AI SDK + Supabase pgvector** is a **first-party-documented ~350-LOC path** (both Vercel and Supabase publish end-to-end RAG guides), adds **zero new infra**, and fits the already-approved custom design (widget + `/help` + `/admin/faq`). Adopting a platform (Dify, Flowise, RAGFlow, LibreChat, AnythingLLM) means a **second stateful system to host/patch/back-up** and theming friction to match the approved design — and **Dify's license forbids multi-tenant SaaS use** without a commercial license. Frameworks (LlamaIndex.TS / LangChain.js) are optional add-ons on top of the AI SDK, not replacements; the AI SDK alone is the lightest fit and already in-stack. **Recommendation: keep the custom build.**

### 9.6.6 Credits to action now (pre-incorporation)
- **Today, no entity needed (prototyping):** GitHub Models (free, no application), Mistral free experiment tier.
- **Use what's already applied for:** **Vercel AI Gateway** gives $5/mo free credits, **no per-token markup, BYOK** — route the **Anthropic startup credits** (already applied) through it; embeddings + fallback + observability included.
- **Lowest-barrier with a basic entity/site:** Microsoft Founders Hub (**90-day verification grace** — could start before the LLP signs), Google $2k MVP tier, AWS Activate Founders ($1k).
- Cloudflare for Startups (already applied) covers the Workers AI path above.

### 9.6.7 Revised recommended architecture
**Knowledge bot (now):**
`Supabase pgvector` (vectors, already have it) + embeddings via **Supabase `gte-small`** (free, in-region) *or* **Cloudflare `bge-base`** (768-dim) → retrieval → **Cloudflare Workers AI** generation (free 10k neurons/day, **no-train**) → behind **AI Gateway** (free cache + spend caps) → custom UI on the **Vercel AI SDK**. **Fallback:** Cerebras free / DeepInfra (~$0.35/mo). **Cost ≈ ₹0; privacy strictly better than the original Gemini-primary plan.**

**Action agent (later, separate security-first spec):** same Cloudflare no-train path (or self-serve ZDR / Modal scale-to-zero if a specific model is needed); **no GPU purchase** at this volume. The hard part remains the security model in §9, unchanged.

> This supersedes §8's provider picks (Groq-primary / OpenRouter-Nemotron / NVIDIA-prototype). The §8 phasing, the RAG-not-fine-tuning verdict (§3), and the action-agent security requirements (§9) all still hold.

---

## 10. What this analysis does NOT decide
- Exact embedding model (narrowed to: Supabase `gte-small` 384-dim vs Cloudflare `bge-base` 768-dim — pick at implementation; note `text-embedding-004` is deprecated and out).
- Whether to front the LLM with **Cloudflare AI Gateway** vs **Vercel AI Gateway** (both free-ish; pick by where caching/observability is most convenient — low-stakes, reversible).
- The full action-agent design (needs its own brainstorm → spec).
- Any change to the approved knowledge-bot UX, data model, or ClickUp tasks.

## 11. Suggested next steps
1. **Accept/modify this analysis.**
2. If accepted: make a **revision note** on the approved spec (`2026-04-14-chatbot-design.md` §4 LLM Strategy + §5 embeddings) capturing:
   - **Primary model → Cloudflare Workers AI** (no-train, free 10k neurons/day), behind an AI Gateway; Cerebras/DeepInfra as fallbacks. **Drop Gemini free tier as primary** (trains on free-tier inputs).
   - **Embeddings → Supabase `gte-small` or Cloudflare `bge-base` (768-dim)**; remove the deprecated `text-embedding-004`.
   - Vectors stay on **Supabase pgvector** (not Cloudflare Vectorize).
   This is a provider/config swap, not a re-architecture — the RAG design, UX, data model, and ClickUp tree (`86d2n3jxv`) are unchanged.
3. **Credits housekeeping:** route the applied-for **Anthropic** credits via **Vercel AI Gateway** (BYOK, no markup); confirm **Cloudflare for Startups** approval (covers Workers AI); optionally grab **GitHub Models / Mistral free** for prototyping now.
4. When ready for the agent: open a **separate brainstorm** → `2026-XX-XX-action-agent-design.md`, security-first; no GPU purchase at current volume.

---

## Appendix — confidence & caveats
- NVIDIA build.nvidia.com credits retired (verified via NVIDIA staff forum post, Sept 2025); production needs NVAIE.
- Inception benefits per official NVIDIA startup pages + VC-Alliance deck; no dollar amounts published anywhere official.
- Serverless prices are June-2026 list/spot and drift fast — re-confirm before committing.
- `text-embedding-004` deprecation per Google Gemini API docs.
- Nemotron sizes/licenses per Hugging Face model cards + NVIDIA developer blogs.
- Aggregator privacy (OpenRouter/HF Providers): the binding guarantee is the downstream provider's, not the aggregator's.

### Wide-sweep findings (§9.6) — confidence & caveats
- **Cloudflare Workers AI free tier (10k Neurons/day) + no-train policy:** HIGH — official `developers.cloudflare.com` data-usage + pricing pages. Per-model token rates and model catalog churn fast — re-verify the pricing/models pages before committing.
- **Cloudflare AI Gateway free caching/observability + Spend Limits (GA 2026-06-05):** HIGH — official docs. Caching is exact-match only (no semantic cache yet).
- **Vectorize free tier is dimension-based (~6,510 vectors @768-dim) + eventually-consistent writes:** HIGH — official limits page. Reason we keep Supabase pgvector.
- **Gemini *free* tier trains on inputs + human review, no opt-out:** HIGH — Google API terms eff. 2026-03-23. Paid/Vertex flips to no-train.
- **Cerebras explicit no-retention; free tier ~5 RPM/1M tok-day (recently tightened):** HIGH on policy; MEDIUM on exact current limits (official tables moved to in-console dashboards — verify live).
- **Self-host GPU breakeven ~15–100M tok/mo; below it pay-per-token wins:** MEDIUM — TCO blogs (SitePoint/tokenmix), directional.
- **Self-serve ZDR on Groq/Fireworks/Together; Bedrock/Azure no-train + in-tenant by default:** HIGH (Groq/Fireworks/Bedrock/Azure official); Together MEDIUM. **Anthropic/OpenAI ZDR are sales-gated, NOT self-serve** (corrected during verification).
- **Supabase: pgvector GA + free `gte-small` embeddings in Edge Functions (in-region Tokyo); hosted LLM invite-only/experimental:** HIGH — official docs (re-verify LLM GA status; Supabase ships fast).
- **Vercel AI Gateway: $5/mo free credits, no per-token markup, BYOK, embeddings + fallback:** HIGH — official docs (updated 2026-05-30).
- **Pre-incorporation credit access:** GitHub Models + Mistral free = no entity (HIGH). Microsoft Founders Hub 90-day verification grace (MEDIUM — confirm in portal). Google $2k MVP / AWS Activate Founders $1k need a basic entity+website (HIGH). OpenAI/Cohere effectively gated on VC/funding (MEDIUM-HIGH).
- **Build-vs-adopt:** custom Vercel AI SDK + pgvector is a first-party-documented path; Dify license forbids multi-tenant SaaS without a commercial license (HIGH — verbatim LICENSE). RAGFlow lacks pgvector (HIGH); Flowise/LibreChat/AnythingLLM/Dify support pgvector (HIGH).
- All §9.6 facts came from 5 parallel research agents (2026-06-22), each with an internal adversarial-verification pass; cross-agent conflicts (Anthropic ZDR self-serve, AnythingLLM pgvector, Nemotron-3 Super size) were resolved against primary sources.
