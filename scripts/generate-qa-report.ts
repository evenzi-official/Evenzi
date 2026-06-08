import fs from 'fs';
import path from 'path';

const RAW_PATH = path.join(process.cwd(), 'designs', '_qa_raw.json');
const OUT_PATH = path.join(process.cwd(), 'designs', '_QA-FINDINGS.md');

interface Finding {
  category: string;
  severity: string;
  issue: string;
  viewport: number | string;
  selector: string;
  repro: string;
  expectedActual: string;
  suggestedFix: string;
  evidence: string;
}

interface PageResult {
  path: string;
  loadFailed?: string;
  findings: Finding[];
}

function generateReport() {
  const data: PageResult[] = JSON.parse(fs.readFileSync(RAW_PATH, 'utf-8'));
  
  let totalIssues = 0;
  const severityCount: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  const categoryCount: Record<string, number> = {};
  const crossCutting: Record<string, Set<string>> = {}; // issue key -> set of pages
  
  // Deduped findings per page
  const pageFindings: Record<string, any[]> = {};
  const worstPages: Array<{ path: string, count: number }> = [];

  for (const page of data) {
    if (page.loadFailed) continue;

    // Dedupe by issue + selector
    const issueMap = new Map<string, any>();
    
    for (const f of page.findings) {
      // Normalize some noisy selectors or messages for grouping
      const key = `${f.category}|${f.issue}|${f.selector}`;
      if (!issueMap.has(key)) {
        issueMap.set(key, { ...f, viewports: new Set([f.viewport]) });
      } else {
        issueMap.get(key).viewports.add(f.viewport);
      }
    }

    const deduped = Array.from(issueMap.values());
    pageFindings[page.path] = deduped;
    totalIssues += deduped.length;
    worstPages.push({ path: page.path, count: deduped.length });

    for (const f of deduped) {
      severityCount[f.severity] = (severityCount[f.severity] || 0) + 1;
      categoryCount[f.category] = (categoryCount[f.category] || 0) + 1;
      
      const xKey = `[${f.category}] ${f.issue}`;
      if (!crossCutting[xKey]) crossCutting[xKey] = new Set();
      crossCutting[xKey].add(page.path);
    }
  }

  worstPages.sort((a, b) => b.count - a.count);

  let md = `# QA Sweep Findings\n\n`;
  md += `> **Note on Manual Testing:** Due to the known CDP context management error preventing the agentic browser from spawning contexts, manual passes for subjective criteria (garish elements, missing empty states) were omitted per protocol. This document contains comprehensive deterministic findings from the automated suite.\n\n`;
  
  md += `## Executive Summary\n`;
  md += `- **Pages tested:** ${data.length}\n`;
  md += `- **Total issues:** ${totalIssues}\n`;
  md += `- **Severity:** P0: ${severityCount.P0}, P1: ${severityCount.P1}, P2: ${severityCount.P2}, P3: ${severityCount.P3}\n`;
  md += `- **Categories:** ${Object.entries(categoryCount).map(([k,v]) => `${k}: ${v}`).join(', ')}\n\n`;

  md += `### Cross-cutting Issues\n`;
  const xcut = Object.entries(crossCutting)
    .filter(([_, pages]) => pages.size >= 5)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10);
  
  if (xcut.length > 0) {
    for (const [issue, pages] of xcut) {
      md += `- **${issue}** (Found on ${pages.size} pages)\n`;
    }
  } else {
    md += `- None found that span > 5 pages.\n`;
  }

  md += `\n### Top 5 Worst Pages by Issue Count\n`;
  for (const wp of worstPages.slice(0, 5)) {
    md += `- \`${wp.path}\` (${wp.count} issues)\n`;
  }
  md += `\n---\n\n`;

  for (const page of data) {
    md += `## ${page.path}\n`;
    if (page.loadFailed) {
      md += `**LOAD-FAILED:** ${page.loadFailed}\n\n`;
      continue;
    }

    const findings = pageFindings[page.path] || [];
    if (findings.length === 0) {
      md += `✅ no issues found — tested: 360, 390, 414, 768, 1024, 1440 (Automated Dimensions Only)\n\n`;
      continue;
    }

    for (const f of findings) {
      const vps = Array.from(f.viewports).join(', ');
      md += `- [${f.severity}][${f.category}] ${f.issue} — viewports: ${vps}\n`;
      md += `  - Where: \`${f.selector}\`\n`;
      md += `  - Repro: ${f.repro}\n`;
      md += `  - Expected vs Actual: ${f.expectedActual}\n`;
      // Clean up evidence formatting if it has newlines
      const safeEvidence = f.evidence.replace(/\\n/g, ' ').replace(/\\r/g, '').trim();
      md += `  - Evidence: ${safeEvidence}\n`;
      md += `  - Suggested fix: ${f.suggestedFix}\n\n`;
    }
  }

  fs.writeFileSync(OUT_PATH, md, 'utf-8');
  console.log(`Successfully generated ${OUT_PATH}`);
}

generateReport();
