# Dheeraj — Sprint 1 progress (session-by-session)

Written by Dheeraj at session end. Read by Abhijith at session start, who syncs entries to ClickUp via approval gate, then archives them under `## Synced`.

## 2026-08-03
**Worked on:** UI polish pass — live-testing corrections across multiple pages

- Venue autocomplete (Step 2) — done — Nominatim dropdown on venue field; debounced 350ms, keyboard nav (↑↓ Enter Esc), click-outside close
- Sub-event roadmap ordering — done — canonical wedding sort (pre-wedding → post-brunch) in `app/events/[id]/page.tsx`; works for all existing events without DB changes
- Setup progress bar — done — rewritten to 5 meaningful steps (date, venue, guest count, sub-events, cover photo); shows actionable next hint
- Cover photo placeholder — done — wedding Unsplash image shown on EventsGrid when no cover uploaded
- Co-host invite email — done — Resend integration in `POST /api/events/[id]/admins`; new `lib/email/inviteEmail.ts` template; new `app/auth/accept-invite/page.tsx` (5 states: invalid/accepted/not-logged-in/wrong-account/auto-accept)
- Default invitation message — done — pre-filled in GuestListContent when DB value is null
- Event settings breadcrumb — done — `settings/layout.tsx` now fetches event name from Supabase; shows actual event name instead of hardcoded "EVENT"
- Breadcrumb copy button — done — wired to `navigator.clipboard.writeText(window.location.href)`; icon swaps to check for 2s
- Story editor body field — done — changed from `form-input` to `form-textarea rows=6` for comfortable long-form editing
- Website photos page — done — converted to client component; file picker opens on click; coming-soon toast + link to Media section; full upload backend not yet built
- Font picker (website design) — done — custom dropdown component (`FontPicker.tsx`) renders each font name in its own typeface; loads Google Fonts on mount

**Decisions:**
- Website gallery upload not implemented — no API/table exists; wired buttons to show coming-soon toast and link to Media section instead
- Co-host access-control / RLS (so accepted co-hosts can actually manage the event) is out of scope this pass — needs dedicated permissions session
- Roadmap ordering done in code (not DB UPDATE) so it works retroactively for all existing events

**Issues found:**
- Breadcrumb copy button was a static button with no handler (no onClick, no file input)
- Story editor body field used `form-input` (single-line styling) instead of `form-textarea`
- Website photos buttons had no onClick at all — pure static server component
- Font picker dropdowns were native `<select>` — browsers don't allow per-`<option>` font-family

**Files changed:**
- `app/api/events/[id]/admins/route.ts` — Resend email send
- `app/auth/accept-invite/page.tsx` (NEW)
- `app/events/[id]/page.tsx` — roadmap sort
- `app/events/[id]/settings/guests/GuestListContent.tsx` — default message
- `app/events/[id]/settings/layout.tsx` — event name breadcrumb
- `app/events/[id]/website/design/page.tsx` — FontPicker swap
- `app/events/[id]/website/design/FontPicker.tsx` (NEW)
- `app/events/[id]/website/edit/[pageId]/StoryEditor.tsx` — textarea
- `app/events/[id]/website/photos/page.tsx` — client component swap
- `app/events/[id]/website/photos/WebsitePhotosClient.tsx` (NEW)
- `app/events/create/components/Step2BasicDetails.tsx` — venue autocomplete
- `app/home/EventsGrid.tsx` — progress bar + placeholder cover
- `components/layout/Breadcrumb.tsx` — copy button wired
- `designs/pages/create-event/create-event.css` — venue dropdown styles
- `designs/shared/shell.css` — copy button + font picker CSS
- `lib/email/inviteEmail.ts` (NEW)
- `package.json` / `package-lock.json` — resend installed

**Tests:** None run this session — all changes are UI/FE corrections, no API schema changes

**Notes:**
- `RESEND_FROM_EMAIL` and `NEXT_PUBLIC_APP_URL` env vars need setting in Vercel for invite emails to work in prod
- Co-host RLS / access permissions pass still needed before co-hosts can actually use the event

**Push:** commit on `Dev-Vibe`
