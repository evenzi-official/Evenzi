import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Logging in...');
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[type="tel"]', '9999999999');
    await page.click('button:has-text("Send OTP")');
    await page.waitForTimeout(2000); // wait for OTP UI
    
    // Fill OTP
    const otpInputs = await page.$$('.pin-input-cell');
    const otp = '123456';
    for (let i = 0; i < otp.length; i++) {
      await otpInputs[i].fill(otp[i]);
    }
    
    await page.click('button:has-text("Verify OTP")');
    console.log('OTP submitted, waiting for navigation...');
    
    // Wait for the app to load
    await page.waitForTimeout(4000);
    console.log('Current URL after login:', page.url());
    
    // Navigate to planning
    const eventId = '477dcaa8-3893-41fa-8381-a08808cfd8bb';
    console.log('Navigating to planning page...');
    await page.goto(`http://localhost:3000/events/${eventId}/planning`);
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'qa/02_planning_page.png' });
    
    // Try to create a task
    // The "Add task" button might just be a floating FAB or a button with text "Add task".
    // Or in the header. Let's dump the buttons.
    const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()));
    console.log('Buttons on page:', buttons);
    
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
