# Brief for Claude — Update V0 Readiness Artifact

| | |
|---|---|
| **Date** | 2026-08-07 |
| **Author** | Abhijith (via Cursor platform-truth session) |
| **Target file** | [`docs/ops/v0-readiness.html`](./v0-readiness.html) |
| **Also update if present** | Claude.ai “V0 Readiness” artifact — mirror the same content (HTML structure / sections). Prefer editing the **repo file** as source of truth; republish artifact from that. |
| **Primary sources** | [`docs/testing/2026-08-07-platform-truth-audit-findings.md`](../testing/2026-08-07-platform-truth-audit-findings.md) · [`docs/testing/audit-2026-08-07/prod-risk.md`](../testing/audit-2026-08-07/prod-risk.md) · [`docs/testing/audit-2026-08-07/w4-design-react.md`](../testing/audit-2026-08-07/w4-design-react.md) |
| **Code branch** | `feature/platform-truth-audit` (worktree `.worktrees/platform-truth-audit`) — many fixes **uncommitted / not yet on `Dev-Vibe-Testing` deploy**. Be honest about “fixed in branch / live SQL” vs “on evenzi.vercel.app”. |

---

## Goal

Refresh the V0 Readiness HTML so it reflects **platform truth audit Stage 1 + Stage 2 (Batches A–D) + W3 E2E + prod-risk + locked Design Q&A**, without inventing new product scope.

**Do:**

- Mark fixed criticals as `crit-card resolved`
- Correct stale findings inside feature accordions (video play, collab admins copy, invitations honesty, journey, push webhook, billing CTA direction)
- Stamp masthead + audit-stats timeline
- Add a short **“Platform truth 2026-08-07”** note block
- Recalculate overview deep-audit counts **only where you change finding tags** (wired / partial / stub / info) — keep math consistent with the JS `FEATURE_BARS` array at the bottom of the file
- Preserve existing visual system (CSS classes, clay cards, accordion pattern) — **no redesign**

**Do not:**

- Rebuild the whole page from scratch
- Mark Admin Module or Support Chatbot as started
- Claim invitations are persisted (they are still draft-only; honesty UI only)
- Claim 5 website themes are live (only `cinematic-scroll` is live)
- Treat `evenzii.com` / www as the app (marketing only)
- Soften security language on items that are still open
- Invent payment / WhatsApp send / favicon as done

---

## Locked product decisions (founder 2026-08-07)

Record these in the artifact (new subsection under Overview or a “Decisions” strip is fine — keep terse):

| ID | Decision | Artifact implication |
|----|----------|----------------------|
| **Q1** | Website **theme** catalog = **Hybrid**: 1 live (`cinematic-scroll`) + honest “more themes coming soon” | Digital Presence: template gallery mismatch is **intentional**, not a launch blocker. Do **not** confuse with Media & Memories (fully wired). |
| **Q2** | Sapphire / midnight-elegant HTML = **design refs only** | Guest-site design HTML is workshop, not product. |
| **Q3** | Journey = **read-only timeline** for V0 | Journey card: listing real sub-events + hub CTAs is enough; in-place edit is out of V0. |
| **Q4** | Invitations **persist = next build** (planning ongoing) | Keep Invitations as Partial / honesty “Draft only — not saved”. Track as upcoming feature, not critical broken. |
| **Q5** | Billing Upgrade CTA = **Hide** until payment gateway planned | Critical “Upgrade does nothing” → resolve / downgrade: **hide button** (product decision). Still no payments. |

**Clarify in Digital Presence / Media cards if needed:**

- **Media & Memories** = photo/video storage, upload, albums, R2 — **DONE / wired**
- **Website Design theme tiles** = which guest-site *look* — only one live; others “Soon”
- **Website → Photos tab** = still “use Media for now” for *which* photos appear on the guest site (bridge stub) — different from Media storage

---

## Domain / deploy truth (do not mislabel)

| Host | Role |
|------|------|
| `evenzi.vercel.app` | **App Dev/UAT** (Vercel project `evenzi`, production alias tracks `Dev-Vibe-Testing`) |
| `evenzii.com` / `www.evenzii.com` | **Marketing / coming-soon** (separate project `evenzi-coming-soon`) |
| `app.evenzii.com` | **Future app production** — not connected yet |

Missing `/sw.js` on marketing host is **expected**, not an app bug.

GitHub `main` lagging Dev-Vibe is **git hygiene**, not “prod is on old code” for the UAT app host.

---

## Critical findings section — required edits

### Mark resolved (add/update `crit-card resolved`)

1. **Video playback** (was open critical)  
   - **Fixed** on platform-truth branch: lightbox uses `<video>` + Play.  
   - Note: verify deploy status — if not yet on `evenzi.vercel.app`, say “fixed in `feature/platform-truth-audit`; merge/deploy pending.”

2. **Collab invite Accept/Decline** — already resolved; refresh remaining text:  
   - E2E (host + 4 roles Accept UI + Decline + forbidden writes) **PASS**  
   - Headed Chrome deep click **PASS**  
   - Drop stale “Admins tab = invite only inserts DB row / no accept” language elsewhere

3. **New resolved — Platform truth P0 security (2026-08-07)**  
   - Anon `get_pending_invite` revoked (PII)  
   - Guest lookup API now respects website password gate  
   - Anon `hash_website_password` revoked  
   - Open `/api/events/[id]/rsvp` retired → 410  
   - Cite migrations: `security_batch_a_01_revoke_anon_pii_rpcs`, `security_batch_bcd_01_sub_events_rsvp_enforce`

4. **New resolved — Push webhook HMAC (PR-1)**  
   - Root cause: trigger sent raw secret as signature; route expected body HMAC → all 401  
   - Live fix: `public.dispatch_notification_push()` HMAC-signs body  
   - Verified: `net._http_response` **200** + `push_dispatch_log` row  
   - Route also accepts shared-secret header (compat) — code on audit branch

5. **Billing “Upgrade now”** (Q5)  
   - Change from open critical “does nothing” → **resolved / product decision**: hide Upgrade until payments planned.  
   - Honesty pass already disabled “Coming soon” + stopped inventing guest/photo caps on branch; **final UX = hide** per Q5.  
   - If hide not coded yet: card = “Decision locked — implement hide; interim honesty ‘Coming soon’ on branch.”

### Keep open or reframe (not critical launch security)

- Payment gateway itself — **out of V0**; backlog under Event Settings  
- Favicon / Apple home-screen icons — **ENH-icons**, parked  
- Resend keys — deferred by policy  
- Website Photos ↔ Media bridge — stub, not P0  
- Invitations persist — next build (Q4), not critical broken UI (honesty already shipped)

---

## Feature accordion — required content updates

Update takeaways, tags (`f-wired` / `f-partial` / `f-stub` / `f-info`), and counts. Prefer **add an Updated 2026-08-07 line** rather than deleting useful history.

### Host Dashboard (`acc-host-dashboard`)
- Collaborations already wired — keep.  
- Mention full UI click-through + Chrome deep-click PASS for collab Accept/Decline.

### Event Settings (`acc-event-settings`)
- **Admins tab:** rewrite — invite/accept/decline + permissions **live** (not the old “DB row only” stub). Optional: note no `GET /admins` JSON list (P1-12 parked enhancement; SSR page works).  
- **Billing:** Upgrade → hide (Q5); plan display still real. Contact support may still be dead — keep as partial/stub if still true.  
- Settings cleanup (Usage/Portal/permissions) already merged earlier — don’t regress.

### Media & Memories (`acc-media`)
- Change takeaway: video playback **fixed** (not “doesn’t exist”).  
- Keep upload/delete/album solid.  
- Storage meter: temporary **5 GB soft limit** copy clarified (plan entitlements not live).  
- Media batch `/urls` uses **read** authz (viewers work).

### Digital Presence (`acc-digital-presence`)
- Template catalog: **1 live** + honest Soon (Q1 C) — mark as **Info / intentional**, not stub bug.  
- Sapphire HTML: design refs only (Q2).  
- Website Photos upload: still “use Media” — keep as partial/stub.  
- Password gate + lookup gate: both fixed (lookup was P0-2).  
- Sub-events `show_on_website` PATCH: session + website write authz + RLS (P1-5).

### Digital Invitations (`acc-invitations`)
- “Saved” was cosmetic → honesty **“Draft only — not saved”**; Download disabled soon (Batch C).  
- Share URL fixed (`getAppBaseUrl()` + slug).  
- Persist = **next build** (Q4) — Partial, planning ongoing.  
- WhatsApp send still Guest Mgmt inert — unchanged.

### Push Notifications (`acc-push`)
- Update webhook finding: HMAC path **fixed live** (was “confirm header mode”).  
- Optional: founder OS toast confirm still nice-to-have.  
- `/sw.js` PASS on `evenzi.vercel.app`.  
- In-app bell + collab notify: PASS.

### Event Management Hub / Journey (if Journey is under hub or separate)
- Journey lists **real sub-events**; CTAs to hub (no dead buttons).  
- Product depth = read-only for V0 (Q3).

### Guest Management
- `submit_rsvp` enforces `rsvp_enabled` + `max_plus_ones_per_invite` (P1-7).  
- Send invites still intentionally inert.

### Auth
- ToS/Privacy `href="#"` remains P2 partial.

### Admin Module / Support Chatbot
- Still **not started**.

### Landing Section
- Leave as-is unless you have newer truth; marketing site is separate from app UAT.

---

## Masthead + timeline stamps

**Masthead meta** (example — merge into existing line):

`audited 2026-08-03 · DP 08-05 · push 08-06 · collab invite 08-07 · platform truth Stage1+2 + prod-risk PR-1 fix 2026-08-07`

Add under `audit-stats`:

```
2026-08-07: Platform truth audit (W0–W6) + Stage 2 Batches A–D + W3 full UI + Chrome deep click PASS + prod-risk PR-1 HMAC webhook fixed live. Design Q&A Q1–Q5 locked. Branch feature/platform-truth-audit (commit/merge pending).
```

---

## Overview counts

Current overview claims (as of file before this update):

- MVP matrix cells: Done **41** / Partial **3** / Not started **7** (51 total)  
- Deep-audit: Wired **75** / Partial **16** / Stub **18** / Info **8** (117 checks)

**After edits:**

1. Recount finding tags you changed in each accordion.  
2. Update `#totWired`, `#totPartial`, `#totStub`, and the informational count.  
3. Update the `FEATURE_BARS` JS array at the bottom so the chart matches accordion tags.  
4. MVP matrix pills (Data/Backend/Frontend ✓/~): only change if a feature’s layer status truly changed (e.g. Invitations FE still partial until persist; Media FE can go ✓ if video was the last FE gap).

If unsure on exact totals, prefer **accurate relative updates** on changed features + a note “deep-audit totals refreshed 2026-08-07 after platform truth” over inventing precise numbers.

---

## Launch backlog / next section (if present)

Refresh bullets to match:

**Done / fixed recently**

- Collab invite Accept/Decline + E2E  
- Platform truth P0/P1 security + honesty batch  
- Push webhook HMAC live  
- Video lightbox play  
- Vitest harness green (201) on audit branch  

**Next / in planning**

- Commit + merge `feature/platform-truth-audit` → `Dev-Vibe` → Testing deploy  
- Digital Invitations **persist** (Q4)  
- Hide Billing Upgrade (Q5) if not already  
- Favicon + Apple/Android home-screen icons (ENH-icons)  
- Optional: Website Photos ↔ Media bridge  
- Optional: logged-in R2 smoke on `evenzi.vercel.app` (PR-3)  
- Payment gateway planning (post-V0 or gated)  
- `app.evenzii.com` cutover when UAT done  
- Fixture cleanup (`e2e-truth-audit`) when founder says  

**Out of V0 / not started**

- Admin Module  
- Support Chatbot  
- Vendor role  
- Resend keys (deferred)  
- Full 5-theme website catalog (Q1 C — later)  

---

## Suggested Critical grid after update (order)

1. Resolved — website-settings IDOR (existing)  
2. Resolved — rate-limit / lookup (existing + note lookup password gate)  
3. Resolved — collab Accept/Decline + E2E  
4. Resolved — platform truth P0 invite PII + open RSVP + hash revoke  
5. Resolved — video playback  
6. Resolved — push webhook HMAC  
7. Resolved / decision — billing Upgrade **hide** (Q5)  

No open “core feature broken” criticals remaining from the Aug 3 list, unless you find something still true in code that this brief missed.

---

## Acceptance checklist for Claude

- [ ] Masthead date line includes platform truth 2026-08-07  
- [ ] Critical: video, push HMAC, P0 security, collab E2E marked resolved  
- [ ] Critical: billing reframed per Q5 (hide), not “broken CTA” as launch blocker  
- [ ] Media card no longer says video doesn’t exist  
- [ ] Event Settings Admins copy no longer says “invite inserts row only / no accept”  
- [ ] Invitations reflect honesty + persist = next build  
- [ ] Digital Presence themes = 1 live + Soon (Q1); sapphire = refs (Q2)  
- [ ] Journey = read-only V0 (Q3)  
- [ ] Domains note: UAT = vercel.app; marketing = evenzii.com; future app = app.evenzii.com  
- [ ] Push webhook partial finding updated to fixed  
- [ ] FEATURE_BARS / totals updated to match tags  
- [ ] No claim that audit branch is fully on production unless merge/deploy confirmed  
- [ ] Visual/CSS system unchanged  

---

## Paste prompt (optional — give Claude this)

```
Update docs/ops/v0-readiness.html using the brief at
docs/ops/2026-08-07-v0-readiness-update-brief.md.

Follow the brief exactly: refresh Critical findings, feature accordion
takeaways/tags, masthead/timeline, domain notes, and locked Design Q&A
Q1–Q5. Preserve layout/CSS. Do not invent scope. Be honest about
feature/platform-truth-audit vs what’s already on evenzi.vercel.app.
When done, summarize what changed section-by-section.
```

---

## Related paths Claude may open

- Findings ledger: `docs/testing/2026-08-07-platform-truth-audit-findings.md`  
- Prod-risk: `docs/testing/audit-2026-08-07/prod-risk.md`  
- Wave reports: `docs/testing/audit-2026-08-07/w1`–`w5`, `w3-*.md`  
- CLAUDE.md MVP table (keep in sync only if you normally do; this brief’s primary target is the HTML artifact)
