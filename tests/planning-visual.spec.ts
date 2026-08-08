import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test('Planning Tools Visual E2E', async ({ page }) => {
  test.setTimeout(120000);

  // 1. Mobile Check
  await page.setViewportSize({ width: 390, height: 844 });
  
  // Login
  await page.goto('http://localhost:3000/auth');
  await page.fill('input[type="tel"]', '9999999999');
  await page.click('button:has-text("Send OTP")');
  await page.waitForSelector('.pin-input-cell');
  const otpInputs = await page.$$('.pin-input-cell');
  const otp = '123456';
  for (let i = 0; i < otp.length; i++) await otpInputs[i].fill(otp[i]);
  await page.click('button:has-text("Verify OTP")');
  await page.waitForURL('**/home', { timeout: 10000 });

  const eventId = '477dcaa8-3893-41fa-8381-a08808cfd8bb';
  await page.goto(`http://localhost:3000/events/${eventId}/planning`);
  await page.waitForSelector('[data-page="planning"]');

  // Wait for React to mount the client component
  await page.waitForTimeout(2000);

  // 1. Client-side form validation (Empty task)
  await page.click('#plan-add-fab');
  await page.waitForSelector('#plan-task-save');
  await page.click('#plan-task-save'); // Should fail validation
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'qa/30_mobile_task_validation.png' });

  // Reload to clear modal state
  await page.reload();
  await page.waitForTimeout(2000);

  // 2. Bulk Actions UI Check (Mobile)
  await page.click('#plan-select-mode');
  await page.waitForTimeout(1000);
  
  // Select tasks - click the first two task checkboxes
  // We'll evaluate to safely click them
  await page.evaluate(() => {
    const checkboxes = Array.from(
      document.querySelectorAll('.task-row .gm-checkbox input')
    ) as HTMLInputElement[]
    if (checkboxes[0]) checkboxes[0].click()
    if (checkboxes[1]) checkboxes[1].click()
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'qa/31_mobile_bulk_actions.png' });

  // 3. Desktop Check - Bulk Actions
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'qa/32_desktop_bulk_actions.png' });

  // Cancel selection
  await page.click('#plan-select-mode'); // toggle off
  await page.waitForTimeout(1000);

  // 4. Receipt Image Upload Stub
  await page.click('#plan-tab-budget');
  await page.waitForTimeout(1000);
  await page.click('#plan-add-fab');
  await page.waitForSelector('#plan-receipt-file');

  // Create a dummy image file for upload
  const dummyImagePath = path.join(process.cwd(), 'qa', 'dummy_receipt.png');
  // Write a 1x1 transparent PNG if it doesn't exist
  if (!fs.existsSync(dummyImagePath)) {
    fs.writeFileSync(dummyImagePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
  }

  // Upload file
  await page.setInputFiles('#plan-receipt-file', dummyImagePath);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'qa/33_desktop_receipt_preview.png' });
});
