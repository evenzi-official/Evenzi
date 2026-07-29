# Sapphire × Mivon — QA remediation (2026-07-22)

**Target:** `designs/pages/website/guest-site/sapphire-mivon/`  
**Sources:** `qa/sapphire-mivon-ui-review.md` · `qa/sapphire-mivon-qa-findings.md`

---

## Fixed this pass

| ID | Finding | Fix |
|----|---------|-----|
| P0 | RSVP missing | `#rsvp` + nav (prior pass) |
| P0 | No `<h1>` | Visually hidden h1 in `#sp-hero` |
| P0 | Story body in `<h2>` | `h2` title + `.sp-story-body` `<p>` |
| P0 | Skip → locked `#story` | `#sp-hero` until unlock; `#story` after |
| P0 | No OG meta | `og:title`, `og:description`, `og:image`, Twitter card |
| P0 | Marquee promises venue | Copy → "manifest · RSVP"; FAQ travel answer updated |
| P1 | Nav before unlock | `.is-gated` on private-section links until check-in |
| P1 | Intro focus escape | `inert` peers + focus trap on `#sp-intro` |
| P1 | Unlock sheet a11y | Focus trap; `aria-haspopup` on Check In |
| P1 | FAQ not keyboardable | `<div>` → `<button type="button">` accordion triggers |
| P1 | Marquee `<h4>` outline | `<span class="sp-marq-text">` |
| P1 | `maximum-scale=1` | Removed; `viewport-fit=cover` |
| P1 | ScrollSmoother mobile | Disabled `<992px` (prior pass) |
| P1 | Scroll height / RSVP overlap | Pre-unlock GSAP measure + refresh (prior pass) |
| P2 | Gallery `#0` dead links | Decorative `<span class="sp-gallery-tag">` |
| P2 | Touch targets | Nav toggler + theme icon ≥44px; FAQ row min-height |
| P2 | Progress scroll chrome | Hidden in overlay |
| P2 | Theme toggle label | `aria-label` (prior pass) |

---

## On hold (needs design / not in lab yet)

| Item | Why |
|------|-----|
| `#venue` section | No Mivon shell + lab content ported |
| Sticky RSVP bar | Lab pattern not merged |
| Full wedding party grid | Design scope TBD (couple-only today) |
| Couple mark logo | Asset/branding decision |
| Font harmonization | Overlay vs Mivon tokens |
| Footer hashtag / download CTA | Product decision |
| OG absolute URL | Needs production host for WhatsApp |

---

## Re-test checklist

1. Hard refresh → skip intro → demo unlock → scroll full page
2. Nav anchors: Story, Manifest, Party, Gallery, Q&A, RSVP
3. FAQ keyboard: Tab to header → Enter toggles
4. Locked state: clear `evenzi-spm-unlocked-brindo-sree` → nav private links gated
5. RSVP submit → success state; footer below form (no overlap)
6. 360 / 768 / 1024 — no horizontal overflow

**Preview:** http://localhost:4000/pages/website/guest-site/sapphire-mivon/
