---
title: Device Test Checklist (designs/)
status: Rolling — Abhijith runs on phone; tick as verified
owner: Abhijith
lan_url: http://192.168.0.112:4000      # from `npm run design` (re-check IP if network changes)
last_updated: 2026-06-04
---

# Device Test Checklist — `designs/`

> **How to use (rolling).** Open the LAN URL on your phone (same Wi-Fi; run `npm run design` first). Walk a page, tick its row, note anything off in **Findings**. This doc is never "done" — it tracks what's been verified on a real device vs only in desktop browser. Add a row when a new page ships.
>
> **Why a device pass matters:** WhatsApp in-app browser, iOS safe-areas, touch-target size, and real font rendering only show up on-device. Desktop + Playwright already cover layout/computed-styles.

Legend: ☐ not tested · ✅ pass · ⚠️ issue (see Findings) · — n/a

---

## A. Priority spot-checks — this session's changes (verify these first)

These are the specific things changed recently that warrant a real-device look:

| # | What to check | Page (LAN path) | Status |
|---|---|---|---|
| 1 | Couple name reads **"Vidya & Anshuman"** everywhere (no "Anya & Kabir"/"Vibrant Union") | spot-check `/index.html`, `/pages/event-control/event-control.html`, `/pages/website/overview.html` | ☐ |
| 2 | **Add a sub-event with a custom name** (e.g. "Cousin's Mehendi"), save, re-open it → type/icon stays correct (not reset to "Other") | `/pages/event-control/our-journey.html` | ☐ |
| 3 | Wizard **date** shows the right day on review + success (no off-by-one) | `/pages/create-event/step-1-type.html` → through to success | ☐ |
| 4 | **Password fields show dots, not clear text** | `/pages/settings/settings.html` (current pw) · `/pages/event-settings/website.html` (site pw) | ☐ |
| 5 | **Toast** appears on actions (e.g. copy breadcrumb, save) — shell now owns it | any page with a breadcrumb copy / save | ☐ |
| 6 | **Palette swatches** render in colour on the Design tab | `/pages/website/design.html` | ☐ |
| 7 | **Danger-zone** red reads correctly in light **and** dark | `/pages/event-settings/general.html` | ☐ |
| 8 | "Website" tab in the tool pages **lands on the editor** (not a 404) | `/pages/guests/guests.html` → tap Website | ☐ |
| 9 | Component showcase sections **13–15** render | `/components.html` (scroll to bottom) | ☐ |

**Findings (priority):**
- _(none yet)_

---

## B. Per-page rolling matrix

For each page: **Tap** = every button/link/toggle fires · **Scroll** = no horizontal scroll, nothing clipped · **Targets** = controls feel ≥44px · **Dark** = dark-mode toggle looks right · **Safe-area** = fixed chrome clears notch/home-bar.

| Page | Tap | Scroll | Targets | Dark | Safe-area | Notes |
|---|---|---|---|---|---|---|
| Dashboard `/index.html` | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Auth `/pages/auth/auth.html` | ☐ | ☐ | ☐ | ☐ | ☐ | OTP pin-input distribution |
| Verify OTP `/pages/auth/verify-otp.html` | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Role select `/pages/auth/role-select.html` | ☐ | ☐ | ☐ | ☐ | ☐ | vendor "coming soon" keyboard/tap feedback |
| Create-event (4 steps + success) | ☐ | ☐ | ☐ | ☐ | ☐ | custom calendar + time picker |
| Event control `/pages/event-control/event-control.html` | ☐ | ☐ | ☐ | ☐ | ☐ | hero, roadmap horizontal-scroll |
| Our Journey `/pages/event-control/our-journey.html` | ☐ | ☐ | ☐ | ☐ | ☐ | add/edit/remove sub-event modals |
| Event settings (6 tabs) | ☐ | ☐ | ☐ | ☐ | ☐ | sidebar → pill scroll on mobile |
| Website overview `/pages/website/overview.html` | ☐ | ☐ | ☐ | ☐ | ☐ | share/publish modals |
| Website design `/pages/website/design.html` | ☐ | ☐ | ☐ | ☐ | ☐ | palette/font, jump-to-preview |
| Website edit-page `/pages/website/edit-page.html` | ☐ | ☐ | ☐ | ☐ | ☐ | section editor, Edit\|Preview toggle |
| Templates gallery + detail | ☐ | ☐ | ☐ | ☐ | ☐ | apply-template round-trip |
| Photos / Card templates | ☐ | ☐ | ☐ | ☐ | ☐ | lightbox |
| Settings (user) `/pages/settings/settings.html` | ☐ | ☐ | ☐ | ☐ | ☐ | avatar upload, password toggle |
| Guests / Invitations / Planning / Media | ☐ | ☐ | ☐ | ☐ | ☐ | shells (nav/tool-rail only for now) |

**Findings (per-page):**
- _(none yet)_

---

## C. Reference — full test dimensions

When doing a thorough pass on a page, also check:
- **Widths:** 360 (small phone), 390 (iPhone), 414 (large phone), + rotate to landscape.
- **States:** every interactive element in default/hover(touch)/active/focus/disabled/loading/error/empty.
- **Keyboard (if external kb):** Tab order logical, Enter/Space activate, Esc closes overlays.
- **WhatsApp in-app browser:** open the LAN link inside WhatsApp's webview (paste to yourself) — check the Google button, OTP, modals/sheets behave.
- **No dead links:** every link goes somewhere real (the `npm run design-check` guardrail catches structural dead links automatically; this is the visual confirm).

> Tip: `npm run design-check` (no device needed) auto-catches demo-name drift, dead internal links, leaked PII, and inline-hex before you even pick up the phone.
