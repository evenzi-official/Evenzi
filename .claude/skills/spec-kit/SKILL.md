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
Stamp a fresh `SPEC_VERSION` (e.g. a short timestamp passed in, since the runtime has no clock). Instantiate the 7 templates into `designs/pages/<page>/`, filling every placeholder. **Council-finding → placeholder mapping:** critical+important findings → the `Council notes folded in` slot and the relevant `_spec.md`/`_test.md` sections; if council skipped, write `n/a (trivial skip)` there. Never leave an unfilled placeholder.

**Re-run contract (idempotency):** on re-run of an existing page —
- Overwrite `_spec.md`, `_test.md`, `_cursor-prompt.md`, `_antigravity-prompt.md` with the new `SPEC_VERSION`.
- **Never clobber** the append-only `_findings.md` / `_review.md` — append a marker noting the spec was re-generated to the new `SPEC_VERSION` so prior findings are visibly stale.
- Do **not** silently reset `_status.md` to SPEC if it's past BUILD — warn the user and confirm before resetting stage.

### Phase 4 — Kit review → 🚪 GATE 2
Present the assembled kit (summary + key decisions + the Cursor runbook). Iterate. On approval bump `_status.md` → `STAGE: BUILD (Cursor)`, `NEXT:` → `_cursor-prompt.md`.

## Design-system constraints (the kit's runbooks carry these)
Tokens only; no inline CSS/JS (generic → `shared/shell.*`, page-specific → `pages/<page>/<page>.*`); reuse before create (cite catalog + a sibling page); copy the canonical `<head>` + chrome from the nearest sibling; set `<body data-page>`; hover-guard every `:hover`; `@supports` glass fallback; stretched-link cards; mobile-first ≥44px; `.bc-wrap` wrapper; dark mode + semantic status tokens mandatory.

## Scope
Produces the kit only. Does **not** review findings (`/spec-kit-review`, TODO A.2 — owns REVIEW→DONE) and does **not** wire Cursor/Antigravity configs (TODO C).
