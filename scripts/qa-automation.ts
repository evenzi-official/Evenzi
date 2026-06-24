import { chromium, Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4000';
const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 }
];

async function getHtmlPages(dir: string): Promise<string[]> {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (let file of list) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(await getHtmlPages(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  }
  return results;
}

async function run() {
  console.log('Starting Playwright QA Sweep...');
  const browser = await chromium.launch({ headless: true });
  
  const designsDir = path.resolve(process.cwd(), 'designs');
  const files = await getHtmlPages(designsDir);
  const urls = files.map(f => {
    const rel = path.relative(designsDir, f);
    return `${BASE_URL}/${rel.replace(/\\/g, '/')}`;
  });

  const findings: any = {
    pagesTested: 0,
    totalIssues: 0,
    failedToLoad: [],
    issues: {}
  };

  for (const url of urls) {
    console.log(`\nTesting: ${url}`);
    findings.issues[url] = [];
    
    // Test on first viewport for smoke/load sanity
    const context = await browser.newContext({ viewport: VIEWPORTS[0] });
    const page = await context.newPage();
    
    let pageErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !text.includes('apple-touch-icon.png') && !text.includes('Tailwind')) {
          pageErrors.push(text);
        }
      }
    });

    await page.goto(url, { waitUntil: 'networkidle' });
    
    // 1. Load-sanity gate
    const hasDataPage = await page.$('body[data-page]');
    const hasPre = await page.$('body > pre');
    const hasValidContent = await page.$('main, header, nav');
    
    if (!hasDataPage || hasPre || !hasValidContent) {
      console.log(`[LOAD-FAILED] ${url} is not a valid page.`);
      findings.failedToLoad.push(url);
      await context.close();
      continue;
    }
    
    findings.pagesTested++;
    
    // Log console errors as issues
    if (pageErrors.length > 0) {
      findings.issues[url].push({
        severity: 'P2',
        category: 'console',
        description: `Console errors detected`,
        details: pageErrors.join('\n'),
        viewports: ['all']
      });
    }

    // Run Viewport tests
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(100); // small delay for relayout
      
      const vpLabel = `${vp.width}px`;

      // 2. Responsive Geometry (Horizontal scroll)
      const hasHScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      if (hasHScroll) {
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        findings.issues[url].push({
          severity: 'P1',
          category: 'responsive',
          description: `Horizontal scroll detected`,
          details: `scrollWidth=${sw} vs innerWidth=${vp.width}`,
          viewports: [vpLabel]
        });
      }
      
      // 3. Axe A11y
      if (vp.width === 1440) {
        try {
          const axeResults = await new AxeBuilder({ page }).analyze();
          
          for (const violation of axeResults.violations) {
            for (const node of violation.nodes) {
               findings.issues[url].push({
                 severity: violation.impact === 'critical' ? 'P0' : violation.impact === 'serious' ? 'P1' : 'P2',
                 category: 'a11y',
                 description: violation.help,
                 details: `Element: ${node.target.join(', ')}\nObserved: ${node.failureSummary}`,
                 viewports: ['all']
               });
            }
          }
        } catch(e) {
           console.log('Axe failed on', url);
        }
      }
    }
    
    await context.close();
  }
  
  await browser.close();
  
  fs.writeFileSync('qa-results.json', JSON.stringify(findings, null, 2));
  console.log('QA Automation finished. Results in qa-results.json');
}

run().catch(console.error);
