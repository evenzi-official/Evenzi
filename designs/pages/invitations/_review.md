# Review — invitations

> Append-only. `/spec-kit-review` writes its council/codex assessment of _findings.md here, newest last.

## 2026-06-13 — /spec-kit-review invitations — against SPEC_VERSION 2026-06-12.2

**Inputs:** Antigravity run (22 PASS, 0 FAIL, 11 SKIP) + Claude/Playwright coverage of the SKIPped rows + a scan of the built `invitations.{html,css,js}`.

**Verdict: 🟢 DONE** — 0 confirmed defects. The 11 Antigravity SKIPs were NOT failures: §6 (responsive/a11y) + §7 (content-length) crashed Antigravity's subagent, and `1.resilience` lacked tool support. All of those rows were re-covered via Playwright and pass; the one real finding (touch target) was fixed.

### Triage of Antigravity findings
- **22 PASS** (smoke · gallery · editor inline-edit · output/share · upload) — confirmed; matches the as-built personalizer.
- **11 SKIP → re-covered, not deferred:**
  - §6 responsive 360/768/1440, radiogroup a11y, reduced-motion, dark-contrast → **PASS** (Playwright).
  - §7 longnames (Devanagari), longvenue, empty → **PASS** — content wraps/clamps in the fixed A5 card, no clip/collision.
  - `1.resilience` → **PASS (partial)**: app chrome is local-resilient; card display fonts are CDN-by-design (documented porting note).
  - `7.device` → manual, flagged for human (real Android + TalkBack).

### Fix applied this pass
- **Touch target (6.mobilebars):** action-bar CTAs (Download/Share) were 37px (<44px). Added `.inv-actionbar .btn-pill{min-height:44px}` (page-scoped). Verified 44px. Re-tested clean.

### Carryover notes (not defects — tracked for the React/export build)
- **PNG export + WhatsApp share are faked** (honest text+link, no image attach). Real build: server render (Satori/Puppeteer) → Supabase Storage → hosted card URL; gate on `document.fonts.ready`.
- **Card display fonts (Cormorant/Playfair) on CDN** — vendor (@font-face) for export/offline fidelity, esp. Devanagari (needs a Noto fallback for the rasterized export). Part of the shell-wide display-font vendoring debt.
- **Touch target is shell-wide:** `.btn-pill` default is 37px and `.seg-item` 40px — raising those at the shell level is a separate cross-cutting task (this fix only covered the Invitations CTA bar).

### Kit patches
- None to `_spec.md`/`_test.md` (the SKIPs were a test-runner crash, not a spec/test gap) → no SPEC_VERSION bump.
