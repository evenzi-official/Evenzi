#!/usr/bin/env node
/**
 * design-check — lightweight consistency guardrail for the designs/ prototypes.
 *
 * Closes the "nav/chrome drift" concern (council TL2) without a risky 18-file
 * nav rewrite: instead of deduping the duplicated chrome, we *detect* drift so
 * it can't silently recur. Run as the design-path session-close step:
 *
 *     npm run design-check        (exit 1 if any issue found)
 *
 * Checks (high-signal, low-noise):
 *   1. Demo-persona drift   — only the canonical couple may appear.
 *   2. Dead internal links  — every local href/src must resolve to a real file.
 *   3. Leaked real PII       — no real personal emails in mock content.
 *   4. Inline literal styles — no style="background:#hex" (use the --sw / token convention).
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESIGNS = join(ROOT, 'designs');

/** Canonical demo persona — update here if the demo couple ever changes. */
const CANONICAL = { display: 'Vidya & Anshuman', slug: 'vidya-anshuman' };

/** Forbidden tokens that indicate stale/duplicated demo content has drifted back in.
 *  "Vibrant Union" is matched case-SENSITIVE (title/caps only) so the legit poetic
 *  copy "your vibrant union" (= your marriage) in create-event.js isn't flagged. */
const FORBIDDEN_PERSONAS = [
  /Anya\s*&(?:amp;)?\s*Kabir/i,
  /\bVibrant Union\b/,
  /\bVIBRANT UNION\b/,
  /\bvibrantunion\b/i,
  /\banya-kabir\b/,
  /\bvibrant-union\b/,
];

/** Real-PII patterns that must never appear in mock content (use @example.com).
 *  Matches any consumer free-mail address generically, rather than listing the
 *  specific addresses that have leaked before — naming them here would keep the
 *  very address we are trying to remove greppable in the repo, and a generic
 *  rule also catches the next one. */
const PII_PATTERNS = [
  /\b[a-z0-9._%+-]+@(?:gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|aol|icloud|me|proton|protonmail|pm|zoho|rediffmail)\.[a-z.]{2,}\b/i,
];

/** Addresses that are intentional product identities, not leaked personal PII. */
const PII_ALLOWLIST = [
  /evenzi\.official@gmail\.com/i,
];

/** Vendored third-party trees. We do not own the code in these, so persona,
 *  PII and style conventions do not apply — an upstream library's author
 *  attribution in a header comment is not a leak of our users' data. */
const VENDOR_DIRS = new Set(['assets', 'vendor', 'node_modules']);

const issues = [];

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (VENDOR_DIRS.has(name)) continue;
      walk(p, exts, out);
    } else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

const htmlFiles = walk(DESIGNS, ['.html']);
const textFiles = walk(DESIGNS, ['.html', '.css', '.js']);

// ── 1. Demo-persona drift + 3. PII + 4. inline literal hex ──────────────────
for (const f of textFiles) {
  const rel = relative(ROOT, f);
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const ln = i + 1;
    for (const re of FORBIDDEN_PERSONAS) {
      if (re.test(line)) issues.push(`[persona-drift] ${rel}:${ln} — matches ${re} (canonical is "${CANONICAL.display}" / ${CANONICAL.slug})`);
    }
    if (!PII_ALLOWLIST.some((re) => re.test(line))) {
      for (const re of PII_PATTERNS) {
        if (re.test(line)) issues.push(`[pii] ${rel}:${ln} — real-looking PII; use @example.com demo identities`);
      }
    }
    if (/style="background:#[0-9A-Fa-f]/.test(line)) {
      issues.push(`[inline-hex] ${rel}:${ln} — literal inline background hex; use the --sw binding or a token`);
    }
  });
}

// ── 2. Dead internal links (href/src) ───────────────────────────────────────
const attrRe = /(?:href|src)="([^"#?][^"]*?)"/g;
for (const f of htmlFiles) {
  const rel = relative(ROOT, f);
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(attrRe)) {
    const target = m[1].split('#')[0].split('?')[0];
    if (!target) continue;
    if (/^(https?:|mailto:|tel:|data:)/i.test(target)) continue;   // external
    const base = target.startsWith('/') ? join(DESIGNS, target) : resolve(dirname(f), target);
    if (!existsSync(base)) {
      issues.push(`[dead-link] ${rel} → "${m[1]}" does not resolve to a file`);
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
if (issues.length === 0) {
  console.log('✓ design-check: no drift found (persona, links, PII, inline-hex all clean)');
  process.exit(0);
}
console.error(`✗ design-check: ${issues.length} issue(s) found:\n`);
for (const it of issues) console.error('  ' + it);
console.error('\nFix these (or update CANONICAL in scripts/design-check.mjs if the demo persona changed).');
process.exit(1);
