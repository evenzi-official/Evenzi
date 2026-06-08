import * as fs from 'fs';

const results = JSON.parse(fs.readFileSync('qa-results.json', 'utf8'));

let markdown = `# Full Design QA Findings

## Executive Summary

- **Pages tested**: ${results.pagesTested} out of 35
- **Total issues**: To be calculated
- **Agentic Visual & Interaction Pass**: [MANUAL/BLOCKED] The browser subagent encountered a persistent infrastructure error (\`Browser context management is not supported\` via CDP) and could not execute the subjective interaction passes. The findings below are generated via the automated deterministic suite (Axe-core, Layout computations, Console).

### Cross-cutting Issues (Highest Leverage)
- **[P1][responsive] Horizontal overflow on components catalog.** The components page exceeds viewport width at all breakpoints below 1440px.
- **[P1][a11y] Missing valid roles for aria-label.** Notification unread dots (\`.fn-notif-unread\`) use \`aria-label\` on \`<span>\` elements without a valid role.
- **[P0][a11y] Form inputs missing labels.** Specifically the OTP inputs in auth and custom pickers lack explicit labels or discernible text.
- **[P2][a11y] Multiple \`contentinfo\` and unlabelled landmarks.** The \`.mt-20\` footer sections across multiple pages cause landmark collision.

---

`;

let totalIssues = 0;

for (const [url, issues] of Object.entries(results.issues)) {
  const pagePath = new URL(url).pathname.replace('/', '');
  markdown += `## ${pagePath}\n\n`;

  if ((issues as any[]).length === 0) {
    markdown += `✅ no automated deterministic issues found — tested: 360px, 390px, 414px, 768px, 1024px, 1440px\n\n`;
    markdown += `*Note: Interaction, visual, and gap testing requires manual execution due to blocked browser automation.* \n\n`;
    continue;
  }

  const dedupedIssues = new Map();
  for (const issue of (issues as any[])) {
    const key = `${issue.severity}-${issue.category}-${issue.description}-${issue.details}`;
    if (!dedupedIssues.has(key)) {
      dedupedIssues.set(key, { ...issue, viewports: new Set(issue.viewports) });
    } else {
      for (const vp of issue.viewports) {
        dedupedIssues.get(key).viewports.add(vp);
      }
    }
  }

  for (const issue of dedupedIssues.values()) {
    totalIssues++;
    const vps = Array.from(issue.viewports).join(', ');
    
    // Extract selector and observation from details if formatted that way
    let where = "Page Level";
    let observation = issue.details;
    if (issue.details && issue.details.includes('Element:')) {
       const parts = issue.details.split('\nObserved:');
       where = parts[0].replace('Element: ', '').trim();
       if (parts[1]) {
         observation = parts[1].trim();
       }
    } else if (issue.details && issue.details.includes('scrollWidth=')) {
       where = "document.documentElement";
    }

    markdown += `- [${issue.severity}][${issue.category}] ${issue.description} — ${vps}\n`;
    markdown += `  - Where: \`${where}\`\n`;
    markdown += `  - Repro: Load page at specified viewport / run automated check.\n`;
    markdown += `  - Expected vs Actual: Element should pass ${issue.category} standard, but failed.\n`;
    markdown += `  - Evidence: ${observation}\n`;
    markdown += `  - Suggested fix: Update markup/CSS to resolve the finding (e.g. add valid role, adjust layout constraints).\n\n`;
  }
}

markdown = markdown.replace('To be calculated', totalIssues.toString());

fs.writeFileSync('designs/_QA-FINDINGS.md', markdown);
console.log('Report generated at designs/_QA-FINDINGS.md');
