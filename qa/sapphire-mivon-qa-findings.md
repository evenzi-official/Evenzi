# Findings — Sapphire × Mivon guest site (2026-07-22)

## Summary

- **Personas used:** `ai/agents/test_engineer.md` (lead) · **Dimensions run:** D1 Functional, D7 Accessibility, D8 Responsive
- **Target:** `http://localhost:4000/pages/website/guest-site/sapphire-mivon/`
- **Design reference:** `http://localhost:4000/pages/website/guest-site/sapphire-lab/` (context only; D2 not in scope)
- **Findings:** 6 (P0 0 / P1 3 / P2 3) · **Overall:** **PASS-WITH-ISSUES**
- **Designs matched:** `designs/pages/website/guest-site/sapphire-mivon/index.html` ↔ sapphire-lab hero/unlock/nav patterns

Core guest flows (intro skip, check-in unlock, nav anchors, FAQ mouse interaction, gallery lightbox, horizontal overflow) pass at all five breakpoints. Accessibility gaps remain around focus management, keyboard-operable FAQ, and mobile touch-target sizing.

---

## D1 Functional

| # | Scenario | 360 | 390 | 768 | 1024 | 1440 | Evidence |
|---|----------|-----|-----|-----|------|------|----------|
| 1 | Intro skip → hero visible | PASS | PASS | PASS | PASS | PASS | `qa/_shots/sapphire-mivon/01-intro-skip-hero-{bp}.png` |
| 2 | Check-in → demo unlock → private content | PASS | PASS | PASS | PASS | PASS | `qa/_shots/sapphire-mivon/02-unlock-{bp}.png` |
| 3 | Nav anchor Story (`#story`) | PASS | PASS | PASS | PASS | PASS | `qa/_shots/sapphire-mivon/03-nav-story-{bp}.png` |
| 4 | Nav anchor Manifest (`#schedule`) | PASS | PASS | PASS | PASS | PASS | `qa/_shots/sapphire-mivon/03-nav-manifest-{bp}.png` |
| 5 | Nav anchor Party (`#party`) | PASS | PASS | PASS | PASS | PASS | `qa/_shots/sapphire-mivon/03-nav-party-{bp}.png` |
| 6 | Nav anchor Gallery (`#gallery`) | PASS | PASS | PASS | PASS | PASS | `qa/_shots/sapphire-mivon/03-nav-gallery-{bp}.png` |
| 7 | Nav anchor Q&A (`#qa`) | PASS | PASS | PASS | PASS | PASS | `qa/_shots/sapphire-mivon/03-nav-qanda-{bp}.png` |
| 8 | FAQ accordion expand/collapse (click) | PASS | PASS | PASS | PASS | PASS | `qa/_shots/sapphire-mivon/04-faq-{bp}.png` |
| 9 | Gallery lightbox open + Esc close | PASS | PASS | PASS | PASS | PASS | programmatic click on `.popimg`; Magnific Popup opens/closes |
| 10 | Mivon loader suppressed post-intro | PASS | PASS | PASS | PASS | PASS | `.loader-wrap { display: none }` via `sp-lab-ready` overlay |
| 11 | Dark/light theme toggle | PASS | — | — | — | — | toggled `body.light` class at 390px |
| 12 | Proceed link visible after unlock | PASS | — | — | — | — | `#sp-proceed` unhidden post-unlock |

### D1 Findings

_None — all in-scope functional flows pass._

---

## D7 Accessibility

| # | Scenario | Result | Evidence |
|---|----------|--------|----------|
| 1 | Esc closes check-in sheet | PASS | keyboard test @ 390px |
| 2 | Skip link present (`href="#story"`) | PASS | DOM inspection |
| 3 | Intro play button receives initial focus | PASS | `#sp-intro-play` focused on load |
| 4 | Intro modal focus trap | **FAIL** | Tab reaches hero/nav behind overlay |
| 5 | FAQ accordion keyboard (Enter/Space) | **FAIL** | `.accordion-button` is non-focusable `<div>` |
| 6 | Skip link tab order | **FAIL** | Skip link is 5th focus stop after intro dismissed |
| 7 | Touch targets ≥ 44px (mobile) | **FAIL** | hamburger + FAQ headers undersized |
| 8 | Theme toggle accessible name | **FAIL** | `.theme-icon` lacks `aria-label` |

### D7 Findings

**[P1] `#sp-intro` intro overlay — focus escapes modal while intro active**

- **Why it matters:** Keyboard and screen-reader users can tab to `#sp-unlock-open`, logo, and navbar behind the intro scrim while the intro dialog is still `aria-modal="true"`.
- **Expected:** Focus trapped inside intro until skip/play completes; background inert.
- **Actual:** Tab order after load: Skip intro → Check In (behind overlay) → logo → navbar toggler → body → Skip to story → intro controls (cycle repeats).
- **Repro:** Load page at 390px without skipping intro → press Tab repeatedly.
- **Shot:** `qa/_shots/sapphire-mivon/hero-390.png`

**[P1] `#accordionExample .accordion-button` — FAQ not keyboard-operable**

- **Why it matters:** WCAG 2.1.1 Keyboard — accordion headers are `<div>` elements with `tabindex="-1"` and no `role="button"`. Mouse click works (Bootstrap collapse); Enter/Space after programmatic focus does not toggle.
- **Expected:** Each FAQ header is a focusable `<button>` (or equivalent) activatable via Enter/Space.
- **Actual:** `#heading3 .accordion-button` → `tag=DIV`, `tabIndex=-1`, `role=null`; Enter does not expand `#collapse3`.
- **Repro:** Unlock page → scroll to Q&A → attempt keyboard-only expand of “Is there parking?”
- **Shot:** `qa/_shots/sapphire-mivon/04-faq-390.png`

**[P1] `.sp-skip` — skip link not first in tab order**

- **Why it matters:** Bypass blocks should be the first focusable control so keyboard users can jump past chrome quickly.
- **Expected:** “Skip to story” is first Tab stop after intro dismisses.
- **Actual:** Post-intro Tab order: Check In → logo → navbar toggler → body → **then** Skip to story.
- **Repro:** Skip intro at 390px → press Tab from top of page.
- **Shot:** `qa/_shots/sapphire-mivon/unlocked-390.png`

**[P2] `.navbar-toggler` — touch target below 44px (mobile/tablet)**

- **Why it matters:** Playbook requires ≥ 44px touch targets on mobile; hamburger is primary nav entry below 992px.
- **Expected:** ≥ 44×44px hit area.
- **Actual:** Measured 20×23px at 360px, 390px, and 768px.
- **Repro:** Load unlocked page at 360px → inspect `.navbar-toggler` bounding box.
- **Shot:** `qa/_shots/sapphire-mivon/hero-360.png`

**[P2] `.accordion-button` — FAQ row height below 44px**

- **Why it matters:** FAQ tap targets are only ~22px tall (width is fine); hard to hit on touch devices.
- **Expected:** Full-row tap target ≥ 44px height with adequate padding.
- **Actual:** ~22px height at 360–1440px (one item ~43px).
- **Repro:** Q&A section at 390px → measure any collapsed `.accordion-button`.
- **Shot:** `qa/_shots/sapphire-mivon/04-faq-390.png`

**[P2] `.theme-icon` — missing accessible name + slightly undersized**

- **Why it matters:** Icon-only control needs programmatic label; 40×40px is below 44px target at desktop widths.
- **Expected:** `aria-label="Toggle dark mode"` (or similar) and ≥ 44px hit area.
- **Actual:** `aria-label` null; child `<i title="…">` only; button box 40×40px @ 1024/1440px. Toggle function works.
- **Repro:** Unlock page @ 1024px → inspect `.theme-icon` in devtools a11y tree.
- **Shot:** `qa/_shots/sapphire-mivon/unlocked-1024.png`

---

## D8 Responsive & theming

| # | Scenario | 360 | 390 | 768 | 1024 | 1440 | Evidence |
|---|----------|-----|-----|-----|------|------|----------|
| 1 | No horizontal overflow (`scrollWidth ≤ viewport`) | PASS | PASS | PASS | PASS | PASS | `docW === winW` at all breakpoints |
| 2 | Hero boarding pass readable | PASS | PASS | PASS | PASS | PASS | `01-intro-skip-hero-*.png` |
| 3 | Mobile nav hamburger present < 992px | PASS | PASS | PASS | — | — | toggler visible, collapse works |
| 4 | Dark/light theme toggle | PASS | — | — | — | — | `body.light` toggles @ 390px |
| 5 | Touch targets ≥ 44px | **FAIL** | **FAIL** | **FAIL** | PASS* | PASS* | see D7 toggler/accordion findings |

\*Desktop theme icon is 40×40px (D7 P2) but nav links and primary CTAs meet target.

### D8 Findings

**[P2] `.navbar-toggler` + `.accordion-button` — mobile touch-target sizing** (same as D7 P2 above; filed once, referenced in both dimensions)

---

## Skipped / environment

- **D2 Design fidelity:** out of scope for this run.
- **D9 Security / D10 Build health:** out of scope.
- **axe-core automated scan:** not installed in project; manual keyboard/DOM checks used instead.
- **Cursor IDE browser MCP:** unavailable this session; validation via Puppeteer + system Chrome.
- **One transient console 404** observed on an early pass; no reproducing 404s on `networkidle2` reload — not filed.

---

## Appendix

### Commands run

```bash
npm run design   # assumed running — page returned HTTP 200
node qa/_tmp-sapphire-mivon-qa.mjs    # Puppeteer flow walk (temp, deleted post-run)
node qa/_tmp-sapphire-mivon-qa2.mjs   # gallery / overflow / a11y sizing (temp, deleted)
```

### Viewports tested

360 × 900 · 390 × 900 · 768 × 900 · 1024 × 900 · 1440 × 900

### Screenshot index (`qa/_shots/sapphire-mivon/`)

- `01-intro-skip-hero-{360,390,768,1024,1440}.png`
- `02-unlock-{360,390,768,1024,1440}.png`
- `03-nav-{story,manifest,party,gallery,qanda}-{360,390,768,1024,1440}.png`
- `04-faq-{360,390,768,1024,1440}.png`
- `hero-{360,390}.png` · `unlocked-{360,390,768}.png` · `nav-768.png`

### Console

No persistent `pageerror` events. Zero console errors on final `networkidle2` passes.
