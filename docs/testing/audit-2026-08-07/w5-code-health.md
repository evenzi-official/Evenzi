# W5 — Code health (dead UI · hardcoded truth · security patterns · UI primitives)

> Stage 1 platform truth audit · **AUDIT ONLY — no fixes** · 2026-08-07  
> Agents: `code_reviewer` + `security_expert` + `tech_lead`  
> Seed: `docs/ops/v0-readiness.html` (verified against code; **several cards are stale** — see §0)  
> Cross-ref: `docs/testing/audit-2026-08-07/w2-api.md` for full API/authz inventory

## Verdict

Core host APIs are mostly on `requireEventWrite` / `requireEventRead`. Residual **truth debt** is concentrated in: cosmetic persistence (invitations), no-op upgrade/playback CTAs, marketing plan limits that do not match `config.plans`, and write-only preference toggles. **Security residual** (also in W2): password-gate bypass on guest lookup, service-role public RSVP insert, and one event route with no app-layer authz.

---

## 0. Readiness seed — stale vs verified

| Readiness claim | Code truth (2026-08-07) |
|-----------------|-------------------------|
| Website password never sent / settings unenforced | **STALE.** `WebsiteContent.tsx:50–55` sends `website_password`; `/e/[slug]` gates via `is_website_password_verified` (`page.tsx:193–200`). |
| Contact support dead | **STALE.** `billing/page.tsx:142` is `mailto:evenzi.official@gmail.com`. |
| Collab Accept/Decline dead vertical | **MOSTLY STALE.** In-app accept/decline + bell live (readiness already marks “mostly fixed 08-07”). |
| Upgrade now no-op | **STILL TRUE** (`billing/page.tsx:126–129`). |
| Video Play no-op | **STILL TRUE** (`MediaClient.tsx:1716`; no `<video>` in MediaClient). |
| Invitations "Saved" cosmetic | **STILL TRUE** (`InvitationsClient.tsx:170–190`). |
| Guest-lookup password bypass | **STILL TRUE** (known follow-up). |
| Auth ToS/Privacy `href="#"` | **STILL TRUE** (`auth/page.tsx:238`). |

---

## 1. Dead / unreachable UI

### P0

_(none unique to UI — see §3 for security P0)_

### P1

| ID | Title | Evidence | Note |
|----|-------|----------|------|
| **W5-P1-1** | Invitations "Saved" autosave is cosmetic; nothing persists | `InvitationsClient.tsx:170`, `:188–190`, `:209` — `setAutosave('Saved')` on edit with **zero** `fetch` / `localStorage` / API. Page seeds only in-memory defaults (`invitations/page.tsx:21–29`). DB tables from `inv_01`–`06` unused by FE. | Matches readiness + CLAUDE.md gap. Hosts believe cards are saved. |
| **W5-P1-2** | Invitations Download button has no handler | `InvitationsClient.tsx:433–436` — `<button>` with no `onClick`. | Adjacent Share WhatsApp works (`:437`). |
| **W5-P1-3** | Billing "Upgrade now" is a no-op | `settings/billing/page.tsx:126–129` — primary button, no `onClick` / `href` / form. | No payment/Stripe/Razorpay infra in repo. Readiness critical card still accurate. |
| **W5-P1-4** | Media lightbox "Play video" has no handler and no player | `MediaClient.tsx:1716–1718` — play button without `onClick`; component renders `<img>` poster only (`:1710–1715`). Repo `<video>` only on design-test `wedding-invitation-temp-1`. | Upload path exists; playback does not. |
| **W5-P1-5** | Our Journey page CTAs are dead | `journey/page.tsx:42–46`, `:55–59` — "Add sub-event" / "Add your first sub-event" buttons, no handlers; page always shows empty state (does not query sub-events). | Orphan/stub surface vs real create-wizard sub-events. |

### P2

| ID | Title | Evidence | Note |
|----|-------|----------|------|
| **W5-P2-1** | Media "Notify me" storage CTA is dead | `MediaClient.tsx:993–996` — button, no `onClick`; copy says "More storage coming soon". | Honest stub; still a clickable no-op. |
| **W5-P2-2** | Auth Terms / Privacy links are `href="#"` | `auth/page.tsx:238`. | Legal surface missing. |
| **W5-P2-3** | Registry / 2FA / WhatsApp send / website gallery upload — intentional stubs | `settings/registry/RegistryContent.tsx` (disabled + "coming soon"); `settings/SecuritySection.tsx:47–55`; `GuestManagementClient.tsx:261`, `:410`; `website/photos/WebsitePhotosClient.tsx:16`. | Product-deferred; not false "Saved" lies. |
| **W5-P2-4** | Website design gallery shows fake "Soon" themes | `WebsiteDesignClient.tsx:70–86` — disabled placeholder cards; only `cinematic-scroll` selectable. | Matches CLAUDE.md template-gallery gap. |
| **W5-P2-5** | Freeform section editor "Saved locally" is localStorage-only | `SectionEditor.tsx:232–252` — persists to `localStorage` key `evz:sections:…`, not server. Label is honest (`:319`). | Typed editors (story/QA/travel) hit APIs; freeform path does not. |
| **W5-P2-6** | Landing-page package dead `#` links | `landing-page/app/page.tsx:27,59,340,382`; `scroll-morph-hero.tsx:219`. | Separate `landing-page/` tree — not the live `app/page.tsx` marketing WIP unless wired. |

**Not a finding:** `ImportCsvModal.tsx:149` uses `href="#"` but has a real `onClick` + `preventDefault` (template download).

---

## 2. Hardcoded vs dynamic / fake toggles / flags

### P1

| ID | Title | Evidence | Note |
|----|-------|----------|------|
| **W5-P1-6** | Plan perk copy invents limits; `config.plans` limit columns are null | UI: `billing/page.tsx:16–21` hardcodes "Up to 50 guests", "200 photo uploads", etc. Live DB (`config.plans`): `max_guests` / `max_photos` / `max_admins` / `max_events_per_user` are **all NULL** for free/premium/elite. App never reads those columns. | Marketing ≠ entitlements. Prices/flags (`custom_domain`, `ai_features`) do come from DB. |
| **W5-P1-7** | Storage meter is a hardcoded 5 GB, not plan-driven | `MediaClient.tsx:56` (`STORAGE_LIMIT_BYTES = 5 * 1024^3`, comment "entitlements are [PLANNED]"); duplicated `settings/usage/page.tsx:7`. | Conflicts with billing "200 photo uploads" narrative; no server enforcement of photo count from plan. |
| **W5-P1-8** | Invitations share RSVP URL is wrong host + uses event UUID not slug | `invitations/page.tsx:31` — `` `https://evenzi.com/e/${id}` ``. Canonical guest sites are `/e/[slug]`; prod is `evenzi.vercel.app`; `getAppBaseUrl()` in `lib/url.ts` unused here. | Shares broken deep links even if WhatsApp opens. |
| **W5-P1-9** | `default_guest_message` / `max_plus_ones_per_invite` / `rsvp_enabled` largely write-only on guest path | Settings save: `guest-settings/route.ts:9–14`, `GuestListContent.tsx:42–46`. Guest site `app/e/**` has **no** reads of these fields. `submit_rsvp` enforces `allow_plus_ones` + `collect_dietary_notes` but **not** `max_plus_ones_per_invite` or `rsvp_enabled`. Host UI uses `rsvp_enabled` for SiteStatusCard only (`website/page.tsx:84`, `SiteStatusCard.tsx:77`). | Hosts think toggles change guest behavior; only plus-one/dietary flags are partially enforced. |
| **W5-P1-10** | User email/SMS alert prefs save but nothing reads them | `NotificationsSection.tsx` + `user_preferences` via settings API. Grep: `email_alerts` / `sms_alerts` only appear in settings UI + types — **not** in `dispatch-push` or notify helpers. | Push works via subscriptions; email/SMS toggles are cosmetic until a consumer exists. |

### P2

| ID | Title | Evidence | Note |
|----|-------|----------|------|
| **W5-P2-7** | `search_indexing_enabled` saves; no robots/meta enforcement | Written in `WebsiteContent.tsx:52` / `website-settings/route.ts`; no `robots` / `noindex` usage under `app/e`. | Persist-only preference. |
| **W5-P2-8** | No feature-flag system | Grep for `FEATURE_` / `featureFlag` in `app/` → empty. | Behavior gated by stubs/"coming soon", not flags. |
| **W5-P2-9** | Middleware marks `/invite` public but no `app/invite` route | `lib/supabase/middleware.ts:66`; `Glob app/invite/**` → 0 files. | Dead public-path allowlist entry. |
| **W5-P2-10** | Home cover placeholders are hardcoded Unsplash URLs | `home/EventsGrid.tsx:28–36`. | Fine for empty covers; not dynamic media. |

---

## 3. Security (IDOR · public `e/**` · ownership · secrets)

> Full matrix: W2. Below: W5 confirmation + product-health framing. Severity aligned with W2 where overlapping.

### P0

| ID | Title | Evidence | Note |
|----|-------|----------|------|
| **W5-P0-1** (= W2-P0-1) | Guest lookup bypasses website password gate | `app/api/e/[slug]/lookup/route.ts` — POST → `resolve_guest_by_lookup` with **no** `evz_site_pw` check. UI page gates (`e/[slug]/page.tsx:193–200`) but API does not. | Informed attacker with guest phone+name obtains private guest session on password-protected sites. Documented deferred gap. |

### P1

| ID | Title | Evidence | Note |
|----|-------|----------|------|
| **W5-P1-11** (= W2-P1-1) | `PATCH …/sub-events/[subId]` missing app authz | `sub-events/[subId]/route.ts:7–45` — no `getUser`, no `requireEventWrite`. Live RLS: owner ALL + collab **SELECT-only**. | Strangers blocked by RLS; failures can surface as 500; **co-host cannot toggle `show_on_website`** despite `website` write cap (capability drift). |
| **W5-P1-12** (= W2-P1-2) | Public `POST /api/events/[id]/rsvp` uses service role | `rsvp/route.ts:19–24`, `:59–95` — unauthenticated insert into any non-deleted event UUID. Only FE caller: `wedding-invitation-temp-1`. | Guest-list pollution / spam IDOR. Canonical RSVP is `e/[slug]/rsvp`. |
| **W5-P1-13** (= W2-P1-3) | Media batch URL signing requires **write**; single URL requires **read** | `media/urls/route.ts:23` (`requireEventWrite`); `media/[mediaId]/url/route.ts:23` (`requireEventRead`). MediaClient batches via `/urls` (`MediaClient.tsx:290`). | Viewers (read-only media) break on primary URL path. |
| **W5-P1-14** (= W2-P1-5) | Rate-limit IP taken from client-controlled `x-forwarded-for` | `lookup/route.ts:33–39`; `verify-password/route.ts:31–38`. | Spoofable bucket key if edge does not overwrite header. |

### P2 / positive

| ID | Title | Evidence | Note |
|----|-------|----------|------|
| **W5-P2-11** | Dev R2 routes unauthenticated outside production | `api/dev/r2/upload-url/route.ts:17–20`; `sign/route.ts:8–10`. | 404 when `NODE_ENV === 'production'`. Preview misconfig risk. |
| **W5-P2-12** | Middleware treats all `/api/*` as public | `middleware.ts:64` — auth must be per-route. | By design; amplifies any missing `getUser` (see sub-events). |
| — | Secrets in client | Only `NEXT_PUBLIC_*` (Supabase anon, VAPID public). `SUPABASE_SERVICE_ROLE_KEY` / `VAPID_PRIVATE_KEY` / Resend / ClickUp stay server-side. `dangerouslySetInnerHTML` in `app/layout.tsx:55` is static theme boot script (safe). | No secret leak found in client bundles from this pass. |
| — | Most `app/api/events/[id]/**` mutators | Use `requireEventWrite` + capability (guests/planning/media/website/admins/general/delete). | Good baseline; see W2 inventory. |

---

## 4. Duplicate UI primitives (high level)

Catalog rule (CLAUDE.md / `designs/components.html` B9): **view-switchers → `.seg`**; floating nav → `.nav-tabs`; do not fork.

| Finding | Severity | Evidence | Note |
|---------|----------|----------|------|
| **W5-P2-13** | `.ep-view-toggle` forks segmented control | `SectionEditor.tsx:294–305`; styles in `designs/pages/website/edit-page.css` ("device-toggle idiom"). Same job as `.seg.seg--fill` / `.seg--sm` (catalog B9/B12). | Page-local fork; React already uses `.seg` on media/settings/website sub-nav. |
| **W5-P2-14** | Design CSS still references legacy `wb-tabs` / `.pill-tabs` alias | `designs/pages/website/website.css:7,42`; shell notes legacy `wb-tabs-wrap` (`shell.css:4012`). Live React website nav uses `.seg` (`website/page.tsx:205`). | Design debt / naming drift; React side largely unified. |
| — | Positive | Media, settings, website section nav use `.seg` | Reuse-before-create honored on primary app surfaces. |

No live React reintroduction of the old `.nav-tabs` vs `.pill-tab` double control was found in `app/` (shell comment documents the historical defect).

---

## 5. P0 / P1 summary (W5 + carried security)

### P0

1. **W5-P0-1** — Guest lookup API bypasses website password gate (`api/e/[slug]/lookup`).

### P1

| ID | One-liner |
|----|-----------|
| W5-P1-1 | Invitations "Saved" cosmetic — no persistence |
| W5-P1-2 | Invitations Download no-op |
| W5-P1-3 | Billing Upgrade now no-op |
| W5-P1-4 | Media Play video no-op (no `<video>`) |
| W5-P1-5 | Journey page Add sub-event CTAs dead |
| W5-P1-6 | Plan perk strings hardcoded; DB limit cols null / unread |
| W5-P1-7 | Storage limit hardcoded 5 GB |
| W5-P1-8 | Invitations RSVP URL wrong (`evenzi.com` + UUID) |
| W5-P1-9 | Guest settings toggles partially unenforced / unread |
| W5-P1-10 | email_alerts / sms_alerts save-only |
| W5-P1-11 | sub-events PATCH no app authz + collab write drift |
| W5-P1-12 | Public events/[id]/rsvp service-role insert |
| W5-P1-13 | media/urls write bar vs url read bar |
| W5-P1-14 | x-forwarded-for trusted for rate-limit IP |

### Suggested Stage 2 batching (judgment only)

1. **Security batch:** P0-1 lookup+password, P1-12 retire/lock temp RSVP route, P1-11 add `requireEventWrite('website')` + RLS collab write, P1-13 unify media URL authz, P1-14 edge IP.  
2. **Truth batch:** P1-1/2/8 invitations persistence or strip fake Saved/Download/fix URL; P1-3 disabled Upgrade or "coming soon"; P1-4 video player or hide Videos tab playback.  
3. **Entitlements batch:** P1-6/7 wire or blank marketing limits; stop inventing 50/200/5 GB until `config.plans` populated.  
4. **Prefs batch:** P1-9/10 either enforce or disable toggles that nothing reads.

---

## Artifact

**Path:** `docs/testing/audit-2026-08-07/w5-code-health.md`
