# Fix Plan — In-scope screens (living doc, 2026-06-23)

Merges the **founder manual pass (M1–M10)** + the **multi-agent/Antigravity findings** (`qa/in-scope-screens-findings.md`). Grouped by priority + area. **More manual items may still arrive — update before executing.** No fixes start until the founder says "done" (exception already taken: M10 preloader is built).

Sources: `qa/manual-findings.md` (M#), `qa/in-scope-screens-findings.md` (D# = agent dimensions).

---

## P0 — Broken / user-visible (do first)
| Item | Source | Fix |
|---|---|---|
| Success page redirects to /home | D4 HIGH | drop cross-schema embed in `app/events/[id]/success/page.tsx:25` → `.schema('config')` + JS join (also rebuild on design system, see C-block) |
| "OTP SENT" toast invisible | D5 HIGH | `app/auth/page.tsx:307` `is-active` → `.bc-toast.is-show` |
| Toggle switch visually dead | D5 HIGH | `components/ui/ToggleSwitch.tsx` → shell composition (`button.toggle-switch[role=switch][aria-checked]` + `.toggle-switch-thumb`) |
| New event not shown until refresh (**M7**) | M7 (High) | `router.refresh()` / `revalidatePath('/home')` after create so `/home` loads fresh on arrival |
| Event date: no validation (**M4b**) | M4 | enforce `>= today` and `<= today+5y` in the picker AND `createEventSchema` (`lib/validations/events.ts`) |

## P1 — Create wizard: fidelity + missing features
| Item | Source | Fix |
|---|---|---|
| Cover upload = white box (**M2**) | M2 | replace with shell `.dp-dropzone` (single-file, dark), wire to `/api/events/cover` |
| Step 2 fields ≠ design (**M3**) | M3 | add "Event Title" (decision: explicit vs auto-derive), align labels/required, fix grid order; may need `config.event_types.field_schema` update |
| Date picker design (**M4a**) | M4 | use the design's dark branded calendar (not the white native popover) |
| Step 3 Set-time / Set-venue / custom-ceremony modals missing (**M5**) | M5 (High) | build the 3 modals per design (date+wheel time, venue name+address, ceremony name+desc); **persist** date/time/venue into `event_sub_events` via create path |
| Step 3 search no empty-state (**M6**) | M6 | add "no results" message, keep "Add custom ceremony" visible |

## P2 — Loading & dashboard polish
| Item | Source | Fix |
|---|---|---|
| Preloader (**M10**) | M10 | ✅ **DONE** — `components/ui/Preloader.tsx` |
| Skeletons everywhere they load (**M1, M8**) | M1, M8 | use shell `.skeleton` (SK3 event card) for dashboard + any async region; **and** server-render the event-types catalog (kill the unnecessary client-fetch spinner in `Step1EventType.tsx`) |
| Dashboard filter alignment (**M9**) | M9 | align Active/Past `.seg` with My-events/Collaborations (remove trailing dead space / space-between) |

## P3 — Quality, security, a11y (agent findings)
| Item | Source | Fix |
|---|---|---|
| Media proxy unauth/no key validation | D9 Med | `/api/media/[...key]` — allowlist key prefixes (+ ownership if private content possible) |
| Delete modal doesn't close on Esc | D7 Med | add Esc handler + focus-trap return in the confirm modal |
| StatusBadge / Button variants undefined | D5 Med | map to real shell classes or add modifiers + catalog |
| event-types routes: no `console.error` before 500 | D3 Med | add logging |
| Step3 custom-ceremony index key | D6 Med | stable client id instead of array index |
| Dead/forked: `WizardProgress.tsx`, dual `--color-*` tokens, `EventMetadataRow` | D5/D3 Low | delete forks; standardize on shell tokens |
| Misc Low: nav "Settings" uses logout icon; `home/page.tsx` swallows `error`; cover content-type trust; `/api/auth/verify` returns full user; settings reads table not view; `form_schema` comment drift | D1/D3/D4/D9 Low | batch cleanup |

## Cross-cutting: design-system consistency (C-block)
M2 + the success page + StatusBadge/Button/ToggleSwitch all share one root cause — **components drifting from the shell catalog**. Fix together: route screens through shell primitives, register the `components/ui/*` wrappers in `designs/components.html`, retire `--color-*` in favor of `--bg/--ink/--brand`.

## Verification follow-ups (found during the fix-verify gate)
- **Success page chrome duplication** — `app/events/[id]/success/page.tsx` now renders its own standalone page-shell (per `success.html`), but it's nested in `app/events/[id]/layout.tsx`, so the event nav-bar + tool-rail sidebar ALSO wrap it. Fix: move the success route out of the `[id]` layout (e.g. its own segment/route group) so it's a clean standalone celebration screen. Off the main path (create → event dashboard, not /success), so low urgency.

## Separate — pre-existing tech debt (not this change; own tickets)
- Stale unit tests (13/71 fail — `role→role_slug`, `field→key` mocks) → refresh suite.
- Lint debt (104 err / 1878 warn).
- Hub hero SVG `transform-origin` → `transformOrigin` (DOM warning).

---

## Suggested execution order (once "done")
1. **P0** (5 items — mostly small, high-impact).
2. **Create wizard batch** P1 (M2–M6) — largest chunk; the modals (M5) + Step 2 fields (M3) are the big ones; may touch `field_schema` seed.
3. **Loading/dashboard** P2 (skeleton rollout + M7 already in P0 + M9).
4. **P3 + C-block** quality/security/design-system cleanup (good candidate for parallel agents).
5. Hand pre-existing debt to separate tickets.
