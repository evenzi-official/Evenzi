import { test, expect } from '@playwright/test';

test.describe('Evenzi Full-Platform E2E', () => {
  test('Stage 1 — Auth & Role Selection', async ({ page }) => {
    // Navigate to local server
    await page.goto('http://localhost:3000');
    // Take a screenshot of the home page
    await page.screenshot({ path: 'e2e-screenshots/home.png' });
    
    // Click Sign In
    await page.click('text=Sign In');
    await page.waitForURL('**/auth');
    await page.screenshot({ path: 'e2e-screenshots/auth.png' });
    
    // Fill in OTP
    // Waiting for the user to provide precise DOM for auth
  });
});
