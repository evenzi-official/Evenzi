# Sapphire × Mivon — UI/UX Review (Lab Prototype)

**Reviewer:** `ai/agents/ui_ux_designer.md`  
**Target:** `designs/pages/website/guest-site/sapphire-mivon/`  
**Reference:** `sapphire-lab/` · `designs/_plans/guest-site-sapphire-mivon-merge.md`  
**Date:** 2026-07-22 · One round · static + playbook cross-check

---

## 1. User assignment

**Guest.** Public wedding site from a WhatsApp link on mid-tier Android — schedule, venue/travel, RSVP, trust.

---

## 2. Findings (summary)

### P0 — blocks ship

| Issue | Fix |
|-------|-----|
| **Venue & RSVP missing** — marquee/FAQ promise them | Port `#venue` + `#rsvp` from lab; wire nav |
| **Broken copy promises** — "venue · RSVP" in marquee; FAQ links venue | Add sections or change copy |
| **No `<h1>`** | Promote couple names or visually hidden h1 |
| **Story paragraph inside `<h2>`** | Title in h2; body in `<p>` |
| **Skip link → locked `#story`** | Target `#sp-hero` until unlock |
| **No Open Graph meta** | `og:title`, `og:description`, `og:image` for WhatsApp preview |

### P1 — fix before next phase

| Issue | Fix |
|-------|-----|
| Nav active before unlock (scrolls to hidden content) | Gate nav until check-in |
| Party = couple only; nav says "Party" | Full family grid or rename |
| Mivon logo wordmark | Couple mark + correct alt |
| Marquee `<h4>` pollutes outline | Use `<span>` |
| Accordion `<div>` not keyboard-operable | `<button>` triggers (aligns QA P1) |
| Heavy ScrollSmoother/marquee on mobile | Gate off or `prefers-reduced-motion` |
| `maximum-scale=1` blocks zoom | Remove from viewport meta |
| Unlock sheet focus trap / `aria-haspopup` | Match lab a11y pattern |

### P2 — polish

Font mismatch (overlay vs Mivon fonts), gallery tag dead links, progress-wrap chrome, theme toggle label, footer hashtag/download CTA.

---

## 3. Pre-delivery checklist

| Check | Result |
|-------|--------|
| User = Guest | Pass |
| Mobile 360–412 | Fail (layout + a11y; see QA pass) |
| WhatsApp / OG | Fail |
| Component reuse | Partial (Mivon shells OK; Venue/RSVP not ported) |
| WCAG AA | Fail |
| Empty/RSVP states | Fail |

---

## 4. Open questions

1. Light vs dark default for guests?  
2. Check-in gate — demo only or production?  
3. Party scope — full family or couple cards?  
4. RSVP — inline form vs deep-link?  
5. Disable ScrollSmoother on mobile?

---

## 5. Next

**Remediation applied 2026-07-22** — see [`qa/sapphire-mivon-remediation-2026-07-22.md`](sapphire-mivon-remediation-2026-07-22.md).

**Still on hold:** Venue section, sticky RSVP bar, full party grid, couple logo mark.

**Companion:** [`qa/sapphire-mivon-qa-findings.md`](sapphire-mivon-qa-findings.md) — browser D1/D7/D8 at 360–1440px.
