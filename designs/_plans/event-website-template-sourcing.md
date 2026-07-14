# Event Website (Digital Presence) — Template Sourcing Strategy & Theme Analysis

> **Purpose.** Records how we're deciding to source the pre-built **guest-facing event website templates** (the scrollable `/e/<slug>` site a guest opens from WhatsApp). Captures the two candidate paths under evaluation — (A) purchase premium HTML themes and convert, (B) AI scratch-build via Lovable — plus a hands-on analysis of the 4 ThemeForest themes Abhijith shortlisted.
>
> **Owner:** Abhijith · **Opened:** 2026-07-14 · **Status:** OPEN (decision deferred — "we can see from there")
>
> **Related:** [`digital-presence-plan.md`](digital-presence-plan.md) · [`event-website-gaps.md`](../../docs/data-model/event-website-gaps.md) · [`guest-site-bold-festive-kerala.lovable.md`](../_prompts/guest-site-bold-festive-kerala.lovable.md) · ClickUp Feature `86d2jwzge` (Digital Presence) / component "Digital Presence: Event Templates" (P0)

---

## 1. The goal

Ship **3–4 pre-built, visually distinct website templates** for the guest-facing event site, so a host can pick a theme and get a polished public wedding/event website with minimal setup. Eventually one set per event type; for MVP only **wedding** is enabled (`config.event_types.enabled = true` for wedding only), so the first templates are wedding-flavoured.

The real scrollable guest site (`/e/<slug>`) **has never been built** — only host-side preview/detail pages exist (`designs/pages/website/templates/*.html`). See gap **G9**. This doc is about *how we source the actual template builds*.

## 2. The two candidate paths

| Path | What it is | Founder's current read |
|---|---|---|
| **A. Purchase premium HTML themes → convert** | Buy polished ThemeForest themes, download the code, use them as the visual/scratch base, and convert into our stack as needed. | **Leaning toward this.** Founder is not worried about stack conversion — "we'll convert into whatever we need." |
| **B. Lovable AI scratch-build → port** | Author a detailed prompt, let Lovable generate a React/Tailwind site, then port to `app/e/[slug]/`. A complete one-shot prompt is already written (see `guest-site-bold-festive-kerala.lovable.md`). | "A good option, but what Lovable creates is **not exactly matching** what we want." Also: no appetite to hand-scratch-code up from a Lovable base. |

**Decision status:** OPEN. The Lovable prompt is written and usable, but the founder isn't satisfied that Lovable's output matches the intended look, and prefers not to scratch-code. Purchasing + converting premium themes is the current lean, pending this analysis.

## 3. Shortlisted ThemeForest themes — hands-on analysis (2026-07-14)

Walked all four live in-browser (desktop render + section structure + network/stack inspection).

| Theme | Demo URL | Category | Stack (observed) | Visual |
|---|---|---|---|---|
| **Mivon** | `uithemez.com/i/mivon_html/onepage-creative-agency.html` | Creative **agency** one-pager | jQuery 3.6 + GSAP ScrollSmoother/ScrollTrigger + Bootstrap 5 + Swiper + Magnific-popup + image-trail | Dark, heavy scroll animation, portfolio/works/team/blog |
| **Azurio** | `mixdesign.dev/themeforest/azurio/index-design-studio.html` | Dark creative **studio / portfolio** | Static HTML, bundled `libs.min.js`/`app.min.js`, **WebGL 3D** (glass-blob hero) | Premium, 3D hero, day/night toggle, big bold type |
| **Xfolio** | `wowtheme7.com/tf/xfolio/index-one-page.html` | Personal **CV / résumé** portfolio | jQuery 3.7 + GSAP SplitText/ScrollSmoother + Bootstrap + Swiper + vanilla-tilt | Dark, red accent, "I'm Subrata", 3D floaties |
| **Cunnet** | `html.aqlova.com/cunnet-demo/cunnet/index-digital-light.html` | Creative **portfolio agency** | jQuery + Bootstrap + **Three.js** + split-type + custom cursor + Swiper | Light, bold typographic ("We Build Bold"), red accent |

### Observations

- **All four are agency / portfolio / résumé templates — none are wedding or event templates.** Their information architecture (services · works/portfolio · team · résumé · pricing · process · blog) has almost **no overlap** with a wedding invite's sections (hero · countdown · story · schedule/sub-events · venue & travel · RSVP · gallery · Q&A). Using them means keeping the *visual system + motion* and rebuilding the wedding sections — i.e. they're a **look-and-motion reference, not a structural head-start.**
- **Stack:** all are **jQuery + Bootstrap + GSAP / Three.js static HTML**. None are React. (Evenzi is Next.js 14 + React 18 + Tailwind.) *Per founder, converting this is acceptable and not a blocker.*
- **Weight:** all are animation-heavy (ScrollSmoother, WebGL, custom cursors, preloaders, 10+ plugins). The in-app browser **timed out twice** just rendering Mivon and Xfolio. Relevant because the guest site is **opened on phones over WhatsApp**, often mid/low-end devices on mobile data — heavy animation risks janky scroll + slow first paint on exactly those devices.
- **Orientation:** all are **desktop-first showcases**; our guest site is mobile-first (≈90% phone traffic). Different design intent, though all are responsive.
- **Range:** the four are stylistically *similar* (bold modern agency; three dark, one light). For 4 genuinely distinct *wedding* moods (e.g. classic-romance / garden-soft / minimal / festive) they don't map cleanly — they read as one vibe.

## 4. ⚠️ Licensing — must resolve before purchase

ThemeForest **Regular License = one item per single end product.** Evenzi generates **many** guest websites (one per customer event) from the same template inside a SaaS. That is very likely **outside the Regular License** — probably requires an **Extended License**, and even Extended restricts SaaS / multi-end-user redistribution. Baking a purchased theme's CSS/JS into a product that customers use may violate ThemeForest terms.

**Action:** read the exact license terms for each theme (and consider contacting the author / Envato support) **before buying**, specifically for the "template reused across many customer-generated sites in a SaaS" case. This is a live risk, not a resolved one.

## 5. Feasibility verdict

| Use the themes as… | Feasibility | Why |
|---|---|---|
| **Design + motion inspiration** | ✅ High | They're beautiful — good source for hero type scale, scroll-reveal timing, gallery grids, section transitions |
| **Direct scratch base to build 4 wedding templates on** | ⚠️ Mixed | Wrong category (agency, not wedding) and desktop-first/heavy for mobile are the real frictions. Stack (jQuery→React) conversion is a cost the founder has accepted. Licensing is unresolved. |

## 6. Current position & next steps

- **Founder lean:** buy premium themes and convert into our stack; not satisfied Lovable matches the intended look; no appetite to scratch-code up from an AI base.
- **Not discarded:** the Lovable prompt (`guest-site-bold-festive-kerala.lovable.md`) stays on the shelf as a ready fallback / reference.
- **Open before committing to Path A:**
  1. Resolve the **licensing** question (§4) — gating.
  2. Accept that these 4 are **agency-structured** — budget the rework to convert each into the wedding section spine (hero · countdown · story · schedule · venue & travel · wedding party · gallery · Q&A · RSVP · footer).
  3. Note the **range gap** — 4 similar agency vibes ≠ 4 distinct wedding moods; may want to reshortlist for variety.
  4. Validate **mobile performance** of the chosen theme(s) on a real mid-range phone before standardising on their motion stack.

_Decision to be revisited next session._
