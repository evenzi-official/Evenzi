# Cursor fix-doc — Planning Tasks v2, loop-2 (4 founder-review fixes)  ·  SPEC_VERSION 2026-06-06.2

The v2 build landed all 13 items. Founder review surfaced 4 fixes. **Edit in place — do NOT rebuild.** Touch only `designs/pages/planning/*` and `designs/shared/shell.{css,js}`. Do NOT edit `pages/guests/` or `pages/website/`.

## 0 · STOP-check
`_status.md` must read `STAGE: BUILD (Cursor)` + `SPEC_VERSION: 2026-06-06.2`. Else STOP (wrong worktree).

## Fixes
1. **Bulk-bar popovers must open UP, not down.** The bulk bar is docked at the screen bottom, but its Set-date / Assign popovers (`openPicker` in `planning.js`, anchored via `getBoundingClientRect`, ~line 1091) open *below* the trigger → off-screen. Add **flip-up logic**: if `triggerRect.bottom + menuHeight > window.innerHeight - margin`, position the popover **above** the trigger (anchor its bottom to the trigger top) instead of below. Applies to all `openPicker` menus invoked from the bulk bar (and harmless elsewhere — flip only when there's no room below). Keep focus-trap + Esc + outside-click intact.
2. **Add "Select all".** In selection mode there's no way to select everything. Reuse the guests pattern (`selectAllVisible()` + a `[data-gm-select-all]` control in `guests.js`): add a **"Select all"** affordance to the planning bulk bar (e.g. next to "N selected") that selects all *currently-visible* tasks (respecting active filters), and toggles to "Clear" / deselect-all when all are selected. Wire `[data-plan-select-all]` → select all visible → `updateBulkBar()`. Keyboard-focusable, labelled.
3. **Color the status-chip counts by state.** The chip counts are `<span data-plan-chip="todo|done|overdue|all">`. Tint each count to its state (subtle, keep AA contrast): `todo` → `--muted`/neutral, `done` → success token, `overdue` → `--danger`, `all` → `--brand`. CSS only (target `[data-plan-chip="…"]`); the chip's own active/hover states stay as-is. (Counts are numeric — colour reinforces state; the chip label text already names it, so this isn't color-only.)
4. **Align the compact header to the content.** `.plan-panel .section-head` and the card/toolbar below it don't share a left edge — the eyebrow ("CHECKLIST"/"BUDGET") + title ("Tasks"/"Spending tracker") sit at a different inset than the card content ("14 of 30 done", the toolbar). Make the section-head's horizontal padding line up so the **eyebrow/title left-align with the card's content left edge** at every width (360 → 1440). Verify in the design self-review at 360px and desktop.

5. **Use the custom Evenzi calendar, not the native OS date picker.** Planning's date fields are bare `<input type="date" class="form-input">` (`#plan-task-due` ~line 412, `#plan-exp-date` ~line 523) → they open the OS picker. The shell already ships the custom Evenzi calendar (`.cal-pop`, `shell.js:538`) wired via the **`[data-date-trigger]`** pattern (canonical markup in `components.html` FF6). Convert BOTH date fields to it:
   ```html
   <button type="button" class="form-input form-input-trigger" data-date-trigger aria-labelledby="…-label">
     <span class="form-input-trigger-value" data-placeholder="Pick a date"></span>
     <span class="material-symbols-outlined" aria-hidden="true">calendar_month</span>
   </button>
   <input id="plan-task-due" name="due" type="date" class="sr-only" tabindex="-1" aria-hidden="true" />
   ```
   **Keep the SAME hidden `<input>` id + name** (`plan-task-due`, `plan-exp-date`) so `planning.js` form logic (set/read `.value`, default `TODAY`, edit-prefill) is untouched — the hidden input stays the value store; the calendar writes to it + dispatches `change`. **Sync the trigger's `.form-input-trigger-value` display** with the input value on init, on edit-prefill, and on the default-`TODAY` set (show the formatted date, else the placeholder). Do NOT add `data-native-date` (that opts back into the OS picker). The shell calendar handles keyboard/Esc/focus + dark mode + mobile bottom-sheet. (This supersedes the v1 spec's "native `<input type=date>`" decision.)

## When done
Run the design self-review + self-test (`.cursor/rules/evenzi-design.mdc`): bulk popovers open upward and stay on-screen; Select-all selects visible + toggles; chip counts are state-colored with AA contrast; header + content share a left edge at 360/768/1440; `git status` shows only `designs/pages/planning/*` + `designs/shared/shell.{css,js}`. Then bump `_status.md` → `STAGE: TEST`.
