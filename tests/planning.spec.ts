import { test, expect } from '@playwright/test';

test('Planning Tools E2E', async ({ page }) => {
  test.setTimeout(120000);
  
  // 1. Login
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
  await page.screenshot({ path: 'qa/03_planning_initial.png' });

  // Add a task
  // Since we don't have the exact button selector, let's click by text or icon.
  // We can search for the add button using generic text or the plus icon.
  // We'll evaluate a script to click any button with text "Add task" or similar.
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.toLowerCase().includes('add task') || b.querySelector('span')?.innerText === 'add');
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(1000);
  
  // Try to submit empty task to trigger validation
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.querySelector('button[type="submit"]')?.click();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'qa/04_task_validation.png' });

  // Fill task form
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const titleInput = inputs.find(i => i.placeholder?.toLowerCase().includes('title') || i.name === 'title' || i.id === 'task-title') || document.querySelector('input[type="text"]');
    if (titleInput) {
      titleInput.value = 'Book mehendi artist';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.querySelector('button[type="submit"]')?.click();
  });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'qa/05_task_created.png' });
  
  // Navigate to Budget tab
  await page.click('text="Budget"');
  await page.waitForTimeout(1000);
  
  // Click Set budget
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const setBtn = btns.find(b => b.innerText.toLowerCase().includes('set budget'));
    if (setBtn) setBtn.click();
  });
  await page.waitForTimeout(1000);
  
  // Fill budget
  await page.evaluate(() => {
    const bInput = document.querySelector('input[type="number"]') || document.querySelector('input[type="text"]');
    if (bInput) {
      bInput.value = '850000';
      bInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const form = document.querySelector('form');
    if (form) form.querySelector('button[type="submit"]')?.click();
  });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'qa/06_budget_set.png' });
  
  // Add expense
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addExpBtn = btns.find(b => b.innerText.toLowerCase().includes('add expense'));
    if (addExpBtn) addExpBtn.click();
  });
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const amtInput = document.querySelector('input[type="number"]') || inputs.find(i => i.placeholder?.includes('Amount') || i.type === 'text');
    if (amtInput) {
      amtInput.value = '45000';
      amtInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const form = document.querySelector('form');
    if (form) form.querySelector('button[type="submit"]')?.click();
  });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'qa/07_expense_added.png' });
});
