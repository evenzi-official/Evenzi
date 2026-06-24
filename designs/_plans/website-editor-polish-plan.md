# Website · Editor Polish — Plan (step-by-step)

**Scope:** Visual/spacing refinement of the Edit Pages editor (`edit-page.html`) + the shared breadcrumb, benchmarked against the WithJoy reference screenshots (2026-06-02).
**Owner:** Abhijith. **Approach:** one step at a time, sign-off + build + verify per step. **Plan only — no build until sign-off.**

---

## Reference read (WithJoy)

WithJoy's editor header is **lean**: `🏠  Welcome ▾   ☀ Public … Visit Site`, then editor form (left) + preview (right). No breadcrumb, no big section-head, no long subtitle, no separate tab row. Our editor stacks **6 chrome blocks** before content: floating nav → breadcrumb (wraps) → section-head + 2-line subtitle → wb-tabs (overflows) → Edit|Preview toggle → "Home" meta card. That density mismatch is the root of all three issues below.

---

## Step 1 — Spacing / chrome density (your #1)

**Problem:** Too much stacked chrome + large gaps push the actual editor far down the page; the section-head subtitle ("Add, arrange, and edit the sections on this page. Changes save automatically.") wraps to 2 lines and is redundant with the obvious UI; wb-tabs overflow-clip ("Edit Pa…").

**Proposed fix (page-scoped — `edit-page.css`, low risk):**
- Tighten vertical rhythm between breadcrumb → section-head → wb-tabs → view-toggle → `.dp-shell` (reduce the inter-block margins on the editor specifically).
- **Shorten the section-head** on the editor: drop the long subtitle (or reduce to a short 4–5 word line), and consider a smaller title size here (it's an editor, not a marketing header).
- Reduce `.dp-shell` top margin + the gap before the meta card.
- (Defer the bigger "do we even need section-head + wb-tabs in the editor" question to Step 1b if you want to go further toward WithJoy's lean header.)

**Decision D1:** how far to trim — (a) tighten gaps + shorten subtitle only (safe), or (b) also drop the section-head subtitle entirely + shrink the title. Recommend **(a)** first, see how it feels, then (b) if still heavy.

---

## Step 2 — "Home" card (meta bar) layout (your #2)

**Problem:** The `.ep-meta` card stacks awkwardly into 3 rows on mobile — `Home  PUBLIC  ☁Saved` / `Show on website [toggle]` / `COLLAPSE ALL` — unbalanced, lots of dead space, the COLLAPSE ALL pill floats oddly.

**Proposed fix (page-scoped — `edit-page.css`):**
- Restructure into a clean **2-zone** layout:
  - **Lead (left):** page name (bold) + tier badge + Saved indicator — reads as one header line.
  - **Actions (right / second row on mobile):** Show-on-website toggle + Collapse-all + delete, as a tidy aligned group.
- Desktop: lead left, actions right, single row. Mobile: lead row, then a clean actions row (even spacing, no orphan pill).
- Tighten the card padding; make "Saved" quieter (it's ambient, not a CTA).
- Borrow WithJoy's calm header feel — the page identity reads first, controls are secondary.

**Decision D2:** keep Collapse-all in this card vs move it to sit just above the section list (closer to what it controls). Recommend **move it** to a small control directly above the sections — it acts on the list, not the page meta. Cleaner card.

---

## Step 3 — Breadcrumb on mobile + "Vibrant Union" (your #3)

**What "Vibrant Union" is:** the **event name** (the demo wedding). The crumb `DASHBOARD › VIBRANT UNION › EDIT · HOME` = Dashboard → this event's hub → current page; the middle crumb links to the event control screen. It's meaningful context on desktop, but on mobile the 3-level path **wraps to 2 lines** and feels cramped/confusing.

**Proposed fix (SHELL-level — `shell.css`, cross-cutting: affects every page's mobile breadcrumb):**
- On mobile (≤767px), **collapse the path to just the back-chip + the active crumb** — e.g. `←  EDIT · HOME`. The DASHBOARD crumb is still reachable via the floating-nav logo (→ dashboard) and the event hub via the back-chip's parent; nothing is lost, the chrome gets much lighter (closer to WithJoy's `🏠 Welcome ▾`).
- Desktop keeps the full path (useful orientation + the event-hub link).
- The active crumb already exists as the brand pill, so this is mostly *hiding the middle crumbs + separators* under a media query.

**Decision D3 (scope):** this is the shared breadcrumb — the change improves **every** page's mobile view (they all wrap the same way), which is good, but it's cross-cutting. Confirm you want the mobile-collapse applied **shell-wide** (recommended) vs only on the editor.
**Decision D3b:** mobile collapsed form — (a) `← EDIT · HOME` (back-chip + active only, recommended) vs (b) `← DASHBOARD › … › EDIT · HOME` (keep first + last with an ellipsis).

---

## Order & process

Suggested order: **Step 3 (breadcrumb) → Step 1 (spacing) → Step 2 (home card)** — the breadcrumb + spacing together reclaim the most vertical room and make the page feel right, then the card polish lands on a calmer page. But your call — we do one at a time, each: confirm approach → build → verify on your phone → next.

The breadcrumb (Step 3) is the only **shell-level / cross-cutting** change — it gets a UI/UX agent pass before build. Steps 1–2 are page-scoped editor tweaks (lighter process).

## Built

### Step 1 — Spacing (2026-06-02) ✅
UI/UX agent plan-phase review (APPROVE WITH NOTES) → implemented its exact guidance (asymmetric scale: chrome gaps 12px, content gaps stay 16px). All page-scoped to `body[data-wb-page="edit"]` — siblings keep the shared 1.25rem rhythm (editor is intentionally denser = "edit mode").
- **edit-page.html:** eyebrow `Website · Edit Pages` → `Website`; **removed** the subtitle entirely (agent: don't shorten, remove — "saves automatically" already shown by the Saved chip).
- **edit-page.css:** `.bc-wrap` pt 24→16px; `.section-head` mt 20→12px; `.section-head-title` 2rem→1.65rem mobile / capped 2rem desktop; eyebrow mb→4px; `.wb-tabs-wrap` + `.dp-shell` mt 20→12px; `.dp-col-left` gap 20→16px; `.ep-meta` padding→.875rem; `.ep-view-btn` `min-height:44px` (touch floor — agent P1).
- **edit-page.js:** scroll the active wb-tab into view on load via direct `scrollLeft` (no smooth motion) — fixes the "Edit Pa…" clip.
- **Verified:** mobile 360/390 (no h-scroll; "Travel & Stay" long name OK), Edit|Preview = 44px, active tab "Edit Pages" visible, subtitle gone, title 26.4px mobile / 32px desktop, siblings (overview) untouched, no console errors. Reclaimed ~90–110px above the first field; "Add section" now near the fold.
- **Deferred to next steps (untouched here):** the meta-card 3-row mobile stacking (Step 2) and the breadcrumb mobile wrap (Step 3). Agent's Step-1b idea (drop wb-tabs inside the editor for the full WithJoy-lean header) noted but not done.

### Step 2 — Home card (2026-06-02) ✅
UI/UX agent plan review (APPROVE WITH NOTES). **Crux insight:** tier (Public/Private) and "Show on website" are two different concepts — the card's defect was the *false adjacency* (Private badge next to the toggle read as if the toggle flips access). Fix = **separate by role**, not merge.
- **edit-page.html:** meta card → 2 zones — **identity** (name + tier + Saved) | **one control** (Show-on-website toggle + delete). **Collapse-all removed** from the card → new chromeless **`.ep-section-bar`** (`N sections` · `Collapse all`) above the section list. Tier badge gets a `title` ("Access tier — set when the page is created") clarifying it's read-only.
- **edit-page.css:** lead `flex:1 1 auto` (tier `flex-shrink:0`, rides with the name); Saved `margin-left:auto` ambient + `.ep-saved-txt` `min-width:3.1rem` (reserve for "Saving…", no jitter); mobile (`≤767`) = 2 full-width rows, delete `margin-left:auto`; desktop = 1 row. Collapse-all **demoted** from `btn-pill-secondary` to a quiet ghost `.ep-collapse-btn` (40px target); delete 44px.
- **edit-page.js:** `renderList()` updates `#ep-section-count` (pluralized) + hides `.ep-section-bar` when 0 sections. Collapse-all handler unchanged (moved with the button, delegated by `data-ep-collapse-all`).
- **Verified:** mobile 2 clean rows + chromeless section bar; desktop 1 row; empty page (bar hidden, delete guarded); collapse-all → "Expand all" + collapses; count updates; Saved width-reserved (no reflow on Saving…); tier tooltip; no h-scroll; no console errors. Resolved the 3-row mess + the false tier/visibility adjacency.

### Step 3 — Breadcrumb (2026-06-02) ✅ — SHELL-LEVEL (all pages)
UI/UX agent plan review (APPROVE WITH NOTES) — caught 3 things and changed the approach:
- **My premise was wrong:** the back-chip renders as a bare `←` (label only in a click-toast), so collapsing to "active only" loses orientation. → Keep the **event name, drop DASHBOARD** on mobile.
- **There was already an ad-hoc collapse in 5 pages** (`event-control, guests, planning, invitations, media`) hiding a *different* crumb via inline `hidden md:` — two competing systems. → Unified to one shell mechanism.
- Collapsing to a single crumb breaks `aria-label="Breadcrumb"` trail semantics → keep 2 crumbs.

**Built:**
- **shell.css** (`≤767`, reuses the existing md breakpoint): `.bc-path > li:first-child` + its trailing `.bc-sep` → `display:none` (drops DASHBOARD + its separator; keeps event-name → active). Back-chip bumped to **44×44 on mobile** (touch floor; was 34px) — placed *after* the base `.bc-back` rule (first attempt was cascade-overridden).
- **Removed the 5 inline `hidden md:inline-flex` event-name collapses** (sed across the 5 files) so the shell rule is the single mechanism; `bc-system`/`bc-copy` mobile-hides untouched.
- **Verified cross-page @360/390:** editor `← VIBRANT UNION › EDIT · STORY`; overview/edit-pages similar; guests/event-control (former inline) now `← ANYA & KABIR › …` (unified); **settings (2-crumb) degrades gracefully to `← SETTINGS`**; all single-line, no wrap, no h-scroll. **Desktop unchanged** (full path, back-chip 34px). `aria-current` intact. No console errors.

**Deferred (agent P2, optional):**
- **Desktop legibility of the event crumb** — the founder's literal "what is Vibrant Union?" is a labeling read (all-caps + tracking makes the event name look like a system token). Fix would be title-case / an `event ·` micro-label, but it fights the breadcrumb's all-caps design language → deferred; mobile now reads it as the clear parent crumb.
- **Demo-data nit:** `event-control` (+ the 4 former-inline pages) say "ANYA & KABIR" while website pages say "VIBRANT UNION" — pick one demo event name for screenshot consistency.

---

**All 3 polish steps shipped.** Editor is materially leaner: ~90–110px chrome reclaimed (Step 1), the meta card reads as identity+one-control with tier/visibility disambiguated (Step 2), and the breadcrumb no longer wraps on mobile across the whole app (Step 3).

### Step 1b — Remove module tabs from the editor (2026-06-02) ✅
Founder circled the **two stacked pill rows** (module `wb-tabs` + the `Edit|Preview` toggle) as the remaining mobile spacing issue, and confirmed "from the editor the only navigation needed is back to the previous page." This is the agent's earlier-deferred Step-1b move.
- **edit-page.html:** removed the `.wb-tabs-wrap` block (Overview/Design/Edit Pages/Photos/Cards). The editor is a focused sub-mode; the breadcrumb back-chip (← to the Pages list, which keeps the tabs) is the only nav needed.
- **edit-page.css:** added `.ep-view-toggle-wrap` `margin-top:.85rem` (the toggle now follows the title directly); removed the dead `.wb-tabs-wrap` override.
- **edit-page.js:** removed the now-dead `scrollActiveTab` IIFE.
- **Verified:** mobile = single pill row (Edit|Preview), content (meta) now starts ~283px (was ~359 — **~76px reclaimed**), 14px title→toggle gap, no h-scroll, no console errors. Desktop = toggle hidden, clean 12px title→content gap (no orphan), back-chip works. Resolves the circled spacing issue.
