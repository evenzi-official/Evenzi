# Media Storage & Streaming — Platform Cost Analysis

> **Purpose.** Compares the candidate platforms for storing and delivering **wedding photo + video albums** (the Media & Memories module) under a realistic Indian-wedding workload. Captures the findings of the interactive cost forecaster shipped alongside this doc so the analysis is readable without running the tool.
>
> **Owner:** Abhijith · **Added:** 2026-07-20 · **Status:** Reference (directional planning, not quotes)
>
> **Interactive tool:** [`wedding-media-cost-forecaster.html`](wedding-media-cost-forecaster.html) — open in a browser; tune the workload sliders (weddings/month, photos, video minutes, viewers, quality, horizon) and see projected monthly cost per platform in USD or INR.
>
> **Related:** [`../R2-STORAGE-GUIDE.md`](../R2-STORAGE-GUIDE.md) (R2 foundation already built) · [`../data-model/DATA-MODEL.md`](../data-model/DATA-MODEL.md) §Media (`event_media`, `event_albums`, R2-backed) · [`../startup-credits-tracker.md`](../startup-credits-tracker.md) (Cloudflare for Startups R2 credits) · ClickUp Feature `86d2jwzdk` (Media & Memories)

---

## 1. The core thesis

For a photo+video wedding-album workload, platforms split into two camps with opposite cost curves:

- **Image-first optimizers** (Cloudinary, ImageKit) charge **premium per-GB rates** that make **video streaming expensive**. They shine on image optimization and (for ImageKit) India latency, but heavy viewing hurts.
- **Delivery-first infrastructure** (Bunny, Cloudflare) is **far cheaper** for the same workload — **until** viewers watch high-resolution video, where Bunny's per-GB delivery climbs while **Cloudflare's flat per-minute** Stream pricing stays roughly flat regardless of resolution.

**Practical implication:** the "right" platform depends on how much high-res video your guests actually watch. Light viewing → image-optimizers are tolerable; heavy/4K viewing → flat-per-minute infra (Cloudflare) is the hedge.

## 2. Feature & base-price matrix (2026 rates, directional)

| Platform | Entry / min | Storage | Delivery | Transcode + ABR | Image optimize | DRM | India edge | Next.js | Best for |
|---|---|---|---|---|---|---|---|---|---|
| **Cloudflare** (R2 + Stream + Image Transforms) — *cheapest infra* | ~$0 (free tier) | R2 $0.015/GB | R2 egress **FREE**; Stream $1/1k min | ✓ HLS/DASH | ✓ | ~ signed URLs | ✓ India PoPs | ~ loader + HLS | Lowest cost at high resolution (flat per-minute video). Assemble-it-yourself. |
| **Bunny.net** (Storage + Stream + Optimizer) — *value pick* | $1/mo min | $0.005–0.01/GB | $0.01/GB (NA/EU), $0.03/GB (Asia) | ✓ free H.264 1080p | ✓ Optimizer | ✓ MediaCage (paid) | ✓ Asia PoPs | ~ URL-based | Cheapest for mobile-res streaming. Per-GB, so cost rises with 4K. |
| **ImageKit** (India HQ · image + video) | Free · Lite $9 · Pro $89 | incl; +$0.09/GB | incl; +$0.45/GB | ✓ (VPU-priced) | ✓✓ core strength | ~ signed URLs | ✓✓ India HQ | ✓ official SDK | Great image optimization + India latency. Video gets pricey (VPU + $0.45/GB). |
| **Cloudinary** (full media pipeline) | Free 25cr · Plus ~$89 · Adv ~$249 | credits | credits (~$0.40/GB eq) | ✓ | ✓✓ | ~ | ✓ global | ✓ next-cloudinary | Most features, fastest to ship, most expensive for heavy viewing. |
| **Mux** (video specialist + R2 for photos) | pay-as-you-go | $0.003/min video; R2 $0.015/GB photos | $0.0008–0.0048/min by res | ✓✓ best-in-class | ✗ video only | ✓ Mux DRM | ✓ global | ✓✓ next-video | Premium video DX. Needs a separate image layer. |
| **Gumlet** (India/SG · image + video) | Free (100min/250GB) · tiered | plan minutes | plan bandwidth | ✓ up to 4K HDR | ✓ Gumlet Image | ✓✓ Widevine/FairPlay | ✓✓ India/SG | ~ API/embed | Strong DRM + India latency in one dashboard. Plan-capped, not pure usage. |
| **AWS** (S3 + CloudFront + MediaConvert) | pay-as-you-go | S3 $0.023/GB | CloudFront ~$0.085/GB | ✓ MediaConvert | ~ build w/ Lambda | ✓ | ✓ India edge | ✗ DIY | Maximum control, maximum ops overhead + egress bills. Overkill here. |

Legend: ✓✓ strong · ✓ yes · ~ partial/DIY · ✗ no.

## 3. Per-platform verdict (heavy-viewing wedding workload)

- **Cloudflare** — Flat per-minute video means cost barely moves with resolution — the hedge if guests watch 4K. You wire up storage, transcode and player yourself.
- **Bunny.net** — Cheapest in the model because video is billed per-GB at low CDN rates and transcoding is free. Push the quality up and this line climbs fastest.
- **ImageKit** — Bandwidth at $0.45/GB plus VPU video processing make streaming costly — but unmatched image optimization and India-native latency. Best if viewing is light.
- **Cloudinary** — Most features and the fastest build, but credits on storage + bandwidth + transforms make it the priciest for heavy viewing. (Credit mapping is approximate.)
- **Mux** — Best-in-class video pipeline and Next.js DX (`next-video`), but you pay a premium and still need R2 + transforms for photos.

## 4. Cost-model assumptions (so rankings are reproducible)

**Physical assumptions:**
- Stored video ≈ **20 MB/min** (ABR ladder).
- Delivered video = the quality slider (default **12 MB/min**, mobile-weighted).
- Each viewer pulls ≈ **85 MB** of images.
- Viewing is **front-loaded**: 60% of a wedding's views in month 1, 25% in month 2, the rest trickling over 10 months.

**Default workload (Indian-wedding baseline):** 10 new weddings/month · 5% monthly growth · 2,500 photos/wedding @ 8 MB · 120 min curated video/wedding · 250 unique viewers · 30 min watched/viewer · 24-month horizon.

**Key per-unit rates used (2026):** Cloudflare R2 `$0.015/GB` + free egress, Stream `$5/1k min stored / $1/1k min delivered`, Image Transforms `$0.50/1k (5k free)`. Bunny storage `$0.005–0.01/GB`, CDN `~$0.02/GB blended`, transcoding free. ImageKit Pro `$89` incl 225 GB bw + 225 GB storage; overage `$0.45/GB bw, $0.09/GB storage, $9/10k VPU`. Cloudinary modelled as credits at `~$0.40/credit`. Mux `$0.0075/min encode, $0.003/min store, ~$0.0025/min deliver`.

## 5. Why this matters for Evenzi

- The Media & Memories data model is already **R2-backed** (DB stores object keys, never bytes — see DATA-MODEL.md §Media), and the **Cloudflare R2 foundation is built + verified** (see R2-STORAGE-GUIDE.md), with **Cloudflare for Startups R2 credits** applied for (startup-credits-tracker.md). This analysis reinforces that direction: **Cloudflare (R2 + Stream) and Bunny are the cost leaders** for our delivery-heavy album workload, and image-optimizer platforms cost more once video viewing is significant.
- **Open question the model surfaces:** video streaming is the swing cost. If we expect guests to watch a lot of high-res video, Cloudflare Stream's flat per-minute pricing is the safer long-run bet; if viewing stays light and mobile-res, Bunny is cheapest. This should inform whether we build video on Cloudflare Stream vs. Bunny vs. Mux when the Media video path is implemented.

## 6. Caveats

**Treat rankings as directional, not quotes.** Cross-platform totals swing on the MB/min assumptions and (for Cloudinary) the credit mapping. The tool is for understanding **shape and order of magnitude** — always confirm against each provider's own calculator before committing. Rates are current as of 2026 and change frequently; the FX rate in the tool is editable and moves daily.
