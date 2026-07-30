# Handoff: Live Browser + Database Testing — Planning Tools Backend-Wiring (Focused Scope)

## 1. Routing header

- **Tool:** Antigravity (browser-driven testing)
- **Model:** default (Gemini 3 or Sonnet) — pure verification, not a build.
- **Setup:** Repo at `/Users/xcalider/Documents/Projects/Evenzi`, branch `Dev-Vibe` (already has the full build). Start `npm run dev` (port 3000), open a browser tab at `http://localhost:3000`. If you have Supabase MCP access configured (project `smjkbmkxweevqpvygabe`, region `ap-northeast-1`), use it for the database-verification steps below — that's the whole point of this pass, not optional.

## 2. Objective & context

This session finished a 9-task subagent-driven build wiring **Planning Tools** (task checklist + budget/expenses) in this wedding-planning SaaS app from a client-state-only prototype to a fully persisted Supabase-backed feature. Every task was code-reviewed; two review cycles caught and fixed real bugs (a not-found/error-handling gap in the task API route, and a missing rollback-on-failure pattern for optimistic UI updates). TypeScript and lint are both clean.

**What's not yet done, and is your job:** prove this actually works end-to-end with real data — not toy strings, not a quick click-through. You are the last gate before this is marked fully shipped. Assume nothing works until you've watched it work in the browser AND confirmed the row actually changed in the database. A UI that "looks like it saved" is not proof — a database row that changed is proof.

## 3. Scope boundary — this prompt is Planning Tools ONLY

Do not test Guest Management, Event Settings, User Settings, or anything else in this pass — a separate, broader end-to-end prompt covers the rest of the platform. Stay inside `/events/[id]/planning`.

## 4. Prior decisions — do not report these as bugs

- **Receipt upload is an intentional UI-only stub.** A file picker shows a local image preview but nothing is uploaded or persisted (`receipt_key` stays null in the DB). After reload, the preview will be gone — that is correct, expected behavior, not a defect.
- **Bulk actions (Set date / Assign) intentionally have no "undo" toast** — just a plain confirmation toast. Not a bug.
- **Toolbar counts (all/todo/done/overdue) are intentionally computed client-side** from the already-loaded task list, not re-fetched from the server on every filter change. Not a bug.
- **Assignee UI (who's responsible for a task) is intentionally not built this pass.**
- **A pre-existing layout bug** (a ToolRail/page-band visual overlap at ≥1024px width) exists on this page AND on the already-shipped Event Hub page — it's a known, tracked, cross-cutting issue predating this build. Note it if you see it, but don't file it as a Planning-Tools-specific defect.
- **No Escape-key dismissal on any modal/popover on this page** — that's a pre-existing gap across the whole page, not something this build introduced or was asked to fix.

## 5. Test account & getting to the feature

- **Login:** phone OTP, test number `9999999999`, OTP code `123456`.
- If no event with real sub-events exists yet, create one through the actual 4-step event-creation wizard first — use a REAL wedding scenario (real-sounding couple names, a real venue name, real dates a few months out, at least 3 distinct sub-events like Haldi/Mehendi/Wedding/Reception) so the sub-event picker in Planning Tools has genuine data to test against, not an empty list.
- Navigate to that event, then to its Planning tab (`/events/[id]/planning`).

## 6. Real-data requirement

Every entry you make in this pass must look like something a real host would type — not "test123" or "asdf". Examples of the kind of realistic data to use:

- Task titles: "Confirm florist for mandap decor", "Finalize catering headcount with venue", "Book mehendi artist", "Send save-the-dates to extended family"
- Vendor names: "Green Leaf Caterers", "Kerala Blooms Florist", "Studio Frame Photography"
- Budget: a realistic total (e.g. ₹8,50,000) and realistic expense amounts per line item (₹45,000 catering advance, ₹12,000 photographer booking fee, etc.)
- Dates: spread across the weeks/months leading up to the wedding date you set during event creation, not all the same day.

## 7. Functional + database test matrix

For every mutation below: (a) do it in the browser, (b) confirm the UI reflects it immediately, (c) **reload the page** and confirm it's still there, (d) **query Supabase directly** (if you have MCP access) to confirm the actual row in `event_tasks`/`event_budgets`/`event_expenses`/`event_expense_types` has the correct values — not just that *some* row exists, check the actual column values match what you entered.

1. **Task checklist — full CRUD:**
   - Create 4-5 realistic tasks with varying due dates, priorities, and sub-event assignments (including at least one task assigned to "whole event" / no specific sub-event).
   - Query `event_tasks` for this event and confirm: correct `title`, `description`, `due_date`, `sub_event_id` (or null), `priority_id` resolves to the correct priority via `config.task_priorities`, `status_id` resolves to `pending` by default.
   - Edit one task's title, due date, and priority. Confirm the DB row updated, not a duplicate row created.
   - Toggle done/undone on 2 tasks. Query the DB and confirm `status_id` actually changed to the `done`-category status and back to `pending` — not just that the checkbox visually ticked.
   - Delete one task. Confirm the row is actually gone from `event_tasks` (not just hidden in the UI).

2. **Bulk actions — with DB verification:**
   - Select 3+ tasks, run bulk **Complete**. Query the DB: confirm ALL selected task ids now have the done-category `status_id`, and confirm tasks NOT selected were untouched.
   - Select a different 2+ tasks, run bulk **Set date** using each quick-pick option in turn (Today, Tomorrow, +1 week, then None on a final pair). Query the DB after each to confirm `due_date` actually changed to the correct value (or became null for "None").
   - Select 2+ tasks, run bulk **Assign** — once to "Whole event" (should set `sub_event_id` to null), once to a specific real sub-event. Query the DB to confirm `sub_event_id` matches.
   - Select 2+ tasks, run bulk **Delete**. Confirm all selected rows are gone from `event_tasks`, and confirm tasks you didn't select are still present (this checks the bulk delete didn't over-delete).

3. **Budget:**
   - If this event has no budget row yet, set one for the first time (this exercises the "no pre-existing row" upsert path specifically — worth calling out in your report whether it worked correctly the first time). Query `event_budgets` to confirm the row now exists with the correct `total_amount`.
   - Update the budget to a different amount. Query the DB to confirm it updated the same row (`event_id` should stay unique — check there isn't a second budget row for this event after the update).

4. **Expenses — full CRUD + custom types:**
   - Add 3 realistic expenses using existing expense types from the dropdown (pick different types), with realistic amounts, vendor names, and dates. Query `event_expenses` and confirm every field matches what you entered, and `expense_type_id` correctly references the type you picked.
   - Use the **"+ Add type"** flow to create a genuinely new custom expense type (something not in the default list, e.g. "Mehendi Artist" or "Return Gifts"). Confirm it appears immediately as selectable in the same session. Use it on a new expense. Query `event_expense_types` to confirm the new row has `is_custom = true` and the correct `event_id`; query `event_expenses` to confirm the new expense's `expense_type_id` points to it.
   - Try adding a **duplicate-name** custom type (same name as one you just created, or same name+casing as an existing default type). Confirm you get a clear, visible error message in the UI — not a silent no-op, not a crash, not a generic "something went wrong."
   - Edit one expense (change amount and vendor). Query the DB to confirm it updated the same row.
   - Delete one expense. Confirm it's gone from `event_expenses`.
   - Add a receipt image to one expense via the file picker — confirm a local preview shows up in the browser. Do NOT expect this to persist (see section 4) — just confirm the preview UX itself doesn't break anything else in the modal.

5. **Breakage / error-path checks (deliberately try to break it):**
   - Try submitting the task form with an empty title — confirm client-side validation blocks it with a visible message (not a failed network request with no feedback).
   - Try setting a budget with a negative number or non-numeric input — see what happens, report it either way.
   - Open the browser devtools Network tab during a few of the mutations above and check: does every successful save actually get a `200`/`201` response with the data you'd expect in the response body? Does the request payload contain the fields you'd expect (not accidentally sending a client-supplied `status` on task creation, for example — tasks should always be created as `pending` server-side, so check the response reflects that even if you didn't specify a status)?
   - Check the browser console for errors after each mutation — report any that appear, even warnings.

## 8. Responsive check (lighter than a full 6-breakpoint sweep — that's not the point of this pass)

Resize to 390px (phone) and 1440px (desktop) at minimum, and just confirm: no horizontal scroll, all modals fully visible and usable, bulk action bar doesn't overlap other content, at both sizes. If something looks visually broken at either size, screenshot it and note it — but the primary goal of this prompt is functional + data correctness, not a full visual audit.

## 9. What to document

One markdown report with:

- A summary table: each test item from section 7 → PASS/FAIL, with a one-line note on what the DB query showed (not just "UI looked right").
- Screenshots for anything that failed, or for the two specific "first-time" edge cases called out (first-ever budget set, duplicate expense-type name error).
- A clearly separated "Issues Found" section, severity-tagged (Critical = data doesn't persist or persists wrong / Important = a flow is broken or confusing / Minor = cosmetic), each with exact repro steps and what the DB query returned vs. what was expected.
- Do not include the section-4 known/accepted items as issues.

## 10. Definition of done

- Every item in section 7 executed with real data, verified via both browser reload AND a direct database query where you have Supabase access.
- Section 5's deliberate break-attempts run and documented either way.
- One report file with the summary table, screenshots, and severity-tagged issues list, saved somewhere this session can read it back.
