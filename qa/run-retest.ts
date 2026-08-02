import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: Record<string, any> = {};

  // Log in
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '9999999999');
  await page.click('button:has-text("Send OTP")');
  await page.waitForSelector('input.pin-input-cell', { state: 'visible', timeout: 5000 });
  const pins = await page.$$('input.pin-input-cell');
  const otp = '123456';
  for (let i = 0; i < 6; i++) {
    await pins[i].fill(otp[i]);
  }
  await page.click('button:has-text("Verify OTP")');
  await page.waitForTimeout(3000);

  const eventId = 'db6a6dc2-3e3b-4f58-a830-434f1f7cd7d4';

  const waitForResponse = (urlPattern: string, method: string) => {
    return page.waitForResponse(res => res.url().includes(urlPattern) && res.request().method() === method, { timeout: 10000 })
      .then(async r => ({ status: r.status(), body: await r.text(), payload: r.request().postDataJSON() }))
      .catch(e => ({ error: e.message }));
  };

  // Stage 4: Story editor
  try {
    await page.goto(`http://localhost:3000/events/${eventId}/website/edit/story`);
    await page.waitForTimeout(1000);
    const resPromise = waitForResponse('/story-blocks', 'POST');
    // The button is "Add Heading"
    await page.click('button:has-text("Add Heading")');
    results.story = await resPromise;
  } catch (e: any) { results.story = { error: e.message }; }

  // Stage 6: Schedule editor
  try {
    await page.goto(`http://localhost:3000/events/${eventId}/website/edit/schedule`);
    await page.waitForTimeout(1000);
    const resPromise = waitForResponse('/sub-events/', 'PATCH');
    // toggle switch
    await page.click('button[role="switch"]');
    results.schedule = await resPromise;
  } catch (e: any) { results.schedule = { error: e.message }; }

  // Stage 7: Q&A editor
  try {
    await page.goto(`http://localhost:3000/events/${eventId}/website/edit/qa`);
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder="What\'s the dress code?"]', 'Q?');
    await page.fill('textarea[placeholder="Smart casual. No white please!"]', 'A!');
    const resPromise = waitForResponse('/qa-items', 'POST');
    await page.click('button.btn-pill-primary:has-text("Add")');
    results.qa = await resPromise;
  } catch (e: any) { results.qa = { error: e.message }; }

  // Stage 8a/b: Travel Point & Stays
  try {
    await page.goto(`http://localhost:3000/events/${eventId}/website/edit/venue-travel`);
    await page.waitForTimeout(1000);
    
    // Add travel point
    await page.fill('input[placeholder="Indira Gandhi Airport"]', 'Airport');
    const tpPromise = waitForResponse('/travel-points', 'POST');
    // First Add button belongs to travel point
    await page.click('button.btn-pill-primary:has-text("Add") >> nth=0');
    results.travelPoint = await tpPromise;

    await page.waitForTimeout(500);

    // Add stay
    await page.fill('input[placeholder="The Grand Hyatt"]', 'Hotel Test');
    const stayPromise = waitForResponse('/stays', 'POST');
    // Second Add button belongs to stay
    await page.click('button.btn-pill-primary:has-text("Add") >> nth=1');
    results.stays = await stayPromise;
  } catch (e: any) { results.stays = { error: e.message }; }

  // Stage 2: Design
  try {
    await page.goto(`http://localhost:3000/events/${eventId}/website/design`);
    await page.waitForTimeout(1000);
    await page.click('img[alt="Cinematic Scroll"]');
    const resPromise = waitForResponse('/website-design', 'PATCH');
    await page.click('button:has-text("Apply")');
    results.design = await resPromise;
  } catch(e: any) { results.design = { error: e.message }; }

  fs.writeFileSync('qa/retest-results-ui.json', JSON.stringify(results, null, 2));
  await browser.close();
}

run().catch(console.error);
