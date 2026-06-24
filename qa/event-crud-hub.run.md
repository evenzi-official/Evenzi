# Run instance — Event creation + Event dashboard (2026-06-22)

> Example of invoking the playbook. Tell Antigravity:
>
> > *"Read `qa/EVENZI-TEST-PLAYBOOK.md`, then this file. Test the TARGET below. Write findings to `qa/event-crud-hub-findings.md`."*

## TARGET
- **Screens:** Event creation (4-step wizard) + Event dashboard (`/events/<id>`). (Both in-scope.) Also re-verify the related settings General page since the review touched it.
- **Design files:** `designs/pages/create-event/step-1…4 + success.html`; `designs/pages/event-control/event-control.html`.
- **Changed files (review pass on commit `0e72a70`):**
  - `app/events/[id]/page.tsx` — hub index; cross-schema embed → `event_hub_summary` view + separate `config.event_sub_types` query; errors surfaced.
  - `app/api/events/[id]/route.ts` — GET embed fix **+ PUT (edit) + DELETE (soft-delete)**.
  - `app/api/events/route.ts` — dashboard GET embed fix (`config.event_types`).
  - `app/events/[id]/settings/page.tsx` + `app/events/[id]/settings/GeneralSettingsForm.tsx` — Save→PUT, Delete→confirm modal→DELETE, partner-name binding from `event_details`.
  - `lib/validations/events.ts` — `updateEventSchema`.
  - `components/ui/WizardStepper.tsx` — React key fix.
- **Flows:** create event (Wedding) → land on hub (must render, not redirect) → settings (partners pre-filled) → edit name + Save (PUT 200, persists) → Delete (confirm modal → DELETE 200 → /home, soft-deleted). Plus: hub for a bad id → not-found (not /home, not 500). Plus: `/events/create` has **no** React key warning.
- **Findings file:** `qa/event-crud-hub-findings.md`.

## Known items (confirm, don't fix — separate pre-existing from new)
- Pre-existing SVG warning on the hub hero: `transform-origin` should be `transformOrigin`.
- Pre-existing stale test `__tests__/lib/validations/events.test.ts` (`field`→`key` from commit `77f0385`) — unit suite red.
- Cover upload (`/api/events/cover`) + media proxy (`/api/media/[...key]`) need R2 creds absent locally → static-audit only, runtime SKIPPED.

## Focus
Give **D2 (design fidelity vs `designs/`)** and **D4 (data modeling, retrieval & R2 storage)** the most depth — this fix was about cross-schema embed correctness, RLS-as-filter, soft-delete, and empty→null coercion. Grep the whole repo for any other cross-schema embeds.
