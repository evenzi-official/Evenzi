# /spec-kit Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/spec-kit <page>` Claude-only planning skill plus its 7-file build-kit template set, the front door of the multi-editor (Claude→Cursor→Antigravity) workflow.

**Architecture:** A skill at `.claude/skills/spec-kit/SKILL.md` defines a 5-phase / 2-gate run flow and a page→overview alias map (v1 scoped to the 10 slugs that have a real `designs/pages/<page>/` dir). Seven template files under `.claude/skills/spec-kit/templates/` are instantiated into `designs/pages/<page>/` during a run. No application code, no Vitest — verification is structural via **named-anchor greps** (assert required headings/anchors exist), not count thresholds.

**Tech Stack:** Markdown skill files (YAML frontmatter + body), modeled on `.claude/skills/council/SKILL.md`.

**Spec:** `docs/superpowers/specs/2026-06-05-spec-kit-skill-design.md`
**Council:** reviewed 2026-06-05 (tech_lead, ui_ux_designer, frontend_engineer, test_engineer) — 🟡 address-then-proceed. This plan version folds in the 3 critical + the important cluster. See "Council fixes folded in" at the bottom for traceability.

---

## Design decisions from council (apply throughout)

1. **Copy-the-head-and-chrome, don't describe it.** The single highest-leverage fix (resolves FE1/FE2/FE3 + nits): the Cursor runbook instructs Cursor to **copy the exact `<head>` + shared chrome from the nearest existing sibling page** (fallback `designs/pages/guests/guests.html`), then replace the body content. This guarantees the Tailwind CDN + `tailwind.config` token map, Google Fonts (Poppins + Material Symbols incl. the FILL axis), PWA/viewport/theme-color meta, `manifest.webmanifest` link, `floating-nav`/`tool-rail`/breadcrumb chrome, and `reveal` convention all come along verbatim.
2. **Bake fixed floors into `_test.md`/`_spec.md`; `{{...}}` only for page-specific additions.** Free-text placeholders evaporate under token pressure; a cold tester reads only what's written.
3. **v1 alias map = the 10 slugs with a real `designs/pages/<page>/` dir.** `dashboard` (root `index.html`), `landing` (marketing), `admin` (n/a yet) are listed as **not-yet-supported** so the hardcoded `designs/pages/<page>/` path + `../../shared/` prefix are always correct.
4. **Named-anchor verification.** Every per-task verify greps for required headings/anchors, not `{{` counts.

---

## File Structure

```
.claude/skills/spec-kit/
├── SKILL.md
└── templates/
    ├── _status.md
    ├── _spec.md
    ├── _test.md
    ├── _cursor-prompt.md
    ├── _antigravity-prompt.md
    ├── _findings.md
    └── _review.md

docs/specs/_WORKFLOW-TODO.md         # MODIFY — tick A.1
```

`{{DOUBLE_BRACE}}` placeholders are expected **only** inside `templates/*` (their job) and **must not** appear unfilled in `SKILL.md`.

---

## Task 1: Scaffold + status/findings/review templates

**Files:**
- Create: `.claude/skills/spec-kit/templates/_status.md`
- Create: `.claude/skills/spec-kit/templates/_findings.md`
- Create: `.claude/skills/spec-kit/templates/_review.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p .claude/skills/spec-kit/templates
```

- [ ] **Step 2: Write `_status.md`** (note: REVIEW is terminal for v1 — TL1; spec version stamp — TL2)

```markdown
<!-- Build-kit baton. STAGE advances: SPEC → BUILD → TEST → REVIEW → DONE.
     Each tool rewrites STAGE/UPDATED/NEXT on handoff. Keep to these lines.
     v1: REVIEW is the terminal state. /spec-kit-review (TODO A.2) owns REVIEW→DONE when built —
     a cold agent at REVIEW should stop and wait, not treat it as a failure. -->
PAGE: {{PAGE_SLUG}}
STAGE: SPEC
SPEC_VERSION: {{SPEC_VERSION}}
UPDATED: {{DATE}} — /spec-kit
NEXT: review the kit, then bump STAGE to BUILD (open Cursor → read _cursor-prompt.md → execute)
```

- [ ] **Step 3: Write `_findings.md`** (fixed result-table schema — TE6; rows reference matrix IDs)

```markdown
# Findings — {{PAGE_SLUG}}

> Append-only. Antigravity (and humans) record results here, newest entry last.
> Reference each row by its _test.md matrix ID (e.g. `1.smoke`, `3.responsive-360`) so reviews can diff against the spec.
> Record SPEC_VERSION so findings made against an older spec are detectable after a re-run.

## {{DATE}} — <tool/who> — against SPEC_VERSION {{SPEC_VERSION}}

| Matrix row | Result | Note / repro |
|---|---|---|
| _no results yet_ | | |
```

- [ ] **Step 4: Write `_review.md`**

```markdown
# Review — {{PAGE_SLUG}}

> Append-only. `/spec-kit-review` writes its council/codex assessment of _findings.md here, newest last.
> Each entry: `## {{DATE}} — /spec-kit-review` then verdict + actions folded back into _spec.md / _test.md.

_No reviews yet._
```

- [ ] **Step 5: Verify (named anchors, not counts)**

Run:
```bash
grep -q "STAGE: SPEC" .claude/skills/spec-kit/templates/_status.md \
&& grep -q "REVIEW is the terminal state" .claude/skills/spec-kit/templates/_status.md \
&& grep -q "| Matrix row | Result | Note / repro |" .claude/skills/spec-kit/templates/_findings.md \
&& echo OK
```
Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/spec-kit/templates/_status.md .claude/skills/spec-kit/templates/_findings.md .claude/skills/spec-kit/templates/_review.md
git commit -m "spec-kit: scaffold + status/findings/review templates (council: TL1/TL2/TE6)"
```

---

## Task 2: `_spec.md` template (build source of truth)

**Files:**
- Create: `.claude/skills/spec-kit/templates/_spec.md`

Folds: UX1 (3-state reuse column + catalog/dark/tokens), UX blind spot (OG/share field), UX5 (primary-user consequence).

- [ ] **Step 1: Write `_spec.md`**

```markdown
# Spec — {{PAGE_TITLE}} (`{{PAGE_SLUG}}`)  ·  SPEC_VERSION {{SPEC_VERSION}}

> Build source of truth. Cursor builds **only** from this file. Filled by `/spec-kit` from the
> feature overview + design system + council review. Overwritten on re-run (SPEC_VERSION bumps).

## Goal & user
- **Primary user:** {{HOST_OR_GUEST}}  (if this is arguably "both", that is a Gate-1 open question — do not silently accept dual-user)
- **User goal of this page:** {{ONE_SENTENCE_GOAL}}
- **Overview source:** docs/features/overviews/{{OVERVIEW_FILE}}
- **a11y tier:** {{A11Y_TIER}}  (guest/public surfaces = AAA; host surfaces = AA)
- **Share / Open Graph:** {{OG_REQUIREMENTS}}  (guest-facing pages MUST render as a correct WhatsApp link preview — OG title/description/image; for host-only pages write "n/a")

## Page composition (top → bottom)
{{SECTION_LIST — each section: name, purpose, contents}}

## Element reuse map
> Every UI element → one of three rungs. Cursor consumes this literally.

| Element | Rung: reuse-as-is / modifier-extend / new | Primitive or new-file | Notes |
|---|---|---|---|
{{REUSE_ROWS}}

> Reuse discipline (cite the catalog): `designs/components.html` is organized into named sections
> (foundations, shell/chrome, surfaces, pills/chips, buttons/controls, forms, avatars, data, layout).
> Check there + `designs/shared/shell.css` first. Dark mode (`.dark`) and semantic status tokens
> (`--success/--warning/--danger/--info`) are mandatory, not optional.

## New primitives needed
> generic → designs/shared/shell.*; page-specific → designs/pages/{{PAGE_SLUG}}/{{PAGE_SLUG}}.*
{{NEW_PRIMITIVES — name, where it lives, why, states}}

## Interaction states (per interactive element)
> default / hover / focus / active / disabled / loading / error / empty — list those that apply.
{{STATES}}

## Data & content model
- **Content fields:** {{FIELDS}}
- **Content-length resilience:** {{LONG_SHORT_EMPTY_BEHAVIOR}}  (the standard stressors are enforced as fixed _test.md rows)

## Responsive behavior
- Mobile-first; design at 360px, scale up. Widths: 360 / 390 / 414 / 768 / 1024 / 1440.
- {{BREAKPOINT_NOTES}}

## Accessibility
- Floor (always): visible focus ring on keyboard nav; alt text on all images; every input has a programmatic label (not placeholder-only); single logical heading order; color is never the sole status signal; touch targets ≥44px.
- Page-specific: {{A11Y_REQUIREMENTS}}

## Copy (Indian conventions: ₹ + lakh/crore, DD/MM/YYYY, 12-hour time)
{{COPY — headings, labels, empty-state text, toasts}}

## Council notes folded in
{{COUNCIL_CRITICAL_AND_IMPORTANT — or "n/a (trivial skip)"}}
```

- [ ] **Step 2: Verify (named anchors)**

Run:
```bash
for a in "## Element reuse map" "reuse-as-is / modifier-extend / new" "## Accessibility" "Share / Open Graph" "## Council notes folded in"; do
  grep -q "$a" .claude/skills/spec-kit/templates/_spec.md || { echo "MISSING: $a"; exit 1; }
done; echo OK
```
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/spec-kit/templates/_spec.md
git commit -m "spec-kit: _spec.md (council: UX1 3-rung reuse, OG field, a11y tier)"
```

---

## Task 3: `_test.md` template (test source of truth)

**Files:**
- Create: `.claude/skills/spec-kit/templates/_test.md`

Folds: TE-blindspot smoke row, TE1 (reduced-motion + dark contrast), TE2/UX4 (a11y floor rows), TE4 (split edge cases), UX3 (content-length stressors), UX-blindspot (WhatsApp/OG row + device class), TE3 (manual device tag), TE7 (console row).

- [ ] **Step 1: Write `_test.md`**

```markdown
# Test plan — {{PAGE_TITLE}} (`{{PAGE_SLUG}}`)  ·  against SPEC_VERSION {{SPEC_VERSION}}

> Test source of truth. Antigravity tests **only** from this file. Run every row; record PASS/FAIL in _findings.md by row ID.

## Acceptance criteria
{{ACCEPTANCE_CRITERIA — bullet list, each independently checkable}}

## Test matrix

### 1. Smoke (run FIRST — gates everything below)
- `1.smoke` — Page loads with no console errors/warnings on load.
- `1.styled` — Computed background is the themed surface, NOT the unstyled default (proves tokens/Tailwind config loaded).
- `1.databody` — `<body>` carries `data-page` (and `data-section` if under a nav tab); active nav/tool-rail item is highlighted.
- `1.chrome` — Floating-nav, tool-rail, and breadcrumb render and match sibling pages.

### 2. Component states
{{STATE_CHECKS — every interactive element in all applicable states}}
- `2.console` — No new console errors/warnings after each interaction.

### 3. Interaction & keyboard
- `3.controls` — Every button/link/toggle/tab/modal trigger fires.
- `3.keyboard` — Logical tab order; Enter/Space activate focused control; Esc closes overlays.
- `3.deadlinks` — No dead links (every href → existing page or explicit `#` with comment).
{{EXTRA_INTERACTION_CHECKS}}

### 4. Responsiveness (widths × content)
- `4.<width>` for each of 360 / 390 / 414 / 768 / 1024 / 1440 — no horizontal scroll, no clipped content, touch targets ≥44px on mobile widths.
{{PAGE_SPECIFIC_RESPONSIVE_CHECKS}}

### 5. Accessibility (fixed floor)
- `5.focusring` — Visible focus indicator on every keyboard-focusable control.
- `5.alt` — All images have alt text.
- `5.labels` — Every input has a programmatic label (not placeholder-only).
- `5.headings` — Single logical heading order.
- `5.coloronly` — Status is never conveyed by color alone (icon/text too).
- `5.reducedmotion` — With `prefers-reduced-motion: reduce`, non-essential animation is suppressed.
- `5.darkcontrast` — Dark mode: text/icon contrast meets WCAG AA (4.5:1 body, 3:1 large); {{A11Y_TIER}} tier honored.
{{A11Y_CHECKS — page-specific additions}}

### 6. Edge / sad paths (fixed)
- `6.empty` — Empty-data state renders.
- `6.loading` — Loading/skeleton state renders.
- `6.error` — Error/failure state renders with recovery affordance.
- `6.longcontent` — 90+ char name, regional-script (Devanagari ~1.4× width), multi-line button label, max-row list — all hold without overflow/clipping.
- `6.counts` — Single-item vs many-items both render correctly.
{{PAGE_SPECIFIC_EDGE_CASES}}

### 7. Guest-surface & device (conditional + manual)
- `7.whatsapp` — IF primary user = guest: page renders correctly as a WhatsApp link preview (OG) AND in the WhatsApp Android in-app WebView. (manual — agent: skip and flag for human)
- `7.device` — Mobile real-device pass on a mid-tier Android with CPU throttle; TalkBack sanity for guest surfaces. (manual — agent: skip and flag for human)

## Definition of done
Every non-manual row PASS (deferrals documented in _findings.md), no console errors, manual rows flagged for human.
```

- [ ] **Step 2: Verify (named anchors)**

Run:
```bash
for a in "### 1. Smoke" "1.styled" "1.databody" "5.reducedmotion" "5.darkcontrast" "6.loading" "7.whatsapp" "360 / 390 / 414 / 768 / 1024 / 1440"; do
  grep -q "$a" .claude/skills/spec-kit/templates/_test.md || { echo "MISSING: $a"; exit 1; }
done; echo OK
```
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/spec-kit/templates/_test.md
git commit -m "spec-kit: _test.md fixed-floor matrix (council: smoke/a11y/motion/edge/whatsapp)"
```

---

## Task 4: Runbook templates (Cursor + Antigravity)

**Files:**
- Create: `.claude/skills/spec-kit/templates/_cursor-prompt.md`
- Create: `.claude/skills/spec-kit/templates/_antigravity-prompt.md`

Folds: FE1/FE2/FE3 (copy head+chrome), FE4 (sibling reference), FE6 (load order), UX1 (catalog), UX2 (hover-guard/glass/stretched-link), TE6 (findings schema), smoke-first.

- [ ] **Step 1: Write `_cursor-prompt.md`**

```markdown
# Cursor build runbook — {{PAGE_TITLE}} (`{{PAGE_SLUG}}`)

You are building the Evenzi **{{PAGE_TITLE}}** page as a static HTML/CSS/JS prototype in `designs/pages/{{PAGE_SLUG}}/`. You start with no prior context — everything you need is in this folder.

## Read first
1. `_spec.md` (this folder) — the build source of truth. Build exactly what it specifies.
2. `designs/components.html` — the component catalog (named sections: foundations, shell/chrome, surfaces, pills, buttons, forms, avatars, data, layout). Reuse before creating.
3. `{{REFERENCE_PAGE}}` (a known-good built sibling, e.g. `designs/pages/guests/guests.html`) — copy its structure as your starting point.

## Step 0 — clone the canonical head + chrome (do this before any body work)
Copy, VERBATIM, from `{{REFERENCE_PAGE}}`:
- the entire `<head>` — Tailwind CDN script + the `tailwind.config` token map, both Google Fonts links (Poppins + Material Symbols **with the `FILL` axis**), `viewport-fit=cover` meta, the (dark/light) theme-color metas, and the `manifest.webmanifest` link.
- the shared chrome in `<body>`: scroll-progress bar, `floating-nav`, `tool-rail`, and the `.bc-wrap` breadcrumb shell.
Then set `<body data-page="{{PAGE_SLUG}}"` (+ `data-section="{{DATA_SECTION}}"` if this page sits under a nav tab) — shell.js reads these to drive active nav/tool-rail state.

## Hard constraints (do not violate)
- **Design tokens only.** Colors/spacing/radii from the `tailwind.config` map + `designs/shared/shell.css` variables. Never hardcode hex/px you could pull from a token.
- **No inline CSS or JS. Ever.** Generic → `designs/shared/shell.{css,js}`; page-specific → `designs/pages/{{PAGE_SLUG}}/{{PAGE_SLUG}}.{css,js}`.
- **Link the page stylesheet + script:** `../../shared/shell.css` then `{{PAGE_SLUG}}.css`; `../../shared/shell.js` then `{{PAGE_SLUG}}.js`. **Load order is load-bearing** — shell.css before page.css (cascade), shell.js before page.js.
- **Reuse before create.** If a `_spec.md` reuse-map row says reuse-as-is or modifier-extend, do that — only add new CSS for "new" rows.
- **Hover-guard:** wrap every `:hover` rule in `@media (hover:hover) and (pointer:fine)`.
- **Glass fallback:** any `backdrop-filter` needs an `@supports not (backdrop-filter: blur(1px))` solid fallback; max ~2 blurred surfaces per page.
- **Stretched-link** for clickable cards containing buttons — never nest `<a>` in `<a>`.
- **Mobile-first.** Design at 360px first, scale up. Touch targets ≥44px. `env(safe-area-inset-*)` on fixed chrome. No hover-only interactions.
- **`.bc-wrap`** is the canonical page wrapper — do not override page width at module level.
- Tag top-level sections with `class="reveal"` for scroll-in (shell.js auto-wires the IntersectionObserver — no per-page JS).

## Build steps
1. Do Step 0 (head + chrome clone) → `designs/pages/{{PAGE_SLUG}}/{{PAGE_SLUG}}.html`.
2. Build the page body top-to-bottom per `_spec.md` composition + reuse map.
3. Add new primitives to the correct file per the constraints.
4. Wire interactions/states from `_spec.md`'s states section.
5. Self-check: every section present, every reuse-map row honored, no inline styles, `data-page` set, tokens-only.

## When done
Update `_status.md`: `STAGE: TEST`, `UPDATED: <today> — Cursor`, `NEXT: open Antigravity → read _antigravity-prompt.md → execute`.
```

- [ ] **Step 2: Write `_antigravity-prompt.md`**

```markdown
# Antigravity test runbook — {{PAGE_TITLE}} (`{{PAGE_SLUG}}`)

You are testing the Evenzi **{{PAGE_TITLE}}** page in `designs/pages/{{PAGE_SLUG}}/`. You start with no prior context.

## Read first
1. `_test.md` (this folder) — the test source of truth. Run every row.
2. The built page served via `npm run design` (http://localhost:4000) → `designs/pages/{{PAGE_SLUG}}/{{PAGE_SLUG}}.html`.

## Steps
1. **Run section 1 (Smoke) FIRST.** If any of `1.smoke / 1.styled / 1.databody / 1.chrome` FAILS, record it and STOP — the page is structurally broken; deeper rows would false-pass. Flag for rebuild.
2. If smoke passes, work through sections 2–6 in order.
3. For **manual** rows (section 7, tagged "agent: skip and flag for human"): do not attempt; record `SKIP (human)` so they're visible.
4. Record every row in `_findings.md` under a new `## <today> — Antigravity — against SPEC_VERSION <v>` heading, one table line per row ID: `| <row id> | PASS/FAIL/SKIP | note (repro for FAIL) |`.

## When done
Update `_status.md`: `STAGE: REVIEW`, `UPDATED: <today> — Antigravity`, `NEXT: /spec-kit-review {{PAGE_SLUG}}`.
```

- [ ] **Step 3: Verify (named anchors)**

Run:
```bash
grep -q "Step 0 — clone the canonical head" .claude/skills/spec-kit/templates/_cursor-prompt.md \
&& grep -q 'data-page="{{PAGE_SLUG}}"' .claude/skills/spec-kit/templates/_cursor-prompt.md \
&& grep -q "@media (hover:hover)" .claude/skills/spec-kit/templates/_cursor-prompt.md \
&& grep -q "Load order is load-bearing" .claude/skills/spec-kit/templates/_cursor-prompt.md \
&& grep -q "Run section 1 (Smoke) FIRST" .claude/skills/spec-kit/templates/_antigravity-prompt.md \
&& echo OK
```
Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/spec-kit/templates/_cursor-prompt.md .claude/skills/spec-kit/templates/_antigravity-prompt.md
git commit -m "spec-kit: Cursor+Antigravity runbooks (council: head/chrome clone, hover-guard, smoke-first)"
```

---

## Task 5: `SKILL.md`

**Files:**
- Create: `.claude/skills/spec-kit/SKILL.md`

Folds: TL3 (v1 slug scoping + not-yet-supported list), TL2 (re-run/idempotency contract), TL-blindspot (council-finding→placeholder mapping + trivial-skip fallback), UX/FE constraints surfaced.

- [ ] **Step 1: Write `SKILL.md`**

````markdown
---
name: spec-kit
description: Claude-only planning skill that turns one Evenzi page/feature into a complete file-based build kit (spec + test plan + Cursor/Antigravity runbooks + status baton) for the multi-editor workflow. Reads the feature overview + design system + brand, drafts a spec, asks open questions, runs /council design (codex opt-in), then writes the 7-file kit into designs/pages/<page>/. Invoke as /spec-kit <page>.
---

# spec-kit — Build-kit generator for the multi-editor workflow

Turns a page into a self-contained **build kit** downstream tools execute without this conversation's context: Claude plans (this skill) → Cursor builds → Antigravity tests → `/spec-kit-review` reviews. The baton is files; `_status.md` is the state marker. This is a **planning** skill — it does not build or test. Output: 7 files in `designs/pages/<page>/`.

## Usage
`/spec-kit <page>` — generate/refresh the kit for `<page>`.
`/spec-kit <page> --codex` — also run one codex review pass (reserve for hard pages; codex is on a limited plan).

## Page → overview alias map (v1)
The slug ≠ the overview filename. v1 supports the slugs with a real `designs/pages/<page>/` dir:

| slug | overview (`docs/features/overviews/`) | page dir (`designs/pages/`) |
|---|---|---|
| `planning` | `planning-tools-overview.md` | `planning/` |
| `website` | `digital-presence-overview.md` | `website/` |
| `media` | `media-memories-overview.md` | `media/` |
| `guests` | `guest-management-overview.md` | `guests/` |
| `invitations` | `digital-invitations-overview.md` | `invitations/` |
| `event-settings` | `event-settings-overview.md` | `event-settings/` |
| `event-control` | `event-management-hub-overview.md` | `event-control/` |
| `settings` | `user-settings-overview.md` | `settings/` |
| `auth` | `auth-overview.md` | `auth/` |
| `create-event` | `celebratory-curator-overview.md` | `create-event/` |

**Not yet supported (no `designs/pages/<page>/` dir):** `dashboard` (root `index.html`), `landing` (marketing), `admin` (n/a). If asked for these, say they're unsupported in v1 and stop — the templates assume the `designs/pages/<page>/` + `../../shared/` topology.

Resolution: no slug match → list supported slugs, ask. Overview file missing on disk → tell the user (informational, not fatal), ask whether to proceed without it.

## Run flow — 5 phases, 2 gates

### Phase 0 — Resolve & read (auto)
Resolve `<page>` via the v1 map. Read in parallel: the overview; `designs/shared/shell.css` + `designs/shared/shell.js` + `designs/components.html`; `docs/BRAND-GUIDELINES.md`; existing `designs/pages/<page>/*` + `designs/_plans/<page>*.md`; `ai/agents/{ui_ux_designer,frontend_engineer,test_engineer}.md`.

### Phase 1 — Draft + open questions → 🚪 GATE 1
Draft a working `_spec.md`. Then present a **single batched, numbered list of open decisions** (AskUserQuestion). Trigger an open question whenever: the primary user is arguably dual (host AND guest); any glass/`backdrop-filter` surface is proposed; any decorative motion is added; assumed max content-lengths are load-bearing; or free-vs-paid tier parity is in question. Fold answers in. Do not proceed until answered.

### Phase 2 — Council (auto, unattended)
Run `/council design` on the answered draft (its roster already brings ui_ux_designer + frontend_engineer + tech_lead + product_manager with debate + arbiter — do not also run a standalone UI/UX pass). `--codex` adds one codex pass. If council triviality-skips, log it.

### Phase 3 — Assemble kit (auto)
Stamp a fresh `{{SPEC_VERSION}}` (e.g. a short timestamp passed in, since the runtime has no clock). Instantiate the 7 templates into `designs/pages/<page>/`, filling every `{{PLACEHOLDER}}`. **Council-finding → placeholder mapping:** critical+important findings → `{{COUNCIL_CRITICAL_AND_IMPORTANT}}` and the relevant `_spec.md`/`_test.md` sections; if council skipped, write `n/a (trivial skip)` there. Never leave an unfilled `{{...}}`.

**Re-run contract (idempotency):** on re-run of an existing page —
- Overwrite `_spec.md`, `_test.md`, `_cursor-prompt.md`, `_antigravity-prompt.md` with the new `SPEC_VERSION`.
- **Never clobber** append-only `_findings.md` / `_review.md` — append a marker noting the spec was re-generated to `SPEC_VERSION <v>` so prior findings are visibly stale.
- Do **not** silently reset `_status.md` to SPEC if it's past BUILD — warn the user and confirm before resetting stage.

### Phase 4 — Kit review → 🚪 GATE 2
Present the assembled kit (summary + key decisions + the Cursor runbook). Iterate. On approval bump `_status.md` → `STAGE: BUILD (Cursor)`, `NEXT:` → `_cursor-prompt.md`.

## Design-system constraints (the kit's runbooks carry these)
Tokens only; no inline CSS/JS (generic → `shared/shell.*`, page-specific → `pages/<page>/<page>.*`); reuse before create (cite catalog + a sibling page); copy the canonical `<head>` + chrome from the nearest sibling; set `<body data-page>`; hover-guard every `:hover`; `@supports` glass fallback; stretched-link cards; mobile-first ≥44px; `.bc-wrap` wrapper; dark mode + semantic status tokens mandatory.

## Scope
Produces the kit only. Does **not** review findings (`/spec-kit-review`, TODO A.2 — owns REVIEW→DONE) and does **not** wire Cursor/Antigravity configs (TODO C).
````

- [ ] **Step 2: Verify frontmatter + no stray placeholders + named anchors**

Run:
```bash
head -4 .claude/skills/spec-kit/SKILL.md | grep -q "name: spec-kit" \
&& grep -q "Not yet supported" .claude/skills/spec-kit/SKILL.md \
&& grep -q "Re-run contract" .claude/skills/spec-kit/SKILL.md \
&& [ "$(grep -c '{{' .claude/skills/spec-kit/SKILL.md)" -eq 0 ] \
&& echo OK
```
Expected: `OK` (note: `{{` count must be 0 — placeholders belong only in templates/).

- [ ] **Step 3: Verify the 10 v1 overview files exist (informational for the 3 unsupported)**

Run:
```bash
for f in planning-tools digital-presence media-memories guest-management digital-invitations event-settings event-management-hub user-settings auth celebratory-curator; do
  test -f "docs/features/overviews/$f-overview.md" && echo "OK $f" || echo "MISSING $f"
done
```
Expected: all 10 print `OK`. (If any MISSING, the skill handles absence gracefully per Phase 0 — but the v1 map should match reality, so investigate.)

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/spec-kit/SKILL.md
git commit -m "spec-kit: SKILL.md (council: v1 scoping, re-run contract, Gate-1 triggers)"
```

---

## Task 6: Tick TODO A.1 + final integration gate

**Files:**
- Modify: `docs/specs/_WORKFLOW-TODO.md`

- [ ] **Step 1: Tick the A.1 `/spec-kit` checkbox**

Change the first `## A.` line from:
```
- [ ] `/spec-kit <page>` skill — reads overview + shell + brand → brainstorm → **council + codex + UI/UX agent** → **ask user open Qs** → write the kit.
```
to:
```
- [x] `/spec-kit <page>` skill — reads overview + shell + brand → brainstorm → **council (design mode) + codex opt-in** → **ask user open Qs** → write the kit. _(built 2026-06-05; spec: docs/superpowers/specs/2026-06-05-spec-kit-skill-design.md)_
```

- [ ] **Step 2: Final integration gate — every template placeholder is one the skill fills**

Run:
```bash
# All distinct {{TOKENS}} used across templates:
grep -rho "{{[A-Z_]*}}" .claude/skills/spec-kit/templates/ | sort -u
```
Then manually confirm each token is produced by a Phase 0–3 input/step in SKILL.md (PAGE_SLUG, PAGE_TITLE, DATE, SPEC_VERSION, OVERVIEW_FILE, DATA_SECTION, REFERENCE_PAGE, A11Y_TIER, OG_REQUIREMENTS, HOST_OR_GUEST, and the per-section content fills). Any token with no producer is a bug — fix SKILL.md Phase 3 to fill it.
Expected: every listed token has a clear producer.

- [ ] **Step 3: Verify skill is discoverable + checkbox ticked**

Run:
```bash
ls .claude/skills/spec-kit/SKILL.md .claude/skills/spec-kit/templates/ \
&& grep -n "\[x\].*spec-kit <page>" docs/specs/_WORKFLOW-TODO.md
```
Expected: SKILL.md + all 7 templates listed; one matching ticked line.

- [ ] **Step 4: Commit**

```bash
git add docs/specs/_WORKFLOW-TODO.md
git commit -m "spec-kit: tick A.1 in _WORKFLOW-TODO"
```

---

## Self-Review

**1. Spec coverage** (against `2026-06-05-spec-kit-skill-design.md`): alias map → Task 5 (now v1-scoped); inputs → Task 5 Phase 0; 5-phase/2-gate flow → Task 5; 7-file kit + state machine → Tasks 1–4; skill layout → Tasks 1 & 5; constraints → Tasks 4 & 5; scope/tick A.1 → Task 6. ✅

**2. Placeholder scan:** `{{...}}` only inside `templates/*` (Task 5 Step 2 asserts 0 in SKILL.md; Task 6 Step 2 confirms each has a producer). No TBD/TODO in plan steps. ✅

**3. Type/name consistency:** stages (`SPEC/BUILD/TEST/REVIEW/DONE`), file names, matrix row IDs (`1.smoke` … `7.device`), paths (`designs/shared/shell.*`, `designs/pages/<page>/`), and the `{{SPEC_VERSION}}` stamp are consistent across all tasks and match the spec. ✅

---

## Council fixes folded in (traceability)
- **Critical:** FE1+FE2+FE3 → Task 4 Step 0 "clone head + chrome" + `data-page`; smoke "row 0" → Task 3 §1.
- **Important:** UX1 3-rung reuse + catalog/dark/tokens → Task 2; UX2 hover-guard/glass/stretched-link → Task 4; TE1/TE2/TE4/UX3/UX4 fixed rows → Task 3 §§5–6; TE5+TL5 named-anchor verify + integration gate → all verify steps + Task 6 Step 2; TL2 re-run contract → Task 5 Phase 3; TL3(+FE5) v1 scoping → Task 5 map; UX-blindspot OG/WhatsApp → Task 2 (field) + Task 3 §7.
- **Arbiter-ruled suggestions:** TL1 REVIEW-terminal note (Task 1) · TE3 manual device tag (Task 3 §7) · FE4 sibling reference (Task 4) · FE6 load-order line (Task 4) · TL4 overviews informational (Task 5 Step 3).
- **Deferred (optional, per user choice):** UX5/UX6 fuller dual-user handling, free-tier=paid parity field, finding→placeholder fine-grain mapping table — Gate-1 triggers + Indian-formatting line included as lightweight versions; rest noted for `/spec-kit-review` or a later pass.
