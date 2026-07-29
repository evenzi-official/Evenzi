# Cursor Build-Doc — Guest Wedding Website · Template #1 "Midnight Elegant" (IMMERSIVE FLAGSHIP)

> **Paste this whole file into Cursor.** Self-contained — the receiving tool has no access to the planning chat.

---

## 1. Routing header

- **Tool:** Cursor · **Mode:** auto (this is animation-heavy — if the free model struggles with the Three.js/GSAP wiring, escalate).
- **Rules to obey:** `.cursor/rules/evenzi-design.mdc` — **no inline CSS/JS**, mobile-first, reuse-before-create, keep `designs/components.html` current, **vendor runtime deps locally** (no CDN — runtime-dependency-resilience rule; the repo already vendors Tailwind for this reason).
- **Pure design work:** static HTML/CSS/JS in `designs/`. **No backend, no React, no bundler.** Preview with `npm run design` (:4000).

## 2. Objective & context

Build the **flagship, first** of five guest wedding-website templates — the public scrollable site a guest opens from WhatsApp at `/e/<slug>`. This one, **"Midnight Elegant,"** sets the **immersive bar** every other template will match.

- Program plan: [`designs/_plans/guest-website-templates-build-plan.md`](../../../../_plans/guest-website-templates-build-plan.md) — read §Creative mandate.
- **Creative mandate (critical):** the guest site is Evenzi's **primary marketing surface** — 1000+ guests per event see it, and its beauty converts them into users. Audience is **premium / high-end devices**. **Go maximally beautiful and immersive** — scroll cinematics, camera-flight feel, WebGL, rich motion. This is NOT a lightweight utility. Do **"heavy done well"**: a hero that paints fast on first tap, richness revealed progressively on scroll, `prefers-reduced-motion` fallback, tuned to run smoothly on high-end phones (esp. iOS Safari WebGL).
- **Design-first HTML now → React later.** Build clean, structured, well-commented HTML/CSS/JS that ports to React/Next.js in Phase 4.

**Source to mine:** the "Midnight Elegant" look is distilled from the **Azurio** theme (extracted at `sandbox/templates-intake/azurio/mixdesign.dev/themeforest/azurio/`). Mine its **dark-luxe aesthetic, WebGL hero energy, bold type, and cinematic scroll feel** — do NOT copy its markup (minified) or its agency content. We rebuild the wedding structure fresh with our own stack.

## 3. Research / already decided

- **Section spine (10, in order), same for all templates:** Hero (+countdown) · Announcement · Our Story · Schedule/Itinerary · Venue & Travel · Wedding Party · Gallery · Q&A · RSVP · Footer.
- **All demo content is already written** — couple **Brindo Sylen & Sreelekshmy M**, Kerala Hindu–Christian interfaith wedding, Kochi, 26 Jan 2027. **Use it verbatim** from [`designs/_prompts/guest-site-bold-festive-kerala.lovable.md`](../../../../_prompts/guest-site-bold-festive-kerala.lovable.md) — §CONTENT (story, 6 sub-events with real Kochi venues, wedding party, Q&A, RSVP copy) and §PHOTO DIRECTION (Unsplash per-slot terms). Reuse the **content + photo slots**, not the bold-festive palette.
- **Standalone guest site** — its own chrome; do NOT import the host app's floating-nav/breadcrumb/dashboard. Reuse only low-level shell infra where helpful (`window.evenzi.openModal/closeModal` for modals; vendored fonts). Everything else bespoke.

## 4. Dev spec

### 4a. Animation stack (vendor locally under `designs/shared/vendor/` or the template dir)

- **GSAP** + **ScrollTrigger** + **ScrollSmoother** + **SplitText** (all free now) — scroll-driven reveals, pinned scenes, text splits.
- **Lenis** — smooth scroll (drives the whole page; sync with ScrollTrigger).
- **Three.js** — the WebGL hero + ambient particle moments.
- Download these into the repo (no CDN). Reduced-motion: if `prefers-reduced-motion: reduce`, disable Lenis + heavy GSAP + Three.js and fall back to instant/simple reveals.

### 4b. Visual system — "Midnight Elegant" (dark luxe)

Deep, cinematic, formal — an evening-reception, candlelit-palace feel.

```
--me-bg:      #0B0E14;  /* near-black midnight base */
--me-bg-2:    #121724;  /* raised panel */
--me-ink:     #F4EFE6;  /* warm ivory text */
--me-muted:   #A9A398;  /* secondary */
--me-gold:    #C9A24B;  /* primary accent — warm gold */
--me-gold-2:  #E7C878;  /* gold highlight/gradient */
--me-line:    rgba(201,162,75,.22); /* hairline gold */
--me-glow:    radial-gradient(...);  /* cand+light glow behind hero */
```
Gold-on-midnight. Metallic gold gradients on headings/CTAs. Generous negative space. Type: a **display serif** for the couple's names + big headings (e.g. Cormorant Garamond / Playfair — vendored), a clean sans for body (Inter/Sora). Fine letter-spaced gold eyebrows.

### 4c. Immersive treatment (this is the point — be ambitious)

- **Lenis smooth scroll** across the whole page; all reveals driven by ScrollTrigger synced to Lenis.
- **Hero = a Three.js WebGL scene.** A slow, elegant, wedding-appropriate 3D moment — e.g. drifting golden light particles / floating diya flames / a subtle volumetric glow with slowly rotating bokeh, over midnight. (Reference Azurio's glass-form hero for *energy*, but keep it tasteful and wedding-luxe, not tech-y.) The couple's names do a **SplitText** char reveal on load. Hero paints a poster-frame instantly, then the WebGL layers in (progressive).
- **Scroll cinematics:** as the guest scrolls, sections **pin + reveal** — parallax on imagery, gold hairlines drawing in, countdown tiles flipping, the story unfolding as a scroll-scrubbed sequence. Aim for the "continuous flight" feel (the scroll-world engine at `~/.claude/skills/scroll-world/references/` is a good structural reference for the scroll-scrub camera pattern — do NOT call its paid Higgsfield gen; hand-build the equivalent with GSAP/Three).
- **Ambient WebGL accents** between sections (subtle particle fields) — cheap on desktop, reduced/disabled on low-power/reduced-motion.
- **Gallery** = an immersive scroll-through (horizontal pin or 3D-tilt grid), lightbox on tap.

### 4d. Two-tier gate + sections

- Public **Hero** (WebGL) → **"Unlock Guest Details"** → cinematic unlock (mock, no auth; any submit/skip reveals) → private sections. Persist unlocked in `localStorage`.
- Sticky RSVP CTA once unlocked (mobile); inline/top CTA on desktop.
- Section layouts (content from the prompt file): Hero(+countdown) · Announcement ribbon · Our Story (scroll-scrubbed, two-col desktop) · Schedule (6 sub-event cards, pinned reveal) · Venue & Travel (map placeholder + travel + 3 hotels) · Wedding Party (Bride's/Groom's) · Gallery (immersive) · Q&A (accordion) · RSVP (per-event Yes/No + stepper + submit → success) · Footer (download-card CTA + "Made with Evenzi").

### 4e. Performance discipline ("heavy done well")

- Hero poster-frame paints first; WebGL + heavy JS load after (progressive). Lazy-load below-fold imagery.
- Cap Three.js on mobile (lower particle counts / DPR clamp / simpler shader); pause WebGL when tab hidden and when off-screen.
- Respect `prefers-reduced-motion` (disable Lenis/WebGL/parallax → clean static-ish fallback that still looks elegant).
- Target smooth 60fps on a recent iPhone; no layout jank, no horizontal scroll.

### 4f. Files (no inline CSS/JS)

`designs/pages/website/guest-site/midnight-elegant/`:
- `index.html`
- `midnight-elegant.css` — `--me-*` token block + structure + section CSS
- `midnight-elegant.js` — Lenis init, GSAP/ScrollTrigger timelines, Three.js hero, countdown, unlock mock, gallery lightbox, RSVP mock, reduced-motion guard
- Vendored libs under `designs/shared/vendor/` (gsap, ScrollTrigger, ScrollSmoother, SplitText, lenis, three).

## 5. Testing
- Countdown → 26 Jan 2027, no break at 0. Unlock gate mock reveals + persists (localStorage). Gallery lightbox (Esc/scrim/button, focus return). RSVP toggles + stepper clamp 0–2 + submit success. No console errors, no network calls.
- WebGL renders on desktop + high-end mobile; reduced-motion path disables it cleanly.

## 6. Visual testing
- Midnight + gold luxe; display-serif names; cinematic hero. Screenshot mobile (390) + desktop (1440); capture a mid-scroll immersive moment.

## 7. UI/UX testing
- ≥44px touch targets; keyboard (Tab/Enter/Esc); no dead links; reduced-motion respected; text legible over WebGL (scrims where needed).

## 8. Responsiveness testing
- 360 / 390 / 414 · 768 · 1024 / 1280 / 1440. No horizontal scroll; desktop uses full immersive layouts; mobile immersive but perf-capped. Centered ~1100–1200px max on large screens.

## 9. Data testing
- N/A — mocks only (unlock/countdown/RSVP client-side).

## 10. Definition of done
- [ ] `index.html` + `midnight-elegant.css` + `midnight-elegant.js`; **no inline CSS/JS**; libs vendored (no CDN).
- [ ] All 10 sections, verbatim Kerala content + Unsplash slots from the prompt file.
- [ ] Midnight+gold system via `--me-*` tokens; display-serif names; zero Azurio agency leftovers.
- [ ] Immersive: Lenis smooth scroll + GSAP scroll cinematics + Three.js WebGL hero + ambient accents; unlock/countdown/gallery/RSVP working.
- [ ] "Heavy done well": fast hero poster-frame + progressive load + mobile WebGL caps + `prefers-reduced-motion` fallback; 60fps on a recent phone; no jank/horizontal scroll.
- [ ] Structure vs `--me-*` token blocks separated (skeleton reusable by later templates).
- [ ] New shared primitives → `designs/components.html`.
- [ ] Hand back for Claude review + Antigravity responsive/a11y/perf pass before "done."
