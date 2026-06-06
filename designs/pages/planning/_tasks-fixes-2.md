# Cursor fix-doc — Planning Tasks v2, loop-3 (2 remaining)  ·  SPEC_VERSION 2026-06-06.2

Loop-2 applied 4/4 (picker flip-up, select-all, chip colors, header align). These **2 remain** (the calendar got dropped in a race; the toast move is new). **Edit in place.** Touch only `designs/pages/planning/*` and `designs/shared/shell.{css,js}`. Do NOT edit `pages/guests/` or `pages/website/`.

## 0 · STOP-check
`_status.md` must read `STAGE: BUILD (Cursor)` + `SPEC_VERSION: 2026-06-06.2`. Else STOP (wrong worktree).

## Fixes

**A. Custom Evenzi calendar instead of the native OS date picker** *(carried over — not applied in loop-2)*. Planning's date fields are still bare `<input type="date" class="form-input">` (`#plan-task-due`, `#plan-exp-date`) → OS picker. The shell ships the custom calendar (`.cal-pop`, `shell.js:538`) wired via the **`[data-date-trigger]`** pattern (canonical markup: `components.html` FF6). Convert BOTH date fields:
```html
<button type="button" class="form-input form-input-trigger" data-date-trigger aria-labelledby="…-label">
  <span class="form-input-trigger-value" data-placeholder="Pick a date"></span>
  <span class="material-symbols-outlined" aria-hidden="true">calendar_month</span>
</button>
<input id="plan-task-due" name="due" type="date" class="sr-only" tabindex="-1" aria-hidden="true" />
```
**Keep the SAME hidden `<input>` id + name** so `planning.js` (set/read `.value`, default `TODAY`, edit-prefill) is untouched — the hidden input is the value store; the calendar writes to it + dispatches `change`. **Sync the trigger's `.form-input-trigger-value` display** with the input value on init, edit-prefill, and the default-`TODAY` set. Do NOT add `data-native-date`. The shell calendar handles keyboard/Esc/focus + dark mode + mobile sheet.

**B. Move the toast to top-right, below the nav.** The bottom is crowded (FAB, bulk bar, tool dock). `.bc-toast` is currently `position:fixed; left:50%; bottom:32px; transform:translateX(-50%)` (bottom-center). Reposition (shell.css — applies app-wide, intended):
- `top: calc(env(safe-area-inset-top, 0px) + 5rem)` (clears the sticky `.floating-nav`), `right: 1.5rem` (→ `2.5rem` at ≥768, matching page padding), `left: auto`, `bottom: auto`.
- Entrance: slide from the top — hidden `transform: translateY(-12px)`, `.is-show` `transform: translateY(0)` (drop the `translateX(-50%)` centering from both states).
- `max-width: min(360px, calc(100vw - 3rem))` so it never overflows on mobile; text + the Undo action stay on one row (wrap gracefully if long).
- Keep the polite live region, the `.bc-toast-action` (Undo), reduced-motion (`transition:none`), and z-index above content/nav.

## When done
Run the design self-review + self-test: date fields open the **custom Evenzi calendar** (not OS), value persists + display syncs, edit-prefill works; toast appears **top-right under the nav**, doesn't overlap the nav, Undo works, no mobile overflow; `git status` shows only `designs/pages/planning/*` + `designs/shared/shell.{css,js}`. Then bump `_status.md` → `STAGE: TEST`.
