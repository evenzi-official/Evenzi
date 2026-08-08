# ENH-icons — Site-wide icons + meta (plan)

**Date:** 2026-08-08  
**Owner:** Abhijith  
**Status:** Implemented this session  
 
**Ticket / ledger:** ENH-icons (`docs/testing/2026-08-07-platform-truth-audit-findings.md`, `docs/NEXT-SESSION.md`)

---

## Goal

Every Next.js app page shows Evenzi branding in browser tabs, bookmarks, iOS/Android “Add to Home Screen”, and default link previews — not the Next.js default favicon / empty meta.

## Asset decision

**Evenzi mark:** stylized **E** + play triangle, brand red on black (app icon) / on white (light).  
Masters: `public/brand/mark-dark.png`, `public/brand/mark-light.png`, `public/brand/mark.svg`.  
Derived: `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`, `public/icons/*`.

## In scope

| Surface | What | Where |
|--------|------|--------|
| Favicon (tab) | `.ico` multi-size + PNG icon | `app/favicon.ico`, `app/icon.png` |
| Apple touch | 180×180 PNG | `app/apple-icon.png` |
| Android / PWA icons | 192 + 512 PNG | `public/icons/icon-192.png`, `icon-512.png` |
| Web app manifest | name, theme, icons, `standalone` | `app/manifest.ts` → `/manifest.webmanifest` |
| Root metadata | title template, description, `metadataBase`, OG, Twitter, `applicationName`, `appleWebApp` | `app/layout.tsx` |
| Theme color | light `#f9fafb` / dark `#0d0d0d` (shell surfaces) | `export const viewport` in `app/layout.tsx` |
| Coverage | All routes under root layout (auth, home, events, settings, public `/e/[slug]` inherit; guest page keeps its own `title`/`description` via `generateMetadata`) | automatic via root layout |
| Design prototypes | Refresh `designs/favicon.ico` + `designs/apple-touch-icon.png` + manifest icon paths so prototypes match app | `designs/` |

## Out of scope

- Final logo / wordmark redesign  
- Per-event Open Graph images for guest websites  
- Marketing host `evenzii.com` / `landing-page/` package (separate deploy)  
- Full offline PWA (service worker already exists for push only)  
- Changing per-route titles beyond defaults already set  

## Implementation notes

1. Prefer Next App Router **file conventions** (`favicon.ico`, `icon.png`, `apple-icon.png`, `manifest.ts`) so every page gets tags without per-page `<head>` edits.  
2. `metadataBase` = `getAppBaseUrl()` from `lib/url.ts` (env → Vercel → localhost).  
3. Title pattern: default `"Evenzi — Plan, Manage & Celebrate Your Events"`; template `"%s · Evenzi"` for child titles.  
4. OG/Twitter defaults reuse the same description + `icon-512` as image until a dedicated social card exists.  
5. Do not invent Resend / unrelated env prompts.

## Acceptance

- [x] `/auth` HTML includes favicon + apple-touch (+ manifest) links  
- [x] `/favicon.ico`, `/icon.png`, `/apple-icon.png` return 200 with Evenzi mark  
- [x] `/manifest.webmanifest` returns Evenzi name + 192/512 icons (middleware allowlisted)  
- [x] `theme-color` present for light/dark  
- [x] OG `og:title` / `og:description` / `og:image` present  
- [x] Guest `/e/[slug]` keeps event-specific title via `generateMetadata`; inherits icons from root  
- [x] `docs/NEXT-SESSION.md` moves ENH-icons to PAST  


## Verify

```bash
npm run build   # metadata/icon routes typecheck + compile
# after dev/build: curl -I localhost:3000/favicon.ico apple-icon.png manifest.webmanifest
```
