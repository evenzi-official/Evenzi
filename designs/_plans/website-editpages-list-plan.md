# Website · Edit Pages — List View — Plan

**Page:** `designs/pages/website/edit-pages.html` (+ optional tiny `edit-pages.js`) — new route.
**User goal:** When a host opens **Edit Pages**, they should see **all the pages of their site** and pick one to edit — not get dropped straight into one page's editor.
**Module:** Website / Digital Presence. Design-path prototype.
**Owner:** Abhijith. **Date:** 2026-06-02.
**Build-order position:** Digital Presence build-order **step 3** (the list view) — was skipped; the detail editor (step 5, `edit-page.html`) shipped first. This fills the gap.

> **Status: PLAN ONLY — no build until Abhijith signs off.**

---

## 0. The gap (Abhijith, 2026-06-02)

The "Edit Pages" wb-tab currently points at `edit-page.html?page=story` — it jumps **straight into editing one page** (Story). There is no landing that lists all pages. Foundation plan §7.1 always specified Edit Pages = **"1 list view + 1 detail editor view = 2"**; only the detail editor exists. This plan adds the **list view** and makes it the tab's landing, with each page drilling into the existing editor.

Confirmed current wiring:
- `overview.html` + `design.html` wb-tab "Edit Pages" → `edit-page.html?page=story`
- `edit-page.html` (editor) back-chip → `overview.html`
- The Overview "Pages" card already lists pages with add / remove / hide / reorder-stub / **Edit chevron** (`data-dp-row-edit` → navigates to `edit-page.html?page=<id>`, wired last session).

---

## 1. What the list view is

A **dedicated, full-width page** that hosts the same Pages list the Overview card already has — but as the primary management surface. From here the host:
- sees **every page** (Home, RSVP, Schedule, Story, Wedding Party, Venue, Travel & Stay, Q&A, Gallery, + any added),
- **clicks a page → opens its editor** (`edit-page.html?page=<id>`),
- **adds / removes / hides / reorders** pages (reusing the machinery built on the Overview).

This is **almost pure reuse** — the row markup, the add-page picker (`#wb-addpage-modal`), the remove confirm (`#wb-removepage-confirm`), visibility toggle, reorder stub, and the row-edit navigation are **all delegated handlers in `website.js`**, so they work on any page that loads `website.js` and carries the `.dp-page-list` markup. New code is minimal.

---

## 2. Layout

```
[ chrome: floating nav · tool rail · breadcrumb · section-head("Edit Pages") · wb-tabs(Edit Pages active) ]

[ .bc-wrap ]
  .ep-list-card (clay-card, full width)
    header:  "Pages"  ·  "N total · tap a page to edit"          [ + Add page ]
    <ul .dp-page-list>
      .page-list-row × all pages   (drag-stub · icon · name · tier · 👁 · 🗑 · ✏️ chevron)
      …
    empty state (if 0 pages)
    [ + Add page CTA ]
```

- Reuses `.clay-card` + the exact `.dp-page-list` / `.page-list-row` structure from `overview.html:399–536`.
- **Primary action = open the editor.** Two affordances (D2): the **Edit chevron** (already wired, keyboard-focusable) + clicking the **row's name/meta region** (mouse convenience via a tiny delegated handler). Hide / remove / drag remain distinct controls.
- Full width (not the Overview's narrow sidebar column), so names + tier badges have room — no 360px crowding like the Overview card had.

---

## 3. Navigation rewiring

| Link | From | To |
|---|---|---|
| wb-tab "Edit Pages" (overview, design, edit-page, edit-pages) | `edit-page.html?page=story` / self | **`edit-pages.html`** |
| `edit-pages.html` breadcrumb back-chip | — | `event-control.html` (label "EVENT") — consistent with overview/design |
| `edit-pages.html` breadcrumb active crumb | — | "WEBSITE · EDIT PAGES" |
| **`edit-page.html` (editor) back-chip** | `overview.html` (PAGES) | **`edit-pages.html`** (label "PAGES") — the editor's true parent is now the list |
| Row "Edit" chevron + row-meta click (both overview card AND list) | — | `edit-page.html?page=<id>` (already wired) |

Result hierarchy: **Overview ↔ Edit Pages (list) → page editor → back to list.** Deep-linking from the Overview Pages card straight to the editor still works (convenience).

---

## 4. Component reuse audit

| Need | Decision | Source |
|---|---|---|
| Chrome (nav, tool rail, breadcrumb, section-head, wb-tabs) | Reuse as-is | shell + overview.html pattern |
| Pages list (rows, drag-stub, tier, hide, remove, edit chevron) | **Reuse `.dp-page-list` / `.page-list-row` markup** | overview.html:421–530 |
| Add-page picker · remove confirm · visibility · reorder-stub · row-edit nav | **Reuse — all delegated in `website.js`** (load it; zero new handlers) | website.js |
| `+ Add page` CTA / count / empty state | Reuse the Overview Pages-card idioms | overview.html |
| Whole-card layout | New, page-specific (full-width list card) | `edit-pages.css` (tiny) or inline reuse of `.dp-card` |
| Row-meta click-to-edit convenience | **New, tiny** delegated handler | `edit-pages.js` (or fold into website.js guarded by page) |

No new shell primitives. `edit-pages.js` is optional and tiny (only the row-meta click convenience); if we keep the Edit chevron as the sole affordance, **no new JS at all**.

---

## 5. Decisions for sign-off

- **D1 — Make the list the Edit Pages landing.** ✅ core of the request. wb-tab → `edit-pages.html`; editor back-chip → `edit-pages.html`.
- **D2 — Row click target.** (a) **Edit chevron only** (simplest, fully keyboard-accessible, zero new JS) vs (b) **chevron + whole-row/name click** (bigger mouse target, +1 tiny handler). Recommend **(b)** — a list whose rows don't respond to a click feels broken; the chevron stays as the keyboard/SR affordance. Low risk.
- **D3 — Overview Pages card: keep as-is** (at-a-glance summary + quick add on the landing; its Edit chevrons deep-link to the editor) vs slim it to a summary + "Manage all pages →" link. Recommend **keep as-is** — it's already built and useful; Edit Pages is the full surface. (Minor duplication, matches the foundation plan's "Overview has a pages panel" + "Edit Pages has the list".)
- **D4 — Add/remove/reorder on the list.** Reuse the full machinery (the list is the natural home for it). ✅ recommend. (Both Overview card and Edit Pages list can add/remove — same shared modals, same state idiom.)
- **D5 — Reorder.** Keyboard ▲▼ is not yet built anywhere (drag is an `aria-disabled` stub on both Overview and the editor). Keep the **stub** here too for consistency; real reorder is a separate cross-cutting task. ✅

---

## 6. States / test matrix (for the build phase)

- List renders all pages; row click + Edit chevron both → `edit-page.html?page=<id>` (correct id per row).
- Add page (picker) → row appears in the list; remove (confirm) → row goes; hide/show toggles; count updates.
- Empty state (0 pages).
- Editor back-chip → returns to `edit-pages.html` (not Overview).
- wb-tab "Edit Pages" active on the list; navigating Overview→Edit Pages→a page→back to list is coherent.
- Responsive 360/390/768/1024/1440 — full-width rows, no crowding, no h-scroll, touch targets ≥44px.
- Light + dark; focus management (row-meta click vs chevron); no console errors; no dead links.

## 7. Build order (after sign-off)
1. `edit-pages.html` — chrome + full-width Pages list (lift the Overview list markup) + Add-page CTA + empty state; load `website.js`.
2. (If D2=b) tiny `edit-pages.js` — row-meta click → navigate to editor.
3. Rewire the 3 wb-tab links → `edit-pages.html`; rewire `edit-page.html` back-chip → `edit-pages.html`.
4. Test matrix + UI/UX agent post-build pass.

## 8. Out of scope
- Real drag reorder (separate cross-cutting task).
- Changing the Overview Pages card (stays as-is per D3).
- Per-page editor internals (already shipped).

## Agent Review

**UI/UX agent verdict (2026-06-02): APPROVE WITH NOTES.** IA is right, reuse is ~90% sound — but the "almost pure reuse" claim hinges on three singular lookups in `website.js`; if the list card doesn't carry the exact hooks, the management actions die quietly. All corrections folded into the build constraints below (verified against website.js).

**P1 — hard reuse constraints (verified — website.js uses singular lookups):**
- `pageList = document.querySelector('.dp-page-list')` (website.js:548), `pagesCount = document.getElementById('dp-pages-count')` (549), `syncPagesState()` keys off `.dp-pages-card` + `#dp-pages-count` + `data-pages-state` (995–1005), `ensureRemoveButtons()` runs once at init (821). **→ Constraint:** the list card on `edit-pages.html` MUST carry `class="clay-card dp-card dp-pages-card"`, the count span `id="dp-pages-count"`, the list `<ul class="dp-page-list">`, and the `data-pages-state` empty-state markup. Otherwise add/remove/count/empty-state silently no-op. Baked into the build order.
- **Lift rows in pre-injection state** (toggle + edit chevron only, **no** pre-baked `data-dp-row-remove` buttons) — `ensureRemoveButtons()` injects Remove at load by querying the first `.dp-page-list`. Pre-baking would double them. (One list per page → the singular `querySelector` is safe here.)

**P1 — D2 row click target → option (b), NOT the agent's (c) stretched-link.** The agent recommended a `<a class="link-stretched">` on the page name. **But:** (1) no `.link-stretched` primitive exists in shell.css, and (2) the shared `buildRow()` in website.js renders the name as `<span class="dp-page-name">` — newly-added pages (via the picker) would then lack the link, diverging injected vs static rows. **Resolution:** keep the **Edit chevron as the keyboard/SR affordance** (already wired) + a tiny **guarded delegated row-click** in `edit-pages.js` (`if (e.target.closest('button,a')) return; else navigate`) as a mouse-only enlargement of the target. No nested-interactive ambiguity (the guard ignores the action buttons); keyboard path is the real focusable chevron.

**P1 — editor back-chip → list: note the deep-link case.** Rewiring `edit-page.html` back-chip from `overview.html` → `edit-pages.html` ("PAGES") is correct (the list is the editor's canonical parent). **Conscious consequence:** a host who deep-links into the editor from the *Overview* Pages card and presses back lands on the **list**, not the Overview. Acceptable (list is canonical); recorded so it's deliberate. No orphan/loop — Overview↔list→editor→list→Overview-tab all resolve.

**P2 — folded in:** repoint **all 4 links** (overview.html:154, design.html:156, edit-page.html:148 tab, edit-page.html:105 back-chip); use the count subcopy **"N total · tap a page to edit"** (NOT the Overview's "drag to reorder" — reorder is a stub, D5); reuse the empty-state markup verbatim (comes free once `.dp-pages-card` is reused); **test at 360px** a full-width row with a 40-char custom title + `lock Private` badge + drag + 3 actions — name must truncate/ellipsis (not wrap-push actions off), icon targets ≥44px, no h-scroll.

**Decisions D1–D5 — agent-reviewed, adopted:**
- **D1 → APPROVE** — list is the landing; tab + editor back-chip → `edit-pages.html`.
- **D2 → option (b)** (guarded row-click + chevron), with the rationale above (not (c) — conflicts with shared `buildRow` + no primitive).
- **D3 → APPROVE keep Overview Pages card as-is** — at-a-glance summary vs full surface; two add/remove entry points is fine for a Host.
- **D4 → APPROVE, conditional** on the P1 class/ID hooks + pre-injection rows.
- **D5 → APPROVE** reorder stays a stub (don't copy the "drag to reorder" subcopy).

## Built (2026-06-02)

**Shipped — Edit Pages list view; the tab now lands on a list of all pages.**

- **`edit-pages.html`** — full-width Pages list (9 rows) in a `.dp-pages-card` (carries the exact hooks `website.js` needs: `#dp-pages-count`, `.dp-page-list`, `data-pages-state`, empty-state markup). Rows lifted from the Overview card in **pre-injection state** (toggle + chevron only). Loads `website.js` → add-page picker, remove confirm, visibility, reorder-stub, row-edit nav all work for free; `ensureRemoveButtons()` injects Remove on the 7 non-mandatory rows.
- **`edit-pages.js`** — tiny guarded row-click (`closest('button, a')` → ignore; else navigate to `edit-page.html?page=<id>`). Edit chevron stays the keyboard/SR affordance.
- **`website.css`** — `cursor:pointer` + hover tint scoped to `body[data-wb-page="edit-pages"]` (hover-gated); a touch more row height for the full-width list.
- **Rewired 4 links** — "Edit Pages" tab on overview.html + design.html + edit-page.html → `edit-pages.html`; editor back-chip → `edit-pages.html`. No `?page=story` leftovers.

**Verified in-browser:** list renders 9 rows; count 9; remove on 7 non-mandatory rows (Home/RSVP excluded); add (9→10) + remove (→9) via reused modals; row-meta click → editor; Edit chevron → editor; editor back-chip + active tab → list; no h-scroll @360; drag hidden mobile; no console errors.

**UI/UX agent — plan APPROVE WITH NOTES (hard reuse-hook constraints folded in), post-build APPROVE WITH NOTES (no P0/P1).** All plan resolutions confirmed in code (hooks, pre-injection rows, D2 guarded row-click + no double-nav, back-chip → list, 4 links repointed, reduced-motion, no cross-page state confusion). Deviation recorded: long names **2-line-clamp** (not literal ellipsis) — safe (actions are `flex-shrink:0`, never pushed off).

**Nav hierarchy now:** Overview ↔ **Edit Pages (list)** → page editor → back to list. (Deep-link from the Overview Pages card straight to the editor still works; back then lands on the list — deliberate, list is canonical parent.)

**Deferred / out of scope:**
- **Pre-existing dead wb-tab anchors** — Photos (`overview.html#photos`) + Card Templates (`overview.html#cards`) target non-existent anchors; placeholders for deferred features (Photos parked until Media ships, Card Templates not built). Inherited across all 4 website pages — fix when those tabs are built.
- `components.html` backfill (growing).
- Real drag reorder (cross-cutting; keyboard ▲▼ exists only in the section editor).
