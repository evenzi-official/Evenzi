# Evenzi Architecture Specs

This folder is the source of truth for cross-cutting architecture decisions and feature-portfolio analysis. All decisions captured here override anything older in `docs/foundation/` or feature specs.

## Reading order

| # | Doc | Purpose |
|---|-----|---------|
| 00 | [Feature map](./00-feature-map.md) | The full feature inventory — 16 product features + 4 infrastructure concerns. Source for all sprint planning. |
| 00b | [Platform user flow (snowflake)](./00b-platform-flow.md) | Whole-platform user journey across every feature. Evenzi at the center; features branch out. Personas, decision points, sad paths, module preview. |
| 01 | [Feature gap matrix](./01-feature-gap-matrix.md) | Per-feature × per-phase status grid. Where each feature stands on Planning, UI, Data, Backend, FE, Integration, Testing, Deployment. |
| 02 | [Dependency graph](./02-dependency-graph.md) | Who-blocks-whom across features. Build order. Parallel work windows. |
| 03 | [Image storage](./03-image-storage.md) | How Evenzi handles user images (cover photos, gallery, profile, invitations). Provider, CDN, cost model. |
| 04 | [Subscription & billing](./04-subscription-billing.md) | Pricing tiers, feature gates, billing provider, usage limits. Even if pricing-specifics aren't locked, the platform supports it. |
| 05 | [Modular architecture](./05-modular-architecture.md) | Star-schema model — each feature ships as an independent module that talks to a thin Evenzi core. Boundaries, contracts, deployment. |
| 06 | [Scalability](./06-scalability.md) | Current Next.js + Supabase capacity, bottlenecks, growth plan. |
| 07 | [MVP scope (locked)](./07-mvp-scope-locked.md) | Final cut of what ships in MVP, soft deadline, sprint allocation. Generated last after gaps + architecture are understood. |

## Architectural principles (apply to every decision in this folder)

1. **Cost-conscious, not cost-blocked** — Every infrastructure choice should default to free tiers. Pay only when free tier is genuinely exceeded or a feature can't ship without paid capacity. Do not optimise prematurely; do not pay for "convenience" if a 10-minute setup avoids the bill.
2. **Provider portability** — Don't hard-code provider URLs or SDKs into feature code. Wrap in modules (`@evenzi/storage`, `@evenzi/billing`, etc.) so providers can be swapped without rewriting features.
3. **Privacy by default** — Private buckets, signed URLs, RLS on every table, EXIF stripping on uploads. Public access is opt-in per asset, never default.
4. **Modular shipping** — Features ship as independent modules talking to a thin core. See [05-modular-architecture.md](./05-modular-architecture.md).
5. **Document the why, not just the what** — Every architecture decision in this folder includes the alternatives considered and why they were rejected.

## Scope

These docs deliberately don't cover:
- Implementation detail (lives in feature specs at `docs/superpowers/specs/`)
- Tactical bug fixes (lives in ClickUp Bugs list)
- Marketing / brand decisions (lives in `docs/marketing/`)
- ClickUp PM convention (lives in `docs/clickup/`)

## How architecture decisions feed back into ClickUp

Each cross-cutting concern (image storage, subscription, modular, scalability) gets ONE implementation task in the **Ops** list — not a full feature hierarchy. The decision lives in this folder; the implementation task tracks "did we ship the architecture."

## Update cadence

Edit these docs whenever a foundational decision changes (new provider, new module, scope cut). Stale architecture docs are worse than no architecture docs — keep them current.
