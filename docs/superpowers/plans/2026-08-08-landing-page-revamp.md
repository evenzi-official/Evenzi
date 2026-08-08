# Landing Page Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 new sections + modify 3 existing elements on the Evenzi `/` marketing page to surface CTAs, make features scannable, differentiate on India angle, and close with a conversion moment.

**Architecture:** New sections live in `components/landing/` as independent client components imported into `app/page.tsx`. The existing `Nav` inline component and `HeroGeometric` usage are modified in-place inside `page.tsx`. `PageFooter` is rewritten in its existing file. No new npm packages — Framer Motion is already installed.

**Tech Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS 4 · Framer Motion · Material Symbols Outlined (already loaded sitewide)

## Global Constraints

- All new landing components use `"use client"` (Framer Motion whileInView requires it)
- `SocialProofStrip` and `PageFooter` are server components (no interactivity)
- Brand colors: `#BB0020` (red), `#c8a96e` (gold), `#080808` (dark), `#FAFAFA` (bg) — no raw hex outside these
- Font: `var(--font-manrope), sans-serif` for sans; `font-serif` Tailwind class for editorial headings
- Icons: `<span className="material-symbols-outlined">icon_name</span>` — no icon library imports
- All `whileInView` animations use `viewport={{ once: true, margin: "-80px" }}`
- Internal links use Next.js `<Link>`, external/mailto use `<a>`
- `tsc --noEmit` must pass clean after every task
- No modifications to `HeroGeometric`, `TextScrollAnimation`, or `IntroAnimation` component internals

---

### Task 1: Nav "Get Started" CTA + Hero CTA section

**Files:**
- Modify: `app/page.tsx` — Nav inline component + page body

**Interfaces:**
- Produces: `id="features"` anchor exists on the page (added in Task 2) — the "See how it works ↓" link targets it via `href="#features"`

- [ ] **Step 1: Update the desktop Nav links in `app/page.tsx`**

Find the `{/* Desktop nav links */}` block inside the `Nav` function and replace it:

```tsx
{/* Desktop nav links */}
<div className="hidden md:flex items-center gap-5">
  <a
    href="#features"
    style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none", fontWeight: 500 }}
  >
    Features
  </a>
  <a
    href="#about"
    style={{ fontSize: "14px", color: "#6b7280", textDecoration: "none", fontWeight: 500 }}
  >
    About
  </a>
  <button
    onClick={handleSignup}
    style={{
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      color: "#6b7280",
      fontWeight: 500,
      fontFamily: "var(--font-manrope), sans-serif",
      padding: "0",
    }}
  >
    Sign In
  </button>
  <button
    onClick={handleSignup}
    style={{
      padding: "9px 20px",
      fontSize: "13px",
      fontWeight: 700,
      color: "#ffffff",
      background: "#BB0020",
      border: "none",
      borderRadius: "9999px",
      cursor: "pointer",
      letterSpacing: "0.04em",
      fontFamily: "var(--font-manrope), sans-serif",
      transition: "background 0.2s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "#9b001a")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "#BB0020")}
  >
    Get Started
  </button>
</div>
```

- [ ] **Step 2: Update the mobile drawer nav links**

Find the `{/* Nav links */}` block inside the drawer panel and replace it:

```tsx
{/* Nav links */}
<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
  <a
    href="#features"
    onClick={() => setMenuOpen(false)}
    style={{ fontSize: "15px", color: "#374151", textDecoration: "none", fontWeight: 500 }}
  >
    Features
  </a>
  <a
    href="#about"
    onClick={() => setMenuOpen(false)}
    style={{ fontSize: "15px", color: "#374151", textDecoration: "none", fontWeight: 500 }}
  >
    About
  </a>
  <button
    onClick={() => { setMenuOpen(false); handleSignup(); }}
    style={{
      alignSelf: "flex-start",
      marginTop: "4px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      color: "#6b7280",
      fontWeight: 500,
      fontFamily: "var(--font-manrope), sans-serif",
      padding: "0",
    }}
  >
    Sign In
  </button>
  <button
    onClick={() => { setMenuOpen(false); handleSignup(); }}
    style={{
      alignSelf: "flex-start",
      padding: "10px 24px",
      fontSize: "13px",
      fontWeight: 700,
      color: "#ffffff",
      background: "#BB0020",
      border: "none",
      borderRadius: "9999px",
      cursor: "pointer",
      letterSpacing: "0.04em",
      fontFamily: "var(--font-manrope), sans-serif",
    }}
  >
    Get Started
  </button>
</div>
```

- [ ] **Step 3: Add the HeroCTA section in `page.tsx` — add this import at top**

```tsx
import { motion } from "framer-motion";
```

- [ ] **Step 4: Add the HeroCTA section in `page.tsx` — insert immediately after `<HeroGeometric ... />`**

```tsx
{/* Hero CTA — sits directly below the hero, first content below the fold */}
<div className="w-full bg-[#FAFAFA] flex flex-col items-center py-12 px-4 -mt-8 relative z-10">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 1.6, ease: [0.25, 0.4, 0.25, 1] }}
    className="flex flex-col items-center gap-4"
  >
    <button
      onClick={() => (window.location.href = "/auth")}
      className="inline-flex items-center px-8 py-4 rounded-full bg-[#080808] text-[#f0ebe0] text-[14px] font-semibold tracking-[0.06em] shadow-[0_4px_24px_rgba(8,8,8,0.18)] hover:bg-[#BB0020] transition-all duration-250"
    >
      Start Planning Free
    </button>
    <a
      href="#features"
      className="text-[13px] font-medium text-[rgba(8,8,8,0.4)] hover:text-[rgba(8,8,8,0.7)] tracking-[0.04em] transition-colors"
    >
      See how it works ↓
    </a>
  </motion.div>
</div>
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Browser check**

Open `http://localhost:3000`. Verify:
- Nav shows "Sign In" (text) and "Get Started" (red pill) on desktop
- Mobile hamburger → drawer shows both links, "Get Started" filled red pill
- Below the hero, "Start Planning Free" black pill and "See how it works ↓" grey link are visible
- Clicking "See how it works ↓" does nothing yet (no `#features` anchor) — that's fine, Task 2 adds it

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat(landing): nav Get Started CTA + hero CTA section"
```

---

### Task 2: FeatureShowcaseGrid

**Files:**
- Create: `components/landing/FeatureShowcaseGrid.tsx`
- Modify: `app/page.tsx` — import + render after HeroCTA

**Interfaces:**
- Produces: `id="features"` anchor — the "See how it works ↓" link from Task 1 now works

- [ ] **Step 1: Create `components/landing/FeatureShowcaseGrid.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "group",
    title: "Guest Management",
    desc: "Add guests, import via CSV, track RSVPs in real time. Replace the spreadsheet.",
  },
  {
    icon: "chat",
    title: "WhatsApp Invitations",
    desc: "Beautiful personalised invitations delivered via WhatsApp — where your guests actually are.",
  },
  {
    icon: "language",
    title: "Event Website",
    desc: "A stunning public page — venue, schedule, and RSVP — no tech skills needed.",
  },
  {
    icon: "payments",
    title: "Budget Tracker",
    desc: "Log expenses in ₹, track spending by category, and never go over budget.",
  },
  {
    icon: "photo_library",
    title: "Photo Gallery",
    desc: "Every memory from every guest, uploaded and curated in one beautiful place.",
  },
  {
    icon: "checklist",
    title: "Planning Checklist",
    desc: "Pre-built Indian wedding checklists. Tick off every detail from Haldi to Reception.",
  },
];

export default function FeatureShowcaseGrid() {
  return (
    <section id="features" className="w-full bg-[#FAFAFA] py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <p
            className="font-sans font-bold tracking-[0.35em] uppercase text-[#c8a96e]"
            style={{ fontSize: "10px" }}
          >
            FEATURES
          </p>
          <h2 className="font-serif font-light tracking-tight mt-3 text-[#080808]" style={{ fontSize: "clamp(28px, 4vw, 52px)" }}>
            Everything for your celebration
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
              className="group bg-white border border-[rgba(8,8,8,0.07)] rounded-[20px] p-7 transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(8,8,8,0.10)] hover:border-[rgba(187,0,32,0.25)]"
            >
              <div className="w-10 h-10 rounded-full bg-[rgba(187,0,32,0.08)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#BB0020]" style={{ fontSize: "20px" }}>
                  {f.icon}
                </span>
              </div>
              <h3 className="font-sans font-bold text-[#080808] mt-4 mb-2" style={{ fontSize: "16px" }}>
                {f.title}
              </h3>
              <p className="font-sans text-[rgba(8,8,8,0.55)] leading-[1.7]" style={{ fontSize: "13px" }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Import and render in `app/page.tsx`**

Add import at top:
```tsx
import FeatureShowcaseGrid from "@/components/landing/FeatureShowcaseGrid";
```

Add after the HeroCTA div and before `<TextScrollAnimation />`:
```tsx
<FeatureShowcaseGrid />
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Browser check**

Open `http://localhost:3000`. Scroll past the hero CTA. Verify:
- "FEATURES" eyebrow and "Everything for your celebration" heading appear
- 6 cards render in 3×2 grid on desktop, 2-col on tablet, 1-col on mobile
- Each card has red circle icon, bold title, muted description
- Hovering a card: lifts slightly + shadow deepens + border turns red-tinted
- Clicking "See how it works ↓" from the hero now scrolls to this section

- [ ] **Step 5: Commit**

```bash
git add components/landing/FeatureShowcaseGrid.tsx app/page.tsx
git commit -m "feat(landing): feature showcase grid — 6 feature cards"
```

---

### Task 3: IndiaDifferentiatorBlock

**Files:**
- Create: `components/landing/IndiaDifferentiatorBlock.tsx`
- Modify: `app/page.tsx` — import + render after FeatureShowcaseGrid

- [ ] **Step 1: Create `components/landing/IndiaDifferentiatorBlock.tsx`**

```tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

const SUB_EVENTS = [
  "Haldi",
  "Sangeet",
  "Mehendi",
  "Baraat",
  "Ceremony",
  "Reception",
  "Engagement",
  "Ring Ceremony",
];

const BADGES = [
  "WhatsApp Invitations",
  "+91 India Numbers",
  "₹ Pricing",
  "India-first Support",
];

export default function IndiaDifferentiatorBlock() {
  return (
    <section className="w-full bg-[#080808] py-24 md:py-36">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <p
              className="font-sans font-bold uppercase text-[#c8a96e]"
              style={{ fontSize: "10px", letterSpacing: "0.35em" }}
            >
              BUILT FOR INDIA
            </p>
            <h2
              className="font-serif font-light text-white leading-[1.2] tracking-tight mt-4"
              style={{ fontSize: "clamp(28px, 3.5vw, 52px)" }}
            >
              The way India celebrates — we've built for all of it.
            </h2>
            <p
              className="text-[rgba(255,255,255,0.5)] leading-[1.85] mt-6 max-w-sm"
              style={{ fontSize: "14px" }}
            >
              Planning a wedding in India means multiple ceremonies, hundreds of
              guests, budgets in the lakhs, and coordinating everything over
              WhatsApp. Evenzi is built for exactly this.
            </p>
          </motion.div>

          {/* Right — sub-event pill grid */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex flex-wrap gap-3 content-start"
          >
            {SUB_EVENTS.map((ev) => (
              <span
                key={ev}
                className="border border-[rgba(200,169,110,0.4)] text-[#c8a96e] rounded-full px-4 py-2 font-semibold tracking-wide cursor-default transition-all duration-200 hover:border-[#c8a96e] hover:bg-[rgba(200,169,110,0.08)]"
                style={{ fontSize: "12px" }}
              >
                {ev}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom badges bar */}
        <div className="mt-16 pt-8 border-t border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-2">
          {BADGES.map((b, i) => (
            <React.Fragment key={b}>
              {i > 0 && (
                <span className="text-[rgba(255,255,255,0.2)]" style={{ fontSize: "11px" }}>
                  ·
                </span>
              )}
              <span
                className="text-[rgba(255,255,255,0.35)] tracking-wide"
                style={{ fontSize: "11px" }}
              >
                {b}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Import and render in `app/page.tsx`**

Add import:
```tsx
import IndiaDifferentiatorBlock from "@/components/landing/IndiaDifferentiatorBlock";
```

Add after `<FeatureShowcaseGrid />`:
```tsx
<IndiaDifferentiatorBlock />
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Browser check**

Scroll to the dark section. Verify:
- Dark `#080808` background full-width
- Gold "BUILT FOR INDIA" eyebrow + white serif headline + muted body on the left
- Gold outline pills (Haldi, Sangeet, etc.) on the right, wrapping naturally
- Pills animate in from the right on scroll
- Bottom badges bar with `·` separators

- [ ] **Step 5: Commit**

```bash
git add components/landing/IndiaDifferentiatorBlock.tsx app/page.tsx
git commit -m "feat(landing): India differentiator block — sub-events + badges"
```

---

### Task 4: WhatsAppSpotlight

**Files:**
- Create: `components/landing/WhatsAppSpotlight.tsx`
- Modify: `app/page.tsx` — import + render after IndiaDifferentiatorBlock

- [ ] **Step 1: Create `components/landing/WhatsAppSpotlight.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

function WhatsAppMockup() {
  return (
    <div className="w-[240px] mx-auto select-none">
      <div
        className="border-2 border-[rgba(8,8,8,0.12)] rounded-[32px] p-3 bg-[#f0f2f5] shadow-[0_24px_64px_rgba(8,8,8,0.12)] overflow-hidden"
      >
        {/* Header bar */}
        <div className="bg-[#075E54] rounded-t-[20px] px-3 py-2.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-white font-bold" style={{ fontSize: "11px" }}>E</span>
          </div>
          <span className="text-white font-semibold" style={{ fontSize: "12px" }}>Evenzi</span>
        </div>

        {/* Message bubble */}
        <div className="bg-white rounded-b-[20px] rounded-tr-[20px] p-3 mt-1 shadow-sm">
          <p className="font-semibold text-[#080808] leading-[1.5]" style={{ fontSize: "11px" }}>
            🎊 You're invited to Priya & Arjun's Wedding!
          </p>
          <p className="text-[#4b5563] mt-1.5 leading-[1.6]" style={{ fontSize: "11px" }}>
            Ceremony: Dec 14, 2026<br />
            7:00 PM · Grand Hyatt, Mumbai
          </p>
          <p className="text-[#075E54] mt-2 font-medium" style={{ fontSize: "11px" }}>
            RSVP here → evenzi.app/e/priya-arjun
          </p>
          <div className="flex justify-end mt-2">
            <span className="text-[#9ca3af]" style={{ fontSize: "10px" }}>10:42 AM ✓✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppSpotlight() {
  return (
    <section className="w-full bg-[#FAFAFA] py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 items-center">
        {/* Left — text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <p
            className="font-sans font-bold uppercase text-[#c8a96e]"
            style={{ fontSize: "10px", letterSpacing: "0.35em" }}
          >
            THE INVITATION
          </p>
          <h2
            className="font-serif font-light text-[#080808] tracking-tight leading-[1.2] mt-3"
            style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
          >
            Send wedding invitations via WhatsApp. In one tap.
          </h2>
          <p
            className="text-[rgba(8,8,8,0.55)] leading-[1.85] mt-6 max-w-lg"
            style={{ fontSize: "14px" }}
          >
            Your guests don't use email. They use WhatsApp. Evenzi generates a
            personalised invitation message for each guest and sends it with
            their RSVP link included — no copy-paste, no manual work.
          </p>
          <Link
            href="/auth"
            className="mt-8 inline-flex items-center gap-1.5 text-[#BB0020] font-semibold hover:underline transition-all"
            style={{ fontSize: "13px" }}
          >
            Try it free →
          </Link>
        </motion.div>

        {/* Right — phone mockup */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
          className="flex justify-center"
        >
          <WhatsAppMockup />
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Import and render in `app/page.tsx`**

Add import:
```tsx
import WhatsAppSpotlight from "@/components/landing/WhatsAppSpotlight";
```

Add after `<IndiaDifferentiatorBlock />`:
```tsx
<WhatsAppSpotlight />
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Browser check**

Verify:
- Section is light `#FAFAFA`, split layout on desktop, stacked on mobile
- Gold "THE INVITATION" eyebrow + serif headline + muted body
- Phone mockup renders: dark green header, white message bubble, RSVP link in green, timestamp in grey
- No broken images (all CSS, no `<img>`)
- "Try it free →" link in brand red

- [ ] **Step 5: Commit**

```bash
git add components/landing/WhatsAppSpotlight.tsx app/page.tsx
git commit -m "feat(landing): WhatsApp spotlight — invite mockup + copy"
```

---

### Task 5: SocialProofStrip

**Files:**
- Create: `components/landing/SocialProofStrip.tsx`
- Modify: `app/page.tsx` — import + render after WhatsAppSpotlight

- [ ] **Step 1: Create `components/landing/SocialProofStrip.tsx`**

No `"use client"` — this is a server component (static content only).

```tsx
const STATS = [
  { num: "10M+", label: "Indian weddings every year", accent: false },
  { num: "₹4L Cr", label: "Annual wedding industry spend", accent: false },
  { num: "Zero", label: "End-to-end platforms before Evenzi", accent: true },
];

export default function SocialProofStrip() {
  return (
    <section className="w-full bg-[rgba(187,0,32,0.03)] border-t border-b border-[rgba(187,0,32,0.08)] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-center">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="relative flex flex-col items-center text-center px-10 md:px-16 py-6 md:py-0"
            >
              {i > 0 && (
                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-10 bg-[rgba(8,8,8,0.10)]" />
              )}
              <div
                className={`font-serif font-light leading-none ${
                  stat.accent ? "italic text-[#c8a96e]" : "text-[#080808]"
                }`}
                style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
              >
                {stat.num}
              </div>
              <div
                className="font-sans text-[rgba(8,8,8,0.4)] uppercase tracking-[2px] mt-3 leading-[1.7]"
                style={{ fontSize: "10px" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Import and render in `app/page.tsx`**

Add import:
```tsx
import SocialProofStrip from "@/components/landing/SocialProofStrip";
```

Add after `<WhatsAppSpotlight />` and before `<IntroAnimation />`:
```tsx
<SocialProofStrip />
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Browser check**

Verify:
- Thin warm-tinted strip with top + bottom border
- Three stats in a row on desktop: `10M+`, `₹4L Cr`, `Zero` (italic gold)
- Vertical dividers between stats on desktop; stacked on mobile
- Labels in small caps below each number

- [ ] **Step 5: Commit**

```bash
git add components/landing/SocialProofStrip.tsx app/page.tsx
git commit -m "feat(landing): social proof strip — India wedding stats"
```

---

### Task 6: AboutUs

**Files:**
- Create: `components/landing/AboutUs.tsx`
- Modify: `app/page.tsx` — import + render after IntroAnimation

**Note:** `public/brand/mark-dark.png` was added during the ENH-icons session (2026-08-08) and exists at that path.

- [ ] **Step 1: Create `components/landing/AboutUs.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutUs() {
  return (
    <section id="about" className="w-full bg-[#FAFAFA] py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-12 lg:gap-16 items-start">
        {/* Left — brand mark + eyebrow */}
        <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4">
          <Image
            src="/brand/mark-dark.png"
            alt="Evenzi"
            width={48}
            height={48}
            className="rounded-xl shrink-0"
          />
          <p
            className="font-sans font-bold uppercase text-[#c8a96e]"
            style={{ fontSize: "10px", letterSpacing: "0.35em" }}
          >
            OUR STORY
          </p>
        </div>

        {/* Right — copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <h2
            className="font-serif font-light text-[#080808] tracking-tight leading-[1.2]"
            style={{ fontSize: "clamp(24px, 3vw, 42px)" }}
          >
            We're building what Indian celebrations deserve.
          </h2>
          <p
            className="text-[rgba(8,8,8,0.6)] leading-[1.9] mt-6"
            style={{ fontSize: "15px" }}
          >
            Planning a wedding in India is one of the most joyful — and complex
            — things a family can do. Hundreds of guests, multiple ceremonies,
            budgets in the lakhs, WhatsApp chaos. The tools that exist were
            never built for this moment.
          </p>
          <p
            className="text-[rgba(8,8,8,0.6)] leading-[1.9] mt-4"
            style={{ fontSize: "15px" }}
          >
            We're a small team building the platform this moment has always
            deserved. One workspace. Every celebration. Start to finish.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Import and render in `app/page.tsx`**

Add import:
```tsx
import AboutUs from "@/components/landing/AboutUs";
```

Add after `<IntroAnimation />`:
```tsx
<AboutUs />
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Browser check**

Verify:
- Light section after the 700vh IntroAnimation
- `id="about"` anchor works from nav "About" link
- Brand mark image loads (check DevTools Network tab — should return 200 from `/brand/mark-dark.png`)
- Asymmetric layout: narrow left col (mark + eyebrow), wide right col (headline + 2 paragraphs)
- On mobile: mark and eyebrow side-by-side, copy below

- [ ] **Step 5: Commit**

```bash
git add components/landing/AboutUs.tsx app/page.tsx
git commit -m "feat(landing): about us section — story + mission"
```

---

### Task 7: FinalCTA

**Files:**
- Create: `components/landing/FinalCTA.tsx`
- Modify: `app/page.tsx` — import + render after AboutUs, before PageFooter

- [ ] **Step 1: Create `components/landing/FinalCTA.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="w-full bg-[#080808] py-28 md:py-40">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="font-serif font-light text-white leading-[1.1] tracking-tight"
          style={{ fontSize: "clamp(32px, 5vw, 68px)" }}
        >
          Your celebration deserves better.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-[rgba(255,255,255,0.45)] mt-6 leading-[1.7]"
          style={{ fontSize: "15px" }}
        >
          Join hosts planning smarter Indian celebrations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <Link
            href="/auth"
            className="inline-flex items-center px-8 py-4 rounded-full bg-white text-[#080808] font-semibold tracking-[0.06em] shadow-[0_8px_32px_rgba(255,255,255,0.15)] hover:bg-[#c8a96e] hover:text-[#080808] transition-all duration-300"
            style={{ fontSize: "14px" }}
          >
            Start Planning Free →
          </Link>
          <p
            className="text-[rgba(255,255,255,0.3)] tracking-wide"
            style={{ fontSize: "11px" }}
          >
            Free to start · No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Import and render in `app/page.tsx`**

Add import:
```tsx
import FinalCTA from "@/components/landing/FinalCTA";
```

Add after `<AboutUs />` and before `<PageFooter />`:
```tsx
<FinalCTA />
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Browser check**

Verify:
- Dark `#080808` full-width section
- Large serif "Your celebration deserves better." centered
- White pill button with gold hover → `/auth`
- "Free to start · No credit card required" fine print below
- Elements stagger-reveal on scroll

- [ ] **Step 5: Commit**

```bash
git add components/landing/FinalCTA.tsx app/page.tsx
git commit -m "feat(landing): final CTA section — closing conversion"
```

---

### Task 8: Footer Enhancement

**Files:**
- Modify: `components/layout/PageFooter.tsx` — full replacement

- [ ] **Step 1: Replace `components/layout/PageFooter.tsx` entirely**

```tsx
import Link from "next/link";

type FooterLink = { label: string; href: string };

const PRODUCT_LINKS: FooterLink[] = [
  { label: "Guest Management", href: "/auth" },
  { label: "Digital Invitations", href: "/auth" },
  { label: "Event Website", href: "/auth" },
  { label: "Budget Tracker", href: "/auth" },
  { label: "Photo Gallery", href: "/auth" },
  { label: "Planning Tools", href: "/auth" },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: "Help & Support", href: "mailto:evenzi.official@gmail.com" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Contact Us", href: "mailto:evenzi.official@gmail.com" },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: "About Evenzi", href: "#about" },
  { label: "Contact Us", href: "mailto:evenzi.official@gmail.com" },
];

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p
        className="font-bold text-[#9ca3af] tracking-[0.2em] uppercase mb-4"
        style={{ fontSize: "10px" }}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {links.map((l) =>
          l.href.startsWith("mailto:") || l.href.startsWith("#") ? (
            <li key={l.label}>
              <a
                href={l.href}
                className="text-[#6b7280] hover:text-[#BB0020] transition-colors duration-200"
                style={{ fontSize: "13px" }}
              >
                {l.label}
              </a>
            </li>
          ) : (
            <li key={l.label}>
              <Link
                href={l.href}
                className="text-[#6b7280] hover:text-[#BB0020] transition-colors duration-200"
                style={{ fontSize: "13px" }}
              >
                {l.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export function PageFooter() {
  return (
    <footer className="w-full bg-[#f9fafb] border-t border-[#e5e7eb]">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 shrink-0 rounded-full bg-[#BB0020] text-white inline-flex items-center justify-center text-sm font-bold">
                E
              </span>
              <span
                className="font-bold text-[#1a1a1a]"
                style={{ fontFamily: "var(--font-manrope), sans-serif", fontSize: "16px" }}
              >
                Evenzi
              </span>
            </div>
            <p className="text-[#9ca3af] leading-[1.7]" style={{ fontSize: "12px" }}>
              Capture · Share · Cherish
            </p>
          </div>

          <FooterCol title="Product" links={PRODUCT_LINKS} />
          <FooterCol title="Support" links={SUPPORT_LINKS} />
          <FooterCol title="Company" links={COMPANY_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[#f3f4f6] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#9ca3af]" style={{ fontSize: "12px" }}>
            © 2026 Evenzi. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[#9ca3af]" style={{ fontSize: "12px" }}>
            <Link href="/legal/privacy" className="hover:text-[#BB0020] transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-[#BB0020] transition-colors">
              Terms
            </Link>
            <a href="mailto:evenzi.official@gmail.com" className="hover:text-[#BB0020] transition-colors">
              Help
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Browser check**

Scroll to the very bottom. Verify:
- 4-column grid: Evenzi brand + Product + Support + Company
- All links are clickable (mailto links open mail client, internal links navigate correctly)
- Bottom bar: copyright left, Privacy / Terms / Help right
- On mobile: 2-column grid (brand col spans full width), bottom bar stacks vertically

- [ ] **Step 4: Commit**

```bash
git add components/layout/PageFooter.tsx
git commit -m "feat(landing): footer enhancement — 4-col layout with product/support/company links"
```

---

## Final Verification

- [ ] **Full `tsc --noEmit` pass**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Live browser pass — 3 breakpoints**

Test at 390px (mobile), 768px (tablet), 1280px (desktop):

| Check | Pass? |
|---|---|
| Nav: "Get Started" red pill visible on desktop | |
| Nav: mobile drawer has both Sign In (text) + Get Started (red pill) | |
| Hero CTA: "Start Planning Free" + "See how it works ↓" visible | |
| Clicking "See how it works ↓" scrolls to feature grid | |
| Feature grid: 3-col desktop, 2-col tablet, 1-col mobile | |
| Feature cards: hover lifts + shadow + red border tint | |
| India block: dark bg, gold pills wrap naturally on mobile | |
| WhatsApp mockup: no broken elements, green header renders | |
| Social proof strip: 3 stats with dividers on desktop, stacked on mobile | |
| About Us: brand mark image loads (200 in network tab) | |
| Clicking nav "About" scrolls to About Us section | |
| Final CTA: white pill button, hover turns gold | |
| Footer: 4-col grid desktop, 2-col mobile, bottom bar links work | |
| No horizontal scroll at any width | |

- [ ] **Final commit (if any fixes made during verification)**

```bash
git add -p
git commit -m "fix(landing): post-verification tweaks"
```
