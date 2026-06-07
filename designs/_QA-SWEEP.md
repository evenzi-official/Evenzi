# Antigravity — Full design-prototype QA sweep

**Mission:** exhaustively test **every page** under `designs/` — click everything, every screen size, every state — across stress, gap, UI/UX, design-standard, interaction, responsive, and accessibility testing. Produce **one prioritized issues document** (`designs/_QA-FINDINGS.md`). This is a **read-only audit** — do NOT edit any build file; your only write is the findings doc.

Serve the prototypes with `npm run design` → **http://localhost:4000**. Test in a real browser at real viewport sizes — **evidence from the running page, never inference from code**. "Looks fine in the markup" is not a pass.

## ⚠️ Testing integrity — the last run produced JUNK; do NOT repeat it
The previous sweep navigated to wrong/404/directory-listing pages and then ran a blind axe scan against them → 908 entries that were **false** (every page reported "no `<h1>`/no `<main>`" though all pages have both; the flagged element was `<pre>` = a live-server directory listing). **Junk values are unacceptable.** Enforce:

1. **Load-sanity gate (per page, before ANY test):** navigate to the exact page URL, wait for full render, then assert it's the REAL page: `document.querySelector('body[data-page]')` exists, the page is NOT a directory listing (`document.querySelector('main, header, nav')` exists and there is no top-level `<pre>` listing), and the `<title>` matches. **If the page didn't load correctly, do NOT test it — record `LOAD-FAILED: <url> got <what>` and move on. Never emit findings derived from a page that didn't load.**
2. **Verify every finding against the live DOM before recording.** If an automated check (axe etc.) says "missing main landmark", confirm `document.querySelector('main')` is actually null before writing it. A check result on a mis-loaded or pre-render page is not a finding.
3. **No boilerplate.** Every finding MUST have: a real CSS selector / element, the **observed value** (e.g. "scrollWidth=531 vs innerWidth=360", "contrast 2.1:1"), exact repro steps, and a concrete fix. Generic text like "Review ARIA guidelines" / "Fix JavaScript error" is rejected — name the actual element and the actual measured problem.
4. **De-dupe across viewports.** Report each distinct issue **once**, listing which viewport(s) it occurs at — do NOT emit the same finding six times.
5. **Known-benign, do NOT flag:** the `/favicon.ico` + `/apple-touch-icon.png` 404 and the Tailwind-CDN production warning are known/benign — skip them. `href="#"` are intentional stubs (`LINK-AUDIT.md`) — not broken.
6. **Cover the manual dimensions, not just axe.** Last run did 0 interaction / design-standard / stress / gap testing. Those §2 sections (B click-everything, K design-standard, L gaps) are mandatory — actually click, type, resize, and judge.
7. **De-dupe across viewports — ONE entry per issue.** Last run still emitted the same finding ×6 (one per breakpoint). Report each distinct issue once with a `viewports: 360,390,…` field. Do NOT repeat per-viewport.
8. **Check `aria-hidden`/`role` before flagging "unlabelled".** Last run false-flagged the notification dots — they are `aria-hidden="true"` (correctly hidden from SR). An element with `aria-hidden="true"` or that's decorative is NOT an a11y finding. Verify the element is actually exposed to the a11y tree first.
9. **`components.html` is the dev component CATALOG** — it's intentionally wide (a showcase, not a user page). Do NOT flag its horizontal width as a bug. Test it for component states, not page-width.
10. **Grouped inputs:** an OTP/pin `role="group"` with an `aria-label` (e.g. "6-digit code") IS labelled — per-cell labels are a P2 nit at most, never a P0. Don't escalate labelled-group inputs to P0.
11. **If the agentic browser pass can't run** (e.g. CDP "context management" error, as happened twice): say so plainly at the top, complete the deterministic suite properly (real measured values, no junk), and **clearly list which §2 dimensions you could NOT cover** so the human knows the gap — never pad with fabricated interaction findings.

---

## 0 · Embody the right experts (read first, use throughout)
You are running as a panel of Evenzi's own agents — test with all of these lenses, every page:
- `ai/agents/test_engineer.md` — sad-path catalogue, reduced-motion, dark-mode contrast, real-device + TalkBack reality, content-length stressors.
- `ai/agents/ui_ux_designer.md` — visual consistency with the shell, hierarchy, motion/glow restraint, mobile ergonomics, two-user split, free-tier-feels-paid, content-length resilience.
- `ai/agents/frontend_engineer.md` — interaction correctness, states, build hygiene.
- `.cursor/rules/evenzi-design.mdc` — **the design-standard checklist** (tokens-only, no inline CSS/JS, reuse-before-create, hover-guard, glass fallback, mobile-first ≥44px, **even-distribution on mobile**, **no iOS input-zoom (16px)**, **`.section-head` template alignment**, dark mode + semantic status tokens, restraint).
- `docs/BRAND-GUIDELINES.md` — brand source of truth (color, type, clay radii, Liquid Glass, motion, dark/light tokens, `.page-band` width).
- `designs/components.html` + `designs/shared/shell.css` — the component catalog (for consistency/reuse/regression checks across pages).
- `designs/LINK-AUDIT.md` — the known link state. **`href="#"` are intentional prototype stubs — do NOT re-flag them as broken**; only flag links to files that don't exist.

If splitting the work helps coverage, dispatch sub-passes per category (interaction / responsive / a11y / design-standard / stress) and merge findings — but every page must be covered by every lens.

---

## 1 · Scope — EVERY page (crawl `designs/**/*.html`)
Test all ~35 pages. Groups (don't skip any):
- **Root:** `index.html` (dashboard), `components.html` (catalog).
- **auth/** auth, verify-otp, role-select
- **create-event/** step-1 … step-4-review, success (the full wizard)
- **event-control/** event-control, our-journey
- **event-settings/** general, guest-list, website, registry, plan-billing, admins
- **guests/** guests
- **invitations/** invitations
- **planning/** planning
- **media/** media
- **settings/** settings
- **website/** overview, design, photos, card-templates, edit-page, edit-pages, **templates/** (index + 5 theme previews)

For multi-tab / multi-state pages (planning Checklist+Budget, website Overview/Design/Photos/Card-Templates, event-settings sidebar, create-event wizard steps) — test **every tab / step / panel**, not just the landing state.

---

## 2 · Per-page protocol — run ALL of this on EACH page
**A. Smoke (gate):** loads with **zero console errors/warnings**; themed surface renders (tokens loaded); `<body data-page>` correct; chrome (floating-nav, tool-rail, breadcrumb, footer, help-FAB) renders + matches siblings. If smoke fails, record + still continue the rest where possible.

**B. Click EVERYTHING:** every button, link, tab, toggle, segmented control, chip, filter, sort, dropdown, picker/popover, modal trigger, FAB, swipe action, accordion, stepper, checkbox/radio, copy-button, theme toggle, avatar/menu. Confirm each **fires and produces the expected result** (panel switches, modal opens/closes, item adds/edits/deletes, filter applies, toast shows, etc.). Note anything that's dead, no-ops, or errors.

**C. Forms:** every input — empty submit, invalid input, valid input; error states (`.form-error`/`aria-invalid`) appear + recover; required markers; the **custom Evenzi date/time pickers** open (not the OS picker); selects/pickers work; loading/disabled states.

**D. Responsive — test at 360 / 390 / 414 / 768 / 1024 / 1440:** no horizontal scroll, no clipped/overlapping content, no truncated values; touch targets ≥44px on mobile; **mobile view of every page**; modals → bottom-sheet <768 with reachable actions; fixed chrome (nav/FAB/bulk-bar/dock) doesn't collide or cover content; **control rows distribute evenly on mobile** (no left-clump/dead-space).

**E. Interaction states:** every interactive element in default / hover (guarded) / active / focus-visible / disabled / loading / error / **empty-state**.

**F. Keyboard & focus:** logical tab order; Enter/Space activate; Esc closes overlays; arrow-keys on tablists/radiogroups/menus; visible focus ring everywhere; modal focus-trap + focus-return; no keyboard traps.

**G. Accessibility:** programmatic `<label>` on every input; icons `aria-hidden` + labelled controls; single logical heading order; **status never color-only**; dark-mode contrast WCAG AA (4.5:1 body, 3:1 large); `prefers-reduced-motion` honored; one `aria-live` per announcement (no nested live regions).

**H. Dark / light:** toggle works; both themes render correctly; contrast holds in both.

**I. Navigation:** links go where they should; back-chip/breadcrumb consistent with siblings; no dead links (excluding intentional `#`).

**J. Stress / content-length:** longest realistic content — 90+ char names, Devanagari (~1.4× width), crore-scale ₹ (₹1,20,00,000), many list items vs empty lists, 0 / 1 / many states; nothing breaks layout or truncates a value.

**K. Design-standard conformance (against `.cursor/rules/evenzi-design.mdc` + brand):** off-brand colors/hardcoded values; inline styles; un-guarded `:hover`; glass without `@supports` fallback / >2 blurred surfaces; garish/over-styled elements vs the shell's restraint; inconsistent components (a bespoke control where a catalog primitive exists); `.section-head` headings misaligned with page content; input-zoom on mobile focus (inputs <16px); uneven mobile control rows.

**L. Gap testing (what's MISSING):** missing empty states, missing error handling, missing loading states, missing keyboard paths, missing focus styles, cross-page inconsistencies (same component behaving/looking differently across pages), and anything a real host would expect that isn't there.

---

## 3 · Output — write `designs/_QA-FINDINGS.md` (the deliverable)

**Top — Executive summary:**
- Pages tested (count) · total issues · counts by **severity** (P0 blocker / P1 major / P2 minor / P3 polish) and by **category** (interaction / responsive / a11y / design-standard / stress / gap / nav / console).
- **Cross-cutting issues** (one defect appearing on many pages — call these out first; they're the highest-leverage fixes).
- The 5–10 worst pages / worst issues.

**Then — per-page sections** (`## <page path>`), each issue as:
```
- [Pxx][category] <one-line issue> — <viewport(s) where it occurs>
  - Where: <selector / area / control>
  - Repro: <exact steps>
  - Expected vs Actual: <…>
  - Evidence: <what you observed; screenshot ref if captured>
  - Suggested fix: <concrete>
```

**Rules for the doc:**
- **Every page gets a section**, even if clean ("✅ no issues found — tested: <dimensions>").
- **No silent skips.** If something can't be tested (e.g. needs a real device for TalkBack/iOS-zoom), record it as `MANUAL` with what to check.
- **Severity honestly:** P0 = broken/unusable or data-loss; P1 = major UX/a11y/responsive break; P2 = minor; P3 = polish.
- **Don't rubber-stamp.** A non-trivial page with zero findings means you didn't look hard enough — exercise every control + every viewport before declaring clean.
- **De-dupe into cross-cutting** when the same issue spans pages, but still list which pages.

---

## 4 · Method recap
1. `npm run design` → :4000. 2. Open each page; run §2 A–L at the 6 viewports. 3. Actually click/keyboard/resize — observe real behavior. 4. Record into `designs/_QA-FINDINGS.md` per §3. 5. Do NOT modify any build file. 6. When done, post a one-paragraph summary (totals + top cross-cutting issues) and confirm the doc is written.
