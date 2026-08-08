# Help Centre V0 — Screens, States and Interactions

**Date:** 2026-08-07
**Status:** Plan-phase design — companion to `2026-08-07-help-centre-v0-design.md`
**Author:** UI/UX Designer agent (`ai/agents/ui_ux_designer.md`), dispatched at plan phase
**Purpose:** Describe every screen and state in words, precisely enough that a developer can build from this document without seeing any image, Figma file or Stitch draft.

> **V0 contains no AI.** Do not design or build "thinking", "streaming" or "generating" states. Every answer shown is staff-authored text retrieved from the database. No copy anywhere may say "chat", "assistant", "ask me", or "bot".

---

## 1. User assignment

| Surface | User | Justification |
|---|---|---|
| **A — Help panel** | Host | Mounts only inside authenticated host chrome. Density and multi-level drill-down are acceptable because a host returns hundreds of times across 6–18 months. |
| **B1 — `/help`, signed in** | Host | Same content, full page, for deliberate reading and for landing on a link a support agent sent. |
| **B2 — `/help` and `/help/a/{slug}`, logged out** | Guest / public | Guest rules apply fully: one screen, no drill-down chrome, no `backdrop-filter`, must survive WhatsApp's Android in-app browser and being forwarded in a family group. |
| **C — Landing FAQ section** | Prospect | Marketing surface. Inline content a visitor scrolls into, not a support widget bolted onto a marketing page. |

`/help` is **one route, two compositions** — shared article rendering, a different action ladder. It must not be a single component tree with auth conditionals scattered through it.

---

## 2. Shared frame — the Help panel

### Presentation

**Desktop, ≥768px.** A docked panel bottom-right, `transform-origin: bottom right`, anchored 12px above the FAB and flush to its right edge. Width 400px, `max-width: calc(100vw - 2rem)`, `max-height: min(78dvh, 640px)`. No scrim. Surface `var(--card)`, 1px `var(--line)`, 24px radius, layered shadow.

Opaque — **no `backdrop-filter`**. Event pages already carry two blurs (floating nav and tool rail), and the panel is a reading surface, where glass is forbidden by the project's visual direction.

**Mobile, ≤767px.** Bottom sheet composed on the existing `.modal-scrim` sheet variant (`shell.css:2223–2262`): scrim `rgba(17,24,39,.5)` with 8px blur, sheet pinned to bottom, 24px top corners, 40px drag-handle bar, sticky head, `max-height: calc(100dvh - env(safe-area-inset-top) - 1rem)`, `overscroll-behavior: contain`, bottom padding `calc(1.25rem + env(safe-area-inset-bottom))`.

**Why the sheet convention applies.** The calendar (`shell.css:1704`) and time picker (`shell.css:1816`) already resolve to a bottom sheet below 768px, as do twelve modals. A host who has added a guest or picked a date has learned this gesture. A second overlay idiom would fork a solved interaction. The sheet variant also already contains the scroll-containment fix, which reusing inherits for free.

### Head

Sticky on mobile, static on desktop. 56px tall, three slots on one row.

- **Left.** At level 0, an empty 44px spacer keeps the title optically centred. At level ≥1, a 44×44 back `<button>` with a `chevron_left` glyph and `aria-label="Back to {parent name}"`.
- **Centre.** `h2#help-panel-title`, 15px / 700 / `--ink`, single line with ellipsis. Text is the current level's name: "Help Centre" → "Managing Guests" → the article title → "Search results" → "Contact support".
- **Right.** A 44×44 close `<button>`, `close` glyph, `aria-label="Close Help Centre"`.
- Below the row, a 1px `var(--line-soft)` divider.

Do **not** reuse `.fn-icon-btn` for these controls — it is 40px, dropping to 36px below 768px, both under the 44px floor. Specify 44×44 explicitly, using a transparent `::before{inset:-4px}` expansion if the glyph should look smaller (the pattern exists at `shell.css:3106`).

### Escalate footer

Present at levels 0, 1, 2 and on the no-match state. **Absent** on the ticket form, submitting and success states. Pinned to the panel bottom, `var(--card)` with a top `var(--line-soft)` hairline.

- Line 1, 12px `--muted`: "Still stuck?"
- `.btn-pill .btn-pill-secondary .btn-pill-sm` — "Contact support" → **A7**.
- Desktop only: a trailing `.btn-pill-ghost .btn-pill-sm` — "Open Help Centre" with an `open_in_new` glyph → navigates to `/help` and closes the panel.

This is the single ordered escalation ladder. Implement it as one component driven by a config array, not inline JSX. That is the sole structural concession to a future generated-answer tier, and it is invisible to the user.

---

## 3. Panel states

### A0 · Closed

Only `.help-fab` is on screen: 56×56, brand fill, `help` glyph, `aria-expanded="false"`, `aria-controls="help-panel"`. Stacked one slot higher on pages that render a primary FAB.

The panel is **not in the DOM** when closed — not `visibility: hidden`, not rendered. It costs nothing and cannot be reached by Tab.

**Actions.** Click / Enter / Space → **A1**.

### A1 · Root (level 0)

Panel mounts and animates in. `aria-expanded` flips to `true`. Focus moves to the panel title. On mobile, `body.no-scroll` is set and one history entry pushed.

Body, top to bottom:

1. **Search field.** `.form-input-search` wrapping `.form-input`, `type="search"`, leading `search` glyph, placeholder "Search help articles". **Not auto-focused** — auto-focus raises the mobile keyboard and hides two-thirds of the panel before the user has decided whether to browse or type. `.form-input-search-clear` appears once there is text.
2. **Eyebrow.** `.section-rule` — 1.75rem brand dash plus "BROWSE TOPICS", 12px / 700 / `.28em`.
3. **Six category rows.** A `<ul role="list">` of `.list-nav-row`s. Each: 34px brand-tint icon plate, label 14px / 600 / `--ink`, sub-label 12px / `--muted` reading "{n} articles", trailing `chevron_right` in `--muted-soft`. Row min-height 56px. Whole row is the button.
4. Escalate footer.

**Full-width rows at every breakpoint.** A two-column grid inside a 360px sheet leaves roughly 140px of text width; "Invitations & RSVP" and "Account & Billing" wrap to three lines and break tile height parity. The grid treatment belongs to the `/help` page only.

**Actions.** Row tap → **A3**. Typing ≥3 characters → **A5**. If `sessionStorage` holds a deeper node from earlier, open directly into it with the back chain intact.

**Loading variant.** Category names are a fixed client-side constant, so the six rows render instantly and never skeleton. Only the counts are fetched: render each as a 28×10 `.skeleton .skeleton-line` until resolved. If the count request fails, **drop the sub-label entirely** — a row reading "0 articles" when the truth is unknown is a lie; a missing sub-label is invisible.

**Error variant.** `.alert-banner` with `role="alert"` above the rows — "Couldn't load help topics. Check your connection." plus `.btn-pill-ghost .btn-pill-sm` "Try again". The six rows still render and stay tappable, because their identity is static. The escalate footer is always present. **Help must never be a dead end because a fetch failed.**

**Offline variant.** When `navigator.onLine === false`: same banner, worded "You're offline. Search and articles need a connection." Search field `disabled` with helper text "Search needs a connection" — disabled, not hidden, so the affordance does not move. "Contact support" also disabled with helper "You'll be able to send this once you're back online", which is the honest statement since the insert cannot succeed. Re-enable on the `online` event.

### A3 · Category — question list (level 1)

Head: back → "Help Centre"; title = category name.

1. Search field, persistent.
2. Category description, 13px `--muted`, one sentence.
3. `<ul role="list">` of up to **5** article rows, `.list-nav-row`, ordered by `sort_order`. **No icon plate** — the category already established context, and an icon per question is visual noise that forces a six-word title onto two lines. Title 14px / 500 / `--ink`, two-line clamp. Trailing `chevron_right`. Min-height 56px.
4. If the category holds more than five published articles: a full-width `.btn-pill-ghost` row — "See all {n} in {Category}" → `/help/{category-slug}`, closing the panel. Do not paginate inside a 400px panel.
5. Escalate footer.

**Loading variant.** Three `.skeleton .skeleton-line` rows at 85% / 70% / 90% width, 56px pitch, shown only after 250ms of latency. Below that, swap instantly — a flash of skeleton is worse than a beat of nothing.

**Empty variant.** A category with zero published articles is a real V0 possibility, since content is authored separately from the build. Centre-aligned block: 32px `--muted-soft` `article` glyph, title 15px / 700 "Nothing here yet", body 13px `--muted` "We haven't published articles in {Category} yet. Search across all topics, or send us your question." Then the escalate footer.

**No article count is shown on the A1 row for an empty category** — the sub-label is omitted, so the user never taps into a promise of nothing.

### A4 · Answer (level 2)

Head: back → category name; title = article title, ellipsised.

1. **Article title**, `h3`, 17px / 700 / `--ink`, wrapping freely, **never clamped**. Repeating it below the ellipsised head is deliberate: the head is a location indicator, the body is the content.
2. **Meta line**, 11px / 700 / `.18em` / `--muted`: the category name. This is the provenance slot. It is populated in V0 and never empty.
3. **`.prose` body**, rendering sanitised Markdown. Numbered lists render as numbered lists. Internal article links route within the panel; external links open in a new tab with an `open_in_new` glyph and `rel="noopener noreferrer"`.
4. **Feedback row.** 12px `--muted` "Was this helpful?" plus two `.btn-pill-ghost .btn-pill-sm` — "Yes" (`thumb_up`) and "No" (`thumb_down`). On click both are replaced in place by 12px `--muted` "Thanks — noted." with `role="status"`. Choosing "No" additionally scrolls the escalate footer into view; it does **not** auto-open the ticket form, which would hijack a low-commitment tap into a high-commitment task.
5. **"Open as page"** — `.btn-pill-ghost .btn-pill-sm` with `open_in_new` → `/help/a/{slug}`, closing the panel. This is how a host gets a forwardable URL.
6. Escalate footer. Escalating from here pre-fills the ticket's topic with this article's category and attaches a context chip.

**Actions.** Back → **A3** if the user came via a category, or → **A6** if they came from search. The back label states which — "Back to Managing Guests" versus "Back to results". The label is the affordance, so it must be accurate, never generic.

**Loading variant.** Title renders immediately from the row the user tapped — it is already in hand, and no user should wait to see the thing they just tapped. Body: four `.skeleton-line`s at 100% / 95% / 88% / 60%.

**Error variant.** `.alert-banner` "Couldn't load this article." plus "Try again", with the title still shown and back still live.

### A5 · Search in progress

Triggered on input at ≥3 characters after a 300ms debounce. The browse region is replaced; search field, head and escalate footer stay. Head title becomes "Search results"; back appears, labelled "Back to topics".

- **1–2 characters:** no request, no spinner. `.form-helper` below the field — "Keep typing to search." Browse region stays visible.
- **In flight under 250ms:** nothing changes. No spinner.
- **In flight over 250ms:** three `.skeleton-line` rows.
- Every keystroke cancels the in-flight request. The panel never renders results for a stale query.

### A6 · Search results

1. Results header with `aria-live="polite"`, 11px / 700 / `.18em` / `--muted`: `{n} RESULTS FOR "{query}"`, query truncated at 60 characters with a middle ellipsis so a pasted paragraph cannot blow out the panel.
2. `<ul role="list">` of `.list-nav-row`s, ranked. Each: title 14px / 500, two-line clamp; sub-label 12px `--muted` = category name, so the user can judge relevance before tapping. Maximum 8 rows; beyond that a trailing `.btn-pill-ghost` "See all {n} results" → `/help?q={query}`.
3. **No snippet extraction and no term highlighting in V0.** A badly-cropped snippet reads worse than a clean title. Title plus category is sufficient at this width.
4. Escalate footer.

### A6-empty · No match

The state where the product either earns or loses trust. It fires when nothing scores above the confidence threshold — not merely when zero rows returned.

1. Centre-aligned block: 32px `--muted-soft` `search_off` glyph; `h3` 15px / 700 "No articles matched"; 13px `--muted` — `Nothing in our help articles matches "{query}". Try a different word, or browse a topic below.`
2. **Six `.tag-chip`s**, one per category, tapping through to **A3**. This turns the dead end back into the guided flow, which is the entire deflection strategy.
3. Escalate footer, visually promoted in this state only: the "Contact support" pill becomes `.btn-pill-primary` and full-width, with the line above reading "Can't find it? Send us your question and a person will reply."

**Copy rules, non-negotiable.** The message must not apologise, must not blame the user's phrasing, and must never say "I don't understand" — nothing here is an entity that understands anything. **"A person will reply"** is load-bearing: it is true, and it is the entire differentiator from the surface this feature was originally scoped as.

### A7 · Ticket form

Head: back → wherever the user came from; title "Contact support". The escalate footer is **removed** — a second "contact support" button beneath a contact-support form is noise.

1. **Intro**, 13px `--muted`: "Tell us what's happening and we'll get back to you within 24 hours." Below, 12px `--muted-soft`: "Support hours: Mon–Sat, 9 AM–7 PM IST." This restates `platform-policies.md` §7.2 rather than implying round-the-clock cover.
2. **Context chip**, only when arriving from an article or category. `.tag-chip` reading "About: {title}", removable via `.tag-chip-x`. Removing it clears the pre-filled topic. Visible, removable context beats invisible metadata.
3. **Email** — `.form-group` + `.form-label` "YOUR EMAIL" + `.form-input` `type="email"` `inputMode="email"` `autoComplete="email"`, pre-filled from session, editable. `.form-helper`: "We'll reply here." Validation on blur; on failure `.form-error` with `aria-invalid` and `aria-describedby` — "Enter an email address we can reply to." Never an error code.
4. **Topic** — `.form-select`, label "TOPIC", options are the six categories plus "Something else". Pre-selected from context, defaulting to "Something else". **Optional** — a required dropdown between a stuck user and a human is friction for the sake of ops tidiness.
5. **Message** — `.form-textarea`, 5 rows, placeholder "What were you trying to do, and what happened instead?" — which is `support-best-practices.md` §3.6's first two intake questions, asked at source so the agent need not email back for them. Required, minimum 20 characters, maximum 2000. Counter appears at 1800 in `.form-helper`, turning `--danger` at 2000.
6. **"What we'll include"** — a collapsible disclosure using `.dp-section-block` / `-head` / `-body`, collapsed by default. Body lists: the page you were on, your account ID, your browser and device. Then 12px `--muted-soft`: "We never include your password or your guests' contact details." Users hand over more detail when they can see exactly what is being sent.
7. **Actions** — `.modal-actions`, which on mobile becomes a sticky full-width 44px row automatically. `.btn-pill-secondary` "Cancel" → back one level; `.btn-pill-primary` "Send to support".

**Validation.** The submit button is **enabled at all times**. A disabled submit gives an already-stuck user a second thing that does not work. Clicking with invalid fields runs validation, focuses the first bad field and announces the error. No request fires.

### A8 · Submitting

Submit becomes `.btn-pill.is-loading` with `aria-busy="true"` and disabled; Cancel disabled; every field becomes `readOnly` — **not** `disabled`, because disabled fields drop out of the accessibility tree and a screen-reader user loses the text they just wrote. Minimum visible duration 400ms. A `role="status"` line reads "Sending your message…".

Do **not** use `.busy-overlay` — it blocks the entire viewport, which is right for a destructive save and wrong for a support message.

**Failure.** Return to **A7** with every field intact — losing a 300-word problem description is how a frustrated user becomes a churned one. `.alert-banner` with `role="alert"` at the top of the form: "Couldn't send that just now. Your message is still here — try again." Submit re-enables. After **two** consecutive failures, append: "Still failing? Email us directly at {support address}." with a `mailto:` link carrying the message pre-filled as the body. That is the genuine last resort, and it works with zero infrastructure.

### A9 · Success

The form is replaced entirely. Focus moves to the heading; `role="status"` on the region.

1. 40px filled `check_circle` glyph in `--success`.
2. `h3` 17px / 700 — "Message sent".
3. 14px `--ink-soft` — "A member of our team will reply to **{email}** within 24 hours."
4. **Reference block** — `.form-label` "YOUR REFERENCE"; the code in 15px / 700 / tabular-nums inside a `.clay-pill`-style well; a 44×44 copy button (`content_copy`) firing `window.evenzi.toast('REFERENCE COPIED')`. Below, 12px `--muted`: "Quote this if you follow up."
5. `.btn-pill-primary` full-width "Done" → closes the panel and resets the stored node to level 0.

**Copy that must never appear:** "Check your inbox", "A confirmation email is on its way", "You'll receive a copy", "We've emailed you". The email provider is unconfigured; the on-screen reference is the receipt. Email is mentioned only as the channel the *human reply* will arrive on, which is true because a human sends it by hand.

### A10 · Behaviour on navigation

The panel closes without animation — an animated close racing a route transition looks broken. `body.no-scroll` clears, the pushed mobile history entry pops, and the current node is written to `sessionStorage`. Reopening on the new page restores that node with its back chain — **except** the ticket form, which always resets to level 0 with its draft discarded. A half-written support message silently carried across pages is worse than a clean start.

---

## 4. Surface B — the `/help` pages

Server-rendered, indexable, no auth required.

| Route | Purpose |
|---|---|
| `/help` | Root — search, all categories, popular articles |
| `/help/{category-slug}` | All articles in one category |
| `/help/a/{article-slug}` | One article — the deep-link target for support replies |

`/help?q={query}` renders search results server-side, so a results page is itself linkable.

### B1 · `/help` root, signed in

Chrome: `<FloatingNav />` minimal variant, breadcrumb DASHBOARD → HELP, `<main className="page-band pt-10 md:pt-14 pb-20">`, `<PageFooter />`. Never hand-roll the width. **No `<HelpFab />` on this page** — a button opening a small panel showing what is already on screen full-size is a dead affordance.

1. `.section-head` — eyebrow "SUPPORT", `h1` "Help Centre", sub "Find an answer, or send us your question. We reply within 24 hours."
2. Search, `.form-input-search`, capped at 640px. Submitting navigates to `/help?q=…` as a real form submission, so it works with JavaScript disabled and yields a shareable URL. With JavaScript it also renders inline and replaces the history entry.
3. Categories — `.dp-tile-grid` (2 / 3 / 4 columns) of `.dp-tile`s, each with a 48px brand-tint icon plate, `h2` category name, one-line description, "{n} articles". Whole tile is a link via `.dp-tile-link`, the stretched-link pattern.
4. Popular articles — `.section-rule` "MOST READ", then up to 8 `.list-nav-row`s. **Omit the whole block if there is no view data.** Do not fabricate popularity.
5. Contact band — a `.clay-card` spanning the band: `h2` "Still need help?", body restating the 24-hour commitment and support hours, `.btn-pill-primary .btn-pill-lg` "Contact support" opening the **same** ticket form component as A7, as a centred modal ≥768px and a bottom sheet below. One form component, two hosts. Never a second form.

### B2 · `/help` root, logged out

Chrome swaps to `.page-shell` + `.page-shell-header` (logo, theme toggle, `.btn-pill-secondary` "Sign in") + `.page-shell-footer`. Guest rules apply: opaque surfaces only, no `backdrop-filter` anywhere, no `.reveal` animation above the fold.

Items 1–4 identical, drawing from the **public corpus**. Item 5 is replaced:

> `.clay-card` — `h2` "Need to talk to someone?" · body "Filing a support ticket needs an Evenzi account, so we know which events to look at." · `.btn-pill-primary` "Sign in to contact support" → `/auth?next=/help` · `.btn-pill-secondary` "Email {support address}" → `mailto:` with a pre-filled subject.

Both paths are real. Neither is a disabled button, and nothing implies the visitor could file a ticket by clicking harder.

**Deep link to an app-corpus article while logged out.** This is a real case, because support replies contain such links and get forwarded. The article renders normally — nothing here is confidential — with the logged-out contact band beneath it. Do not redirect to `/auth`, and do not show a "this content is for members" gate.

### B3 · `/help/{category-slug}`

`.section-head` with eyebrow "HELP CENTRE" linking back to `/help`, `h1` = category name, sub = its description. A full `<ul>` of `.list-nav-row`s — all published articles, no cap, no pagination below roughly 200 articles. Contact band appropriate to auth state. Empty category renders the A3-empty composition scaled up.

### B4 · `/help/a/{article-slug}`

The URL a support agent pastes into an email or WhatsApp reply, so it carries the most weight per pixel.

1. Breadcrumb: Help Centre → {Category} → {Article}.
2. `h1` = article title, wrapping freely, measure capped at 65ch.
3. Meta: category name plus "Updated {DD/MM/YYYY}" — Indian date format. The update date is a trust signal on a support article and costs nothing.
4. `.prose` body at 65ch measure.
5. Feedback row, same as A4.
6. Related articles in the same category, up to 4 rows — **only if** ranking exists; otherwise a single "See all in {Category}" link.
7. Contact band, auth-appropriate.

**WhatsApp requirements, non-negotiable for this route:**

- Open Graph `title` = article title; `description` = first 150 characters of the body with Markdown stripped; `og:image` = a static branded 1200×630 card. Per-article generated images are out of scope and would be the slowest thing on the page.
- Server-rendered HTML, readable with no client JavaScript. Must render in WhatsApp's Android in-app browser and in an aging Samsung Internet.
- No `backdrop-filter` anywhere in this composition.
- `<link rel="canonical">` and sitemap inclusion. `/help` and its children are the only host-app routes that should be indexable.

---

## 5. Surface C — landing page FAQ section

An inline section within `app/page.tsx`, drawing from the **public corpus**. It must read as part of the marketing narrative, not as a support widget dropped into the middle of a landing page.

- Show the top 6–8 public articles as an accordion, not as links away. A visitor mid-scroll should get their answer without leaving the page.
- Accordion rows expand in place, rendering `.prose`. One open at a time.
- **No search field here.** Search belongs on `/help`. A search box in a marketing section invites queries the section cannot serve and interrupts the scroll.
- Section footer: a single `.btn-pill-secondary` "See all help articles" → `/help`.
- Standard `.section-head` treatment consistent with the rest of the landing page, so it inherits whatever that page's rhythm turns out to be.

Because `app/page.tsx` is still in progress, this section's visual treatment must be agreed with whoever owns that file before it is built.

---

## 6. Accessibility contract

| Concern | Requirement |
|---|---|
| Panel role | `role="dialog"`, `aria-labelledby` → panel title id, `id="help-panel"` |
| Mobile ≤767px | `aria-modal="true"`, focus **trapped**, `body.no-scroll` set |
| Desktop ≥768px | `aria-modal="false"`, **not trapped**, page stays scrollable and operable |
| Both | Escape closes; outside click closes; focus returns to the FAB |
| Focus on open | Panel title with `tabIndex={-1}` — never the search field |
| Search result count | `aria-live="polite"` — "6 results for 'otp'" / "No articles matched 'otp'" |
| Level change | `aria-live="polite"` on the level heading, so a screen-reader user hears the new context after a silent DOM swap |
| Ticket submitting | `role="status"` |
| Ticket success | `role="status"`, focus moved to the success heading |
| Any failure | `role="alert"` on `.alert-banner` |
| Headings | Panel: title `h2`, article titles `h3`. `/help`: `h1` "Help Centre", categories `h2`, articles `h3`. Article page: `h1` is the article title; `.prose` emits `h3`/`h4` for Markdown `##`/`###` so no level is skipped |
| Rows | Real `<button>` in the panel, real `<a>` on pages. Never a `div` with a click handler |
| Tab order in panel | back → title → close → search → clear → rows in DOM order → escalate footer |
| Roving `↑`/`↓` focus | Explicitly out of scope for V0. Plain Tab must work first |
| Colour | Never the only signal. No-match, offline and error each pair an icon with text |
| Touch targets | 44×44 minimum throughout, including panel head controls |

---

## 7. Motion

Two motions, both earned. Nothing else.

1. **Panel open/close.** Reuse existing transitions verbatim — desktop `opacity` + `translateY(-10px→0)` + `scale(.98→1)` over 0.22s `cubic-bezier(.2,.7,.2,1)`, re-anchored to `transform-origin: bottom right`; mobile `translateY(100%→0)` over 0.22s. Both already carry `prefers-reduced-motion` kill rules.
2. **Ticket submitting.** `.btn-pill.is-loading` three-dot, minimum 400ms visible. This is the trust-critical action of the feature — the user is handing over a problem they could not solve alone — so it gets a deliberate processing state even when the insert returns in 80ms.

**Forbidden.** No slide transition between panel levels: it reads as page navigation, fights the reduced-motion path, and buys nothing at this depth — levels swap instantly. No skeleton pulse under 250ms of latency. No spinner on search.

---

## 7a. Responsive rules

Breakpoints to verify: 360, 390, 412, 768, 1024, 1440. Anything broken at 360px is P0.

| Rule | Reason |
|---|---|
| Category rows are full-width in the panel at every breakpoint | A two-column grid at 360px leaves ~140px of text width; long category names wrap to three lines and break height parity |
| Panel height clamps at `min(78dvh, 640px)` on desktop | Prevents the panel growing past the viewport on a 1024×640 laptop. Body scrolls; head and escalate footer stay pinned |
| Mobile sheet inherits `max-height: calc(100dvh - env(safe-area-inset-top) - 1rem)` | Already correct in the existing sheet variant — keep it |
| **Below 768px, `.form-input`, `.form-textarea` and `.form-select select` set `font-size: 16px`** | Any input under 16px triggers viewport zoom on iOS Safari. `.form-input` is currently 14px. `designs/pages/website/website.css` already patches this for one field locally (`.cc-search-row input`) — a page-local workaround for a system-wide problem. Fixing it at shell level resolves Help and retires that hack |
| Panel switches sheet↔dock at 768px | Matches the existing modal convention, not a new breakpoint |

---

## 8. Content-length rules

| Content | Rule |
|---|---|
| Category name | Fixed set, longest is "Invitations & RSVP" (18ch). Single line, no clamp, no ellipsis |
| Article title in a row | Two-line clamp, `overflow-wrap: anywhere`. Titles are questions in the user's own words and will run long |
| Article title as a heading | **Never clamped.** Wraps freely at level 2 and on the article page |
| Answer body | Unbounded. Panel body scrolls; head and escalate footer stay pinned. Test with a 20-step numbered list and with a 40-word one-liner |
| Search query echo | Truncate at 60 characters with a middle ellipsis |
| Ticket message | 2000-character cap, counter from 1800 |
| Sparse categories | The design must look correct with three or four articles per category and still work at fifteen |

---

## 9. Component reuse

### Reused without modification

| Element | Primitive |
|---|---|
| Search field | `.form-input-search` + `.form-input` + `.form-input-search-clear` (`shell.css:3795`) |
| Every button | `.btn-pill` + `-primary` / `-secondary` / `-ghost` / `-sm` / `-lg` (`shell.css:1097`) |
| Submit in flight | `.btn-pill.is-loading` + `.btn-pill-spinner` (`shell.css:1175`) — already has a reduced-motion fallback |
| Ticket form fields | `.form-group` / `-label` / `.form-input` / `.form-textarea` / `.form-select` / `.form-helper` |
| Field errors | `.form-error` (`shell.css:2106`) |
| Mobile sheet mechanics | `.modal-scrim` sheet variant (`shell.css:2223–2262`) |
| Loading placeholders | `.skeleton` + `.skeleton-line` |
| Copy confirmation | `window.evenzi.toast()` → `.bc-toast` (`shell.css:587`) |
| Category chips on no-match | `.tag-chip` (`shell.css:3972`) |
| Page heading blocks | `.section-head` / `-eyebrow` / `-title` / `-sub` (`shell.css:2619`) |
| In-page anchors | `.section-rule` (`shell.css:1304`) |
| Page width | `.page-band` + `.bc-wrap` — never hand-roll |
| Logged-out chrome | `.page-shell` + `-header` + `.page-logo` + `-footer` (`shell.css:2418`) |
| `/help` category grid | `.dp-tile` + `.dp-tile-grid` + `.dp-tile-link` (`shell.css:3158`, `3133`, `3237`) |
| Collapsible disclosure | `.dp-section-block` / `-head` / `-body` (`shell.css:3014`) |

### New primitives — all three must be catalogued in `designs/components.html` in the same change

**`.dock-panel`** — promoted from `.fn-notif-panel` (`shell.css:992`), which is already "a floating card panel anchored by JS to a chrome button, with a header, a scrollable list body and a footer link". That is exactly the desktop Help panel; only its name is notification-specific. Add `--origin-top-right` and `--origin-bottom-right` modifiers and keep `.fn-notif-panel` as a one-release alias so the bell does not break.

Building a separate `.help-panel` would reproduce the `.nav-tabs` / `.pill-tab` failure exactly: two classes, one job, drift forever.

**`.list-nav-row`** — generalised from `.fn-notif-item`'s grid (`shell.css:1041`). One job: a full-width tappable row with a leading icon plate, a one- or two-line label, an optional sub-label and a trailing chevron, navigating one level deeper. Category rows, question rows and search results are all this row.

Purpose-scan of what already exists and why each was rejected: `.checklist-row` leads with a completion checkbox — a state control, not navigation. `.dp-tile` is a card in a grid, wrong shape inside a 360px panel. `.qa-tile` is translucent and requires a glass parent, which would put a third `backdrop-filter` on pages that already have two. `.radio-pill` is mutually-exclusive state selection, not navigation.

**`.prose`** — tokenised rich-text styling, which does not exist anywhere today (zero occurrences in `shell.css`). Tailwind v4's preflight zeroes list markers, margins and padding, so every Markdown numbered list currently renders as an unnumbered run-on block. Needs: `p` (14px / 1.6 / `--ink-soft`), `ol`/`ul` (restored markers, 1.25rem inline padding, 0.4rem item gap), `strong`, `a` (`--brand`, underlined, 44px min tap height via `padding-block`), `code`, `h3`/`h4`, and `:last-child{margin-bottom:0}`. Measure capped at 65ch on pages. Second and third consumers already exist in the roadmap — the event-website Story and Q&A blocks, and the public policy pages.

### Recommended promotion

**`.alert-banner`** — promote the generic `role="alert"` dismissible banner currently living as `.media-error-banner` in `designs/pages/media/media.css` (catalogued as MU2) into `shell.css`, with `--danger` / `--warning` / `--info` modifiers, aliasing the media class. Help is its second consumer; writing a third variant would be the same fork defect.

---

## 10. Open questions for the founder

1. **"Help Centre" or "Help Center"?** Template 7 in `support-best-practices.md` already ships "Center" in copy sent to users. Recommendation, adopted in this document: **"Help Centre"** (en-IN, consistent with an India-first product), with Template 7 corrected in the same change.
2. **Should the landing FAQ accordion default to one row open, or all closed?** All closed is recommended — it keeps the section compact for a scrolling visitor — but it depends on how prominent the section should be in the page's narrative, which is the landing page owner's call.

---

## 11. Verification owed before launch

| Check | Why it cannot be done now |
|---|---|
| `/help/a/{slug}` in WhatsApp's Android in-app browser | This is the forwarded surface the route exists to serve. Cannot be verified at plan time or in a desktop browser |
| TalkBack walk on a real Android device | Screen-reader behaviour on Android differs materially from desktop screen readers |
| Real-device pass at 360px | 360px is the binding constraint that drove full-width rows, the 16px input floor and the sheet layout |
| Confidence-threshold calibration | Must be tuned against real queries during the dogfood week, not guessed |
