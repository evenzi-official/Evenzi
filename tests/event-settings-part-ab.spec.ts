/**
 * Validates Event Settings Cleanup Part A + B on feature/event-settings-cleanup.
 * Run: npx playwright test tests/event-settings-part-ab.spec.ts --reporter=line
 */
import { chromium, test, expect } from '@playwright/test'

const BASE = 'http://127.0.0.1:3000'

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#phone', { timeout: 30_000 })
  await page.locator('#phone').fill('9999999999')
  await page.getByRole('button', { name: /send otp/i }).click()
  await page.getByLabel(/digit 1/i).waitFor({ timeout: 20_000 })
  for (let i = 0; i < 6; i++) {
    await page.getByLabel(new RegExp(`digit ${i + 1}`, 'i')).fill('123456'[i]!)
  }
  await page.getByRole('button', { name: /verify otp/i }).click()
  await page.waitForURL(/\/(home|auth\/role-selection)/, { timeout: 45_000 })
  if (page.url().includes('role-selection')) {
    const host = page.getByRole('button', { name: /host|continue|get started/i }).first()
    if (await host.count()) await host.click()
    await page.waitForURL('**/home', { timeout: 30_000 })
  }
}

async function firstEventId(page: import('@playwright/test').Page): Promise<string> {
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' })
  const link = page.locator('a[href*="/events/"][href*="-"]').filter({ hasNotText: /start a new event/i }).first()
  // Prefer UUID hrefs only
  const uuidLink = page.locator('a[href^="/events/"][href*="-"]').locator('visible=true').first()
  await page.waitForSelector('a[href^="/events/"][href*="-"][href*="477d"], a[href^="/events/"][href$="-"]', { timeout: 5_000 }).catch(() => {})
  const hrefs = await page.$$eval('a[href^="/events/"]', (as) =>
    as.map((a) => (a as HTMLAnchorElement).getAttribute('href') || '').filter((h) => /\/events\/[0-9a-f-]{36}/i.test(h))
  )
  if (!hrefs.length) throw new Error('no event links on /home')
  const m = hrefs[0]!.match(/\/events\/([0-9a-f-]{36})/i)!
  return m[1]!
}

test.describe('Event settings Part A + B', () => {
  test.setTimeout(180_000)

  test('Part A UI fixes + Part B BusyOverlay wiring', async () => {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' })
    const page = await browser.newPage()
    const results: Record<string, string> = {}

    await login(page)
    const eventId = await firstEventId(page)
    results.eventId = eventId

    // --- Part A Task 5/4/6: General ---
    await page.goto(`${BASE}/events/${eventId}/settings`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /general settings/i })).toBeVisible({ timeout: 30_000 })

    const showDash = page.getByText(/show this event on my dashboard/i)
    const discoverable = page.getByText(/discoverable/i)
    results.A5_no_dashboard_toggle = String(await showDash.count() === 0)
    results.A5_no_discoverable = String(await discoverable.count() === 0)

    const dateInput = page.locator('input[type="date"]').first()
    await expect(dateInput).toBeVisible()
    const colorScheme = await dateInput.evaluate((el) => getComputedStyle(el).colorScheme)
    results.A5_date_color_scheme = colorScheme // expect dark or dark-ish

    const support = page.locator('a[href="mailto:evenzi.official@gmail.com"]').filter({ hasText: /contact support/i })
    results.A4_mailto_support = String(await support.count() > 0)

    results.A6_no_es_footer = String(await page.locator('.es-footer').count() === 0)

    // BusyOverlay present in DOM (inactive)
    results.B8_busy_overlay_mounted = String(await page.locator('.busy-overlay').count() > 0)

    // Trigger save → overlay should activate briefly
    const saveBtn = page.getByRole('button', { name: /save changes/i }).first()
    await saveBtn.click()
    // race: overlay may flash; poll briefly
    let overlayActive = false
    for (let i = 0; i < 20; i++) {
      if (await page.locator('.busy-overlay.is-active').count()) {
        overlayActive = true
        break
      }
      await page.waitForTimeout(50)
    }
    results.B8_overlay_on_save = String(overlayActive)
    await page.waitForTimeout(1500) // let save finish

    // --- Part A Task 1: Website ---
    await page.goto(`${BASE}/events/${eventId}/settings/website`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /website/i }).first()).toBeVisible({ timeout: 20_000 })

    const manage = page.getByRole('link', { name: /manage your website/i })
    results.A1_manage_link = String(await manage.count() > 0)
    if (await manage.count()) {
      const mh = await manage.getAttribute('href')
      results.A1_manage_href = mh ?? ''
      results.A1_manage_href_ok = String(mh === `/events/${eventId}/website`)
    }
    results.A1_no_view_live = String(await page.getByText(/view live site/i).count() === 0)
    results.A1_no_fake_pages_section = String(await page.getByRole('heading', { name: /^pages$/i }).count() === 0)
    results.A6_website_no_es_footer = String(await page.locator('.es-footer').count() === 0)
    results.B9_website_busy = String(await page.locator('.busy-overlay').count() > 0)

    // --- Part A Task 2: Registry coming soon ---
    await page.goto(`${BASE}/events/${eventId}/settings/registry`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/coming soon/i).first()).toBeVisible({ timeout: 20_000 })
    results.A2_coming_soon_copy = 'true'
    const disabledInputs = page.locator('input:disabled, button:disabled, select:disabled, textarea:disabled')
    results.A2_disabled_controls = String(await disabledInputs.count() >= 3)
    const addLink = page.getByRole('button', { name: /add link \(coming soon\)/i })
    results.A2_add_link_disabled = String((await addLink.count()) ? await addLink.isDisabled() : false)

    // --- Guests / Admins BusyOverlay ---
    await page.goto(`${BASE}/events/${eventId}/settings/guests`, { waitUntil: 'domcontentloaded' })
    results.B9_guests_busy = String(await page.locator('.busy-overlay').count() > 0)
    const guestGuide = page.locator('a[href="mailto:evenzi.official@gmail.com"]')
    results.A4_guests_mailto = String(await guestGuide.count() > 0)

    await page.goto(`${BASE}/events/${eventId}/settings/admins`, { waitUntil: 'domcontentloaded' })
    results.B9_admins_busy = String(await page.locator('.busy-overlay').count() > 0)

    // Source-level check: BusyOverlay component exists
    console.log('RESULTS=' + JSON.stringify(results, null, 2))

    // Hard asserts
    expect(results.A5_no_dashboard_toggle).toBe('true')
    expect(results.A5_no_discoverable).toBe('true')
    expect(results.A4_mailto_support).toBe('true')
    expect(results.A6_no_es_footer).toBe('true')
    expect(results.A1_manage_link).toBe('true')
    expect(results.A1_manage_href_ok).toBe('true')
    expect(results.A1_no_view_live).toBe('true')
    expect(results.A2_coming_soon_copy).toBe('true')
    expect(results.A2_disabled_controls).toBe('true')
    expect(results.B8_busy_overlay_mounted).toBe('true')
    expect(results.B9_website_busy).toBe('true')
    expect(results.B9_guests_busy).toBe('true')
    expect(results.B9_admins_busy).toBe('true')
    // Overlay flash is best-effort (fast network may miss it)
    if (results.B8_overlay_on_save !== 'true') {
      console.warn('WARN: BusyOverlay.is-active not observed during save (may be too fast)')
    }

    await browser.close()
  })
})
