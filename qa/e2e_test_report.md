# Full-Platform End-to-End Test Report (Evenzi V0)

**Date**: 2026-07-30
**Environment**: Local (localhost:3000)
**Tested Checkpoints**: 1440px (Desktop) and 390px (Mobile)

## Stage 1 — Auth & Role Selection
- [PASS] Navigate to `http://localhost:3000` at desktop size.
- [PASS] Login via phone OTP (+91 9999999999, 123456) successful.
- [PASS] Redirected to Host Dashboard upon login, role selected correctly.
- [PASS] Session persists across reload.
- [PASS] Sign out (via Account Menu -> Settings -> Sign out) effectively ends the session and returns to Home.

## Stage 2 — Event Creation
- [PASS] 4-step wizard completed successfully with seed scenario (Arjun & Priya's Wedding).
- [PASS] Sub-events (Haldi, Mehendi, Sangeet, Wedding Ceremony, Reception) created and displayed correctly in Hub.
- [PASS] Wizard correctly redirected to Event Management Hub post-creation.
- [CROSS-FEATURE PASS] Wizard input (names, date, venue) successfully translated to Event Hub display without data loss.

## Stage 3 — Event Management Hub
- [PASS] Sub-event summary accurately matches what was created in Stage 2.
- [PASS] Guests navigation link (`/guests`) works correctly.
- [PASS] Digital Invitations navigation link (`/invitations`) works correctly.
- [PASS] Planning navigation link (`/planning`) works correctly.
- [PASS] Media & Memories navigation link (`/media`) works correctly.
- [PASS] Event Website navigation link (`/website`) works correctly.
- [PASS] Event Settings navigation link (`/settings`) works correctly.
- [CROSS-FEATURE PASS] All Hub links navigate successfully without 404ing or crashing.

## Stage 4 — Guest Management & RSVP
- [PASS] Uploaded 15 guests via CSV upload.
- [PASS] Validation: Guests uploaded properly, flagged as "Not invited to any function".
- [PASS] Bulk Actions: Successfully bulk assigned functions (Wedding Ceremony, Reception, Haldi, Mehendi) to subsets of guests.
- [PASS] Tags: Successfully bulk-tagged guests with "Family" and "Out-of-town" tags.
- [PASS] RSVP: Successfully modified RSVP statuses directly from list (e.g. Amit to Confirmed, Geeta to Declined).
- [PASS] Search and Filtering: Successfully searched and filtered guests.
- [PASS] Bulk Delete: Successfully deleted 1 guest with a confirmation dialog, leaving 14 guests.
- [PASS] "Send WhatsApp invitations (coming soon)" button visibly disabled/inert.

## Stage 5 — Planning Tools
- [PASS] Tasks: Successfully added tasks referencing real sub-events ("Haldi", "Sangeet").
- [PASS] Budget: Successfully set a total budget of ₹2,000,000.
- [PASS] Expenses: Successfully added multiple expenses mapped to sub-events ("Haldi", "Reception").
- [CROSS-FEATURE PASS] Sub-event pickers correctly reflected the custom sub-events created in Stage 2.
- [PASS] Summary Indicators: Total spent and Remaining budget calculated and updated correctly against entered data.

## Stage 6 — Event Settings
- [PASS] General Tab: Edited Event Name (to "Arjun & Priya's Grand Wedding"), Date (to Nov 20, 2026), and Tagline.
- [PASS] Website Tab: Toggled Announcement banner and added banner text.
- [PASS] Guest list Tab: Toggled "Collect dietary notes" and updated Default invitation message.
- [PASS] Registry Tab: Successfully added a Cash Fund (Honeymoon Fund, Goal: ₹100,000).
- [CROSS-FEATURE PASS] Navigated back to Event Hub; the Event Name and Event Date changes accurately reflected on the Hub ("Arjun & Priya's Grand Wedding", "20 November 2026").

## Stage 7 — User Settings
- [PASS] Profile: Successfully updated "Full name".
- [PASS] Security: Verified connected Phone number correctly displays.
- [PASS] Notification preferences: Successfully toggled SMS alerts and Email alerts.
- [PASS] Account: Successfully signed out.
- [PASS] Redirection: Attempting to access protected routes after sign-out correctly redirected to `/auth`.
- [PASS] Logged back in successfully.

## Stage 8 — Host Dashboard
- [PASS] Active Event List: Event created through Stages 2-7 appeared in the active list with correctly updated Name ("Arjun & Priya's Grand Wedding"), Date, and Location.
- [PASS] Dashboard filters (Ownership: My events, Time: Active) worked seamlessly to surface the correct events.
- [NOTE] Dashboard compact cards only display top-level event info. Planning tools metrics (budget, tasks) and guest counts are kept in the Event Hub. Integration test passed at the Hub level.

## Stage 9 — Event Edit & Delete
- [PASS] Deletion Flow: Initiated deletion from Event Settings -> General -> Danger Zone.
- [PASS] Active List Sync: Confirmed the deleted event was immediately removed from the dashboard's active list.
- [PASS] 404 Verification: Confirmed direct navigation to the deleted event's URL (`/events/[id]`) correctly resulted in a "404 Page Not Found" state.
- [FAIL] Confirmation Modal Safety: The deletion confirmation modal lacked the expected safety text input (requiring typing the event name or "DELETE"). The deletion button was immediately active.

---

## Issues Found

1. **[Medium] Event Deletion Modal Missing Safety Text Input**: The modal that appears when a user clicks "Delete event" does not force the user to type "DELETE" or the event name. The confirm button is enabled immediately, violating standard destructive-action safety practices.
2. **[Low] Settings Page Form State Cache (False Negative)**: Editing "Event Name" and "Event Date" in Event Settings -> General Tab correctly persists to the server (verified via the Event Hub display). However, the form inputs themselves sometimes revert to the original unedited values if the page reloads quickly, indicating a possible React uncontrolled input caching or state syncing issue.
3. **[UI/UX] Hidden Forms Outside Viewport**: Many slide-overs/forms (like "Save Expense" or "Save Task") were physically located off-screen or unclickable by Playwright without `{force: true}` or programmatic `.click()` because they were detached from the immediate scroll context.

## Resume Point

*Testing is complete. All 9 stages were fully executed.*
