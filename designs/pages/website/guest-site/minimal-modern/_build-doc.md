# Cursor Build-Doc — Guest Wedding Website · "Minimal Modern"

> ⚠️ **SUPERSEDED AS FIRST BUILD (2026-07-20).** Midnight Elegant (Azurio) now leads. Also: the "strip heavy JS / keep it light" framing below is **overridden by the immersive creative mandate** (see `designs/_plans/guest-website-templates-build-plan.md` §Creative mandate) — even "Minimal Modern" should be immersive-minimal (Apple-style scroll cinematics via GSAP + Lenis), not static. **Revise this doc before building this template.**

> **Paste this whole file into Cursor.** It is self-contained — the receiving tool has no access to the planning chat.

---

## 1. Routing header

- **Tool:** Cursor · **Mode:** auto (free NVIDIA model is fine for HTML/CSS/JS).
- **Rules to obey:** `.cursor/rules/evenzi-design.mdc` (Evenzi design-path rules) — mobile-first, **no inline CSS/JS**, reuse-before-create, keep `designs/components.html` current.
- **This is pure design work:** static HTML/CSS/JS in `designs/`. **No backend, no React, no build step.** Preview with `npm run design` (live-server on :4000).

## 2. Objective & context

Build the **first of five** guest-facing wedding-website templates for Evenzi's "Digital Presence" feature — the scrollable public site a guest opens from a WhatsApp link at `/e/<slug>`. This one is the **"Minimal Modern"** mood.

- Full program context: [`designs/_plans/guest-website-templates-build-plan.md`](../../../../_plans/guest-website-templates-build-plan.md) (5-template lineup, design-first→React strategy, editor split).
- These templates are **design-first HTML now, converted to React/Next.js later** — so build clean, well-structured HTML/CSS/JS that will port easily.
- **Mobile is the primary canvas** (≈90% of guests open on phones over WhatsApp), but desktop must be a deliberate first-class layout too — not a stretched phone column.

**Source to mine:** the "Minimal Modern" look is distilled from the **Xfolio** theme (extracted at `sandbox/templates-intake/xfolio/wowtheme7.com/tf/xfolio/`). **Mine its type + clean structure + token approach — do NOT copy its markup or its dark red palette.** We rebuild the wedding structure fresh and flip the palette to light. Reference its one-page demos (`index-*-one-page.html`) and `assets/css/main.css` for layout/spacing feel only.

## 3. Research / what's already decided

- **Section spine (10, in order):** Hero (+countdown) · Announcement · Our Story · Schedule/Itinerary · Venue & Travel · Wedding Party · Gallery · Q&A · RSVP · Footer. This spine is the same for all five templates — they differ by *look*, not sections.
- **All demo content is already written** — couple **Brindo Sylen & Sreelekshmy M**, a Kerala Hindu–Christian interfaith wedding, Kochi, 26 Jan 2027. **Use the content set verbatim** from [`designs/_prompts/guest-site-bold-festive-kerala.lovable.md`](../../../../_prompts/guest-site-bold-festive-kerala.lovable.md) — §"CONTENT" (story, 6 sub-events with venues, wedding party, Q&A, RSVP copy) and §"PHOTO DIRECTION" (Unsplash per-slot search terms). Read that file; reuse its copy and photo slots exactly. (Note: it was written for the bold-festive mood — reuse the **content**, not the palette.)
- **Shell:** `designs/shared/shell.css` + `shell.js`. This is a **standalone guest site with its own chrome** — do NOT pull in the host app's floating-nav / breadcrumb / dashboard chrome. Reuse only low-level infra where it genuinely helps: the shell modal controller (`window.evenzi.openModal/closeModal`) for the unlock + RSVP-success modals, vendored fonts under `designs/shared/fonts/`, and design tokens where they don't fight the template look. Everything else is bespoke template CSS.

## 4. Dev spec

### 4a. Visual system — "Minimal Modern" (light)

Clean, airy, editorial-minimal. Lots of whitespace, thin hairline rules, one restrained accent, confident modern-sans type.

**Palette (define as CSS custom properties at the top of the template CSS):**
```
--mm-bg:      #FAFAF8;  /* warm off-white page */
--mm-surface: #FFFFFF;  /* cards */
--mm-ink:     #1A1A1A;  /* headings/body */
--mm-muted:   #7A756E;  /* secondary text */
--mm-line:    #E7E3DB;  /* hairline rules/borders */
--mm-accent:  #B08D57;  /* muted gold — the single accent (links, active, small marks) */
--mm-accent-soft: #F0E9DC; /* accent tint for chips/fills */
```
One accent only. No gradients beyond the faintest. Shadows minimal (`0 8px 30px -20px rgba(0,0,0,.18)`).

**Type:** headings + body in **Sora** (geometric modern sans — mined from Xfolio; vendor it or use the existing vendored fonts if present, else `@font-face`/Google Fonts per the design-path font rule). Optional: a light serif accent for the couple's names only. Big hero type (clamp ~34–52px), generous line-height 1.6 on body, small-caps letter-spaced eyebrows in `--mm-accent`.

**Spacing/rhythm:** generous section padding (mobile ~56px vertical, desktop ~96px), max content width ~1100px centered on desktop, single-column on mobile.

**Motion:** light scroll-reveal (fade-up), reduced-motion safe. **Strip all heavy agency JS** — no ScrollSmoother, no WebGL, no custom cursor, no preloader.

### 4b. Structure & token discipline (matters for later templates)

- Keep **structure CSS** (layout, section skeletons, responsive rules) conceptually separate from **look tokens** (the `--mm-*` custom properties + font choices), ideally in clearly-commented blocks. Template #2+ will reuse the structure and swap only the token block — so this first build effectively defines the shared skeleton. Don't hard-code colors/fonts inline in rules; always go through the `--mm-*` vars.

### 4c. Two-tier gate + sections

Model the gate (mock, no auth):
- **Public Hero** loads first with an **"Unlock Guest Details"** button → opens a bottom-sheet/modal (phone OR password field, non-functional) → on submit (or a "view invitation" action) reveal the private sections; persist "unlocked" in `localStorage`.
- Sticky bottom **RSVP** button appears once unlocked (mobile); on desktop it becomes an inline/top CTA.

Per-section layout (content from the prompt file; here's the mobile→desktop intent):

| # | Section | Mobile | Desktop |
|---|---|---|---|
| 1 | Hero | full-bleed vertical cover, names, date, live countdown tiles, unlock CTA | full-viewport, larger type, wider countdown row |
| 2 | Announcement | slim ribbon, dismissible | same, centered |
| 3 | Our Story | single column, photos between paragraphs | two-column text beside photos |
| 4 | Schedule | vertical stack of the 6 sub-event cards | 2–3 col grid grouped by day |
| 5 | Venue & Travel | map placeholder + stacked getting-there + 3 hotel cards | map beside address; travel + hotels in a row |
| 6 | Wedding Party | segmented Bride's/Groom's, 2-across | side-by-side columns, 3-across |
| 7 | Gallery | 2-col masonry → lightbox | 3–4 col masonry |
| 8 | Q&A | full-width accordion | centered ~800px |
| 9 | RSVP | stacked per-event Yes/No + stepper + submit → success state | centered ~640px card |
| 10 | Footer | monogram, date, "download card" CTA, "Made with Evenzi" | same, centered |

Countdown, unlock, and RSVP are **client-side mocks** (vanilla JS; no network).

### 4d. Files (no inline CSS/JS)

Create in `designs/pages/website/guest-site/minimal-modern/`:
- `index.html` — the template markup
- `minimal-modern.css` — token block (`--mm-*`) + structure + section CSS
- `minimal-modern.js` — countdown, unlock-gate mock, gallery lightbox, RSVP mock, scroll-reveal
- Reuse `designs/shared/shell.css` / `shell.js` only for the modal controller + tokens/fonts as noted. Link the vendored `designs/shared/tailwind.css` only if you actually use its utilities (the existing pages do); otherwise keep it self-contained.

## 5. Testing (static prototype)

- Countdown ticks to 26 Jan 2027 and doesn't break at 0.
- Unlock gate: closed → tap CTA → modal → submit → private sections revealed → reload keeps it unlocked (localStorage).
- Gallery lightbox opens/closes (Esc + scrim + button); focus returns to trigger.
- RSVP: per-event toggles work, stepper clamps 0–2, submit shows the success state. No console errors.
- No network calls (pure design).

## 6. Visual testing
- Matches the Minimal Modern system: off-white, single gold accent, Sora type, airy spacing, hairline rules. No leftover Xfolio red/dark.
- Screenshot mobile (390) + desktop (1440) for review.

## 7. UI/UX testing
- Every interactive element ≥44px on touch; keyboard: Tab order logical, Enter/Space activate, Esc closes overlays.
- No dead links (every `<a>` resolves or is `href="#"` with a comment). Reduced-motion respected.

## 8. Responsiveness testing
- Verify **360 / 390 / 414** (phone), **768** (tablet), **1024 / 1280 / 1440** (desktop). No horizontal scroll at any width; no clipped content; desktop uses the multi-column intents in 4c (not a centered phone strip). Centered ~1100px max on large screens.

## 9. Data testing
- N/A — no data flow. RSVP/unlock/countdown are client-side mocks with obvious empty/success states already specified.

## 10. Definition of done
- [ ] `index.html` + `minimal-modern.css` + `minimal-modern.js` in the template dir; **no inline CSS/JS**.
- [ ] All 10 sections built with the verbatim Kerala demo content + Unsplash photo slots from the prompt file.
- [ ] Minimal Modern light palette + Sora type applied via `--mm-*` tokens; zero Xfolio dark/red leftovers; heavy agency JS stripped.
- [ ] Two-tier unlock gate (mock) + sticky/desktop RSVP CTA + countdown + gallery lightbox + RSVP success — all working client-side.
- [ ] Passes §5–§8 (interaction, visual, UX, responsive at all 6 widths, no console errors, no horizontal scroll).
- [ ] Structure vs. `--mm-*` token blocks clearly separated (so template #2 can reuse the skeleton).
- [ ] New shared primitives (if any) added to `designs/components.html`.
- [ ] Hand back for Claude review + Antigravity responsive/a11y pass before it's called done.
