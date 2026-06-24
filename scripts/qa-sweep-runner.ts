import { chromium, Page } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 }
];

const TARGET_PORT = 4000;
const BASE_URL = `http://localhost:${TARGET_PORT}`;
const RAW_FINDINGS_PATH = path.join(process.cwd(), 'designs', '_qa_raw.json');

// Find all HTML pages recursively
function getHtmlFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

interface Finding {
  category: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
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

async function checkLoadSanity(page: Page): Promise<string | null> {
  const bodyDataPage = await page.$('body[data-page]');
  if (!bodyDataPage) return "Missing <body data-page='...'>";

  const isPre = await page.$('main, header, nav');
  const topLevelPre = await page.$eval('body > pre', () => true).catch(() => false);
  if (!isPre && topLevelPre) return "Rendered a directory listing instead of actual page";

  const title = await page.title();
  if (!title || title.includes("Index of")) return "Missing or invalid <title>";

  return null;
}

async function runPageTests(pagePath: string, browserContext: any): Promise<PageResult> {
  const relativePath = path.relative(path.join(process.cwd(), 'designs'), pagePath);
  const url = `${BASE_URL}/${relativePath}`;
  
  console.log(`\nTesting ${relativePath}...`);
  const pageResult: PageResult = { path: relativePath, findings: [] };
  
  const page = await browserContext.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (msg: import('@playwright/test').ConsoleMessage) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico') && !msg.text().includes('apple-touch-icon.png')) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (error: Error) => {
    consoleErrors.push(error.message);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e: any) {
    pageResult.loadFailed = `Failed to navigate: ${e.message}`;
    await page.close();
    return pageResult;
  }

  const sanityError = await checkLoadSanity(page);
  if (sanityError) {
    pageResult.loadFailed = sanityError;
    await page.close();
    return pageResult;
  }

  if (consoleErrors.length > 0) {
    pageResult.findings.push({
      category: 'console', severity: 'P1', issue: 'Console errors on load', viewport: 'all',
      selector: 'document', repro: 'Load page', expectedActual: `Expected 0 errors, got: ${consoleErrors[0]}`,
      suggestedFix: 'Fix javascript error', evidence: `Console: ${consoleErrors[0]}`
    });
  }

  for (const vp of VIEWPORTS) {
    await page.setViewportSize(vp);
    // Let resize settle
    await page.waitForTimeout(500);

    // 1. Responsive: Horizontal scroll check
    const scrollIssue = await page.evaluate(() => {
      if (document.documentElement.scrollWidth > window.innerWidth) {
        return `scrollWidth=${document.documentElement.scrollWidth} vs innerWidth=${window.innerWidth}`;
      }
      return null;
    });
    if (scrollIssue && relativePath !== 'components.html') {
      pageResult.findings.push({
        category: 'responsive', severity: 'P1', issue: 'Horizontal scrolling', viewport: vp.width,
        selector: 'document.documentElement', repro: 'Load page and check scrollWidth',
        expectedActual: `No horizontal scroll, actual: ${scrollIssue}`, suggestedFix: 'Ensure all containers have max-w-full and overflow-hidden if necessary',
        evidence: scrollIssue
      });
    }

    // 2. Mobile input zoom
    if (vp.width < 768) {
      const smallInputs = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        const small = inputs.filter(i => {
          const style = window.getComputedStyle(i);
          const size = parseFloat(style.fontSize);
          return size < 16;
        });
        return small.map(i => i.tagName.toLowerCase() + (i.className ? '.' + i.className.replace(/ /g, '.') : '')).slice(0, 3);
      });
      if (smallInputs.length > 0) {
        pageResult.findings.push({
          category: 'design-standard', severity: 'P1', issue: 'iOS input-zoom risk (<16px)', viewport: vp.width,
          selector: smallInputs[0], repro: 'Focus input on iOS device',
          expectedActual: `Font size >= 16px, got <16px`, suggestedFix: 'Add @media (max-width: 767px) { font-size: 16px; }',
          evidence: `Found small inputs: ${smallInputs.join(', ')}`
        });
      }
    }

    // 3. Axe a11y run
    try {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      for (const v of results.violations) {
        // Evaluate if it's inside aria-hidden via evaluate to be absolutely sure
        for (const node of v.nodes) {
          const targetSelector = node.target[0];
          const isHidden = await page.evaluate((sel: string) => {
            const el = document.querySelector(sel);
            if (!el) return true; // Can't find, ignore
            let curr: HTMLElement | null = el as HTMLElement;
            while (curr) {
              if (curr.getAttribute('aria-hidden') === 'true') return true;
              curr = curr.parentElement;
            }
            // Check for actual role exposure 
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return true;
            return false;
          }, targetSelector).catch(() => true);

          if (!isHidden) {
            pageResult.findings.push({
              category: 'a11y', severity: 'P1', issue: v.id, viewport: vp.width,
              selector: String(targetSelector), repro: 'Run axe check',
              expectedActual: v.help, suggestedFix: v.helpUrl,
              evidence: node.failureSummary || 'Axe violation'
            });
          }
        }
      }
    } catch (e: any) {
      console.warn(`Axe failed on ${relativePath} at ${vp.width}: ${e.message}`);
    }
  }

  await page.close();
  return pageResult;
}

async function main() {
  console.log("Starting QA Sweep Runner...");
  
  const files = getHtmlFiles(path.join(process.cwd(), 'designs'));
  console.log(`Found ${files.length} HTML pages.`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' }); // Emulate agent test requirement

  const allResults: PageResult[] = [];

  for (const file of files) {
    const res = await runPageTests(file, context);
    allResults.push(res);
  }

  await browser.close();

  fs.writeFileSync(RAW_FINDINGS_PATH, JSON.stringify(allResults, null, 2), 'utf-8');
  console.log(`\nQA Sweep complete! Wrote raw findings to ${RAW_FINDINGS_PATH}`);
}

main().catch(console.error);
