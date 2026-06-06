# Cursor change-prompt — compact section header + (i) info-disclosure (Guests)

**Goal:** shrink the tall page header on Guest Management. Keep the "SECTION" eyebrow + the "Guest Management" title, but **tighten it up against the breadcrumb** and **move the long description out of the layout flow into a small (i) info icon** next to the title that reveals the text on demand. Saves ~2 lines of vertical space above the content.

Build the (i)-disclosure as a **new, generic, reusable shell primitive** (other section pages can adopt it later), but **wire it on `guests.html` ONLY** in this pass.

## Read first
- `.cursor/rules/evenzi-design.mdc` — design-system rules + the mandatory **design self-review + self-test** passes (run both before you call this done).
- `designs/shared/shell.css` — find the existing `.section-head` / `.section-head-eyebrow` / `.section-head-title` / `.section-head-sub` block (this is what Guests uses).
- `designs/pages/guests/guests.html` — the consumer (header at ~line 137).

## Decisions (already made — build exactly these)
- **Title placement:** tightened — title stays its own line directly under the breadcrumb (reduce the gap, shrink the title a notch on this compact variant). **Do NOT touch the breadcrumb chrome** (`.bc-wrap` / `.bc-shell`).
- **Disclosure:** the description shows via the (i) button on **hover (desktop pointer) AND keyboard focus AND tap (touch)** — not hover-only.

## 1 · New shell primitives (`designs/shared/shell.css` — generic)
- **`.section-head--compact`** (modifier on `.section-head`) — reduce the top margin so the header hugs the breadcrumb, and trim the title size a step (e.g. one size down from the default `.section-head-title`). No description shown in flow.
- **`.section-head-titlerow`** — a flex row (align-items: center, gap from a token) holding the title + the info button; the tip is positioned relative to it.
- **`.section-head-info`** — small icon-button (Material Symbols `info`): visually ~18–20px icon but a **≥44px hit area** (padding); `color: var(--muted)`, hover→`var(--ink)`/`var(--brand)` (hover-guarded); visible `:focus-visible` ring.
- **`.section-head-tip`** — the description popover: positioned **below** the info button (absolute, anchored to `.section-head-titlerow`), `var(--card)` bg + `1px var(--line)` border + clay radius + a token shadow; `max-width: min(320px, calc(100vw - 2rem))`; text wraps; `z-index` above content; **`hidden` by default**. No horizontal overflow at 360px (clamp width + left-anchor).
- **Reveal rules:**
  - `@media (hover:hover) and (pointer:fine)` → show the tip on `.section-head-info:hover` and on `.section-head-info:focus-visible` (CSS `+`/sibling or via the `.is-open` class JS sets).
  - **Reduced motion:** if you add a fade, gate it behind `prefers-reduced-motion: no-preference`; otherwise show/hide instantly.

## 2 · Shell behavior (`designs/shared/shell.js` — delegated, generic)
Add a small delegated handler for `[data-info-tip]` (the info button):
- **Click/tap** toggles the tip: flip `aria-expanded` on the button + show/hide the tip (e.g. toggle `.is-open` / the `hidden` attr). This is the touch path (and a desktop "pin").
- **Keyboard:** focusing the button shows the tip (focus path); **Esc** closes it and returns focus to the button.
- **Outside click / scroll** closes any open tip.
- Works for ANY `.section-head-info` on the page (delegate on document), so it's reusable.
- IIFE conventions; no inline JS; no `innerHTML`.

## 3 · Wire it on Guests (`designs/pages/guests/guests.html` ONLY)
Restructure the header (~line 137):
```html
<header class="section-head section-head--compact reveal">
  <p class="section-head-eyebrow">SECTION</p>            <!-- keep existing eyebrow text -->
  <div class="section-head-titlerow">
    <h1 class="section-head-title">Guest Management</h1>
    <button class="section-head-info" type="button" data-info-tip
            aria-label="About Guest Management"
            aria-describedby="gm-head-tip" aria-expanded="false">
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
    </button>
    <span class="section-head-tip" id="gm-head-tip" role="tooltip" hidden>Build your invitee list, track RSVPs as they arrive, and send WhatsApp invitations — all in one place.</span>
  </div>
</header>
```
- Move the **exact** existing `.section-head-sub` text into the `.section-head-tip` (verbatim — don't reword). Remove the old `<p class="section-head-sub">` from the flow.
- Mobile: the header already stacks (block flow) below the breadcrumb — the titlerow (title + info) sits there; the tip opens below the button. Verify no horizontal overflow at 360px.

## A11y (must hold)
- Info button: real `<button>`, `aria-label`, `:focus-visible` ring, ≥44px hit area, `aria-expanded` reflects open state.
- Tip reachable by keyboard (focus shows it) AND touch (tap toggles) AND pointer (hover) — never hover-only.
- Esc closes + returns focus; outside-click closes.
- Description text is `aria-describedby`-linked to the button so SR users get it regardless of hover.
- `prefers-reduced-motion` respected.

## Scope / guardrails (do NOT cross)
- Touch only `designs/shared/shell.css`, `designs/shared/shell.js`, and `designs/pages/guests/guests.html`. **Do NOT edit any other page**, the breadcrumb chrome, or anything in guests below the header (the guest list, modals, JS logic stay byte-identical).
- Tokens only; no inline CSS/JS; hover-guard every `:hover`; load order intact.
- Build the primitives **generic** (so planning/media/etc. can adopt `--compact` + the info button later) but adopt them **only on guests** now.

## When done
Run the **design self-review + self-test** (per the cursor rule): confirm hover + focus + tap all reveal the tip, Esc/outside-click close, no 360px overflow, ≥44px target, no console errors, and `git status` shows only the 3 files above. Guests is not in the spec-kit baton system — no `_status` to bump; just report "done + self-tested" and what you changed. (Claude will verify in the browser + commit.)
