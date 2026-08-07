# W4 — Design ↔ React map

| | |
|---|---|
| **Date** | 2026-08-07 |
| **Wave** | Stage 1 / W4 |
| **Scope** | Audit only — no product code changes |
| **Agents** | `ui_ux_designer`, `frontend_engineer` |
| **Method** | Inventory `designs/pages/**/*.html` → map to `app/**` routes → cite intentional docs → spot-check primary CTAs in React (structural + handlers; not Playwright) |

## Inventory rules

- **Include:** host-facing screens under `designs/pages/**/*.html`, plus guest-site template entry points (`guest-site/*/index.html`).
- **Exclude:** vendor asset noise under `website/guest-site/sapphire-mivon/assets/**` (5 HTML stubs: fonts/css/map placeholders).
- **Out of `designs/pages`:** `designs/index.html` (host dashboard prototype) and `designs/components.html` (catalog) are not in this inventory; React dashboard lives at `/home`.
- **Policy:** React + written decisions win. Undocumented drift → **Q&A** (not auto-P0). Cite: [platform-truth-audit-design.md](../../superpowers/specs/2026-08-07-platform-truth-audit-design.md) §W4; baseline routes in [PORT-MAP.md](../../PORT-MAP.md) §7 (stale on build status — routes below verified against `app/` on 2026-08-07).

## Summary counts

| Status | Count | Meaning |
|--------|------:|---------|
| **match** | 17 | Design screen has a React route; structure aligns |
| **intentional-diverge** | 14 | Documented / shipped decision; React wins |
| **Q&A** | 7 | Undocumented or founder-decision gap (template catalog) |
| **MISSING** | 0 | No unmapped host product screen left as blind MISSING after classifying intentional/Q&A |
| **Total inventoried** | **38** | After excluding `sapphire-mivon/assets/**` |

**CTA spot-check (mapped pages only):** most primary CTAs are wired. Known inert / cosmetic (documented elsewhere, not auto-P0 here): Journey Add sub-event (dead buttons), Guests Send invites (intentionally disabled), Invitations “Saved” (cosmetic), Website Photos upload (coming-soon toast), Billing Upgrade (stub), Registry form (disabled / deferred).

---

## Map table

| Design path | React route | Status | Notes |
|-------------|-------------|--------|-------|
| `designs/pages/auth/auth.html` | `/auth` | match | Phone + Google primary CTAs wired (`AuthPage`). |
| `designs/pages/auth/verify-otp.html` | `/auth` (inline OTP step) | intentional-diverge | PORT-MAP proposed `/auth/verify`; React folds verify into `/auth` when `otpSent` ([PORT-MAP.md](../../PORT-MAP.md) §8.2 “OTP-verify page TBD”). Verify CTA wired. |
| `designs/pages/auth/role-select.html` | `/auth/role-selection` | intentional-diverge | Naming: PORT-MAP `/auth/role` → shipped `role-selection`. Continue → `/home` wired. |
| `designs/pages/create-event/step-1-type.html` | `/events/create?step=1` | intentional-diverge | Four static HTML steps → one wizard route + `WizardContext` ([PORT-MAP.md](../../PORT-MAP.md) §7 naming delta; event-crud plan). Continue CTA wired. |
| `designs/pages/create-event/step-2-details.html` | `/events/create?step=2` | intentional-diverge | Same single-route wizard. Continue wired. |
| `designs/pages/create-event/step-3-celebrations.html` | `/events/create?step=3` | intentional-diverge | Same. Continue wired. |
| `designs/pages/create-event/step-4-review.html` | `/events/create?step=4` | intentional-diverge | Same. Create/submit → API + `router.push(/events/[id])` wired. |
| `designs/pages/create-event/success.html` | `/events/[id]/success` | match | Primary hub CTA `Link` wired. |
| `designs/pages/event-control/event-control.html` | `/events/[id]` | match | Hub tiles / tool links are real `Link`s (invitations, guests, planning, website, journey, settings). |
| `designs/pages/event-control/our-journey.html` | `/events/[id]/journey` | match | Route + chrome present. **Primary CTAs dead:** “Add sub-event” / “Add your first sub-event” are `<button>` with no `onClick` (empty-state only). Flag for W5 / founder — not auto-P0 here. |
| `designs/pages/event-settings/general.html` | `/events/[id]/settings` | intentional-diverge | No `/general` suffix (PORT-MAP had it). Save / delete wired via `GeneralSettingsForm`. |
| `designs/pages/event-settings/admins.html` | `/events/[id]/settings/admins` | match | Invite co-host primary CTA → `POST .../admins` wired. |
| `designs/pages/event-settings/guest-list.html` | `/events/[id]/settings/guests` | match | Guest-list settings surface present under settings tabs. |
| `designs/pages/event-settings/plan-billing.html` | `/events/[id]/settings/billing` (+ `/settings/usage`) | intentional-diverge | Billing tab maps; React also ships **Usage** (`/events/[id]/settings/usage`) with no design HTML twin. Upgrade button present but non-functional stub (limits deferred — [event-settings data-model design](../../superpowers/specs/2026-06-17-event-settings-data-model-design.md)). |
| `designs/pages/event-settings/registry.html` | `/events/[id]/settings/registry` | match | Route exists; form controls **disabled** (Registry deferred in event-settings spec). |
| `designs/pages/event-settings/website.html` | `/events/[id]/settings/website` | match | Save / offline / password toggles wired to website-settings API. |
| `designs/pages/guests/guests.html` | `/events/[id]/guests` | match | Add guest / Import CSV wired. **Send invites** intentionally `disabled` (“coming soon”) — CLAUDE.md / push-notifications design. |
| `designs/pages/invitations/invitations.html` | `/events/[id]/invitations` | match | Gallery → editor → Share UI present. Share opens `wa.me`. **“Saved” is cosmetic** — no persist API/localStorage (CLAUDE.md Digital Invitations gap). |
| `designs/pages/media/media.html` | `/events/[id]/media` | match | Upload / albums / delete pipelines wired (`MediaClient` + R2). |
| `designs/pages/planning/planning.html` | `/events/[id]/planning` | match | Checklist + budget; Add task / expense / budget CTAs hit planning APIs. |
| `designs/pages/settings/settings.html` | `/settings` | match | Profile Save → `/api/settings/profile`; notif toggles wired; 2FA UI disabled stub. |
| `designs/pages/website/overview.html` | `/events/[id]/website` | match | Publish / Share / Pages links wired (`SiteStatusCard`, `ShareSiteDialog`). |
| `designs/pages/website/design.html` | `/events/[id]/website/design` | match | Apply / palette / cover CTAs wired for **cinematic-scroll**; extra theme cards disabled “Soon”. |
| `designs/pages/website/photos.html` | `/events/[id]/website/photos` | match | Upload button exists; click → toast “coming soon” + Media link ([DP audit plan](../../superpowers/plans/2026-08-05-digital-presence-audit-plan.md) intentional). |
| `designs/pages/website/edit-page.html` | `/events/[id]/website/edit/[pageId]` | match | Per-page editors (Story, Q&A, Party, Travel, …) with Save/Add handlers. Path naming: PORT-MAP `/website/pages/[page]` → shipped `/website/edit/[pageId]`. |
| `designs/pages/website/edit-pages.html` | `/events/[id]/website/edit` | intentional-diverge | **Website Pages as separate route** — audit example. Design file is **retired** (meta-refresh → `overview.html`; [`_page.md`](../../../designs/pages/website/_page.md)). React keeps a dedicated **Pages** tab + `PagesListClient` (reorder/visibility APIs). Cite: [platform-truth-audit-design.md](../../superpowers/specs/2026-08-07-platform-truth-audit-design.md) §W4; [DP audit plan](../../superpowers/plans/2026-08-05-digital-presence-audit-plan.md) PagesListClient. React wins. |
| `designs/pages/website/card-templates.html` | — (see `/events/[id]/invitations`) | intentional-diverge | No `/website/cards` route. Explicitly **out of Digital Presence** — reuse invitations catalog / defer seed ([DP audit plan](../../superpowers/plans/2026-08-05-digital-presence-audit-plan.md) OUT OF SCOPE; [event-website gaps G12](../../data-model/event-website-gaps.md)). |
| `designs/pages/website/templates/index.html` | — (partially absorbed into Design tab) | Q&A | No `/website/templates` gallery route. Design assumes 5-theme gallery; React has one live template (`cinematic-scroll`) + disabled placeholders with different names. Founder product decision flagged ([DP audit plan](../../superpowers/plans/2026-08-05-digital-presence-audit-plan.md) §Template system; CLAUDE.md Digital Presence gap). |
| `designs/pages/website/templates/bold-festive.html` | — | Q&A | Same template-catalog decision; no `[template]` detail route. |
| `designs/pages/website/templates/classic-romance.html` | — | Q&A | Same. |
| `designs/pages/website/templates/garden-soft.html` | — | Q&A | Same. |
| `designs/pages/website/templates/midnight-elegant.html` | — | Q&A | Same (host gallery detail). |
| `designs/pages/website/templates/minimal-modern.html` | — | Q&A | Same. |
| `designs/pages/website/guest-site/sapphire/index.html` | `/e/[slug]` (+ preview `wedding-invitation-temp-1`) | intentional-diverge | Guest product surface ships **cinematic-scroll** / `WeddingTemplate1Client`, not a sapphire HTML port ([DP audit plan](../../superpowers/plans/2026-08-05-digital-presence-audit-plan.md)). |
| `designs/pages/website/guest-site/sapphire-mivon/index.html` | `/e/[slug]` | intentional-diverge | Design reference / workshop build; runtime guest site is cinematic-scroll. (Assets under `assets/` excluded from inventory.) |
| `designs/pages/website/guest-site/midnight-elegant/index.html` | — | Q&A | Guest-site entry for a design theme with no matching React template route (same catalog decision as host `templates/`). |
| `designs/pages/website/guest-site/sapphire-lab/index.html` | — | intentional-diverge | Lab / workshop only — not a host product route. |
| `designs/pages/website/guest-site/sapphire-lab/sapphire-sandbox.html` | — | intentional-diverge | Sandbox — not a product surface. |

### Excluded (noise)

| Path | Reason |
|------|--------|
| `designs/pages/website/guest-site/sapphire-mivon/assets/**/*.html` (5 files) | Vendor/font/css/map placeholders — not screens |

### React-only extras (no design HTML twin under `designs/pages`)

| React route | Note |
|-------------|------|
| `/home` | Host dashboard (design lives at `designs/index.html`, outside `pages/`) |
| `/` | Marketing landing (in progress) |
| `/events/[id]/settings/usage` | Usage meter sibling to billing |
| `/auth/accept-invite` | Collab invite accept |
| `/wedding-invitation-temp-1` | Template preview harness |
| `/website-theme-framer`, `/dev/r2-test` | Non-MVP / test |

---

## Primary CTA spot-check (mapped)

| Area | Primary CTA(s) | React | Spot-check result |
|------|----------------|-------|-------------------|
| Auth | Send OTP / Verify / Google | `/auth` | Wired |
| Role | Continue as Host | `/auth/role-selection` | Wired → `/home` |
| Create wizard | Continue / Create event | `/events/create` | Wired (API create) |
| Success | Go to event | `/events/[id]/success` | Wired `Link` |
| Hub | Tool tiles | `/events/[id]` | Wired `Link`s |
| Journey | Add sub-event | `/events/[id]/journey` | **Dead** (no handler) |
| Settings general | Save | `/events/[id]/settings` | Wired |
| Admins | Invite | `.../admins` | Wired |
| Billing | Upgrade | `.../billing` | Stub (no payment) |
| Registry | Save / toggles | `.../registry` | Disabled (deferred) |
| Website settings | Save | `.../settings/website` | Wired |
| Guests | Add / Import / Send | `.../guests` | Add+Import wired; Send disabled intentional |
| Invitations | Share / Saved | `.../invitations` | Share UI wired; Saved cosmetic |
| Media | Upload | `.../media` | Wired (R2 pipeline) |
| Planning | Add task / expense | `.../planning` | Wired to APIs |
| User settings | Save profile | `/settings` | Wired |
| Website overview | Publish / Share | `.../website` | Wired |
| Design | Apply template | `.../website/design` | Wired for cinematic-scroll |
| Photos (site) | Upload | `.../website/photos` | CTA → coming-soon toast |
| Pages list | Visibility / reorder | `.../website/edit` | Wired to website-pages API |
| Page editor | Save / Add item | `.../website/edit/[pageId]` | Wired (per editor) |
| Public guest | Unlock / RSVP sections | `/e/[slug]` | Password gate + lookup + template render present |

---

## Design Q&A queue (for findings ledger)

Copy candidates into `docs/testing/2026-08-07-platform-truth-audit-findings.md` → **Design Q&A**:

1. **Template catalog strategy** — Design’s 5-theme gallery (`templates/*` + guest-site variants) vs React’s single `cinematic-scroll` + differently named “Soon” placeholders. Keep cinematic-scroll? Port the 5? Hybrid?
2. **midnight-elegant guest-site** — Keep as future template, archive, or map to cinematic-scroll only?
3. **Our Journey Add CTAs** — Wire to existing sub-event APIs / create-wizard edit path, or collapse Journey into hub until editable? (Also a functional gap; severity for W6.)

---

## Intentional divergences (cited)

| Divergence | Cite |
|------------|------|
| Website Pages as separate React tab (`/website/edit`) while design `edit-pages.html` redirects to overview | Audit design §W4; design `_page.md` + `edit-pages.html` retired comment; DP audit plan PagesListClient |
| Wizard = one route `/events/create` | PORT-MAP §7; event-crud implementation plan |
| OTP folded into `/auth` | PORT-MAP §8.2 TBD; shipped `AuthPage` |
| Settings general at `/settings` not `/settings/general` | Shipped event-settings FE |
| Card templates not under Digital Presence | DP audit plan OUT OF SCOPE; G12 → Digital Invitations |
| Guest site ≠ sapphire HTML | DP audit plan template system; runtime `/e/[slug]` |
| Website Photos upload deferred | DP audit plan |
| Send invites inert | CLAUDE.md; push-notifications design |
| Registry / Billing upgrade stubs | Event-settings data-model deferred items |

---

## Deliverable path

`docs/testing/audit-2026-08-07/w4-design-react.md`
