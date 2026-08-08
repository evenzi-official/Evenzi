# Stage 1 — Foundations A: support address and the Help FAB

**Paste everything below the line into a fresh Cursor session.**

Covers plan tasks 1 and 2. Depends on nothing. Both changes are independent of the Help Centre feature and can ship on their own.

---

## 1. Routing

**Tool:** Cursor, auto mode with a free NVIDIA model.
**Repository:** `/Users/xcalider/Documents/Projects/Evenzi`
**Branch:** create `feature/help-centre-foundations-a` from `Dev-Vibe`.

## 2. Objective and context

Evenzi is a wedding and event planning platform built on Next.js 14 App Router, TypeScript strict, Tailwind v4 and Supabase. It is mobile-first — phones are the dominant device.

This stage fixes **three defects that are live in production today**. None of them is part of the Help Centre feature; they were found while specifying it. They ship independently and need no other work to land first.

**Defect one — the support address is a personal Gmail account, in seven files.** `evenzi.official@gmail.com` appears in seven application files, including both authentication screens, which are exactly where a user who cannot sign in goes looking for help. Meanwhile two operations documents publish `support@evenzi.com`, two more publish `support@evenzi.in`, and the domain the company actually owns is `evenzii.com`. Four variants, none of them consistent.

**Defect two — the Help FAB is unclickable on tablets.** `.help-fab` sits at `right: 24px`, `bottom: 84px`, `z-index: 30`. `.add-fab` sits at `right: 20px`, `bottom: 92px`, `z-index: 60`. Both are 56×56, so they overlap by roughly 52×48 pixels and `.add-fab` wins the stacking order. On the Guests and Planning screens the help button cannot be clicked between 769px and 1399px.

**Defect three — the Help FAB does not exist on phones.** `designs/shared/shell.css:743` sets `.help-fab { display: none }` below 768px. On a mobile-first product there is currently no route into help from any phone, at all.

There is also no help affordance on `/home`, which is where a brand-new host — the person most likely to need help — lands.

## 3. Research and prior decisions

- The `display: none` rule exists because the FAB collided with the bottom tool rail. That is already solved separately: `shell.css:739` lifts the FAB to `calc(env(safe-area-inset-bottom) + 5.25rem)` below 1399px, which clears the rail. The hide rule is redundant and costs the entire mobile surface.
- **Help sits above the primary action, not below it.** Adding a guest is the frequent act; asking for help is the rare one. The thumb-closest slot goes to the frequent one.
- `support@evenzii.com` does not exist yet and will be created at launch. Until then the address is `abhijith@evenzii.com`, which is real and monitored. The flip is one environment variable so no file is ever edited again for this.
- Full reasoning: [spec §10.1 and §10.3](../../specs/2026-08-07-help-centre-v0-design.md).

## 4. Dev spec

**Read [plan tasks 1 and 2](../2026-08-08-help-centre-v0.md) and follow them step by step.** They contain the exact CSS, the exact component code, and the exact test code. Do not improvise around them.

Summary of what lands:

| File | Change |
|---|---|
| `lib/constants/support.ts` | New. `SUPPORT_EMAIL` from `NEXT_PUBLIC_SUPPORT_EMAIL` with `abhijith@evenzii.com` as default, plus `SUPPORT_MAILTO()`, `SUPPORT_HOURS`, `SUPPORT_RESPONSE_HOURS` |
| 5 settings and footer files | Replace the hardcoded Gmail `mailto:` with `SUPPORT_MAILTO()` |
| `app/auth/page.tsx`, `app/auth/role-selection/page.tsx` | Point "Need help?" at `/help` rather than a mailto — `/help` is reachable logged out and is the better destination for someone who cannot sign in |
| `designs/shared/shell.css` | Replace the `.help-fab` block: remove `display:none`, `right` to `1.25rem` to share an axis with `.add-fab`, `z-index` to 59, add `.help-fab--stacked` |
| `components/layout/HelpFab.tsx` | Add `stacked`, `expanded`, `onClick` props; `aria-expanded`, `aria-controls`, and a label that flips open/close |
| `components/layout/HelpFabMount.tsx` | New. Pathname-gated single mount |
| `app/layout.tsx` | Mount `<HelpFabMount />` once |
| `app/events/[id]/layout.tsx:57`, `app/settings/page.tsx:89` | Remove the per-page `<HelpFab />` |
| `designs/components.html` | Catalog the `--stacked` modifier as S5b |

`z-index: 59` is deliberate — below `.add-fab`'s 60 so the primary action still wins any residual overlap, but above the tool rail at 40.

The FAB is hidden on `/`, `/auth/*`, `/e/*`, `/help*`, `/invite*` and `/wedding-invitation-temp-*`. `/e/*` is the public guest event website, where a host-support button is noise to a wedding guest. `/help` is excluded because a button that opens a small panel showing what is already full-size on screen is a dead affordance.

**The FAB has no click handler yet.** The panel arrives in stage 8. Leave `onClick` undefined — do not wire a placeholder, a toast, or a link.

## 5. Testing

Write `__tests__/lib/constants/support.test.ts` exactly as given in plan task 1, step 1. Six assertions covering the default address, the domain, the consumer-provider guard, and `mailto` encoding.

Then:

```bash
npm run test:run
npx tsc --noEmit
npm run lint
grep -rn "evenzi.official@gmail.com" app/ components/ lib/   # must return nothing
```

## 6. Visual testing

Start the dev server and check the Guests screen at `/events/{any-event-id}/guests`:

- **1024px** — both FABs visible, not overlapping, both clickable. This is the breakpoint where help was previously buried.
- **1280px** — same.
- **375px** — both FABs visible. Help was previously absent entirely here.
- **`/home`** — the help FAB now appears, where before there was none.
- **`/e/{any-slug}`** — the help FAB does **not** appear.

Screenshot 1024px and 375px on the Guests screen.

## 7. UI/UX testing

- Tab to each FAB — a visible focus ring appears on both.
- The help FAB's accessible name reads "Open Help Centre".
- Clicking the help FAB does nothing yet, and that is correct for this stage.
- Clicking the add FAB still opens the guest form, unchanged.
- Both buttons are at least 44×44.

## 8. Responsiveness testing

360, 390, 412, 768, 1024, 1440. At every width: no horizontal scroll, both FABs on screen, neither clipped by a safe-area inset, and the help FAB clear of the bottom tool rail. Anything broken at 360px is a P0.

## 9. Data testing

Not applicable — this stage touches no data.

## 10. Definition of done

- [ ] `npm run test:run` passes, including the six new constant tests
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `grep -rn "evenzi.official@gmail.com" app/ components/ lib/` returns nothing
- [ ] Both FABs visible and clickable at 375, 1024 and 1280px on the Guests screen
- [ ] Help FAB present on `/home`, absent on `/e/*` and `/help`
- [ ] `designs/components.html` documents the `--stacked` modifier
- [ ] No dead click handler on the help FAB
- [ ] Screenshots at 1024 and 375px attached
- [ ] Branch `feature/help-centre-foundations-a` pushed

Then hand back to Claude for review. Do not merge.
