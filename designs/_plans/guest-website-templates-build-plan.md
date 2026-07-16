# Guest Website Templates — Build Plan (design-first → React)

> **Goal.** Ship **5 guest-facing event-website templates** (the scrollable `/e/<slug>` site a guest opens from WhatsApp) — wedding-flavoured for MVP, mobile-first + first-class desktop. Approach: **design in pure HTML/CSS/JS first** (in `designs/`, the established Evenzi prototype path), get each template fitting our needs, **then convert to React/Next.js** at `app/e/[slug]/`. (The Lovable-build template is already React — it takes a port-and-refine path instead of HTML-first.)
>
> **Owner:** Abhijith · **Started:** 2026-07-14 · **Status:** Phase 0 done · Phase 1 design lock DONE (lineup below) · Phase 2 build next

---

## 0. Template lineup (locked 2026-07-14)

Five distinct wedding moods, each mined from one source. We take the source's layout/type/motion feel and apply our own wedding palette (mine + rebuild — not a copy).

| # | Mood | Source | Palette lane | Path | Notes |
|---|---|---|---|---|---|
| 1 | **Bold Festive** | **Lovable build** | maroon + gold | already React → port + refine | Also the Phase-4 React blueprint (section components + `themes.ts` + `weddingData`). Add missing Venue & Wedding Party; verify unlock gate. |
| 2 | **Midnight Elegant** | Azurio | dark + metallic | HTML-first → React | Strip WebGL/3D; rebuild from visual ref |
| 3 | **Classic Editorial** | Mivon | ivory/champagne + serif | HTML-first → React | Editorial magazine layout; readable CSS |
| 4 | **Minimal Modern** | Xfolio | clean off-white + 1 accent | HTML-first → React | Cleanest base; true one-page demos |
| 5 | **Blush Romantic** | Cunnet | soft pink + cream | HTML-first → React | Cunnet's layout, our soft-pink palette |
>
> **Related:** [`digital-presence-plan.md`](digital-presence-plan.md) · [`event-website-template-sourcing.md`](event-website-template-sourcing.md) · [`../_prompts/guest-site-bold-festive-kerala.lovable.md`](../_prompts/guest-site-bold-festive-kerala.lovable.md) · [`event-website-gaps.md`](../../docs/data-model/event-website-gaps.md) (G1–G11) · ClickUp Feature `86d2jwzge` (Digital Presence) / component "Digital Presence: Event Templates" (P0)

---

## 1. Strategy (locked with founder 2026-07-14)

**Design-first, then convert.** Build the templates as pure HTML/CSS/JS prototypes in `designs/` (fitting our wedding structure + brand), get them approved, *then* port to React/Next.js in one clean rebuild — rather than fighting a jQuery→React conversion and a redesign at once. This matches how the whole Evenzi `designs/` → `app/` pipeline already works (see PORT-MAP.md).

**Three refinements:**
1. **"Repurpose" = mine + rebuild, not edit-in-place.** The theme sources are HTTrack site-mirrors (rewritten URLs, cache junk, heavy agency JS). We lift the *visual system* (type, palette, layout, motion feel) and rebuild the wedding structure cleanly on `designs/shared/shell.css`, not untangle the mirror DOM. Lift-vs-rebuild confirmed per theme in Phase 1.
2. **Strip the heavy JS.** ScrollSmoother, WebGL/Three.js, image-trails, custom cursors, preloaders — gut them. A WhatsApp-opened mobile invite can't carry that weight. Keep only light scroll-reveal.
3. **The Lovable build is the React-conversion blueprint.** Its section-component split + `themes.ts` token registry + `weddingData` are the structural model for the final React port (Phase 4) — reused, not discarded.

## 2. Assets in hand (Phase 0 inventory)

All extracted to the **gitignored** `sandbox/templates-intake/` (≈380 MB; never enters app git). Not clean ThemeForest packages — **HTTrack mirrors** (visual reference; licensing unresolved, see §6).

### 2a. The 4 theme mirrors

| Theme | Source domain | Category | Stack (to strip on rebuild) | Core CSS to mine | Mineability |
|---|---|---|---|---|---|
| **Mivon** (4.zip) | uithemez.com | Creative agency one-pager | jQuery + GSAP ScrollSmoother + Bootstrap 5 + Swiper | `.../assets/css/style.css` (188K, readable) | ✅ Good — readable CSS |
| **Azurio** (5.zip) | mixdesign.dev | Dark creative studio/portfolio | Static + WebGL 3D (glass hero) | `.../css/main.min.css` (396K, minified) | ⚠️ Harder — minified + WebGL |
| **Xfolio** (6.zip) | wowtheme7.com | Personal CV/résumé portfolio | jQuery + GSAP SplitText/Smoother + Bootstrap | `.../assets/css/main.css` (132K) + `responsive.css` | ✅ Best — readable + true one-page demos (`index-*-one-page.html`) |
| **Cunnet** (7.zip) | html.aqlova.com | Creative portfolio agency (light+dark, incl. shop) | jQuery + Bootstrap + Three.js + custom cursor | `.../assets/css/main.css` (432K) | ⚠️ Large CSS; has light+dark |

All four are **agency/portfolio/résumé** category — none are wedding templates. Repurposing means keeping the look and rebuilding the wedding section spine (see §4 sourcing-doc analysis for the full feasibility read).

### 2b. The Lovable build ("Kerala Wedding Joy") — the React blueprint

A **well-structured** React project (740 KB extracted) — matches the recommended architecture:
- `src/components/wedding/` — **Hero, Countdown, AnnouncementBanner, StorySection, ScheduleSection, Gallery, QASection, RSVPSection, FooterSection** + helpers (Reveal, SectionDivider, SectionTitle, Eyebrow, StickyRsvpCta)
- `src/data/themes.ts` (theme-token registry) + `weddingData.ts` (content)
- **3 theme variants** already: routes `emerald`, `sapphire`, `teal`
- Stack: **Tailwind v4 + shadcn/ui + framer-motion + TanStack Start + Bun** (not Next.js)
- **Gaps to fix on port:** no **Venue & Travel** and no **Wedding Party** section; **unlock-gate** component not present — verify. Content is the Kerala Brindo & Sreelekshmy demo from the prompt.

## 3. Phased plan

| Phase | What | Owner | Gate |
|---|---|---|---|
| **0 · Intake** ✅ | gitignored sandbox → extract 5 zips → inventory (this doc) | Claude | done |
| **1 · Design lock** | Section spine (10, incl. the 2 the Lovable build missed) · map 4 themes → 4 distinct wedding looks · shared HTML skeleton (one section structure, a CSS token-set per template, on `shell.css`) · lift-vs-rebuild call per theme | Claude → **founder sign-off** | ← next |
| **2 · First build** | Either (a) **Lovable → Next.js port** (lands the React architecture + `app/e/[slug]` skeleton + section contracts early, since it already exists — add Venue & Wedding Party, verify unlock gate) — recommended to front-load the blueprint; or (b) first **HTML template** (Xfolio → Minimal Modern, easiest base) to prove the design-first flow | **Cursor** builds · Antigravity QA · Claude review | founder review |
| **3 · Remaining 4 HTML templates** | Repurpose each theme → wedding guest-site in `designs/pages/website/guest-site/<template>/`: mobile+desktop, our 10 sections, mock unlock/RSVP, heavy JS stripped, reuse shell primitives. One at a time. | **Cursor** · Antigravity · Claude | per-template review |
| **4 · Convert HTML → React/Next** | Port approved HTML templates into `app/e/[slug]/` using the Lovable component architecture as blueprint (one section skeleton, 5 token-sets); swap TanStack→Next App Router; reconcile Tailwind | **Cursor** · Claude review | — |
| **5 · Host picker + QA + licensing** | Design-tab template picker (**gated on G5 `event_website_design` data-model slice** for persistence) · cross-device/perf QA on real phones · **licensing verified before shipping any theme-derived asset** | Antigravity · Claude | licensing gate |

## 4. Editor split

- **Claude (me):** Phase 0 inventory, Phase 1 design architecture + spec, all code review, stack/routing reconciliation, licensing check, and **writing every Cursor/Antigravity handoff prompt**.
- **Cursor:** Phase 2 + 3 HTML repurpose (bulk) · Phase 4 React port · the 2 missing sections.
- **Antigravity:** Phase 3 + 5 automated testing (responsive, a11y, visual regression, cross-template, real-device).
- **Founder (Abhijith):** file-moving/extraction, design taste calls, licensing decision, running Cursor/Antigravity with Claude's handoffs.

## 5. Phase 1 — design lock (RESOLVED 2026-07-14)

1. **Theme → wedding-mood mapping** — locked; see §0 lineup. 5 distinct moods (Bold Festive / Midnight Elegant / Classic Editorial / Minimal Modern / Blush Romantic). Lovable = 5th template + React blueprint; Mivon nudged to "Classic Editorial" (ivory/serif) so Cunnet owns the blush lane.
2. **Section spine — the 10 (all templates):** Hero(+Countdown) · Announcement · Story · Schedule/Itinerary · Venue & Travel · Wedding Party · Gallery · Q&A · RSVP · Footer. Same spine every template; they differ by look, not sections.
3. **Shared skeleton mechanism** — one HTML section structure + a **CSS custom-property token-set per template** (pure-CSS mirror of the Lovable `themes.ts` idea), all on `shell.css`; templates differ by tokens/layout-variant, not forked markup.
4. **Lift-vs-rebuild per theme** — Xfolio/Mivon (readable CSS) lift more; Azurio/Cunnet (minified/WebGL) rebuild-from-visual-ref.
5. **`designs/` home** — one dir per template under `designs/pages/website/guest-site/<template>/`, sharing a common skeleton + per-template token CSS.

### Open (Phase 2 kickoff): which template builds first — the Lovable→Next port (front-loads the React blueprint) or the easiest HTML template (Xfolio → Minimal Modern)?

## 6. Licensing gate (unresolved — blocks shipping, not designing)

Sources are **HTTrack mirrors, not purchased packages** (founder: "no clean purchased, all mirrors"). ThemeForest **Regular License = one item per single end product**; Evenzi spins up many customer sites in a SaaS → likely needs Extended, and even that restricts SaaS/multi-user redistribution. **Before shipping any theme-derived CSS/markup**, resolve licensing per theme (purchase + read terms, or ensure the shipped code is an original rebuild sufficiently transformed from the reference). Designing/prototyping from the reference is fine; shipping derived assets is the gated step.
