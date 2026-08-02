# Event Website (Digital Presence) — Full Visual + Functional E2E Sweep

## Prerequisite 4.0 & 4.1: Environment Check
- **4.0 Code existence check:** PASS
  - `git log` on `app/events/[id]/website` confirmed recent changes (b5a8389 feat(website): Wave 3 guest website)
  - `app/e/` directory is present
- **4.1 Environment check:** PASS
  - Dev server is running on port 3000
  - Auth: (Testing in progress)
  - Test event exists: `db6a6dc2-3e3b-4f58-a830-434f1f7cd7d4` (Slug: `dheeraj-1-dheeraj-2-s-wedding-20261203`)
  - Website template exists: `cinematic-scroll`

## Stage 1 — Overview page
- **Verdict:** PASS
- **Details:** The overview page successfully lists the event details, showing "No pages set up yet" and correctly displays the public URL slug (`evenzi.app/e/dheeraj-1-dheeraj-2-s-wedding-20260917`).

## Stage 2 — Design page (template/palette/font)
- **Verdict:** FAIL
- **Details:** Found a bug when picking the 'Cinematic Scroll' template. Navigated to Design page and clicked the Cinematic Scroll template, then clicked Apply. UI showed "Saved ✓", but cross-checking via Supabase MCP (`select template_id from event_website_design`) showed `template_id` remained `null`. Network inspection revealed the frontend sent a PATCH to `/api/events/.../website-design` with payload `{"template_id":null}`. This is the exact regression mentioned in the handoff docs (D54).

## Stage 3 — Edit/Pages: visibility + reorder
- **Verdict:** PASS
- **Details:** Navigated to Edit Pages. Toggled the "Schedule" page visibility off and clicked "Move down" on the "Home" page (reordering Schedule above Home). Reloaded the page. The UI correctly persisted the new state: Schedule was the first item and marked as "Hidden", Home was the second item.

## Stage 4 — Story page editor
- **Verdict:** FAIL
- **Details:** Navigated to Story page editor and clicked "Add Heading". The UI did not update. Network/console inspection revealed a 404 Not Found error for POST requests to `/api/events/477dcaa8-3893-41fa-8381-a08808cfd8bb/story-blocks`. The API route appears to be completely missing. Supabase `event_story_blocks` confirmed no rows were added.

## Stage 5 — Wedding Party editor
- **Verdict:** PASS (Partial)
- **Details:** Navigated to Wedding Party editor. Successfully added "Alice Smith" (Maid of honour) to Bride's side and "Bob Jones" (Best man) to Groom's side. The UI correctly placed them in their respective sections. Reloaded the page and the data persisted correctly. Cross-checked with DB table `event_wedding_party_members` which showed 2 rows. Note: The Add Member modal did not have an option to upload a photo, despite the test instructions suggesting it might exist.

## Stage 6 — Schedule editor
- **Verdict:** FAIL
- **Details:** Navigated to Schedule editor. Filled in custom event names for two schedule items ("Rehearsal Dinner" and "Wedding Ceremony") and toggled the visibility switch on the first event. However, network inspection revealed a `404 Not Found` for the PATCH request to `/api/events/477dcaa8-3893-41fa-8381-a08808cfd8bb/sub-events/23fdd4c1-ec8d-444d-b3c1-8cc31c8e05c4`. This API route appears to be missing or broken, preventing any schedule changes from being saved to the `event_sub_events` database table.

## Stage 7 — Q&A editor
- **Verdict:** FAIL
- **Details:** Navigated to Q&A editor. Clicked "Add Q&A item", filled in the question ("What is the parking situation?") and answer ("There is plenty of free parking."), and clicked "Add". The network inspector showed a `404 Not Found` for the POST request to `/api/events/477dcaa8-3893-41fa-8381-a08808cfd8bb/qa-items`. The DB table `event_qa_items` is empty. The API route is missing.

## Stage 8 — Venue & Travel editor
- **Verdict:** FAIL
- **Details:** Navigated to Venue & Travel editor. 
  - Added a travel point (Airport: "Central Station"). The network request was successful, but DB inspection of `event_travel_points` showed that only `name` and `kind` were saved. All other fields (`distance_text`, `travel_time_text`, `map_link`, `note`) were `null`.
  - Added a place to stay (Hotel: "The Grand Hotel"). The network inspector showed a `404 Not Found` for the POST request to `/api/events/477dcaa8-3893-41fa-8381-a08808cfd8bb/stays`. The DB table `event_stays` is empty. The API route is missing.



## Stage 9 — Registry / Video pages (generic jsonb sections)
- **Verdict:** FAIL
- **Details:** Navigated to Registry page. Clicked "Add section" and added a "Heading + paragraph" section. The UI immediately displays "Content saved in your browser — server sync planned", indicating that the backend sync is not yet implemented. Confirmed via Supabase that `event_website_sections` is empty. The content does not persist to the database.

## Stage 10 — Photos page
- **Verdict:** PASS / EXPECTED-INCOMPLETE
- **Details:** Navigated to Photos page (`/events/[id]/website/photos`). The page loaded successfully without crashing and displayed a static mock / "coming soon" state ("No gallery photos yet. Upload photos to display..."). No errors in the console.

## Wave 2 (public guest site)

## Stage 11 — Public page load (no identity)
- **Verdict:** PASS
- **Details:** Navigated to `http://localhost:3000/e/dheeraj-1-dheeraj-2-s-wedding-20260917` in a fresh (logged out) browser context. 
  - Confirmed public-tier pages (Home and Our Story) are visible in the navigation and body. 
  - Confirmed private-tier pages (Schedule, RSVP, Wedding Party, Q&A, Venue & Travel) are NOT visible in the navigation. 
  - Trying to navigate to a nested path like `/e/[slug]/schedule` returns a clean 404.

## Stage 12 — Non-existent / offline slug → 404
- **Verdict:** PASS
- **Details:** Visited `http://localhost:3000/e/some-slug-that-does-not-exist`. The server returned a clean 404 Not Found (verified by HTTP status and Playwright), matching the expected behavior.

## Stage 13 — Guest lookup (phone + name)
- **Verdict:** FAIL
- **Details:** Filled in the "Find your invitation" form with name "Test Guest" and phone number "+919876543210" (which was manually inserted into the `event_guests` database table for this event). Clicked "Find My Invitation". The console showed a `404 Not Found` for the POST request to `/api/e/dheeraj-1-dheeraj-2-s-wedding-20260917/lookup`. The endpoint is missing, making guest authentication impossible.

## Stage 14 — Guest session persistence
- **Verdict:** INCONCLUSIVE (Blocked by Stage 13)
- **Details:** Cannot test session persistence because the initial lookup API route is missing.

## Stage 15 — Guest-specific view (only their tagged sub-events)
- **Verdict:** INCONCLUSIVE (Blocked by Stage 13)
- **Details:** Cannot test guest-specific views because guest authentication fails.

## Stage 16 — RSVP submission
- **Verdict:** INCONCLUSIVE (Blocked by Stage 13)
- **Details:** Cannot test RSVP submission because the private pages and RSVP forms are unreachable.

## Stage 17 — Rate limiting on lookup
- **Verdict:** COULD NOT TRIGGER
- **Details:** The `/lookup` endpoint returns `404 Not Found` instead of checking limits, so rate limiting (HTTP 429) could not be triggered.

## Stage 18 — Session expiry handling
- **Verdict:** INCONCLUSIVE (Blocked by Stage 13)
- **Details:** Cannot simulate an expired session since a valid session token could not be obtained initially.

## Issues Found
- **[Critical] Missing API Routes (Wave 1 & 2):** Multiple essential API endpoints are missing, returning `404 Not Found`. This breaks major functional flows.
  - `/api/events/[id]/story-blocks` (Story page editor)
  - `/api/events/[id]/sub-events/[id]` (Schedule editor)
  - `/api/events/[id]/qa-items` (Q&A editor)
  - `/api/events/[id]/stays` (Venue & Travel editor)
  - `/api/events/[id]/website-sections` (Registry / Video editors - implied by the frontend mock message)
  - `/api/e/[slug]/lookup` (Wave 2 Guest Authentication)
- **[Important] Partial Data Save (Venue & Travel):** The endpoint for adding travel points only saves the `name` and `kind` fields. Other fields like `distance_text`, `travel_time_text`, `map_link`, and `note` are left as `null` in the DB.
- **[Important] Template Selection Bug (Design):** Selecting a website template and saving it sends a `null` template ID to the backend, failing to persist the selection. This is a known regression (D54).
