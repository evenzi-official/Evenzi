# Landing Page Revamp — Design Spec
**Date:** 2026-08-08  
**Author:** Dheeraj (frontend)  
**Route:** `app/page.tsx` — `/`  
**Status:** Approved — ready for implementation

---

## 1. Overview

Add 7 new sections and modify 3 existing elements on the Evenzi marketing landing page (`/`). The goal is to convert visitors by: surfacing a CTA above the fold, making features scannable before the immersive scroll experience, differentiating on the India angle, and closing with a clear conversion moment.

**Reference:** Analysed against withJoy.com — adapted for Indian wedding context and Evenzi's editorial theme.

### What changes

| # | Item | Type |
|---|---|---|
| 1 | Nav — add "Get Started" CTA | Modify existing |
| 2 | Hero — add CTA button pair | Modify existing |
| 3 | Feature Showcase Grid | New section |
| 4 | India Differentiator Block | New section |
| 5 | WhatsApp Power Spotlight | New section |
| 6 | Social Proof Strip | New section |
| 7 | About Us | New section |
| 8 | Final CTA | New section |
| 9 | Footer — multi-column | Modify existing |

### What does NOT change

- `HeroGeometric` component internals (only usage in `page.tsx` gets a CTA appended below it)
- `TextScrollAnimation` — untouched
- `IntroAnimation` — untouched (now updated with Indian photos)
- Brand tokens: `#FAFAFA`, `#080808`, `#BB0020`, `#c8a96e`
- Framer Motion as the animation library

---

## 2. Final Page Order

```
<Nav />                        — modified
<HeroGeometric />              — existing component, CTA appended in page.tsx
<HeroCTA />                    — new inline component in page.tsx
<TextScrollAnimation />        — existing, untouched
<FeatureShowcaseGrid />        — new component
<IndiaDifferentiatorBlock />   — new component
<WhatsAppSpotlight />          — new component
<SocialProofStrip />           — new component
<IntroAnimation />             — existing, untouched
<AboutUs />                    — new component
<FinalCTA />                   — new component
<PageFooter />                 — modified (replace existing)
```

---

## 3. Section Specs

### 3.1 Nav — "Get Started" CTA

**File:** `app/page.tsx` (inline `Nav` component)

**Changes:**
- Add a filled pill button **"Get Started"** that links to `/auth`, placed before the existing "Sign In" button on desktop.
- Change "Sign In" from a pill button to a plain text link (`text-[#6b7280] text-[14px] font-medium`).
- Mobile drawer: add "Get Started" as a filled pill below the nav links; keep "Sign In" as a text link above it.

**Styles — Get Started button:**
```
background: #BB0020
color: #ffffff
padding: 9px 20px
font-size: 13px
font-weight: 700
border-radius: 9999px
letter-spacing: 0.04em
font-family: var(--font-manrope), sans-serif
hover: background #9b001a (darken 15%)
transition: background 0.2s ease
```

---

### 3.2 Hero — CTA Button Pair

**File:** `app/page.tsx` — rendered directly below `<HeroGeometric />` using absolute/sticky positioning or as a sibling element that overlaps the hero's bottom area.

**Implementation:** Add a `<HeroCTA />` inline component that renders at `position: relative; margin-top: -120px; z-index: 70` so it sits visually inside the hero section above the gradient fade-out. On mobile drop to `margin-top: -80px`.

**Content:**
- **Primary button:** "Start Planning Free" → `/auth`
- **Secondary link:** "See how it works ↓" → smooth scrolls to `#features`

**Primary button styles:**
```
background: #080808
color: #f0ebe0
padding: 14px 32px
border-radius: 9999px
font-size: 14px
font-weight: 600
letter-spacing: 0.06em
box-shadow: 0 4px 24px rgba(8,8,8,0.18)
hover: background #BB0020, shadow stronger
transition: all 0.25s ease
```

**Secondary link styles:**
```
color: rgba(8,8,8,0.45)
font-size: 13px
font-weight: 500
letter-spacing: 0.04em
margin-top: 16px
hover: color rgba(8,8,8,0.7)
```

**Animation:** Both elements fade up with Framer Motion:
```
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.8, delay: 1.6, ease: [0.25, 0.4, 0.25, 1] }
```

---

### 3.3 Feature Showcase Grid

**File:** `components/landing/FeatureShowcaseGrid.tsx`

**Section structure:**
- Background: `#FAFAFA`
- Top padding: `py-24` / `md:py-32`
- Anchor: `id="features"`

**Eyebrow:** `FEATURES` — uppercase, 10px, `#c8a96e`, letter-spacing 0.3em, centered

**Headline:** *"Everything for your celebration"* — `font-serif font-light text-[clamp(28px,4vw,52px)] text-[#080808] tracking-tight text-center mt-3 mb-16`

**Grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-6`

**Six feature cards:**

| Icon (Material Symbol) | Title | Description |
|---|---|---|
| `group` | Guest Management | Add guests, import via CSV, track RSVPs in real time. Replace the spreadsheet. |
| `chat` | WhatsApp Invitations | Beautiful personalised invitations delivered via WhatsApp — where your guests actually are. |
| `language` | Event Website | A stunning public page for your event — venue, schedule, and RSVP — no tech skills needed. |
| `payments` | Budget Tracker | Log expenses in ₹, track spending by category, and never go over budget. |
| `photo_library` | Photo Gallery | Every memory from every guest, uploaded and curated in one beautiful place. |
| `checklist` | Planning Checklist | Pre-built Indian wedding checklists. Tick off every detail from Haldi to Reception. |

**Card styles:**
```
background: #ffffff
border: 1px solid rgba(8,8,8,0.07)
border-radius: 20px
padding: 28px
transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease
hover:
  transform: translateY(-4px)
  box-shadow: 0 12px 40px rgba(8,8,8,0.10)
  border-color: rgba(187,0,32,0.25)
```

**Card internal layout (top to bottom):**
1. Icon circle: `w-10 h-10 rounded-full bg-[rgba(187,0,32,0.08)] flex items-center justify-center` — icon `text-[#BB0020] text-[20px]`
2. Title: `font-sans font-700 text-[16px] text-[#080808] mt-4 mb-2`
3. Description: `font-sans font-400 text-[13px] text-[rgba(8,8,8,0.55)] leading-[1.7]`

**Animation:** Cards stagger-reveal on scroll using Framer Motion `whileInView`:
```
initial: { opacity: 0, y: 24 }
whileInView: { opacity: 1, y: 0 }
viewport: { once: true, margin: "-80px" }
transition: { duration: 0.6, delay: index * 0.08, ease: [0.25, 0.4, 0.25, 1] }
```

---

### 3.4 India Differentiator Block

**File:** `components/landing/IndiaDifferentiatorBlock.tsx`

**Section:** Full-width dark section. Background: `#080808`. Padding: `py-24 md:py-36`.

**Layout:** Two-column split on `lg` desktop (`lg:grid-cols-[1fr_1fr]`), stacked on mobile.

**Left column — text:**
- Eyebrow: `#c8a96e`, `text-[10px] tracking-[0.35em] uppercase font-700` — `BUILT FOR INDIA`
- Headline: `font-serif font-light text-[clamp(28px,3.5vw,52px)] text-white leading-[1.2] tracking-tight mt-4` — *"The way India celebrates — we've built for all of it."*
- Body: `text-[14px] text-[rgba(255,255,255,0.5)] leading-[1.85] mt-6 max-w-sm` — "Planning a wedding in India means multiple ceremonies, hundreds of guests, budgets in the lakhs, and coordinating everything over WhatsApp. Evenzi is built for exactly this."

**Right column — sub-event pill grid:**
- `flex flex-wrap gap-3 content-start`
- Pills for: `Haldi` `Sangeet` `Mehendi` `Baraat` `Ceremony` `Reception` `Engagement` `Ring Ceremony`
- Pill style: `border border-[rgba(200,169,110,0.4)] text-[#c8a96e] rounded-full px-4 py-2 text-[12px] font-600 tracking-wide`
- Hover: `border-[#c8a96e] bg-[rgba(200,169,110,0.08)]`

**Bottom bar** (spans full width, `mt-16 pt-8 border-t border-[rgba(255,255,255,0.08)]`):
Four badges inline, separated by `·`:
- `WhatsApp Invitations` · `+91 India Numbers` · `₹ Pricing` · `India-first Support`
- Style: `text-[11px] text-[rgba(255,255,255,0.35)] tracking-wide`

**Animation:** Left col slides in from left, right col from right, on scroll (`whileInView`, `once: true`).

---

### 3.5 WhatsApp Power Spotlight

**File:** `components/landing/WhatsAppSpotlight.tsx`

**Section:** Light bg `#FAFAFA`. Padding `py-24 md:py-32`. Max-width `max-w-6xl mx-auto px-6`.

**Layout:** Split `lg:grid-cols-[3fr_2fr]` — text left, phone mockup right. Stacks on mobile (mockup goes below text).

**Left — text:**
- Eyebrow: `#c8a96e` — `THE INVITATION`
- Headline: `font-serif font-light text-[clamp(28px,3.5vw,48px)] text-[#080808] tracking-tight leading-[1.2] mt-3` — *"Send wedding invitations via WhatsApp. In one tap."*
- Body: `text-[14px] text-[rgba(8,8,8,0.55)] leading-[1.85] mt-6 max-w-lg` — "Your guests don't use email. They use WhatsApp. Evenzi generates a personalised invitation message for each guest and sends it with their RSVP link included — no copy-paste, no manual work."
- CTA: `mt-8` — text link with arrow `text-[#BB0020] font-600 text-[13px] hover:underline` → "Try it free →" → `/auth`

**Right — WhatsApp phone mockup (pure CSS, no images):**
Phone frame:
```
width: 240px
border: 2px solid rgba(8,8,8,0.12)
border-radius: 32px
padding: 12px
background: #f0f2f5  (WhatsApp bg color)
box-shadow: 0 24px 64px rgba(8,8,8,0.12)
```
Inside: static WhatsApp message bubble:
- Header bar: dark green `#075E54`, white "Evenzi" label, phone icon
- Message bubble: white bg, rounded, `padding: 12px 14px`
  - Bold: "🎊 You're invited to Priya & Arjun's Wedding!"
  - Body: "Ceremony: Dec 14, 2026 · 7:00 PM · Grand Hyatt, Mumbai"
  - Link: `text-[#075E54]` "RSVP here → evenzi.app/e/priya-arjun"
- Timestamp: `10:42 AM · ✓✓` (grey, right-aligned, 10px)

---

### 3.6 Social Proof Strip

**File:** `components/landing/SocialProofStrip.tsx`

**Section:** Full-width. Background: `rgba(187,0,32,0.03)`. Border top + bottom: `1px solid rgba(187,0,32,0.08)`. Padding: `py-12`.

**Layout:** `flex items-center justify-center gap-0` — 3 stats in a row, each separated by `1px solid rgba(8,8,8,0.10)` vertical divider. On mobile: `flex-col` with horizontal dividers.

**Three stats:**
1. **"10M+"** / "Indian weddings every year"
2. **"₹4L Cr"** / "Annual wedding industry spend"
3. **"Zero"** (italic, `#c8a96e`) / "End-to-end platforms before Evenzi"

**Stat number styles:** `font-serif font-light text-[clamp(28px,3.5vw,48px)] text-[#080808] leading-none`
**Label styles:** `font-sans text-[10px] text-[rgba(8,8,8,0.4)] tracking-[2px] uppercase mt-3 leading-[1.7]`
**Each stat:** `flex flex-col items-center text-center px-12 md:px-16`

---

### 3.7 About Us

**File:** `components/landing/AboutUs.tsx`

**Section:** `#FAFAFA` bg. Padding `py-24 md:py-32`. Max-width `max-w-5xl mx-auto px-6`.

**Layout:** Asymmetric — narrow left accent column (brand mark + eyebrow), wide right copy column. `lg:grid-cols-[160px_1fr] gap-16`.

**Left column:**
- Evenzi brand mark: `public/brand/mark-dark.png` at 48×48px (or `mark.svg`)
- Below: eyebrow `OUR STORY` — `#c8a96e text-[10px] tracking-[0.35em] uppercase mt-4`

**Right column:**
- Headline: `font-serif font-light text-[clamp(24px,3vw,42px)] text-[#080808] tracking-tight leading-[1.2]` — *"We're building what Indian celebrations deserve."*
- Para 1: `text-[15px] text-[rgba(8,8,8,0.6)] leading-[1.9] mt-6` — "Planning a wedding in India is one of the most joyful — and complex — things a family can do. Hundreds of guests, multiple ceremonies, budgets in the lakhs, WhatsApp chaos. The tools that exist were never built for this moment."
- Para 2: same style — "We're a small team building the platform this moment has always deserved. One workspace. Every celebration. Start to finish."

**Animation:** Right column `whileInView` fade up, `once: true`.

---

### 3.8 Final CTA

**File:** `components/landing/FinalCTA.tsx`

**Section:** Full-width. Background: `#080808`. Padding: `py-28 md:py-40`. Centered.

**Content (all centered, max-width 640px, `mx-auto px-6`):**
- Headline: `font-serif font-light text-[clamp(32px,5vw,68px)] text-white leading-[1.1] tracking-tight` — *"Your celebration deserves better."*
- Sub: `text-[15px] text-[rgba(255,255,255,0.45)] mt-6 leading-[1.7]` — "Join hosts planning smarter Indian celebrations."
- CTA button: `mt-10` — white pill `bg-white text-[#080808] px-8 py-4 rounded-full font-600 text-[14px] tracking-[0.06em] shadow-[0_8px_32px_rgba(255,255,255,0.15)] hover:bg-[#c8a96e] hover:text-[#080808] transition-all duration-300` → "Start Planning Free →" → `/auth`
- Fine print: `mt-4 text-[11px] text-[rgba(255,255,255,0.3)] tracking-wide` — "Free to start · No credit card required"

**Animation:** Headline + button `whileInView` fade up, `once: true`.

---

### 3.9 Footer — Enhanced

**File:** `components/layout/PageFooter.tsx` (replace current content)

**Structure:** Three-column grid + bottom bar. Background: `#f9fafb`. Border top: `1px solid #e5e7eb`. Padding: `pt-16 pb-8`.

**Top section — 4 columns** (`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto px-6`):

**Col 1 — Brand:**
- Evenzi logo mark (circle E, 36px) + wordmark
- Tagline: `"Capture · Share · Cherish"` — `text-[12px] text-[#9ca3af] mt-2`

**Col 2 — Product:**
- Header: `PRODUCT` (caps, 10px, tracked, `#9ca3af`)
- Links: Guest Management, Digital Invitations, Event Website, Budget Tracker, Photo Gallery, Planning Tools

**Col 3 — Support:**
- Header: `SUPPORT`
- Links: Help & Support, Privacy Policy, Terms of Service, Contact Us

**Col 4 — Company:**
- Header: `COMPANY`
- Links: About Evenzi, Contact (`mailto:evenzi.official@gmail.com`)

**Bottom bar** (`mt-12 pt-6 border-t border-[#f3f4f6] flex flex-col md:flex-row items-center justify-between`):
- Left: `© 2026 Evenzi. All rights reserved.` — `text-[12px] text-[#9ca3af]`
- Right: Privacy · Terms · Help (text links)

**Link styles:** `text-[13px] text-[#6b7280] hover:text-[#BB0020] transition-colors duration-200`
**Section header styles:** `text-[10px] font-700 text-[#9ca3af] tracking-[0.2em] uppercase mb-4`

---

## 4. Component File Map

```
app/
  page.tsx                              ← Nav + HeroGeometric + HeroCTA modified

components/
  landing/
    FeatureShowcaseGrid.tsx             ← NEW
    IndiaDifferentiatorBlock.tsx        ← NEW
    WhatsAppSpotlight.tsx               ← NEW
    SocialProofStrip.tsx                ← NEW
    AboutUs.tsx                         ← NEW
    FinalCTA.tsx                        ← NEW
  layout/
    PageFooter.tsx                      ← MODIFIED (replace content)
```

---

## 5. Technical Constraints

- All new components are `"use client"` (Framer Motion `whileInView` requires client)
- `whileInView` with `once: true` and `viewport: { margin: "-80px" }` on all scroll-reveal animations
- No new npm dependencies — Framer Motion is already installed
- Material Symbols icons: already loaded sitewide (used in app shell) — use `<span className="material-symbols-outlined">icon_name</span>`
- All font references use `var(--font-manrope)` for sans; serif sections use `font-serif` Tailwind class
- `#features` anchor on `FeatureShowcaseGrid` for the "See how it works ↓" scroll target
- Smooth scroll: `scroll-behavior: smooth` already on html (or add via `onClick` + `scrollIntoView`)
- WhatsApp mockup: pure CSS/JSX — no external image
- All `<a href>` links: internal pages use Next.js `<Link>`, external/email use `<a>`
- Footer column links that don't have pages yet (About, Blog) use `href="#"` with comment

---

## 6. Out of Scope

- No blog/articles section (no content yet)
- No real testimonials (no users yet)
- No hotel blocks / registry (not Evenzi features)
- No animation on the WhatsApp mockup (static display only)
- No dark mode on new sections (existing page is light-mode only)
- No new DB queries or API routes

---

## 7. Definition of Done

- [ ] All 6 new component files created and imported into `page.tsx`
- [ ] Nav has "Get Started" filled button + "Sign In" as text link (desktop + mobile drawer)
- [ ] Hero has CTA pair visible above the fold on 390px mobile and 1440px desktop
- [ ] `#features` anchor scrolls correctly from "See how it works ↓"
- [ ] All `whileInView` reveals fire on first scroll-into-view
- [ ] WhatsApp mockup renders without broken images
- [ ] Footer has 4 columns with all links (placeholder `href="#"` acceptable for non-existent pages)
- [ ] `tsc --noEmit` passes clean
- [ ] Live-tested in browser at 390px, 768px, 1280px
