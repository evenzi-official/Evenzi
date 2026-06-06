# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## Recently Landed (2026-06-06 — Terse inline-chat mode + caveman eval)

Config/infra session, no tickets. Full report: `docs/session-reports/2026-06-06-session-report.md`.

- **Declined the `caveman` plugin** (global SessionStart hook + memory-file rewriting — conflicts with verbatim gates + scope-split). Built an in-house **terse inline-chat mode** instead: terse in 1:1 chat, full plain-English in all persisted/team-facing artifacts.
- Rule lives in memory (`feedback_terse_inline_chat.md`) **and** mirrored to a `## Communication Mode` section in `CLAUDE.md` — because memory is cwd-slug-keyed and doesn't load in worktrees (verified 0/22 worktree dirs have memory). CLAUDE.md is the worktree-proof carrier.
- **Open finding:** worktree memory blindness is systemic — affects ALL memory rules, not just terse. Decide later if other load-bearing rules need CLAUDE.md backing.
- Deferred (LOW): `/terse`↔`/full` toggle, per-turn enforcement hook, stray `-Users-xcalider-Documents-Evenzi-Evenzi/memory/` cleanup.

---

## Recently Landed (2026-06-05b — Multi-editor workflow OPERATIONAL: /spec-kit + /spec-kit-review + planning trial)

Infra/skill session. Built the whole multi-editor pipeline from `docs/specs/_WORKFLOW-TODO.md` and validated it end-to-end. Full report: `docs/session-reports/2026-06-05-session-report.md`.

**Shipped:**
- **`/spec-kit <page>`** + **`/spec-kit-review <page>`** skills (`.claude/skills/`), 7 kit templates, v1 alias map (10 slugs), re-run contract. Surfaced in `/start-evenzi-session`.
- **Editor wiring:** `.cursor/rules/evenzi-design.mdc` + `.agents/rules/evenzi-testing.md` → agent role-books + constraints.
- **Planning trial DONE:** `/spec-kit planning` → Cursor build (~95% spec-faithful) → Antigravity test → `/spec-kit-review` → LOOP (2 minor defects) → fixes → 🟢 DONE. Kit + built page in `designs/pages/planning/` (SPEC_VERSION 2026-06-05.2). 2 new shell primitives: `.checklist-row--simple`, `.status-badge--over`.

**Next:**
- **D.5 — judge Cursor → Pro/Pro+ decision** (evidence in `designs/pages/planning/_review.md`).
- `components.html` backfill now also owes `.checklist-row--simple` + `.status-badge--over`.
- Planning residual `7.device` (on-device crore-scale ₹ at 360px, manual).
- Kit the next page anytime: `/spec-kit <slug>`.

> ⚠️ The Guest Management "NOT MERGED" note below is now stale — it was merged to `Dev-Vibe` this session (FF to `2a232c1`), and this session's work merges on top.

---

## Recently Landed (2026-06-05 — Guest Management page, full build) — MERGED to Dev-Vibe

Host-side **Guest Management** built end-to-end (`designs/pages/guests/*`) + a **tagging & sub-event-assignment** feature + multiple founder phone-review passes. Committed on worktree branch `claude/affectionate-neumann-65a437` as **0dd40a5** (NOT merged to Dev-Vibe).

Shipped: stats cards · responsive guest cards · manual-RSVP setter (sheet/popover) · search/filter/sort · 5 modals · CSV import sim · per-guest function assignment + tags combobox · row meta strip · tag manager · zero-assigned banner · **Jira-style bulk select** (floating bottom bar) · **swipe-to-reveal row actions** (RSVP/Assign/Send) · icon-only Add FAB · offline toast. New shell primitives: `--danger`/`--warning` tokens, RSVP badges, status radio-pills, `.guest-row` family (surface+swipe-rail), `.tag-chip`, `.guest-assign-chip`, `.form-input-search`, `.form-check`, reusable `openPicker` (single+multi). Reviewed by council + Codex + UI/UX agent; critical a11y/trust fixes applied.

Full detail + deferred list: `designs/_plans/guests-plan.md` + `designs/_plans/guests-tags-subevents-plan.md`.

### Parked for next session (priority order)
1. **Merge to Dev-Vibe** (when ready) + council/Codex re-review of the final tagging state.
2. **Quick cleanup batch:** active-filter chips (removable, when results non-empty) · `title` tooltips (long names, `+N`) · dead-CSS cleanup (`.guest-row-actions`/`.gm-add-btn`/`.gm-sort`) · BRAND-GUIDELINES mirror `--danger`/`--warning` · bulk Tag/Assign pickers pre-fill current state · icon FOUT gate (shell-wide).
3. **`components.html` backfill** — sizable debt: all new guests primitives unrecorded.
4. **Public RSVP page** (guest-facing, no-login) — the other half of the feature. **DEPRIORITIZED — do at the very end, NOT a near-term priority.**

### Multi-editor workflow (proposed, not yet set up)
Split future dev: Claude (plan + review + merge) · Cursor (UI builds) · Codex (logic/refactor) · Antigravity (test). Handoff = a `docs/specs/<feature>.md` spec per feature (template not yet scaffolded). See chat plan from 2026-06-05.

---

## Recently Landed (2026-06-03b — Design review sweep + Photos/Card Templates tabs)

Second design-path session today. Page-by-page review/build + a permanent width fix. Full report: `docs/session-reports/2026-06-03-design-review-session-report.md`.

**Shipped:**
- **Dashboard** (`index.html`) — card consolidation (1 primary + flat secondary), full-width hero + 3-up grid, hero redesign (progress bar + up-next, conditional collab avatars/role tag), mobile button fixes.
- **Event-control** + **Our Journey** (`pages/event-control/our-journey.*` — new) — full-screen hero w/ bottom stats strip + scroll cue; uniform bento w/ links; dedicated sub-events/functions manager (add/edit/delete modals) feeding the public website roadmap.
- **Website tabs: Photos + Card Templates** (`pages/website/{photos,card-templates}.*` — new) — Card Templates (7-style filter, 18 SVG-placeholder tiles, lightbox); Photos (standalone Gallery manager w/ Media & Memories dependency banner, select/cover/remove + bulk). Removed redundant Edit Pages tab.
- **`.page-band`** canonical width wrapper added to `shell.css` + documented in `BRAND-GUIDELINES.md` (stops new pages "coming broken"). Breadcrumb sweep: "VIBRANT UNION" → "ANYA & KABIR" across 16 files.

**Genuine next-up:** the **public guest-facing website** (`evenzi.com/e/anya-kabir`) — Photos + Card Templates + Our Journey all feed it. Also carries: `components.html` backfill debt (2 sessions of new primitives), `/council` on the Photos→Media bucket lifecycle, real card PDF/PNG assets, and lingering "Vibrant Union" copy in some `<title>`/hero text.

> ⚠️ The "Immediate Next Steps" list further down is stale (predates the design-path work) — treat the bullet above as the live next step.

---

## Recently Landed (2026-06-03 — Website editor flow end-to-end + polish + per-page tier)

Very large design-path session. Built the whole **Website / Digital Presence editor flow** (Templates → list → per-page editor) and ran a multi-step polish + founder-review pass. Every build went plan → UI/UX agent plan review → sign-off → build → test → agent post-build review. Full report: `docs/session-reports/2026-06-03-session-report.md`. Per-feature `## Built` in `designs/_plans/website-*.md`.

**Shipped:**
- **Templates** (`designs/pages/website/templates/`) — gallery `index.html` + 5 detail pages + `templates.{css,js}`. Reuses `.dp-template-card` + `[data-palette]`/`[data-font]`; "Apply" round-trips via `sessionStorage` (+ `?apply=` fallback) into the Design tab (`design.js` extended: `dpHasOverrides`, `?apply=`, `dpCurrentTemplate`).
- **Overview modals** — Add-page picker + Remove-page confirm injected into `website.js SHARED_MODALS_HTML`. Completed the orphan **`.modal-picker-grid`** shell primitive (added the grid + `.modal-picker-tile-check` gating) + hardened radiogroup a11y. Page rows got Remove on the 7 non-mandatory pages (Home/RSVP locked).
- **Edit Pages per-page editor** (`edit-page.{html,css,js}`) — section engine, **all 11 section types** (inline editor + faithful live preview each), new shell primitives **`.dp-section-block`** + **`.dp-preview-frame.is-scrollable`**, mobile Edit|Preview toggle, autosave indicator.
- **Edit Pages list view** (`edit-pages.{html,js}`) — the landing the tab needed; lists all pages → click drills into the editor. Reuses the Pages-card machinery + delegated `website.js` handlers.
- **Editor polish** (`designs/_plans/website-editor-polish-plan.md`): Step 1 spacing (asymmetric 12/16px scale, removed subtitle, scroll-into-view), Step 2 meta-card redesign (**tier vs visibility disambiguated** — tier rides with the name as a label, visibility is the one control, collapse-all moved to a chromeless row above the list), Step 3 **shell-wide mobile breadcrumb collapse** (≤767: drop DASHBOARD + sep, keep `event → active`; unified 5 ad-hoc inline `hidden md:` collapses; back-chip → 44px), Step 1b removed the module tabs from the editor.
- **Founder review fixes:** event-control hero **top-anchored** (52px nav→breadcrumb, in sync with all pages — was centered); Share modal (squared WhatsApp textarea + 700px on desktop); **per-page Public/Private toggle** — the editor tier badge is now interactive (Home always Public; Pages list reflects via `sessionStorage epTier:<id>` + `website.js syncPageTiers()`).

**Carryover / next (see report for full list):**
- **`components.html` backfill — now sizable** (`.dp-template-card`, `.modal-picker-*`, `.dp-section-block`, `.is-scrollable`, `.epv-*`, gallery grid, tier toggle). Deferred all session.
- **Guest-side unlock flow** (public hero + "Unlock Guest Details" modal + RSVP) — designed, not built (DP steps 7–9); needed to make Private testable end-to-end.
- Dead `overview.html#photos`/`#cards` tab anchors (pre-existing); demo-name inconsistency ("ANYA & KABIR" vs "VIBRANT UNION"); dead `#dp-template-modal` selector in `design.js` (no-op).
- `/agent-evolve` candidates noted in the report (orphan-primitive check, toast-only back-chip label, tier-vs-visibility, asymmetric spacing scale).

---

## Recently Landed (2026-05-26 — Design tab shipped + cross-cutting bc-wrap fix + template route pivot)

Large design-path session. Design tab Phases 1–12 all shipped. UI/UX agent post-build review passed (APPROVE WITH NOTES); 2 P1s fixed in-session. Cross-cutting `.bc-wrap` bug fixed across 13 pages. Template picker redesigned then pivoted to a dedicated route (gallery + detail pages queued for next session).

### Design tab (`designs/pages/website/design.html` + `design.js`) — shipped

- 4 control cards: Template / Palette / Heading font / Cover & OG image
- 8 palettes (brand-red default + blush, ivory, sage, midnight, sunset, ocean, marigold) — driven by `[data-palette]` attribute selectors on `.dp-preview-frame` (now generalized to work on any element)
- 5 heading fonts (Poppins default + Cormorant, Playfair, Lora, Inter) — body locked to Poppins
- Live preview right column (sticky desktop, in-flow mobile) with `.is-controls-driven` cross-fade
- Cover & OG single card with toggle; CLS-safe `min-height` reserved
- Mobile "Jump to preview" anchor (IntersectionObserver-driven, only when preview is below viewport)
- Reset chips per axis — interactive (focusable button, hover rotates icon -90°)
- 2 inline modal instances: cover crop (`data-crop-aspect="16:9"`) + OG crop (`data-crop-aspect="1.91:1"`)

### `.bc-wrap` page-template fix (cross-cutting bug)

The Website module had a 144px void between floating-nav and breadcrumb; every other page had 52px. Root cause: leftover `margin:7.25rem` override from when `.floating-nav` was `position:fixed` (it's `sticky` now and occupies layout space).

- **Promoted `.bc-wrap` (+ `.bc-wrap-narrow`) to `shell.css`** as the canonical page-template wrapper (1.5rem top, 1440px max, 1.5rem/2.5rem padding switches at 768px).
- Removed website.css override + the 1rem section-head override.
- Converted 13 pages: invitations, guests, planning, media, settings + 6 event-settings (with `bc-wrap-narrow`) + overview/design. All now have an identical 52px nav→breadcrumb gap.
- Outliers kept distinct: event-control (sticky hub breadcrumb — intentional), auth/create-event (page-chrome, no `bc-shell`).

### Template route pivot (architecture committed; pages not yet built)

- Designed a redesigned mini-hero template picker modal (`.dp-template-card` with palette + heading font rendered in each tile, CURRENT pill decoupled from SELECTED rim).
- Pivoted: templates deserve a dedicated route. Modal markup deleted from design.html; "Change template" CTA is now `<a href="templates/index.html">` (404 until built — intentional URL contract).
- Modal-specific JS handlers stripped; `TEMPLATES` + `commitTemplate()` retained.
- Added `sessionStorage` round-trip hook in design.js: on load, reads `dpTemplateApplied`, commits if set, clears.

### Key locked decisions worth keeping in front next session

- **Templates are pages, not a modal** — gallery at `templates/index.html`, detail per template at `templates/<id>.html`.
- **`.dp-template-card` + `[data-palette]`/`[data-font]` selectors are reusable** — gallery/detail pages just compose them.
- **`.bc-wrap` is the canonical page-template wrapper** — DO NOT override at the module level; any new page just adds `class="bc-wrap reveal"`.
- **Discard-overrides confirm fires on the detail page** when host clicks "Apply this template" with non-default palette/font. Uses the existing `.modal-confirm-cautionary` shell.
- **Apply flow**: detail page → `sessionStorage.setItem('dpTemplateApplied', id)` → navigate to `../design.html` → `applyFromSession` IIFE commits.

Full report: `docs/session-reports/2026-05-26-session-report.md`.

---

## Recently Landed (2026-05-23 — Design tab Phase 0)

**Design path session — Website module, Design tab.** Plan written end-to-end + UI/UX agent plan-phase review + Phase 0 foundation built and verified. The actual `design.html` page is NOT yet built — Phase 1+ is queued for next session.

- **`designs/_plans/website-design-tab-plan.md`** (~510 lines) — plan v2 with full agent-review block. 1 P0, 8 P1s, 9 P2s all resolved or documented.
- **3 new shell primitives promoted to `shell.css`:**
  - `.modal-confirm-cautionary` — sibling of `.modal-confirm-affirmative` for "you'll lose X" flows (Reset overrides, Delete page, Remove guest, template-discard). Neutral icon tint, outline glyph, no spring pop, brand-red primary CTA stays visible.
  - `.dp-reset-chip` — per-axis override reset chip (Design tab + future Edit Pages per-page overrides). Hidden by default, reveals via `.is-visible`; hover rotates icon -90° + brand-tint fill.
  - `.dp-crop-stage[data-crop-aspect]` — 6 CSS-only aspect-ratio overrides (16:9, 1.91:1, 1:1, 4:3, 3:4, 9:16). Cover crop and OG crop are the immediate consumers.
- **Cross-cutting modals extracted** — Share / Publish settings / Publish-confirm / Discard moved from `overview.html` into `website.js` `SHARED_MODALS_HTML` constant (~180 lines, idempotent injection). Single source for every wb-page going forward. Discard rewritten on `.modal-confirm-cautionary`.
- **Overview re-verified end-to-end** post-extraction. Stacked modals (z:90/90+10), Esc cascades top-first, focus return to trigger, zero console errors. Screenshot in session report.

### Key plan decisions worth keeping in front next session
- **Cross-cutting modals are now JS-injected from website.js** — DO NOT paste modal markup back into any wb-page HTML.
- **Cover & OG live in a single card** with a toggle ("Use a custom social-share image"). Default state: OG auto-derived from cover. CLS-safe: `min-height` reserved on `.dp-og-block`.
- **Override pill = interactive Reset chip per axis** (not passive label). Per-axis reset only; no global "Reset all overrides" CTA.
- **Mobile "Jump to preview" anchor** is a Design-tab-specific feature for now (page-level, not shell-level). IntersectionObserver-driven floating bottom-right pill.
- **Desktop preview stickiness** must use `position:sticky + align-self:start` inside a height-matched grid (prevents orphan floating preview past controls).
- **Templates: 5 bundles.** Palettes: 8. Heading fonts: 5 (Poppins default + Cormorant + Playfair Display + Lora + Inter). Body font Poppins locked.

Full report: `docs/session-reports/2026-05-23-session-report.md`.

---

## Recently Landed (2026-05-22 — Digital Presence Foundation)

**Design path session — Website module.** First module designed under the new "UI/UX agent at PLAN phase" memory rule (paid for itself — caught 3 structural issues that would have caused major rework).

- **`designs/_plans/digital-presence-plan.md`** — comprehensive 402-line plan (5 tabs, 2-tier guest site, identity model, 12 section primitives, modal layer, locked Q1–Q8 defaults).
- **Website Overview tab** built end-to-end at `designs/pages/website/overview.html` (+ `website.css`, `website.js`) — rich breadcrumb with SYNCED clock, flat `.section-head`, URL/RSVP/lock card, get-started checklist (with all-done state), live preview, pages list, card-templates teaser, tip card.
- **12 new shell primitives promoted to `shell.css`:** `.section-head` family, `.status-badge` family, `.dp-page-tier`, `.dp-preview-frame` (3-mode: static/controls-driven/page-scoped), `.device-toggle`, `.dp-tile-grid` family (2/3/4 col + dense), plus 4 modal shells (`.modal-picker-grid`, `.modal-image-crop`, `.modal-image-lightbox`, `.modal-confirm-affirmative`) + `.modal-head` + `.dp-filter-chips` + `.modal-radio-row`. Plus `--success` token family.
- **Stacking-safe shell modal controller** rebuilt — `focusReturnMap[]`, `topModal()`, dynamic z-index, delay-trick visibility transition, sync reflow before focus. Exposed as `window.evenzi.openModal/closeModal`. Page-level duplicates deleted.
- **4 modal instances** wired in Overview: Share, Publish settings, Publish-confirm (stacks on top), Discard/template-reset.
- **Width alignment fix** — all content bands now 1440px (matching the floating nav); padding breakpoint moved to 768px.
- **New memory rule** `feedback_uiux_agent_in_planning.md` — dispatch UI/UX agent at PLAN phase on every non-trivial design task.

### Locked decisions worth keeping in front of you next session
- **Template bundles** Layout + Hero + Palette + Font; change resets via Discard confirm.
- **Cards palette-independent** (designer-made static PDFs/PNGs).
- **Photos tab deferred** until Media & Memories module ships.
- **Body font locked to Poppins**; only heading font is host-swappable.
- **OG image auto-derived** from cover; host can override.
- **12 section primitives** (added Map embed, Countdown, Video embed; folded two-column into heading+paragraph; dropped standalone CTA-button section).
- **Publish-confirm modal required** before Draft→Published.
- **Autosave model** — per-field blur, 600ms debounce, SYNCED chip in breadcrumb (no autosave toasts).
- **Per-page editor mobile** — Edit | Preview tab-toggle at <1024px; 55/45 split desktop.

Full report: `docs/session-reports/2026-05-22-session-report.md`.

---

## Top of queue (next session)

**Templates gallery + detail pages** — Design tab "Change template" CTA already links to `templates/index.html` (404 until built). Build:

1. `designs/pages/website/templates/index.html` — Gallery: 5 large `.dp-template-card`s in 3-col grid, "Current" pill on Bold Festive, click → detail page.
2. `designs/pages/website/templates/<id>.html` × 5 — Detail per template. Hero (full-bleed mock) + 3 page mini-previews (Schedule / RSVP / Wedding Party) + sticky sidebar with palette/font meta + "Apply this template" CTA. Apply CTA: if overrides exist, fire `.modal-confirm-cautionary` first → on confirm, `sessionStorage.setItem('dpTemplateApplied', id)` → navigate to `../design.html` → `applyFromSession` IIFE commits + clears.

Then in order:
1. Edit Pages list view → Add-page picker + Delete-page confirm
2. Edit Pages per-page editor → Add-section picker + 12 section primitive editors + Edit|Preview mobile toggle
3. Card Templates tab → Lightbox + filter chips + `designs/assets/card-templates/` scaffold
4. (Photos tab deferred until Media ships)

### Pending polish carryover
- **`designs/components.html` backfill** — STILL pending, growing. 12 primitives from 2026-05-22 + 3 from 2026-05-23 (`.modal-confirm-cautionary`, `.dp-reset-chip`, `.dp-crop-stage[data-crop-aspect]`) + new from 2026-05-26 (`.bc-wrap`+`.bc-wrap-narrow`, `--dpp-*` preview token family + 8 palette + 5 font variants, `.dp-template-card` family, `.dp-jump-preview`, all Design-tab cards). Do this when templates pages land.
- **Mobile real-device test of design.html** — Abhijith on phone via LAN URL. Browser/desktop covered.
- **Designer template thumbnails** — currently `.dp-thumb-fallback` (brand-red icon + name in small caps). Replace when assets land.
- **P2 polish from agent post-build:** toast-with-override-count, dark-mode Midnight palette visual check, reset-chip touch target ≥36px, roving tabindex idiom in radiogroups, `.dp-font-row`/`.dp-palette-tile` shell promotion (Edit Pages = 2nd consumer).
- Real QR generation via `qrcode-svg` lib (placeholder icon for now).
- `data-state="saving"` affordance hook on async save buttons.
- Glyph decision: `celebration` vs `rocket_launch` for Publish-confirm (currently rocket).
- Lock `.modal-actions` button order convention in `docs/BRAND-GUIDELINES.md`.
- Add a width-contract note to BRAND-GUIDELINES: any shell primitive sitting in the page-shell band must inherit `.floating-nav`'s 1440px max-width + 768px padding switch.

### Out-of-scope follow-ups
- `designs/pages/event-control/event-control.html:83-90` still uses legacy `role="tablist"` on cross-page nav — propagate the website-page fix when event-control is next touched.
- `.dp-icon-btn` / `.dp-icon-btn-sm` — PROMOTE to shell after second consumer.

---

## Recently Landed (2026-05-20 — Infra Session)

Pure infra/process. No ClickUp feature work touched.

- **New skill: `/council`** — multi-agent review with debate + Tech Lead arbiter. 4 modes (plan/design/code/bug), 5 phases, auto-invokes at 4 checkpoints. See `.claude/skills/council/SKILL.md`.
- **New skill: `/agent-evolve`** — agents accumulate inline learnings (cap 8 per agent). Auto-invokes on learning signals + end-session batch. See `.claude/skills/agent-evolve/SKILL.md`.
- **4 MCPs added (user scope):** playwright, context7, sequential-thinking, memory (KG, parked).
- **5 parked-runner agents deleted:** intake_agent, task_distributor, task_planner, system_checker, fullstack_engineer. Preserved on `Dev-Runner` branch.
- **`docs/ORCHESTRATION-MAP.md`** — 6 Mermaid diagrams covering session lifecycle, council internals, evolution loop, wiring.
- **CLAUDE.md** — Council Gates subsection + Self-evolution paragraph.
- **3 new memory rules** — tool preferences (auto-use Context7/Playwright/Seq-Thinking), council defaults (4 auto-trigger checkpoints), agent-evolution defaults (quality bar + cap).
- **Branch base sync** — worktree was on `origin/main` (10 commits behind). Merged Dev-Vibe in; 3 conflicts resolved (qa_engineer→test_engineer rename, start-session→start-evenzi-session rename, task_distributor delete).
- **Codex plugin** — install pending (login error during `/codex:setup`).

Full report: `docs/session-reports/2026-05-20-session-report.md`.

---

## Progress Tracker

### Full Document Suite (DONE — 2026-04-16)
- [x] Foundation docs (F1–F6 + Indian Events Dictionary) — `docs/foundation/`
- [x] Feature overviews for all 13 MVP modules — `docs/features/overviews/`
- [x] Ops docs (Platform Policies + Support Best Practices) — `docs/ops/`
- [x] Marketing docs (Brand Guidelines + Product Positioning) — `docs/marketing/`
- [x] PPT Script (investor + stakeholder) — `docs/presentations/`
- [x] Investor/User/Vendor Q&A scrutiny session — gaps identified and corrected
- [x] Open decisions documented — `docs/foundation/open-decisions.md`
- [ ] **5 open decisions need team discussion** — see `docs/foundation/open-decisions.md`
- [ ] **Share doc suite with Admin & Ops and Marketing & Branding teams via Google Drive**
- [ ] **Abhijith to fill 5 placeholders in `evenzi-ppt-script.docx` before presenting**

### Phase 1: ClickUp Setup (DONE)
- [x] Create Ideas list in Product space
- [x] Create workflow tags and assign to all existing tasks
- [x] Retroactive tracking — mark completed work (auth, designs, env vars)
- [x] Move post-MVP tasks to Ideas list
- [x] Update CLAUDE.md, ONBOARDING.md, PROJECT.md

### Phase 2: Feature Task Creation (MOSTLY DONE)
- [x] Create 9 feature parent tasks with descriptions and dependencies
- [x] Set feature dependencies in ClickUp
- [x] Clean up standalone tasks (deleted 32 flat tasks that didn't fit hierarchy)
- [x] Create `docs/clickup/` folder with 5 reference docs (TEMPLATES, GUIDELINES, WORKSPACE, INTAKE, DEPENDENCIES)
- [x] Add parallel subagent instructions to CLAUDE.md and start-session skill
- [x] Expand to 14 feature parents (added Landing, Admin, Event Mgmt Hub, Event Settings, User Settings)
- [x] Create full subtask hierarchy — 237 tasks across 10 features (Batches 1-3)
- [ ] **Batch 4 — remaining subtasks needed for:** Landing Section (86d2k1kwh), Admin Module (86d2k1kye), Digital Invitations (86d2jwza1), Digital Presence (86d2jwzge — partial, 1 component exists)
- [x] Sprint ClickApp enabled on all spaces

### Phase 2.5: Sprint Setup (NOT STARTED)
- [ ] Create Sprint 1 and assign features (Fix Vercel, Component Library, Auth)
- [ ] Create Sprint 2+ and assign remaining features per dependency order

### Phase 3: Implementation (IN PROGRESS)
- [x] **Fix Vercel Deployment (S — DONE)** — Live at evenzi.vercel.app
- [ ] Reusable Component Library (L — unblocks all UI work)
- [x] **Auth & Role Selection (M — DONE)** — Google OAuth, phone OTP, role selection, middleware routing, user_profiles table, auth-routing fix landed
- [ ] Profile Completion Gate — dashboard prompt for incomplete profiles (depends on User Settings)
- [x] **Event CRUD — 4-Step Wizard (XL — IN REVIEW)** — Spec done, 14 tasks implemented, 65 tests, E2E verified, revamp delivered, UI polish enhancement closed. Awaiting feature-level review.
- [x] **Host Dashboard (M — IN REVIEW)** — Server component with real event cards, hero CTA, empty state. Awaiting review.
- [ ] **Landing Section (L — IN PROGRESS)** — Subtask hierarchy in place (9 components). Static pages (Home, Layout, Legal) intentionally skip Backend Dev per JSON-config content architecture.
- [x] **Support Chatbot (MVP — PLANNED, not implemented)** — Spec + plan + multi-agent review + ClickUp hierarchy done. Blocked on Figma. Feature task: `86d2n3jxv`. See spec `2026-04-14-chatbot-design.md` and plan `2026-04-14-chatbot-implementation.md`.
- [ ] Event Management Hub (M — central navigation for event features)
- [ ] Guest Management & RSVP (L)
- [ ] Digital Invitations — WhatsApp (M)
- [ ] Planning Tools — Checklist & Budget (L)
- [ ] Media & Memories — Photo Gallery (M)
- [ ] Digital Presence — Event Website (L)
- [ ] Event Settings (M)
- [ ] User Settings (M)
- [ ] Admin Module (L — developer monitoring panel)

---

## Context

**Event CRUD is functionally complete.** Full 4-step wizard (Type → Details → Sub-Events → Review), success screen, dashboard with real event cards, all working end-to-end. Vercel deployment is live at evenzi.vercel.app.

---

**What was done this session (2026-05-19 — design-path: auth fixes, Step-3 modals, custom date/time pickers, header fix):**

- **Auth flow tested + reviewed** (was built but never reviewed). 8 P1–P3 fixes landed: pin-input wrap on iPhone-16 (fluid `.pin-input` cells), role-select mobile collapse (line-clamp + ≤480px block), roving tabindex, `href="#"` comments, `.btn-pill-lg` legibility, resend `document.hidden` guard, honest "min-height is a floor" comment.
- **ACCEPTED RESIDUAL (Abhijith, do not re-litigate):** role-select.html at 360px truncates role descriptions hard (`"Manc… you…"`) and host name wraps 2 lines (~18px taller than vendor). Collapse is fixed and layout is compact/balanced. Full fix needs a mobile column redesign (drop icon or stack) — **deferred, accepted as-is**. (Recorded here because `designs/_plans/auth-flow-plan.md` was deleted this session at Abhijith's request.)
- **Step-3 Celebrations modals (NEW)** — Set time / Set venue / Add custom ceremony, reusing the shell modal primitive. Auto-select, prefill, refresh-resilience, custom-card injection, Step-4 review display. Fixed a latent shell bug: `.sr-only` was referenced by the date/time-trigger doc-comment but never defined → added it to `shell.css` (also fixed `components.html`).
- **Custom Evenzi calendar (NEW shell primitive)** — `.cal-*` + `shell.js`; intercepts `[data-date-trigger]`, replaces the native OS picker app-wide. Hidden `<input type=date>` stays the value store; `data-native-date` fallback. Applied to **all** native date inputs: Step-2 EVENT DATE + `event-settings/general` (converted bare inputs to the trigger pattern). **Month/year quick-nav**: tap the title → Jan–Dec month grid, prev/next arrows step the year, full keyboard nav.
- **UI/UX-agent review DONE (2026-05-19 resume):** ran the agent over Step-3 modals + custom calendar + time picker. Verdict was *MERGE AFTER P1 FIXES* (no P0s). 4 P1s fixed + browser-verified: (P1-1) time-picker live pending-value read-out; (P1-2) `.tp-scroll` edge-fade + page-safe scoped scroll; (P1-3) Set-time error icon + `aria-invalid`/`aria-describedby`; (P1-4) `data-min-today` floors event/ceremony dates (past days disabled) on Step-3/Step-2/event-settings. P2s (AM/PM `radiogroup`, title-vs-3-fields hierarchy) deferred; `.cal-day` 36px **accepted, do not "fix"**. Commits `596c1cb`/`a4acf5b`/`a6306b7` **merged to `Dev-Vibe`** (fast-forward).
- **Custom Evenzi time picker (NEW shell primitive)** — `.tp-*` + `shell.js`; intercepts `[data-time-trigger]` (fixed "Pick a time not opening" — native `showPicker()` was unreliable on the now-hidden input). HH:MM + AM/PM, `data-native-time` fallback.
- **Step-3 End time** — added End time field; both optional, **End must be after Start** when both set (validated, blocks save). State/display/refresh-restore extended (`timeRaw {date,time,endTime}`).
- **Header-overflow fix** — all 5 create-event pages used dead Tailwind `hidden md:inline` (no Tailwind CDN there) → ~46px header overflow ≤~420px, distorting fixed sheets. Promoted to `shell.css` (`.page-eyebrow` responsive + new `.page-close-label`), stripped raw Tailwind.
- **`components.html` updated** — FF6 retitled/refreshed to showcase the custom Evenzi calendar + time picker (+ `.sr-only` / native-fallback note).
- Design-server dependency made resilient (`npm run design` → `npx --yes live-server`); `start-evenzi-session` skill: server-start is now step 1 of the design path.

**Open decisions / state:**
- `Dev-Vibe` is now at `a6306b7` (this session's full work merged). No held merge outstanding.
- Time-picker now has visual screenshot proof (resume session — screenshot tool worked: read-out + scroll-fade confirmed). Earlier programmatic-only caveat resolved.
- Sample-design parity is partial **by Abhijith's explicit choice**: no Today/Tomorrow chips, no month/year quick-nav caret, no Jan–Dec month-grid, no date ranges; time is HH:MM+AM/PM (no seconds). Revisit only if requested.

**Open follow-ups for next session:**

- **Celebratory Curator wizard (NEW)** — full 5-screen event-creation flow in `designs/pages/create-event/`. Triggered from Dashboard's `+ Create event` nav button and the empty-CTA "Start a new event" card on `designs/index.html`. Per-step routing via sessionStorage state machine (`evz-event` key). All 5 screens: step-1-type, step-2-details, step-3-celebrations, step-4-review, success.
- **Wedding-only MVP scope** — Step 1 has Wedding clickable; Birthday, Anniversary, Corporate dimmed with brand-tinted "SOON" tag and `aria-disabled="true"`. Click on disabled card fires a toast `BIRTHDAY COMING SOON` etc.
- **New shell primitive**: `.cw-stepper` family — 4-step progress indicator with `.is-done` / `.is-active` / upcoming states, mobile-collapses labels at ≤640px, connector min-width tightens further at ≤380px to fit small phones.
- **New shell primitive**: `.btn-pill-danger` — for destructive-but-not-primary CTAs (Sign Out). Transparent bg, brand-red border/text, brand-tint hover.
- **Loading-state visual upgrade**: `.btn-pill-spinner` replaced from a rotating circle to **3 bouncing dots** (using ::before/::after pseudo-elements + staggered animation delays). Reduced-motion fallback swaps to synchronous opacity pulse. Show-rule generalised to `.is-loading > .btn-pill-spinner` so any button (`.btn-pill`, `.btn-google`, etc.) inherits the pattern.
- **Auth flow follow-ups landed**: Logo bumped to 1.625rem mobile / 1.875rem desktop. `.nav-tabs.auth-tabs` track bg switched from `var(--peach)` (which is `#1f2937` solid in dark) to `color-mix(in oklab, var(--brand) 6%, var(--card))` — fixes the dark-mode "navy ring around tabs" bug. `.nav-tab` made self-sufficient (transparent bg + border:0 + appearance:none) so UA defaults don't leak through when Tailwind preflight loads late. Theme-toggle added to all 3 auth pages with localStorage persistence.
- **Settings page**: Logout button added in a new "Account" section between Notification Preferences and the action footer. Uses the new `.btn-pill-danger` variant. Wired in `settings.js` to navigate to `../auth/auth.html` on click with loading state + toast.
- **Settings cross-page hardening**: `.theme-icon-light`/`.theme-icon-dark` specificity bumped to beat Material Symbols' default `display:inline-block` (was causing both icons to render simultaneously in light mode).
- **P1 #3 (en-IN date format)**: review screen renders `2026-09-15 → "15 Sept 2026"` via `toLocaleDateString('en-IN')`.
- **`[hidden]` safety net**: `.cc-shell [hidden] { display:none !important }` so any flex/grid child honouring the `hidden` attribute doesn't show through. Fixes Birthday review (no partners row, no itinerary section).

**Open follow-ups for next session:**

1. ~~**P1 #5 — Page-chrome promotion to `.page-shell` family**~~ ✅ **DONE 2026-05-15** (commit `cb568d1`). Unified `.page-shell-*` family in shell.css, 8 HTML files renamed, auth.css + create-event.css trimmed to page-specific rules only. Net -5 LOC.

**Also done 2026-05-15:**
- ✅ Settings gear moved from top floating-nav → side tool-rail on 6 event pages. Top nav cleaner (Bell + Theme + Avatar only).
- ✅ Dashboard "+ Create event" CTA hidden at ≤768px (mobile nav was crowded).
- ✅ Built `designs/pages/event-settings/` with 6 polished pages: general, website, admins, guest-list, registry, plan-billing. Shared left sidebar nav, mobile horizontal-scroll-of-pills fallback, Save handlers + toasts.
- ✅ Promoted `.bc-copy` Tailwind utility chain (P1 from settings audit). Now `display:none` default + `@media (min-width:768px) { display:inline-flex }` in shell.css. Stripped 9 Tailwind tokens across 7 HTML files.

2. **Anniversary celebrations** — agent flagged that Indian 25th/50th anniversaries often have a puja + reception arc. Currently anniversary is "Coming Soon"; when it ships, decide whether Step 3 (Celebrations picker) is shown or hidden. Hint: maybe a simpler 2-celebration default (puja + reception).

3. **Step 3 meta buttons** — "Set Time" / "Set Venue" inside each celebration card currently fire stub toasts. Defer to a later session: build the actual time/venue pickers, integrate with the dashboard event-detail page.

4. **Form-validation helper (`data-validate` hook)** — still the highest-value deferred follow-up. Auth + wizard + settings all duplicate small validators. A delegated handler in shell.js that reads `data-validate="required|min:10|pattern:..."` on inputs and flips `aria-invalid` + `.form-error` text would normalise the pattern.

5. **Real-device WhatsApp Webview testing** — auth flow + wizard need a phone pass. Pin-input distribution, dark-mode contrast, +91 prefix readability — all phone-screen-only checks.

6. **`status-badge` primitive** — most-requested deferred P1 from the 5/11 audit. Canonical success / warning / danger / info chips. The new `.role-tag-soon` and `.cc-type-tag` are early variants that should generalise.

7. **Refresh-on-Step-3-mid-selection** is now state-safe (immediate sessionStorage write on toggle), but Step 2 form fields only autosave on `input` events (250ms debounced). If the user refreshes mid-keystroke they may lose <250ms of typing. Acceptable trade-off; flag for future.

8. **Custom ceremony picker** on Step 3 — `[data-cc-add-custom]` fires a `CUSTOM CEREMONY PICKER` toast but does nothing. Likely a modal with a free-text input. Defer.

---

**Next session intent (2026-05-15):** **Design the Auth flow** — Login / Sign Up / Role Selection — as static HTML/CSS/JS prototypes in `designs/pages/auth/`.

Four screens to build (Abhijith provided a Stitch/Figma reference screenshot last session):
1. **Login** — Phone-number entry + `Send OTP` brand CTA + `OR` divider + `Continue with Google` secondary. Two pill tabs at top (`Sign Up` | `Log In`, active=dark). Card layout, brand wordmark top-left, "Need Help?" link top-right. Subtitle: "Get started with your free event website and AI photo sharing." Footer: terms-of-service + copyright.
2. **Sign Up** — Same layout, `Sign Up` tab active, title swaps to "Create your Evenzi account."
3. **Role Selection — variant A ("Brand Left Aligned")** — Two role cards side-by-side (Host / Event Owner · Vendor) with brand-tint icon, description, and `Continue as <role>` brand CTA. "← Back to Login" beneath. Page-foot: Privacy Policy · Terms of Service · Help Center.
4. **Role Selection — variant B ("Final Layout")** — Same role cards, lighter page chrome (just copyright in foot).

**Ground against:** the live React implementation at https://evenzi.vercel.app/auth — match the visual reality, not invent. The static prototype's goal is to lock visual language for the existing React port to be brought up to.

**Shell primitives already available (no new ones expected):**
- Pill tabs → use `.radio-pill-group` from FF6 (was originally OTP-section reframed; works as 2-tab segmented control with `role="radiogroup"`).
- Phone input → `.form-input-group` + `.form-input-prefix` `+91` + `.form-input-field` (now proven on the settings page Profile section).
- Send OTP CTA → `.btn-pill.btn-pill-primary.btn-pill-lg` with the new `.is-loading` state (also proven on settings page Save button).
- "Continue with Google" → likely needs a new `.btn-google` primitive (white bg, brand line border, Google G mark, label text) — **add to shell.css**, candidate for promotion if any other social-login surfaces appear.
- Role cards → reuse `.choice-card` from settings (notification preferences pattern) — promote from settings.css to shell.css since this is the second consumer (per the choice-card rule established in the settings audit-fix plan).
- "Need Help?" link, "← Back to Login" link → candidate `.btn-text` primitive that was DROPPED from the settings session (agent's call). Re-evaluate: with 2+ consumers now (auth back-link, future "Forgot password?"), **promote `.btn-text` to shell.css** in next session.
- Form-validation helper (`data-validate` hook) — **build this first** before Phone-number input wiring. Agent flagged as the highest-value deferred follow-up; auth flow is exactly the second consumer that triggers the "build now or fork twice" decision.

**Build order (proposed):**
1. UI/UX agent gap audit on the 4 screens against current shell.
2. Promote `.choice-card` to shell.css. Promote `.btn-text` to shell.css. Add `.btn-google` to shell.css.
3. Build `data-validate` helper in shell.js (handles required, pattern, custom-validator hooks; flips `aria-invalid` + `.form-error` text).
4. Create `designs/pages/auth/auth.html` + `auth.css` + `auth.js`. Tab swap via JS toggles title + form behavior. Single page handles login + signup + role-selection states via `body[data-step]`.
5. Test on phone — WhatsApp Android Webview test for the Google button + Phone OTP flow especially.

**What was done last session (2026-05-14 — settings page audit-fix + Profile redesign, no ClickUp tasks):**
- **All P0/P1/P2/P3 from the settings shell-component audit resolved.** Plan + post-build review: `designs/_plans/settings-audit-fix-plan.md` (verdict: APPROVE WITH NOTES).
- **P2 root-cause fix:** `.form-input` default border re-based from `var(--brand-tint-2)` (18% red in dark — read as "semi-focused at rest" on every input page-wide) → `var(--line)` (neutral). Same fix applied to `.form-textarea`, `.form-select select`, `.pin-input-cell`. `.form-input-group` / `.form-input-trigger` inherit via composition; not double-updated. Affects every form-input across the app.
- **P0:** Removed 3 inline IIFEs from `settings.html`. Duplicate password-toggle (was causing double-fire bug — verified fix). `.toggle-switch` keyboard handler hoisted to `shell.js` as delegated listener with `preventDefault()` on Space (stops viewport scroll on Firefox/Safari). `data-toggle-card` (choice-card) handler moved to new `designs/pages/settings/settings.js`.
- **P1:** Removed 3 inline `style=""` attrs. New shell rules: `.fn-icon-btn[aria-current="page"]` (strict equality), `.bc-copy` base + icon size + hover/focus, `.help-fab` base rule (was Tailwind-only). Stripped the 11-class Tailwind chain from `.help-fab` across all 9 design pages.
- **P3:** `.floating-nav-inner.is-minimal` modifier added to shell.css; `!important` rule deleted from settings.css.
- **Profile section redesigned to 50/50 split:** Mirrors Security section's `border-left` divider pattern at ≥640px. Fields take the left column (Full Name, Phone with new `+91` split prefix using `form-input-group`, Email); avatar 96px (kept compact — agent overrode original 120px push) on the right with vertical divider. Mobile (<640px) stacks avatar above fields via `order:-1`.
- **`<label for="avatar-upload">` + visually-hidden file-input pattern:** Camera badge is now a real file picker. New `.avatar-edit-input` rule in shell.css with `:focus-visible + .avatar-edit-btn` to surface focus ring on the label. shell.js delegated change handler enforces 5MB cap with `#avatar-error` recovery message; fires "PHOTO READY" toast on success.
- **New shell primitives:** `.btn-pill.is-loading` + `.btn-pill-spinner` with reduced-motion fallback (spin → opacity pulse). Save button on settings demonstrates the pattern; 1.2s simulated roundtrip + success toast `SETTINGS SAVED`.
- **iOS PWA safe-area:** `.settings-actions` now has `padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px))`.
- **components.html showcase:** B2 Buttons gained `.btn-pill.is-loading` row (primary + secondary). AV1 Avatar editor gained a 3rd "File-input" variant demonstrating the `<label for>` pattern. S5 Help FAB tile rewritten — was still using the old Tailwind chain even after the build pass; agent caught it in post-build review.
- **UI/UX agent both pre-build (REVISE → revised) and post-build (APPROVE WITH NOTES). Final findings flagged:**
  - `.help-fab` hidden ≤768px but mobile tool-rail has no help entry either — design gap, flag for next session.
  - `.bc-copy` Tailwind chain `hidden md:inline-flex` still raw on settings.html — defer.
  - Tailwind CDN itself still on settings.html — defer to Next.js migration.
  - Security section breakpoint 880px (not 768) — keep, document.

**What was done previous session (2026-05-11 — components.html form fields + 10 new shell primitives, no ClickUp tasks):**
- Extended `designs/components.html` from 9 to 12 sections. New: **06 Form fields** (FF1–FF9), **07 Avatars & people** (AV1–AV2), **10 Dialogs** (DLG1–DLG2 + live demo). Added tiles in existing sections: S8 fn-notif-panel, B8 toggle-switch, B9 segmented-radiogroup, D8 scrollable-list, L4 section-rule. Replaced legacy `clay-pill` "VIEW DETAILS" CTA with canonical `btn-pill` set (B2). Replaced placeholder L3 with `empty-cta-card`.
- Added **10 new primitives** to `shell.css` (~411 lines): `form-textarea` (clay-sm radius), `form-select` + chevron (native picker, pill-styled), `form-input-group` + prefix/suffix/field (phone +91, currency ₹), `form-input-trigger` (date/time native picker bridge), `pin-input` 6-cell OTP, `radio-pill-group` (RSVP Yes/No/Maybe — `role="radiogroup"`), `form-error` + `form-helper-success` (semantic colors with icon — never color-only), `modal-scrim` + `modal-card` (single component, two presentations: centered ≥768px, bottom-sheet <768px with drag handle), `btn-pill:disabled` rule, `cs-code` + `cs-note` showcase utilities. `@supports not` fallback updated to include `.modal-scrim`.
- Added **4 new IIFEs** to `shell.js` (~269 lines): password show/hide toggle (delegated, supports both `data-pw-toggle="<id>"` and bare attr), radio-pill click + arrow-key navigation, date/time trigger that opens hidden native `<input>` sibling and formats DD MMM YYYY / 12-hour AM/PM back to label, modal/sheet open-close with **focus-trap (Tab/Shift+Tab cycle within `.modal-card`) + lastFocused restore on close + body.no-scroll lock**.
- **UI/UX agent ran two passes** — pre-build gap audit (24 components recommended; selected 10 P0 + 12 showcase tiles for already-existing primitives) and post-build review (4 P1s caught: B9 self-contradicting role-tablist demo, 80+ inline `style="..."` hits including 15+ verbatim `<code style>` blocks, FF1 autofocus stealing caret on page load, modal missing focus-trap/restore — a11y blocker). All 4 P1s fixed in-session.
- **Two build bugs caught and fixed**: (1) `<768px` media query was styling `.modal-static` showcase tiles, making DLG1 "centered modal" demo render with drag handle on mobile — fixed by scoping to `.modal-scrim:not(.modal-static)`; (2) live modal trapped inside `.reveal` containing block (CSS rule: `transform` on ancestor scopes `position:fixed`) — fixed by moving live modal target to body level just before `</body>`. Both fixes documented inline in markup.
- **Founder decisions locked in**: bottom-sheet `<768px` + centered modal `≥768px`; `form-textarea` uses `clay-sm` radius (16px); native `<input type="date|time">` with styled trigger (Android Webview reliability + WhatsApp in-app browser); legacy `clay-pill` "VIEW DETAILS" deleted.
- Plan doc + ## Built section: `designs/_plans/components-additions-plan.md`.
- Session report: `docs/session-reports/2026-05-11-session-report.md`.
- **Open follow-ups for next session:**
  - **Settings page form-input borders** — Abhijith flagged in screenshot: 3 fields rendering with overly saturated red borders against dark background. Likely a `var(--brand-tint-2)` saturation issue at 18% opacity in dark mode, OR `settings.css` has overrides. Investigate before tweaking shell.css. **This was Abhijith's stated next-session intent.**
  - **Form-validation JS helper (`data-validate` hook)** — agent's highest-value follow-up. Without it, Auth/Wizard/Guest invite/RSVP will each fork their own `form-error` wiring against the brand-new primitive within two pages.
  - WhatsApp Android Webview test of every new primitive (modal/sheet, OTP, radio-pill, form-input) — needs real device session.
  - `status-badge` primitive (canonical color-coded set: success / warning / danger / info) — most-requested deferred P1 from the gap audit.
  - Existing `.nav-tabs` usage in `floating-nav` and other pages still uses `role="tablist"` for buttons with no panels — match B9's reframing to `role="radiogroup"` where it's a filter, not page-content tabs.
  - Remove inline IIFE password toggle from `settings.html` (handler now lives in `shell.js`).
  - FF7 OTP showcase tile doesn't yet expose `aria-invalid="true"` error state — add when expanding form-field tiles.

**What was done previous session (2026-05-10 — design path skill + UI/UX agent + design folder fixes, no ClickUp tasks):**
- Added **"Design next page" path** to `/start-evenzi-session` (5a.7) under Abhijith. Five sub-sections: init (`ui-ux-pro-max` + UI/UX agent + `npm run design`), plan (component reuse audit + agent review + sign-off), build (no inline CSS/JS, mobile-first, agent passes per increment), test (component states + interaction + 6-width responsiveness + cross-page + mobile device + agent review), close. Eight path-specific rules. New table row in 5a.6 surface menu.
- Added **`npm run design`** script using `live-server` on :4000 / host 0.0.0.0 (LAN-reachable from phone). Added `live-server` devDep + `.claude/launch.json` `design` config.
- **Reorganized `designs/`** flat → structured: `designs/{shared/, pages/<page>/, assets/}`. Dashboard renamed to root `index.html`. All 9 HTMLs and `index.css` path-rewritten. Smoke test: every internal href returns 200.
- **Created `ai/agents/ui_ux_designer.md`** — Evenzi UI/UX role book (216 lines). Two-user split, free-tier-feels-paid, WhatsApp-aware, anti-trend stance, component reuse, content-length resilience, mobile-dominant responsive, motion restraint, glass surgical, a11y floor, performance discipline, `code quality in designs/`. Defers project facts to `docs/foundation/*` and `BRAND-GUIDELINES.md` (read at task time, not baked in). Evolves freely with new patterns learned per pass.
- **Reconciled `docs/BRAND-GUIDELINES.md`** to mirror `designs/shared/shell.css` — brand red `#BB0020`/`#ee3f3a`, Poppins, Liquid Glass tokens, clay shadow system, light + dark values, motion + a11y. Replaced placeholder draft.
- **Updated `/end-evenzi-session`** symmetrically: 4a.1 ClickUp step now conditional (skip for design-only sessions), new 4a.7 design-path closing (verify `## Built` block, verify `components.html`, agent file evolution expected, stop design server), renumbered downstream sections.
- **First UI/UX agent review pass on `designs/`** — full sweep, ~5000-word findings. P0/P1 fixes applied directly:
  - **P0** Extracted 688-line inline `<style>` from `event-control.html` into new `event-control.css`. Fixed live `.stats-strip-card` opacity bug where the inline 75% was winning the cascade against shell.css's documented 28% bleed-through.
  - **P0** Wrapped 34 `:hover` rules in `@media (hover:hover) and (pointer:fine)` across `shell.css` (28), `index.css` (4), `settings.css` (2). No more sticky-hover on touch.
  - **P1** Added `@supports not (backdrop-filter)` fallback for 9 Liquid Glass primitives.
  - **P1** Switched breadcrumb clock to 12-hour AM/PM. `tickClock` now pauses on `document.hidden` + `visibilitychange` (battery saver).
  - **P1** All 3 dashboard featured-event cards: `<a>` wrapping faux-button `<span>`s → `<article>` + `<h2><a class="fec-link-stretched">` + real `<a>` action buttons (z-index pattern).
  - **P1** Dashboard filter pills: `role="tablist"` → `role="radiogroup"`, `aria-selected` → `aria-checked` (correct semantics; they're toggles, not tabs).
- **Memory: paired-skill consistency rule** — when editing one of start-evenzi-session ↔ end-evenzi-session, audit and update the partner. Saved to `~/.claude/projects/.../memory/feedback_paired_skill_consistency.md`.
- **Open follow-ups for next session:**
  - Replace `designs/assets/hero-image.jpg` (6.8 MB → ~250 KB sized variant). Blocks meaningful perf testing on guest devices.
  - **Design the public RSVP page** — guest-facing surface, AAA contrast, two-tap, WhatsApp-in-app-browser tested. First real exercise of the new design path skill end-to-end.
  - Auto-inject chrome (head, footer, FAB, toast, nav, tool-rail) via `shell.js` to stop the 8x duplication.
  - Tokenize type scale, radii, spacing, semantic colors in `shell.css`.
  - Doc consistency cleanup: 4-step vs 5-step wizard mismatch between `user-types-scope.md` and `user-flows.md`.

**What was done previous session (2026-05-10 — design system + 8 new screens, no ClickUp tasks):**
- Built the **Evenzi static-prototype design system**. Two new shared files: `designs/shell.css` (~700 lines: tokens, Liquid Glass, clay surfaces, floating nav, breadcrumb, tool rail, footer, FAB, toast, scroll-progress, reveal, motion patterns + component primitives — clay pill, hero pill/meta chip, tool card, qa card/tile, stats strip, stat icon, avatar stack, empty CTA card, checklist row, btn-pill, form-input/label/password, toggle switch, section rule, avatar-edit, notification dropdown panel) and `designs/shell.js` (theme switcher, breadcrumb interactivity, tool rail/nav-tab active state via `body[data-page]/[data-section]`, scroll progress, scroll reveal w/ sync in-viewport fallback, count-up + bar-fill, **auto-injected notification dropdown** for any bell button).
- Created **5 sub-page shells**: `designs/guests.html`, `invitations.html`, `planning.html`, `media.html`, `website.html` — all link `shell.css` + `shell.js`, share the same nav/breadcrumb/tool-rail/footer/help-FAB/toast/scroll-progress shell, render only a page header + empty content card. Auto-active state per page via `body data-page` and `data-section`.
- Created **`designs/components.html`** — full component-library showcase: 9 sections (Foundations, Shell/Chrome, Surfaces, Pills/Chips, Buttons/Controls, Data Display, Layout primitives, Backgrounds, Motion patterns), 30 components with all states, ~42 tiles total.
- Created **`designs/dashboard.html`** + `designs/dashboard.css` — user home page after login. Single page with **4 toggleable view combinations** (MY EVENTS · ACTIVE / PAST × COLLABORATIONS · ACTIVE / PAST), JS-driven via `body[data-ownership]/[data-time]`. Dashboard-specific nav variant: drops segmented Dashboard/Website tabs, adds **+ Create Event** CTA. Featured event card uses `hero-image.jpg` cover + 3 hero meta chips + avatar stack + countdown chip + 2 CTAs. Compact event cards in the right column. "Empty state" CTA cards for "+ New project" and "Join with code". Includes a "No past collaborations yet" empty state for the 4th view.
- Created **`designs/settings.html`** + `designs/settings.css` — top-level user settings page (no event scope). 3 sections: Profile information (name/phone/email + avatar editor with camera badge), Security (current password + new password with eye toggle + Update password CTA, 2FA toggle switch with description), Notification preferences (3 choice cards: Email/Push/SMS — toggle active/inactive). Discard + Save All Settings action footer. Reuses `clay-card` for surfaces and `btn-pill` for actions.
- **Refactored `event-control.html`** to use `shell.css` + `shell.js` — removed 7 duplicated inline IIFEs (~210 lines) that lived in shell.js (theme/breadcrumb/tool-rail/scroll-progress/reveal/count-up/bar-fill); kept 3 page-specific IIFEs inline (hero parallax, QA tile composer, journey ring). Same logo/breadcrumb/footer markup; visual unchanged. Theme toggle now fires once per click (was double-firing). Updated all 14 navigation links to relative `.html` filenames + dashboard.html as top-level home (logo, breadcrumb DASHBOARD link, back chip).
- **Locked navigation hierarchy**: Logo (every page) → `dashboard.html`. Breadcrumb "DASHBOARD" path link → `dashboard.html`. Back chip = parent in tree (sub-page → event-control; event-control → dashboard; settings/components → dashboard). Dashboard/Website segmented tabs stay event-scoped only. Audited all 8 pages.
- **Liquid Glass design enforcement**: restored full glass treatments in light mode (qa-card, qa-tile, stats-strip-card, hero-pill, hero-meta-chip — all use `--lg-bg-grad` + backdrop blur or translucent `card/N%` with saturation boost). Reduced opacity on hero stats from 75% → 28% (light) / 60% (dark) so the hero image bleeds through. Hero pills now glass instead of solid white.
- **Mobile + accessibility polish**: floating nav `top: calc(.85rem + env(safe-area-inset-top))` so iOS PWA status bar doesn't overlap the avatar. Tool rail dock + Help FAB respect `safe-area-inset-bottom`. Touch targets ≥44pt. Reduce-motion respected. All forms accessible (aria-label, aria-checked, aria-pressed). Notification panel uses ARIA dialog + Esc close.
- **Notification dropdown panel** auto-injected on every bell button. Glass card with header (Notifications + Mark all read) + 5 sample items (2 unread with red pip indicator) + View all footer. Closes on outside-click, Esc, or scroll-start. Repositions on resize.
- **Activity timeline ring color fix**: replaced Tailwind's `ring-brand/20` (which falls back to default blue with CSS-var colors) with explicit `box-shadow: 0 0 0 4px var(--brand-tint-2)`. Applied in both event-control.html and components.html.
- **Component reuse cleanup**: promoted `.fec-action` (was in dashboard.css) to shell.css as `.btn-pill` / `.btn-pill-primary` / `.btn-pill-secondary` / `.btn-pill-lg`. Updated dashboard.html (12 instances) + settings.html to use the shared button. Removed duplicates from settings.css. Reused `.clay-card` for settings sections instead of bespoke `.settings-card`.
- **Checklist row redesign**: replaced the heavy 6-line-wrapping rounded-square checkbox with a clean Apple-Tasks-style row — circular checkbox (22px), 2-line title clamp, optional muted sub-line for vendor/category, due chip with `is-urgent` variant (red bg + clock icon), uses `:has()` selector for checked state (filled brand circle + line-through title). Promoted to shell.css. Updated event-control "Up Next" list (8 items) and components.html showcase.
- **Tested** across 7 pages × light/dark × mobile (375px), tablet (768px), desktop (1280px, 1440px, 1600px). Floating nav aligns end-to-end with main content (max-w-[1440px] + matching px). Zero console errors. All filter combinations verified.
- **Open follow-ups for next session:**
  - Wire dashboard pages to real Next.js routes (currently links go to `.html` filenames, will need to map to Next.js dynamic routes when integrated)
  - Add `manifest.webmanifest` for PWA shortcut path (referenced but missing)
  - Switch from Tailwind CDN to project Tailwind build when migrating to the Next.js app
  - Touch-target audit: `fn-icon-btn` is 40px desktop / 36px mobile — below Apple HIG (44pt) and Material (48dp). Bumping requires revisiting nav density. Defer to integration phase.
  - components.html showcase doesn't yet demonstrate the new `.btn-pill`, `.form-input`, `.toggle-switch`, `.avatar-edit` primitives — add tiles for these.
  - event-control.html still has its own inline `<style>` block (~700 lines). Could be further refactored to fully use shell.css, but kept as canonical reference per earlier instruction.

**What was done previous session (2026-05-09 — design exploration, no ClickUp tasks):**
- Designed the **Event Management Hub / Event Control** screen end-to-end as a self-contained HTML/CSS/JS prototype at `designs/event-control.html` + `designs/hero-image.jpg`. Single source-of-truth for the per-event command center landing screen — replaces earlier Stitch drafts.
- Visual language locked: **Apple-style Liquid Glass** (themed light/dark tokens — black-tinted in light to avoid wash-out, white-tinted in dark for refraction), **Evenzi red brand** (`#BB0020` light / `#ee3f3a` dark), **Poppins** typography, claymorphism radii (24/16/9999px).
- Page composition: floating glass nav (logo + Dashboard/Website tabs + bell/theme/settings/avatar) → sticky breadcrumb → full-viewport hero (Anya & Kabir's wedding) with parallax bg image + interactive Quick Actions card + Venue/Date glass chips + 4-stat strip → "Our Journey" timeline snapshot (circular progress ring + featured "Catering menu finalisation" card + 7-step roadmap dots) → "Manage your event" 5-card bento (Guest mgmt, Invitations, Planning, Media, Website — uniform brand-red icons + numbered corners 01–05) → Up next checklist + Recent activity (both scrollable glass cards with mask-fade edges) → footer.
- Interactive layer: scroll-progress hairline at top, scroll-spy on tool rail, count-up stat numbers, progress-fill bars, IntersectionObserver-driven section reveals, mouse parallax on hero, theme persist via localStorage.
- Tested across 1280/768/375 × light/dark — all sections legible, glass elements hold up, no JS errors.
- Preview server config added to `.claude/launch.json` as `stitch-preview` (Python http.server on port 8770 from `designs/`). Original `nextjs-dev` config preserved.
- **Open follow-ups:** wire to real Next.js routes (links currently 404), add `manifest.webmanifest` for the PWA shortcut path, switch from Tailwind CDN to project Tailwind build when integrated.

**What was done previous session (2026-05-04):**
- Created `/start-evenzi-session` and `/end-evenzi-session` as **proper project skills** at `.claude/skills/start-evenzi-session/SKILL.md` and `.claude/skills/end-evenzi-session/SKILL.md`. Both ask "Who's using? (Abhijith / Dheeraj)" and branch the flow accordingly (Abhijith path = full ClickUp + Dev-Vibe; Dheeraj path = `dheeraj-progress.md` + feature branch only)
- Renamed-not-duplicated: deleted the original `.claude/skills/start-session/` and `.claude/skills/end-session/` (these were the generic ancestors; the Evenzi-specific upgrades replace them)
- Updated `.claude/skills/clickup-pm/SKILL.md` with two new modes: `sync-dheeraj-progress` (approval-gated read of un-synced entries from `dheeraj-progress.md`, push to ClickUp as comments + status updates, archive into `## Synced`) and `regenerate-digests` (overwrites per-user `abhijith.md` / `dheeraj.md` digests from current ClickUp state)
- Updated `.claude/skills/session-report/SKILL.md` references from `/end-session` → `/end-evenzi-session`
- Created `docs/sprint/README.md` — pointer to active sprint (none yet), folder layout spec, ownership matrix, append-only rules
- **Renamed `ai/agents/qa_engineer.md` → `ai/agents/test_engineer.md`** and enriched it: 3 modes (Planning / Execution / Maintenance), 10-row stack-and-coverage matrix (Vitest, Playwright, axe, Lighthouse, etc.), sad-path catalogue (auth/validation/DB/network/state/third-party/UI), test plan template that writes to `docs/test-plans/<slug>.md`, backlog of features needing backfill (Auth, Event CRUD, Host Dashboard)
- Updated all live references to the renamed agent: `ai/pipelines/feature.md`, `enhancement.md`, `bug.md`, `ai/agents/task_distributor.md` (6 places + sweet-spot row rewrite), `CLAUDE.md` (env var comment), `.claude/skills/plan-review/SKILL.md` (table + perspective bullets), `docs/foundation/team-structure.md`. Historical specs/plans (chatbot, agent-runner, mission-control) intentionally left unmodified
- Updated memory entries `project_team_split.md` and `project_dheeraj_no_clickup.md` to confirm the skills exist as files (not just references) and to instruct using `/start-evenzi-session` + `/end-evenzi-session` over the generic ancestors

**What was done previous session (2026-05-03):**
- ClickUp connection validated (workspace ID 90161512057, 3 spaces resolved)
- 6 ClickUp task transitions applied with comments:
  - Fix Vercel Deployment (`86d2jmkn4`) → done
  - UI Polish enhancement (`86d2kt2qj`) → done (revamp covered it)
  - Auth & Role Selection (`86d2jwz1h`) → already done, confirmation comment
  - Event CRUD wizard (`86d2jwz3x`) → review
  - Host Dashboard (`86d2jwz6v`) → review
  - Landing Section (`86d2k1kwh`) → in progress
- Three tasks moved from Backlog to Active Sprint to access `done`/`review` statuses
- Branch sync: force-pushed `origin/Dev-Vibe` to match `origin/Dev-Vibe-Testing` tip (`b5e4804`); the prior `078289d chore:testing main dev` commit was discarded
- Discovered + fixed status name mismatch: ClickUp uses `review` (not `in review`); GUIDELINES.md and clickup-pm/SKILL.md updated, also flagged that the Backlog list doesn't expose `done`/`review` statuses (must move to Active Sprint first)
- Installed `gh` CLI 2.92.0 via Homebrew to enable git auth from this environment

**What was done previous session (2026-04-16):**
- Created full Evenzi document suite: 50 files (25 .md + 25 .docx) across Foundation, Feature Overviews, Ops, Marketing, Presentations
- 9 parallel agents built the initial suite; 5 parallel agents refined it after a founder Q&A
- Q&A scrutinised docs from investor/user/vendor perspectives — 6 critical gaps fixed (vendor model, DPDP Act, event magazine, market sizing, PWA, guest accessibility)
- New: Indian Wedding & Events Dictionary (5 traditions, 33 sub-events, 26-term glossary)
- New: Open Decisions doc (5 decisions pending team discussion before external sharing)
- New: Session report saved to `docs/session-reports/2026-04-16-session-report.md`

**What was done previous session (2026-04-14):**
- Brainstormed + spec'd the Support Chatbot feature (MVP Phase 1)
- Wrote full implementation plan (34 tasks across Phase A/B/C)
- Multi-agent review: Tech Lead + Data Modeller + Security + Backend + Frontend + QA → 29 findings
- Revised plan with 20 fixes (6 critical + 14 important) as Revisions R1–R20
- Created ClickUp hierarchy: **Feature + 11 subtasks + 18 sub-subtasks = 30 tasks**, all dependencies set
- **Implementation intentionally deferred** — awaiting Figma designs for UI tasks
- Spec: `docs/superpowers/specs/2026-04-14-chatbot-design.md`
- Plan: `docs/superpowers/plans/2026-04-14-chatbot-implementation.md`
- Feature ClickUp task: `86d2n3jxv`

**Chatbot architecture at a glance:**
- RAG over Supabase pgvector with admin-editable FAQ
- Gemini 2.5 Flash primary + Groq Llama 3.1 8B fallback + keyword degradation (all free tier)
- Widget on most pages + `/help` page + `/admin/faq/*` CRUD + `/admin/tickets` list
- Resend email escalation for unresolved questions
- Zero paid API keys; graceful degradation when quota exhausted
- Admin analytics bot + guest-aware bot deferred to Phase 2+

**What was done previous session (2026-04-13):**
- ClickUp workspace planning: Growth & Marketing + Operations & Admin spaces restructured
- 3 list renames, 3 new lists, 32 milestone tasks created
- Full team roster documented (6 members across 3 spaces)
- Abhijith confirmed as project owner/reviewer across all spaces
- Design spec: `docs/superpowers/specs/2026-04-13-clickup-spaces-planning-design.md`

**What was built previous session (2026-04-10):**
- Design spec: `docs/superpowers/specs/2026-04-09-event-crud-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-09-event-crud-implementation.md` (14 tasks, 23 review fixes)
- 4-agent plan review (Tech Lead, Security, Data Modeller, Frontend) — all findings addressed
- Database: 5 new tables (event_types, sub_event_types, events, event_metadata, event_sub_events) + atomic RPC
- Seed data: Wedding (enabled) + 5 disabled types + 7 wedding sub-event types
- API routes: GET event-types, GET sub-events, POST/GET events, GET event detail
- Types + Zod validation: 17 tests for schemas + validateDynamicFields
- Wizard state: React Context + useReducer with 11 tests
- 8 wizard components: Shell, Progress, Steps 1-4, EventTypeCard, SubEventCard
- Success screen (server component)
- Dashboard: converted to server component + client EventsGrid
- Middleware: host-role guard for /events routes
- Event placeholder page (until dashboard feature is built)
- Shared ICON_MAP utility (lib/utils/icons.ts)
- Enhancement task created for UI polish (86d2kt2qj)
- Full E2E test in Chrome, code review with all fixes applied
- 65/65 tests, build passes, 18 commits on worktree branch

**ClickUp state (after 2026-05-03):**
- Fix Vercel Deployment (86d2jmkn4) → done
- Auth & Role Selection (86d2jwz1h) → done
- UI Polish enhancement (86d2kt2qj) → done
- Event CRUD wizard (86d2jwz3x) → review (awaiting feature-level approval)
- Host Dashboard (86d2jwz6v) → review
- Landing Section (86d2k1kwh) → in progress
- Spec & Architecture: Event CRUD (86d2k1mq4) → done

**Database (Supabase):**
- `user_profiles` — existing (3 users)
- `event_types` — 6 rows (1 enabled: Wedding)
- `sub_event_types` — 7 rows (wedding sub-events)
- `events` — has test data from E2E (Aarav & Ishani's Wedding)
- `event_metadata` — partner name key-value pairs
- `event_sub_events` — 3 sub-events (Wedding Ceremony, Reception, Sangeet)
- `create_event_with_details` RPC — atomic insert with auth.uid()

## How To Resume

### Immediate Next Steps

1. **Auth flow design (Login / Sign Up / Role Selection)** — see "Next session intent" block above. Build static HTML/CSS/JS prototypes in `designs/pages/auth/`. Grounded against live React at https://evenzi.vercel.app/auth. **Abhijith's stated next-session intent.**
2. **Form-validation JS helper** — `data-validate` hook + `data-error-required`/`data-error-pattern` attributes that flip `aria-invalid` and toggle `form-error` messages. UI/UX agent's #1 follow-up — auth flow is the second consumer; build this BEFORE wiring the auth phone-input or it gets forked again. **Build first** within the auth-design session.
3. **Settings page polish (DONE 2026-05-14)** — form-input red border bug root-caused in shell.css (`.form-input` default `var(--brand-tint-2)` → `var(--line)`). See `designs/_plans/settings-audit-fix-plan.md`.
3. **Team discussion on 5 open decisions** (`docs/foundation/open-decisions.md`) — pricing, free tier limits, magazine name, WhatsApp approach, vendor plan name
2. **Share document suite via Google Drive** — Admin & Ops and Marketing & Branding teams
3. **Abhijith fills PPT placeholders** — fund ask, bios, pricing limits, timeline, contact
4. **Review Event CRUD wizard + Host Dashboard** (`86d2jwz3x`, `86d2jwz6v` — both `review`) — sign off or send back with feedback. Approving unblocks Component QA / Integration Testing.
5. **Landing Section** (`86d2k1kwh` — `in progress`) — Spec & Architecture is the next phase to start (subtask `86d2k1n3d`).
6. **Event CRUD Data Modeling** (`86d2k1mqc`) — Spec is done, tables exist. Mark done or refine if schema changes are needed.
7. **Fix Success Screen redirect** — Server component may have cookie/auth issue. Test on Dev-Vibe directly.
8. **Agent enrichment (remaining Medium agents)** — backend_engineer, data_modeller, tech_lead, product_manager (test_engineer was enriched + renamed from qa_engineer on 2026-05-04)

### Known Issues
- Success screen redirects to /home instead of rendering (cookie issue)
- UI needs significant polish to match Figma (enhancement task created)
- Missing test for GET /api/events/[id] route
- Progress bar initially shows "Step 1 of 3" before type selection (totalSteps defaults to 4 but renders 3)
- Zod upgraded to v4 (was v3) — z.record() syntax changed

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/superpowers/specs/2026-04-09-event-crud-design.md` | Event CRUD design spec (approved) |
| `docs/superpowers/plans/2026-04-09-event-crud-implementation.md` | Implementation plan (14 tasks, 23 review fixes) |
| `docs/superpowers/specs/2026-04-08-auth-role-selection-design.md` | Auth design spec |
| `docs/BRAND-GUIDELINES.md` | Brand source of truth — reconciled to `designs/shared/shell.css` (brand red `#BB0020`, Poppins, Liquid Glass tokens, clay shadows) |
| `ai/agents/ui_ux_designer.md` | UI/UX role book — design + review + code quality in `designs/`. Evolves freely. |
| `docs/clickup/WORKSPACE.md` | All ClickUp IDs, workspace structure |
| `docs/PROJECT.md` | Full feature descriptions, DB plans |
| `CLAUDE.md` | Project guide, conventions, parallel subagents |
