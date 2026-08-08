# Stage 2 — Foundations B: overlay wrapper and design primitives

**Paste everything below the line into a fresh Cursor session.**

Covers plan tasks 3 and 4. Depends on nothing. Can run in parallel with stage 1.

---

## 1. Routing

**Tool:** Cursor, auto mode with a free NVIDIA model.
**Repository:** `/Users/xcalider/Documents/Projects/Evenzi`
**Branch:** create `feature/help-centre-foundations-b` from `Dev-Vibe`.

## 2. Objective and context

Evenzi is a wedding and event planning platform on Next.js 14 App Router, TypeScript strict, Tailwind v4 and Supabase. The design system lives in `designs/shared/shell.css` (4,310 lines) and is catalogued in `designs/components.html`.

This stage builds two foundations the Help Centre needs, both of which fix problems that already exist across the product.

**Problem one — twelve modals, no shared overlay behaviour.** Twelve files hand-roll `.modal-scrim`. Exactly four handle the Escape key. **None** implements focus return to the trigger, focus trapping, or a body scroll lock — `body.no-scroll` exists in `shell.css:2298` with zero React consumers, and there is no `lib/hooks/` directory at all. The practical effect: close a modal and your keyboard position is dumped at the top of the page; Tab repeatedly and focus wanders behind the panel into the page underneath; scroll a modal on mobile and the page scrolls with it.

**Problem two — no rich-text styling exists.** `shell.css` contains zero occurrences of `.prose` or any equivalent. Tailwind v4's preflight zeroes list markers, margins and padding. Every Help Centre answer is Markdown authored by the operations team, and their brief explicitly instructs numbered lists for multi-step instructions. Rendered today, every one of those would collapse into an unnumbered run-on block — the single most important formatting in the entire content set.

## 3. Research and prior decisions

- **`NotificationBell` is the proving consumer for the overlay wrapper, not a modal.** The accessibility contract splits in two: mobile is `aria-modal="true"`, focus trapped, body scroll locked; desktop is `aria-modal="false"`, untrapped, page still operable. Any of the twelve existing modals is a pure modal and would validate only the trapped path. `components/layout/NotificationBell.tsx` is already a non-modal anchored panel that handles Escape at line 118 and uses `.fn-notif-panel` at line 183 — so it exercises the untrapped path, and this stage promotes that same class to `.dock-panel` anyway. One file, touched once.
- **Do not fork a new panel class.** `.fn-notif-panel` is already "a floating card panel anchored to a chrome button, with a header, a scrollable body and a footer link" — which is exactly the Help panel. Only its name is notification-specific. This codebase already grew `.nav-tabs` and `.pill-tab` as two classes doing one job, and that is a defect the reuse rule exists to prevent.
- **`.list-nav-row` generalises `.fn-notif-item`** (`shell.css:1041`). Rejected alternatives, all scanned by purpose: `.checklist-row` leads with a completion checkbox and is a state control not navigation; `.dp-tile` is a card in a grid, the wrong shape inside a 360px panel; `.qa-tile` is translucent and needs a glass parent, which would put a third `backdrop-filter` on pages that already carry two; `.radio-pill` is mutually-exclusive state selection.
- Full reasoning: [UI spec §9](../../specs/2026-08-07-help-centre-v0-ui-design.md).

## 4. Dev spec

**Read [plan tasks 3 and 4](../2026-08-08-help-centre-v0.md) and follow them step by step.** They contain the exact hook code, component code, CSS and test code.

| File | Change |
|---|---|
| `lib/hooks/useOverlaySurface.ts` | New directory and file. Escape, focus trap, body scroll lock, focus return. Exports `getFocusableElements` and `nextTrapFocus` as pure functions so the logic is unit-testable without a DOM |
| `components/ui/OverlaySurface.tsx` | New. Wrapper owning `role="dialog"`, `aria-modal`, `aria-labelledby`, and outside-click |
| `components/layout/NotificationBell.tsx` | Migrate onto the wrapper. Delete the bespoke Escape listener at line 118. Keep every visual class |
| `designs/shared/shell.css` | Add `.prose`, `.list-nav-row` and its parts, `.dock-panel` (promoting `.fn-notif-panel`), `.alert-banner` (promoting `.media-error-banner`), and the 16px mobile input floor |
| `designs/pages/media/media.css` | Remove the `.media-error-banner` rules now living in shell |
| `designs/pages/website/website.css` | Remove the local `.cc-search-row input{font-size:16px}` hack, now covered by the shell-level floor |
| `designs/components.html` | New `#help-primitives` section cataloguing all four |

Four details that are load-bearing:

**The overlay is not rendered when closed.** Not `visibility: hidden`, not `display: none` — returns `null`. It costs nothing and cannot be reached by Tab.

**`modal` is a prop, not a breakpoint check inside the component.** The caller decides. Help passes `modal={isMobile}`; the notification bell passes `modal={false}` at all widths.

**The 16px input floor is not cosmetic.** Any input under 16px triggers a viewport zoom on iOS Safari when focused, and `.form-input` is 14px. There is already a page-local workaround for this in `website.css` for one field — this replaces it system-wide.

**`.prose` links get `padding-block`,** which lifts an inline link to a 44px tap target without changing how it looks.

## 5. Testing

Write `__tests__/lib/hooks/useOverlaySurface.test.ts` exactly as given in plan task 3, step 1 — eight assertions across `getFocusableElements` and `nextTrapFocus`, covering disabled controls, anchors without `href`, `tabindex="-1"`, forward and backward wrapping, focus starting outside the trap, and the empty-trap case.

```bash
npm run test:run
npx tsc --noEmit
npm run lint
```

## 6. Visual testing

Run the design server and open `designs/components.html#help-primitives`:

- `.prose` renders a **numbered list with visible numbers** — this is the whole reason the primitive exists. Also check a bulleted list, bold, inline code, a blockquote and a link.
- Three `.list-nav-row` variants: with icon, without icon, and one whose label is long enough to clamp at two lines.
- `.dock-panel` renders as a floating card.
- `.alert-banner` in all three roles.
- Toggle light and dark — every primitive is readable in both.

Screenshot the `#help-primitives` section in both themes.

## 7. UI/UX testing

Test the migrated notification bell in the running app:

- Click the bell — the panel opens.
- Press Escape — it closes.
- **Focus returns to the bell button**, which it did not before this change.
- The page behind still scrolls while the panel is open. It is non-modal, so this is correct.
- Click outside — it closes.
- Tab through the panel — focus moves through its contents and is *not* trapped, because desktop is non-modal.
- Every `.list-nav-row` is at least 56px tall with a visible focus ring.

## 8. Responsiveness testing

360, 390, 412, 768, 1024, 1440. Check that `.list-nav-row` labels clamp at two lines rather than overflowing at 360px, `.prose` stays within 65ch on wide viewports, and no primitive causes horizontal scroll. Focus a text input at 375px and confirm the viewport does **not** zoom.

## 9. Data testing

Not applicable — this stage renders no data.

## 10. Definition of done

- [ ] `npm run test:run` passes, including the eight new hook tests
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] Numbered lists render with visible numbers in `.prose`
- [ ] Notification bell: opens, Escape closes, focus returns to the trigger, outside-click closes, page behind still scrolls
- [ ] All four primitives catalogued in `designs/components.html` under `#help-primitives`
- [ ] `.media-error-banner` removed from `media.css`; the `website.css` 16px hack removed
- [ ] No text input zooms the viewport on iOS at 375px
- [ ] Screenshots of `#help-primitives` in light and dark attached
- [ ] Branch `feature/help-centre-foundations-b` pushed

Then hand back to Claude for review. Do not merge.
