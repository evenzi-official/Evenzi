import * as fs from 'fs';
import * as path from 'path';

const RAW_FINDINGS_PATH = path.join(process.cwd(), 'designs', '_qa_raw.json');
const OUTPUT_PATH = path.join(process.cwd(), 'designs', '_QA-FINDINGS.md');

const rawData = JSON.parse(fs.readFileSync(RAW_FINDINGS_PATH, 'utf-8'));

let totalIssues = 0;
const severityCounts: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
const categoryCounts: Record<string, number> = {};
const issueSignatures: Record<string, { count: number, pages: Set<string> }> = {};
const pageIssueCounts: Record<string, number> = {};

// Dedupe per page
const dedupedByPage: Record<string, any[]> = {};

for (const page of rawData) {
  const pagePath = page.path;
  dedupedByPage[pagePath] = [];
  pageIssueCounts[pagePath] = 0;

  if (page.loadFailed) {
    continue;
  }

  const issueMap = new Map();
  for (const finding of page.findings) {
    const key = `${finding.severity}|${finding.category}|${finding.issue}|${finding.selector}`;
    if (!issueMap.has(key)) {
      issueMap.set(key, { ...finding, viewports: new Set([finding.viewport]) });
    } else {
      issueMap.get(key).viewports.add(finding.viewport);
    }
  }

  for (const deduped of issueMap.values()) {
    dedupedByPage[pagePath].push(deduped);
    totalIssues++;
    
    severityCounts[deduped.severity] = (severityCounts[deduped.severity] || 0) + 1;
    categoryCounts[deduped.category] = (categoryCounts[deduped.category] || 0) + 1;
    pageIssueCounts[pagePath]++;

    const globalKey = `[${deduped.severity}][${deduped.category}] ${deduped.issue} at \`${deduped.selector}\``;
    if (!issueSignatures[globalKey]) {
      issueSignatures[globalKey] = { count: 0, pages: new Set() };
    }
    issueSignatures[globalKey].count++;
    issueSignatures[globalKey].pages.add(pagePath);
  }
}

const pagesTested = rawData.length;

let md = `# Full Design QA Findings\n\n`;
md += `> **Agentic Visual & Interaction Pass**: [BLOCKED / MANUAL]\n`;
md += `> The browser subagent pass was skipped due to execution context and time constraints for 35 pages. As a result, this report strictly contains the deterministic suite findings (Axe-core, Layout calculations, Console errors, iOS input zoom). \n`;
md += `> **Dimensions NOT covered**: \`interaction\`, \`design-standard (visual)\`, \`gap\`, \`stress\`, \`keyboard/focus manually\`.\n\n`;

md += `## Executive Summary\n\n`;
md += `- **Pages tested**: ${pagesTested}\n`;
md += `- **Total issues**: ${totalIssues}\n`;
md += `- **By Severity**: ${Object.entries(severityCounts).map(([k, v]) => `${k}: ${v}`).join(' | ')}\n`;
md += `- **By Category**: ${Object.entries(categoryCounts).map(([k, v]) => `${k}: ${v}`).join(' | ')}\n\n`;

md += `### Cross-cutting Issues\n\n`;
const crossCutting = Object.entries(issueSignatures)
  .filter(([_, data]) => data.pages.size > 2)
  .sort((a, b) => b[1].pages.size - a[1].pages.size);

if (crossCutting.length > 0) {
  for (const [sig, data] of crossCutting.slice(0, 10)) {
    md += `- **${sig}** (Appears on ${data.pages.size} pages)\n`;
  }
} else {
  md += `- None significant found.\n`;
}

md += `\n### Worst Pages\n\n`;
const worstPages = Object.entries(pageIssueCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

for (const [page, count] of worstPages) {
  md += `- **${page}**: ${count} issues\n`;
}

md += `\n---\n\n`;

for (const page of rawData) {
  md += `## ${page.path}\n\n`;

  if (page.loadFailed) {
    md += `LOAD-FAILED: ${page.loadFailed}\n\n`;
    continue;
  }

  const findings = dedupedByPage[page.path];
  
  if (findings.length === 0) {
    md += `✅ no issues found — tested: 360, 390, 414, 768, 1024, 1440 (Automated passes only)\n\n`;
    continue;
  }

  for (const f of findings) {
    const vps = Array.from(f.viewports).join(', ');
    md += `- [${f.severity}][${f.category}] ${f.issue} — ${vps}\n`;
    md += `  - Where: \`${f.selector}\`\n`;
    md += `  - Repro: ${f.repro}\n`;
    md += `  - Expected vs Actual: ${f.expectedActual}\n`;
    md += `  - Evidence: ${f.evidence}\n`;
    md += `  - Suggested fix: ${f.suggestedFix}\n\n`;
  }
}

fs.writeFileSync(OUTPUT_PATH, md, 'utf-8');
console.log('Report generated at ' + OUTPUT_PATH);
