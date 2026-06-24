# Design Spec — `/spec-kit` skill + build-kit format

**Date:** 2026-06-05
**Author:** Abhijith (via Claude Code, design/brainstorm path)
**Status:** Approved design → implementation plan next
**Implements:** `docs/specs/_WORKFLOW-TODO.md` → Section A item 1 (`/spec-kit`) + Section B (kit templates)
**Out of scope (later TODO sections):** `/spec-kit-review` (A.2), `.cursor/rules` + Antigravity wiring (C), the first real `planning` run (D)

---

## 1. Purpose & context

`/spec-kit <page>` is a **Claude-only planning skill** that turns one Evenzi page/feature into a complete, file-based **build kit** — a set of handoff documents that downstream tools act on *without the originating conversation's context*:

- **Claude** plans (this skill) → writes the kit
- **Cursor** reads `_cursor-prompt.md` → builds the page
- **Antigravity** reads `_antigravity-prompt.md` → tests → writes `_findings.md`
- **Claude** (`/spec-kit-review`, next skill) reviews findings → writes `_review.md` → loops

The baton between tools is **files**, with `_status.md` as the one-line state marker. This skill is the front door of that pipeline. It does not build or test — it produces the plan + the runbooks + the test plan that everyone downstream executes.

This is **infra/process work** (like the 2026-05-20 council/agent-evolve session), not sprint feature work. No ClickUp task is attached.

### Why a kit and not just a plan

The existing design path produces a single `designs/_plans/<page>.md`. That works when Claude both plans and builds in one session. The multi-editor workflow splits planning (Claude) from building (Cursor) from testing (Antigravity) — each tool starts cold, so each needs a **self-contained, role-targeted document**. The kit is that decomposition.

---

## 2. The `<page>` argument

The page slug does not equal the overview filename, so the skill carries an **alias map** (slug → overview file → page dir). Initial map:

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
| `dashboard` | `host-dashboard-overview.md` | (root `index.html`) |
| `landing` | `landing-overview.md` | (marketing) |
| `admin` | `admin-module-overview.md` | (n/a yet) |

Resolution rules:
- Exact slug match → use the mapped overview + page dir.
- No match → list the known slugs and ask which one (or accept a new slug + ask for the overview source).
- Overview file missing on disk → tell the user and ask whether to proceed without it (overview is strongly preferred but not strictly required).

---

## 3. Inputs the skill reads (Phase 0)

Canonical paths (verified 2026-06-05):

- **Feature overview** — `docs/features/overviews/<mapped>.md`
- **Design system** — `designs/shared/shell.css`, `designs/shared/shell.js`, `designs/components.html`
- **Brand** — `docs/BRAND-GUIDELINES.md` (source of truth for brand decisions)
- **Existing page work (if any)** — `designs/pages/<page>/*` and `designs/_plans/<page>*.md`
- **Agent role-books** — `ai/agents/ui_ux_designer.md`, `ai/agents/frontend_engineer.md`, `ai/agents/test_engineer.md` — read so their constraints are embedded into the Cursor/Antigravity prompts (tokens-only, no inline CSS/JS, mobile-first, reuse-before-create, the test matrix).

---

## 4. Run flow — 5 phases, 2 human gates

```
Phase 0  Resolve & read            (auto)
Phase 1  Draft + open questions  → 🚪 GATE 1 (you answer batched open Qs)
Phase 2  Council (design mode)     (auto, unattended)   [+ codex if --codex]
Phase 3  Assemble kit             (auto)
Phase 4  Kit review              → 🚪 GATE 2 (you review; on approve, status → BUILD)
```

### Phase 0 — Resolve & read (auto)
Resolve `<page>` via the alias map; read all inputs in §3 (parallel reads). If the slug or overview can't be resolved, fall to the §2 ask rules.

### Phase 1 — Draft + open questions → GATE 1
Synthesize a **working draft `_spec.md`** from overview + design system + existing work:
- page goal & primary user (host vs guest)
- section-by-section breakdown
- every UI element → **reuse map** (existing shell primitive) vs **new primitive needed**
- states required per element (default / hover / focus / disabled / loading / error / empty)
- data/content model & content-length resilience
- responsive behavior (mobile-first, the 6 test widths)
- a11y requirements

Then surface a **single batched, numbered list of open decisions** (the genuinely ambiguous calls — not things the skill can reasonably default). Wait for answers. Fold answers into the draft.

### Phase 2 — Council (auto, unattended)
Run `/council design` on the answered draft spec. Council's design roster already brings `ui_ux_designer` + `frontend_engineer` + `tech_lead` + `product_manager` with debate + arbiter, so a separate standalone UI/UX pass is **not** duplicated here. Fold council findings (critical + important) into `_spec.md` and `_test.md`.

**Codex is opt-in.** `--codex` flag adds one codex review pass for hard pages (codex is on a limited plan — reserve it). Default runs **without** codex.

If council's triviality skip fires (cosmetic-only), log it and continue — the kit is still produced.

### Phase 3 — Assemble kit (auto)
Instantiate the 7 templates (§5) into `designs/pages/<page>/`, filled from the spec + council output. `_findings.md` and `_review.md` are created empty-with-header (downstream tools append to them). Set `_status.md` to `SPEC` (pending the Gate-2 approval that flips it to `BUILD`).

### Phase 4 — Kit review → GATE 2
Present the assembled kit to the user (summary + key decisions + the Cursor runbook). Iterate on request. On approval, bump `_status.md` → `BUILD (Cursor)` with the `NEXT:` line pointing at `_cursor-prompt.md`.

---

## 5. The kit format (Section B) — 7 files

All in `designs/pages/<page>/`, underscore-prefixed so they sort above the eventual `*.html/css/js`.

| File | Role | Written by | Mutability |
|---|---|---|---|
| `_status.md` | One-line baton — handoff state machine | every tool bumps it | overwrite |
| `_spec.md` | **Build source of truth** | `/spec-kit` | overwrite on re-run |
| `_test.md` | **Test source of truth** | `/spec-kit` | overwrite on re-run |
| `_cursor-prompt.md` | Numbered **build runbook** for Cursor | `/spec-kit` | overwrite |
| `_antigravity-prompt.md` | Numbered **test runbook** for Antigravity | `/spec-kit` | overwrite |
| `_findings.md` | Test findings | Antigravity / humans | **append-only** |
| `_review.md` | Review of findings | `/spec-kit-review` | **append-only** |

### State machine (`_status.md`)
Stages: `SPEC → BUILD → TEST → REVIEW → DONE`. Each tool advances it and rewrites the `NEXT:` hint. Shape:
```
PAGE: planning
STAGE: BUILD (Cursor)
UPDATED: 2026-06-05 — /spec-kit
NEXT: open Cursor → read _cursor-prompt.md → execute
```

### `_spec.md` (build detail)
Page goal & user; section-by-section composition; per-element reuse map (shell primitive cited by name) vs new primitives (with where they should live — shell vs page-specific); all interaction states; data/content model; responsive behavior; copy; a11y. The single source Cursor builds from.

### `_test.md` (test detail)
Acceptance criteria; the full test matrix (component states, interaction/keyboard, 6-width responsiveness 360/390/414/768/1024/1440, cross-page nav, light/dark, a11y); edge cases (content-length, empty, error); explicit definition of done. The single source Antigravity tests from.

### `_cursor-prompt.md` (build runbook)
Self-contained numbered steps. Opens by orienting Cursor (what page, that it must read `_spec.md`), states the hard constraints (design tokens only, **no inline CSS/JS**, reuse `shared/shell.*` primitives before creating, mobile-first, generic→shell / page-specific→`<page>.*`), then ordered build steps, then the closing instruction to bump `_status.md` → `TEST`.

### `_antigravity-prompt.md` (test runbook)
Self-contained numbered steps: read `_test.md`, run each matrix row, record pass/fail + notes into `_findings.md`, then bump `_status.md` → `REVIEW`.

### `_findings.md` / `_review.md`
Created empty with a header + an append convention note. `_findings.md` is where test output accrues; `_review.md` is where `/spec-kit-review` writes its council/codex assessment. Both append-only, newest-last, timestamped entries.

---

## 6. Skill file layout

```
.claude/skills/spec-kit/
├── SKILL.md                         # frontmatter + the 5-phase flow + alias map + gates
└── templates/
    ├── _status.md
    ├── _spec.md
    ├── _test.md
    ├── _cursor-prompt.md
    ├── _antigravity-prompt.md
    ├── _findings.md
    └── _review.md
```

Templates are **separate files** (not inline in SKILL.md): keeps SKILL.md readable, makes templates editable without touching skill logic, and they double as the canonical reference. Templates use clear `{{PLACEHOLDER}}` markers the skill fills during Phase 3.

`SKILL.md` follows the repo convention (YAML `name` + `description`, then a body of tables/phases) modeled on `council/SKILL.md`. Target length comparable to council (~150–200 lines).

---

## 7. Design-system constraints carried into every kit

The kit prompts must hard-code Evenzi's design discipline so Cursor/Antigravity (which only *read* the agent role-books as rules) stay in lane:

- **Tokens only** — colors/spacing/radii from `shared/shell.css` variables, never raw hex/px guesses.
- **No inline CSS/JS** — generic → `shared/shell.*`; page-specific → `designs/pages/<page>/<page>.{css,js}`.
- **Reuse before create** — check `components.html` + `shared/shell.css` first; cite the primitive.
- **Mobile-first**, touch targets ≥44px, `env(safe-area-inset-*)` on fixed chrome, design at 360px first.
- **`.bc-wrap`** canonical page wrapper; do not override width at module level.

---

## 8. Scope boundaries

**In (this task):**
- `.claude/skills/spec-kit/SKILL.md`
- 7 template files under `.claude/skills/spec-kit/templates/`
- page→overview alias map (in SKILL.md)
- Tick `_WORKFLOW-TODO.md` → A.1 `/spec-kit` checkbox (the doc is now on this branch after the Dev-Vibe rebase)

**Out (later TODO sections):**
- `/spec-kit-review` skill — A.2
- `.cursor/rules/` + Antigravity test-config wiring — C
- First real `planning` run — D

---

## 9. Open questions

None outstanding. Decisions locked during brainstorming:
1. Build kit format + skill together (A + B as one unit). ✅
2. Engine = `/council design` core, codex opt-in via `--codex`. ✅
3. Gates = open-Qs upfront + kit review at end (council unattended between). ✅
4. Templates = separate files in skill dir. ✅
5. `_WORKFLOW-TODO.md` brought onto this branch via Dev-Vibe FF + rebase. ✅
