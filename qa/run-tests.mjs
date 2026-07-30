import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
    
    // Click Sign In
    await page.click('text="Sign In"');
    await page.waitForTimeout(2000);
    
    const html = await page.evaluate(() => {
      const form = document.querySelector('form') || document.body;
      return form.innerHTML;
    });
    console.log('--- FORM HTML ---');
    console.log(html);
    
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
