# WhatsApp Invites — Path A (click-to-chat) — Design Spec

**Date:** 2026-08-26
**Author:** Abhijith + Claude
**Feature:** Send WhatsApp invitations to event guests from Guest Management
**Status:** Design — pending council review, then implementation

---

## 1. Problem & Goal

A host with ~100 guests wants to send each of them a WhatsApp invitation that
carries an invitation-styled preview, a personal message, and a link to the
event site where the guest can RSVP. Today the "Send invites" button in Guest
Management (`app/events/[id]/guests/GuestManagementClient.tsx`) and the per-row
"Send" control are both deliberately inert ("WhatsApp sending — coming soon").
This spec wires them up.

The invitation is sent **from the host's own personal WhatsApp**, not from a
business number. That single constraint dictates the whole design.

## 2. Hard constraints (why the design looks the way it does)

These are platform realities, not choices:

1. **`wa.me` click-to-chat pre-fills text only.** The `?text=` parameter cannot
   attach a JPG or PDF. A real card-image attachment is impossible to automate
   from a personal number; the host would have to attach it manually. We do not
   ask the host to do that per guest.
2. **No true one-click bulk from a personal number.** WhatsApp exposes no send
   API to personal accounts. Auto-messaging 100 contacts violates WhatsApp's
   Terms and gets the number banned. The only compliant approach is **one chat
   at a time**, opened pre-filled, the host taps send.
3. **We cannot detect delivery.** Opening `wa.me` is the only signal we have.
   "Invited" is therefore marked when the host *opens* WhatsApp for a guest, and
   the UI says so honestly — it is not a delivery confirmation.

The founder's fuller vision (a real card image/PDF attached, one-click bulk to
all 100) is the **WhatsApp Business Cloud API** — captured as Path B in §9,
built later when there is budget for Meta verification and per-message cost.

## 3. Approach chosen

**Path A — click-to-chat with a guided send queue.** Free, works today, from the
host's own WhatsApp. The "card in the message" experience is approximated by a
**rich link preview**: the event site link renders a WhatsApp preview card
(image + title + description) when the `/e/[slug]` page carries Open Graph tags.

## 4. Components

### 4.1 Message builder — `lib/invitations/whatsappInvite.ts` (pure, unit-tested)

- `buildInviteText({ guestName, defaultMessage, siteUrl }): string`
  - Shape:
    ```
    Hi {guestName},

    {defaultMessage}

    {siteUrl}
    ```
  - If `defaultMessage` is empty/null, use a fallback line
    (e.g. "You're invited to our celebration — details and RSVP here:").
  - Guest name trimmed; if empty, drop the greeting line gracefully.
- `toWhatsAppUrl({ phone, text }): string`
  - Phone → E.164 digits-only (no `+`, no spaces) as `wa.me` requires
    (`https://wa.me/919876543210`). Reuse/extract the existing `toE164` helper
    used by `app/settings/ConnectMethods.tsx`; default country code **+91**
    (matches the app's India phone config), applied only when the stored number
    lacks a country code.
  - `text` is `encodeURIComponent`-ed.
  - Returns `https://wa.me/{digits}?text={encoded}`.
- No network calls, no React — trivially unit-testable.

### 4.2 Event-site Open Graph preview — `app/e/[slug]/page.tsx`

- Add `export async function generateMetadata({ params })`.
- Resolve the event by slug (reuse the existing `/api/e/[slug]` data path or a
  light server query for `name`, `tagline`, `cover_image_key`).
- Emit:
  - `title` = event name
  - `description` = tagline (fallback: a generic invite line)
  - `openGraph.title/description`, `openGraph.images = [coverPhotoPublicUrl]`
    where the cover URL is built from `cover_image_key` via the existing
    `getPublicUrl` helper. If no cover, omit images (WhatsApp falls back to a
    text-only preview).
- This is what makes the WhatsApp link render an image preview. **A flat render
  of the actual invitation card as the og:image is Path B** — the card is
  composed client-side and has no single rendered image today; the event cover
  photo is the reliable now-image.
- Privacy note: `/e/[slug]` is already a public page; exposing its cover photo in
  an OG tag reveals nothing not already public to anyone with the link.

### 4.3 Guided send queue — in `GuestManagementClient.tsx`

- "Send invites" opens a **queue modal** (reuse the shell modal/portal + busy
  primitives; no new modal system).
- Queue = guests **not yet invited** by default (host can choose "all"). Guests
  with no phone are excluded (with a small "N skipped — no phone" note).
- Per step shows: guest name + phone, a read-only preview of the message text,
  and a primary **"Open WhatsApp"** button (an `<a target="_blank" rel="noopener">`
  to the wa.me URL). Secondary: **Skip**. After opening: **Sent · Next**.
- Clicking "Open WhatsApp" (a) opens the wa.me tab and (b) marks that guest
  invited (§4.5), optimistically removing the "Not invited" chip.
- Progress bar (n of N). Closing the modal is safe; reopening resumes from the
  first still-not-invited guest (state lives in `invited`, persisted).
- If the event site is offline (`site_offline` true), show a non-blocking warning
  in the modal ("Your event site is currently offline — guests who tap the link
  won't see it until you publish").

### 4.4 Per-row Send

- The existing disabled per-row "Send" (`gr-swipe-send`) becomes active: opens
  that guest's wa.me URL + marks invited. Disabled only when the guest has no
  phone.

### 4.5 Mark-invited API — `POST /api/events/[id]/guests/mark-invited`

- Body: `{ guestIds: string[] }` (uuid[], non-empty, capped e.g. ≤500).
- Auth: `requireEventWrite(supabase, id, user.id, 'guests')` — owner/collaborator
  with write, same guard as the other guest routes.
- Effect: `update event_guests set invited = true where event_id = id and id = any(guestIds)`
  — **event-scoped** (mirrors the lesson from the bulk-complete RPC fix: never
  update by id alone).
- Returns `{ updated: n }`. Idempotent (re-marking an invited guest is a no-op).
- Chosen over extending the single-guest PATCH because the queue marks one-at-a
  -time but the same endpoint should serve a future "mark selected as invited";
  a small dedicated bulk endpoint is cleaner and testable.

## 5. Data flow

```
Host clicks Send (row) or steps queue
  → client builds wa.me URL: buildInviteText + toWhatsAppUrl
     (guest.phone, event.default_guest_message, `${origin}/e/${slug}`)
  → opens WhatsApp (new tab)  [host taps send inside WhatsApp]
  → POST /guests/mark-invited { guestIds:[guest.id] }
  → optimistic: remove "Not invited" chip; on failure, roll back + toast
```

## 6. Edge cases

| Case | Handling |
|---|---|
| Guest has no phone | Send disabled; excluded from queue with a skip note |
| `default_guest_message` empty | Fallback invite line |
| Event site offline / unpublished | Non-blocking warning in the queue; link still sent (guest lookup still works) |
| No cover photo | OG omits image; text-only preview |
| WhatsApp not installed (desktop) | `wa.me` opens `web.whatsapp.com` — works |
| mark-invited fails | Optimistic chip reverts + error toast; host can retry |
| Phone already has country code | `toE164` must not double-prefix (guard, per the earlier "double +91" bug) |

## 7. Testing

- **Unit** (`lib/invitations/whatsappInvite.test.ts`): message shape with/without
  default message and guest name; E.164 normalisation incl. already-prefixed and
  malformed numbers (no double +91); URL-encoding of newlines/emoji/`&`.
- **Live click-through:** on a real event with guests — open the queue, confirm
  WhatsApp opens pre-filled with the right text + link, the "Not invited" chip
  flips, progress persists across a modal close/reopen, per-row Send works, and
  the `/e/[slug]` link shows an image preview when pasted into WhatsApp.

## 8. Out of scope (this pass)

- Real card image/PDF attachment (Path B).
- One-click automatic bulk (Path B).
- Delivery/read receipts (not available without Business API).
- Per-guest message personalisation beyond name + the event default message.
- Sub-event-specific invitations.

## 9. Path B (documented, not built)

**WhatsApp Business Cloud API** (Meta) or a BSP (e.g. Twilio):
- Real one-click bulk send to all guests.
- Approved **template messages** carrying the invitation card as a media header
  (image or PDF document).
- Requires: Meta Business verification, a registered sender number, template
  approval (24–48h), and a per-message conversation cost.
- Delivery + read status available via webhooks.
- Separate spec + budget decision when we get there.

## 10. Files touched

- **New:** `lib/invitations/whatsappInvite.ts`, `lib/invitations/whatsappInvite.test.ts`,
  `app/api/events/[id]/guests/mark-invited/route.ts`.
- **Edited:** `app/e/[slug]/page.tsx` (generateMetadata),
  `app/events/[id]/guests/GuestManagementClient.tsx` (queue modal + per-row Send + wiring).
- Possibly a small `lib/phone` extraction if `toE164` currently lives inside
  `ConnectMethods.tsx` and needs sharing.

---

## 11. Council review — 2026-08-26 (Security + Frontend, single-round, token-efficient)

**Verdict:** 🟡 ADDRESS-THEN-PROCEED. No critical/cross-tenant break; six
findings folded in below. Risk level MEDIUM, driven by input-validation on
`mark-invited` and the `wa.me` phone path.

### Adopted changes (these amend §4–§6 above)

1. **Harden phone → `wa.me` path (Security, important).** The phone is
   interpolated into the URL *path* (`wa.me/{digits}`), which `encodeURIComponent`
   on the text does NOT protect. `normalizePhone` MUST strip every non-digit,
   apply the +91 default only when the result isn't already a 12-digit `91…`
   number (no double-prefix — the prior bug), and then validate `^\d{10,15}$`.
   If it fails, **skip that guest** (never interpolate an unvalidated phone). Unit
   tests must cover `911234?text=EVIL&x=`, `+91…`, `0091…`, 10-digit bare, and junk.

2. **Validate `mark-invited` input (Security, important).** `guestIds` must be a
   non-empty array of UUID-shaped strings, capped at **≤500**; reject non-array /
   empty / malformed with **400** (not a silent `{updated:0}`). Prevents a
   large-array lock-amplification / DoS. (Authz core — event-scoped update +
   `requireEventWrite` — is already sound.)

3. **OG via Next Metadata object, not raw HTML (Security, important).** Return
   `title`/`description` through `generateMetadata`'s Metadata object (Next
   auto-escapes) so a host-authored event name/tagline can't inject `">`/attributes.
   **Clamp** title/description length server-side. Omit `openGraph.images` when
   `cover_image_key` is null (no broken URL); covers are the **public** bucket only.

4. **Primary surface = the guest list itself, guided queue is opt-in (Frontend,
   important).** For ~100 guests, a blind 100-step wizard is the wrong default.
   The **per-row "Open WhatsApp" on the existing guest list IS the checklist** —
   host scans, jumps, retries, sees status chips at a glance. Keep the guided
   queue as an optional "one-by-one" mode behind "Send invites", not the only path.
   This also reuses the existing guest-row component instead of a bespoke stepper.

5. **Invited-on-open needs a reversal path (Frontend, high).** Marking invited on
   *open* (our only signal) is a false-positive trap if the host doesn't actually
   send. Pair it with: (a) an **undo toast** (reuse `bc-toast` with an action
   button, ~5s) that reverts the optimistic mark, and (b) a persistent per-row
   **"Mark not invited"** in the row overflow. `mark-invited` therefore needs a
   sibling **un-mark** path (extend the endpoint to accept `invited: boolean`, or
   a paired route).

6. **Derive progress from persisted state; explicit rollback; reuse primitives;
   a11y (Frontend, med).**
   - Queue position is computed as "next not-invited from DB" on each render —
     **no React `currentIndex` cursor** — so it survives the mobile app-switch
     (iOS may discard the returning tab).
   - On `mark-invited` POST failure: **re-add the chip** + error `bc-toast` with
     Retry. The `wa.me` tab opens regardless (that's the host's real action).
   - Reuse shell modal/portal + `bc-toast` + the "Not invited" chip. A plain
     progress bar inside the modal is fine (not a duplicate). **Do NOT** gate the
     `wa.me` open behind `useBusy`/BusyOverlay — opening a tab is instant and the
     host is leaving the page. A new `SendQueueModal` that reimplements modal
     chrome is a review-blocking duplicate.
   - Focus moves into the modal on open and to the new guest's heading on Next;
     wrap "n of N" in `aria-live="polite"`; all controls ≥44×44px with
     `env(safe-area-inset-bottom)` on the modal footer.

7. **ToS / personal-number ban (Security, suggestion).** Identical text to many
   guests fast is WhatsApp's spam signature; the ban hits the host's own number.
   Keep it **one manual click per guest** — never auto-open, never a
   `window.open` loop over guests. Add a short in-UI caution that this sends from
   their personal WhatsApp.

### Net effect on the build
- §4.5 `mark-invited` gains input validation + an un-mark capability.
- §4.1 phone normalization tightened to a validated digit string.
- §4.2 OG uses the Metadata object + length clamp + null-cover guard.
- §4.3/§4.4 reframed: the **guest list with per-row Open WhatsApp is primary**;
  the guided queue is optional and DB-derived, not a stateful wizard.
- New: undo toast + per-row "Mark not invited" for reversal.

**Council reviewed:** 2026-08-26 by security_expert + frontend_engineer
(single-round, token-efficient by founder request). Verdict: ADDRESS-THEN-PROCEED
— findings folded into this spec.
