import { test, expect } from '@playwright/test';

test('Planning Tools E2E via Browser API calls', async ({ page }) => {
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
  
  // 1. Test Task Creation
  await page.evaluate(async (id) => {
    // We execute fetch inside the browser to get the auth cookie automatically sent
    await fetch(`/api/events/${id}/planning/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Book Photographer',
        priorityId: 'ef9c4251-ce0b-46a2-9b24-1188af290532', // assuming a priority ID or we can omit since backend might handle null
      })
    });
  }, eventId);

  // Reload to see the new task in the UI
  await page.goto(`http://localhost:3000/events/${eventId}/planning`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa/10_task_created.png' });

  // 2. Test Budget
  await page.evaluate(async (id) => {
    await fetch(`/api/events/${id}/planning/budget`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalAmount: 75000 })
    });
  }, eventId);

  await page.reload();
  await page.click('text="Budget"');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa/11_budget_updated.png' });

  // 3. Test Expense Creation
  // We need to fetch an expense type first or just use null if the DB allows
  await page.evaluate(async (id) => {
    // create expense type
    const res = await fetch(`/api/events/${id}/planning/expense-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Photography' })
    });
    const data = await res.json();
    const typeId = data.expenseType?.id;

    if (typeId) {
      await fetch(`/api/events/${id}/planning/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 25000,
          expenseTypeId: typeId,
          expenseDate: new Date().toISOString().split('T')[0],
          vendorName: 'Snappy Shots'
        })
      });
    }
  }, eventId);

  await page.reload();
  await page.click('text="Budget"');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa/12_expense_added.png' });
});
