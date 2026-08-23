# Our Journey cards — meta line + comfortable spacing

**Date:** 2026-08-23  
**Scope:** `app/events/[id]/journey` rows + `designs/pages/event-control/our-journey.css` only.  
**Out of scope:** new fields, reorder, wizard changes, API changes.

## Goal

Match the locked card anatomy (icon, title + status badge, **date · time · venue**, Website toggle, edit, delete) with **more air** so the meta line is readable. Empty functions still show a hint, not a blank hole.

## Anatomy (unchanged)

```
[icon]  Title                    [HELD | NEXT UP | THE BIG DAY]
        Fri, Aug 15 · 7:00 AM · Lake Pichola, Udaipur
                                      Website [toggle]  [edit] [delete]
```

- Title: `custom_name` else catalog type name.
- Meta: `formatSubEventDate` · `formatSubEventTime` · `venue`, joined with ` · `. Omit any missing piece.
- If **all three** empty: muted italic `Add date, time & venue` (tappable via existing Edit — no extra control).
- Format stays `en-US` short weekday/month as today (`Fri, Aug 15 · 7:00 AM`).

## Spacing (comfortable)

Override page CSS only (`.oj-*`):

| Token | Locked now | Comfortable |
|---|---|---|
| Row padding | `1rem 1.1rem` / md `1.1rem 1.35rem` | `1.15rem 1.25rem` / md `1.35rem 1.5rem` |
| Icon–text gap | `1rem` / md `1.25rem` | `1.15rem` / md `1.5rem` |
| List gap | `.85rem` | `1rem` |
| Title → meta | `margin-top: .2rem` | `margin-top: .4rem` |
| Meta type | 13px / weight 500 | 13px / weight 500, `line-height: 1.45` |
| Row align | `center` | `flex-start` on small screens if meta wraps; `center` from 768+ |
| Meta overflow | nowrap + ellipsis | nowrap + ellipsis ≥768; allow wrap <768 (max 2 lines) |

Icon stays 48px. No new colors. Dark/light via existing `--muted` / `--ink`.

## Empty vs filled

- Filled (any part): `.oj-row-meta` as now.
- Empty: `.oj-row-meta.is-empty` — `--muted-soft`, no italic if italic fights the system; use opacity 0.85 instead.

## Reuse

No new components. Keep `ToggleSwitch`, `ConfirmDialog`, `useBusy`, wizard date/time pickers in the modal.

## Success

- Cards with data look like the screenshot, with looser padding.
- Cards with no schedule show the hint, not a collapsed title-only row.
- No horizontal scroll at 360px.
- `npx tsc --noEmit` still clean.
