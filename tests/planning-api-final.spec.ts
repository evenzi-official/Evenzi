import { test, expect } from '@playwright/test';

test('Planning Tools Final API E2E', async ({ page }) => {
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
  
  // 1. Task Creation
  await page.evaluate(async (id) => {
    await fetch(`/api/events/${id}/planning/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Book Photographer',
        priorityId: '08911664-1146-4390-b4b1-6062c91e71ba'
      })
    });
  }, eventId);

  // 2. Budget Edit
  await page.evaluate(async (id) => {
    await fetch(`/api/events/${id}/planning/budget`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalAmount: 85000 })
    });
  }, eventId);

  // 3. Expense Creation
  await page.evaluate(async (id) => {
    await fetch(`/api/events/${id}/planning/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 25000,
        expenseTypeId: '3fbaeca0-a551-48ff-891d-04d610ceeef5',
        expenseDate: new Date().toISOString().split('T')[0],
        vendorName: 'Snappy Shots'
      })
    });
  }, eventId);

  // Check UI visually
  await page.goto(`http://localhost:3000/events/${eventId}/planning`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa/20_planning_final_tasks.png' });

  await page.click('text="Budget"');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa/21_planning_final_budget.png' });
});
