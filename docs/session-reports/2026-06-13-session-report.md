# Session Report — 2026-06-13 (Media v2 · Skeletons · Invitations · PORT-MAP)

**User:** Abhijith · **Branch:** `claude/exciting-hodgkin-bf851a` (from `Dev-Vibe`)
**Type:** Design-path + `/spec-kit` + infra. **No ClickUp tickets** (all pre-task design/infra work).
**Commits:** 10 (clean worktree at close). **Design server** stopped at session end.

---

## What shipped

### 1. Media & Memories — full prototype + v2 (`designs/pages/media/`)
- **Built the host dashboard** from a council-reviewed `/spec-kit` kit: upload dropzone, recent strip, Albums grid, All-photos grid with select/cover/remove + bulk + lightbox(prev/next), storage meter (passive CTA), empty/first-run hero.
- **Promote discipline (3 ordered commits):** `.photo-tile`/`.bulk-bar` family promoted from `website.css` → `shell.css` (Media = 2nd consumer), website.css deduped + `photos.html` re-verified, assign-picker built net-new on `.modal-picker-grid` (not a promoted `openPicker`).
- **Layout iterations (founder live review):** content reorganized into a `.seg` **tab structure** (Photos · Videos · Albums) matching the Event Website sub-nav; tab-bar left-alignment bug fixed (`.seg-wrap` not `--page` inside `.page-band`).
- **v2 features:** Sort (Newest/Oldest/Name) + filters (album · sub-event/function · date range) with removable chips; **bulk Delete** with cautionary confirm + **Undo toast** (founder override of the locked "no bulk delete"); **full Videos tab** mirroring Photos (poster + play badge + duration, player lightbox, sort/filter, select/bulk, add/remove album); **albums hold BOTH** photos + videos ("15 photos · 2 videos", open-album filters both, delete un-files both).
- **Font vendoring (shell-wide):** Poppins + Material Symbols vendored to `designs/shared/fonts/` (`@font-face`), Google-CDN `<link>`s removed across pages (closes `1.resilience`). *(4 website display fonts still CDN — tracked.)*
- Review pass (`/spec-kit-review`) caught 2 matrix-blind defects (incomplete `.dp-tile-trigger` promote; tab-switch not clearing select-mode) — both fixed + verified.

### 2. Skeleton loading — platform-wide foundation (`shell.css`/`shell.js`/`components.html`)
- `.skeleton` primitive (token-driven `--skel-base`/`--skel-sheen`, light+dark), subtle shimmer, reduced-motion → opacity pulse. Shapes: line(sm/lg)·circle·pill·thumb·block.
- Region-swap convention: `aria-busy="true"` swaps `[data-skeleton]` ↔ `[data-content]`; `window.evenzi.setLoading(el, bool)`.
- Cataloged in `components.html §14` with the swap demo + 4 reusable templates (event card · tile grid · list row · section head). Per-surface rollout deferred.

### 3. Invitations — card personalizer (`designs/pages/invitations/`) → DONE
- Council review (4 agents + arbiter) on the kit, **then a red-team + reference (withjoy.com) stress test reframed it**: from a palette/font *designer* (over-engineered, ugly-DIY risk) to a Joy-style **personalizer** — designer-LOCKED templates, edit text **inline on the card** (contenteditable + floating size toolbar), **"Upload your card" first tile**, front-only.
- Built inline (Cursor skipped): gallery (style filter + 7 locked templates + upload tile) → editor (light/**dark-mode-immune** `.inv-card` via per-`[data-tpl]` `--c-*` tokens) → Preview / Download (faked PNG) / **honest WhatsApp share** (text + RSVP link; `wa.me` can't attach images).
- `/spec-kit-review` → **🟢 DONE**: Antigravity 22 PASS / 0 FAIL; its 11 SKIPs were a subagent crash on §6/§7 — re-covered via Playwright (responsive, a11y, **Devanagari + long content** wrap in the A5 card, no clip). Fixed action-bar CTAs 37px → 44px.
- Overview patched with the scope split (invitations = card designer; send/track stays in Guest Management; connect via hosted card URL).

### 4. PORT-MAP.md (`docs/PORT-MAP.md`) — brought into repo + updated to 2026-06-13
- Was a loose file shared with Dheeraj; now canonical in-repo. Updated §0 (component library now exists — revamp), §3 (skel tokens + fonts vendored), §4.1 (`.nav-tabs`→`.seg`), §4.8 (new primitives: skeleton/photo-tile/bulk-bar/lightbox-nav + Invitations/Media page modules), §5 (`setLoading`), §7/§8 (Invitations=card designer, Media full prototype, coverage flips). Synced back to `~/Downloads`.

---

## Decisions worth keeping in front
- **Invitations = personalizer, not designer** (stress-test verdict). Locked templates + inline text edit; no palette/font panel. Upload-first.
- **Media tabs = Photos · Videos · Albums**; albums are a shared container for both media types.
- **Bulk delete is allowed** (founder override) but always with confirm + undo.
- **Cards are dark-mode-immune** (own `--c-*` tokens) — a wedding card is a light artifact.
- **WhatsApp share is text + link, never an image attach** (`wa.me` limitation) — honest copy everywhere.

## Carryover / next
- **Skeleton rollout** into real surfaces (Dashboard cards, Media grids, Guests rows, Planning) — foundation is ready.
- **Shell-wide vendoring debt:** 4 website display fonts + Invitations card fonts (Cormorant/Playfair/Lora/Inter) still CDN — vendor for export/offline fidelity (esp. Devanagari for the card PNG export).
- **Shell-wide touch targets:** `.btn-pill` (37px) + `.seg-item` (40px) under 44px — raise at shell level (only the Invitations CTA bar was fixed this session).
- **Invitations React/export build:** real PNG render (Satori/Puppeteer) → Supabase Storage → hosted card URL; gate on `document.fonts.ready`.
- **Antigravity reliability:** the Invitations run crashed on §6/§7 (subagent crash) — worth investigating before relying on it for the responsive/a11y matrix.

## Agent-evolution candidates (not yet applied)
- UI/UX agent: "wedding/invite cards are dark-mode-immune light artifacts — scope colour to per-template tokens, never global `--bg`/`--ink`."
- Product/Tech: "stress-test a 'designer' idea against a real reference before building — personalizer (locked templates + inline edit) usually beats free palette/font for a 'not too much' brief."

## ClickUp
No tasks touched — this was design-path + `/spec-kit` + infra (pre-task; no tickets).
