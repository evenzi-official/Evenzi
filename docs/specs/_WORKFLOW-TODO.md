# Multi-Editor Workflow — Setup TODO

Goal: Claude plans (council/codex/agents) → generates a per-feature kit → Cursor builds → Antigravity tests → Claude reviews → merge. File-based handoff (`_status.md` = baton).

## A. Build the skills (one-time)
- [x] `/spec-kit <page>` skill — reads overview + shell + brand → brainstorm → **council (design mode) + codex opt-in** → **ask user open Qs** → write the kit. _(built 2026-06-05; spec: docs/superpowers/specs/2026-06-05-spec-kit-skill-design.md)_
- [x] `/spec-kit-review <page>` skill — read `_findings.md` → council/codex review → write `_review.md` → update `_spec.md` → bump `_status.md`. _(built 2026-06-05; owns REVIEW→DONE)_

## B. Kit templates (one-time)
- [ ] `_spec.md` (build detail) · `_test.md` (test detail)
- [ ] `_cursor-prompt.md` (numbered build runbook) · `_antigravity-prompt.md` (numbered test runbook)
- [ ] `_status.md` (one-line baton) · `_findings.md` / `_review.md` (append-only)

## C. Wire the other tools to our agents (one-time)
- [ ] `.cursor/rules/` → point at `ai/agents/ui_ux_designer.md` + `ai/agents/frontend_engineer.md` + `ai/system/agent_rules.md` + constraints (tokens-only, no inline CSS/JS, mobile-first).
- [ ] Antigravity test-config → point at `ai/agents/test_engineer.md` + the test conventions.
- [x] Agents already exist: `ui_ux_designer.md` (UI/UX) + `test_engineer.md` (testing).

## D. First real run — Planning tab (the Cursor trial)
- [ ] `/spec-kit planning` → council pass + answer open Qs → generate kit in `designs/pages/planning/`.
- [ ] Open Cursor → "read `_cursor-prompt.md`, execute" → build.
- [ ] Antigravity → "read `_antigravity-prompt.md`" → test → `_findings.md`.
- [ ] `/spec-kit-review planning` → review → update kit → loop until Done.
- [ ] **Judge Cursor** (follows spec? reuses tokens? doesn't break shell? clean code?) → decide Pro/Pro+ purchase.

## Notes
- Codex is on a **limited** plan (Go, ~75% left) → reserve for hard tasks / one review pass, not main building.
- Council/skills/hooks are **Claude-only** — Cursor/Antigravity just *read* the agent role-books as rules.
- Separate parked work (not this workflow): merge Guest Mgmt to `Dev-Vibe`, cleanup batch, `components.html` backfill, Public RSVP (deprioritized). See `docs/NEXT-SESSION.md`.
