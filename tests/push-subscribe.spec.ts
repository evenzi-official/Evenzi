/**
 * Phase B push wiring — Playwright.
 *
 * Real PushManager.subscribe is denied under Chromium/Chrome automation on macOS
 * ("Registration failed - permission denied") even when Notification.permission=granted.
 * This suite verifies the regressions we fixed:
 *   1) /sw.js is public (not redirected to /auth)
 *   2) Settings SSR passes VAPID to the client
 *   3) UI enable path POSTs to /api/notifications/push-subscription (via PushManager mock)
 *   4) Authenticated API accepts an allowlisted FCM endpoint
 *
 * Manual B7: Chrome/Safari with OS notification permission + webhook still required for OS toasts.
 *
 * Run: npx playwright test tests/push-subscribe.spec.ts
 */
import { chromium, test, expect } from '@playwright/test'

const FAKE_ENDPOINT = `https://fcm.googleapis.com/fcm/send/evenzi-pw-${Date.now()}`
const FAKE_P256DH = 'BPtestP256dhKeyForPlaywrightOnly0123456789abcdef'
const FAKE_AUTH = 'authKeyForPlaywrightTest01'

test.describe('Phase B push wiring', () => {
  test.setTimeout(120_000)

  test('sw.js is public + settings has VAPID + UI subscribe POSTs', async () => {
    const browser = await chromium.launch({ headless: false, channel: 'chrome' })
    const context = await browser.newContext({
      permissions: ['notifications'],
      serviceWorkers: 'allow',
    })
    await context.grantPermissions(['notifications'], { origin: 'http://127.0.0.1:3000' })
    const page = await context.newPage()

    // --- 1) SW must not redirect to /auth (root cause of Safari/Playwright hang) ---
    const sw = await context.request.get('http://127.0.0.1:3000/sw.js', { maxRedirects: 0 })
    expect(sw.status(), await sw.text()).toBe(200)
    expect(await sw.text()).toContain('addEventListener')

    // --- Login ---
    await page.goto('http://127.0.0.1:3000/auth', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#phone', { timeout: 20_000 })
    await page.locator('#phone').fill('9999999999')
    await page.getByRole('button', { name: /send otp/i }).click()
    await page.waitForSelector('.pin-input-cell', { timeout: 20_000 })
    const cells = page.locator('.pin-input-cell')
    for (let i = 0; i < 6; i++) await cells.nth(i).fill('123456'[i]!)
    await page.getByRole('button', { name: /verify otp/i }).click()
    await page.waitForURL(/\/(home|auth\/role-selection)/, { timeout: 30_000 })
    if (page.url().includes('role-selection')) {
      const host = page.getByRole('button', { name: /host|continue|get started/i }).first()
      if (await host.count()) await host.click()
      await page.waitForURL('**/home', { timeout: 30_000 })
    }

    // --- 2) VAPID from server ---
    await page.goto('http://127.0.0.1:3000/settings', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#notifications', { timeout: 20_000 })
    const vapid = await page.locator('#notifications').getAttribute('data-vapid')
    expect(vapid && vapid.length > 20).toBeTruthy()

    // --- 3) Mock PushManager.subscribe (automation cannot create real push bindings) ---
    await page.evaluate(
      ({ endpoint, p256dh, auth }) => {
        const fakeSub = {
          endpoint,
          expirationTime: null as number | null,
          options: { userVisibleOnly: true, applicationServerKey: null as ArrayBuffer | null },
          getKey: () => null,
          toJSON: () => ({ endpoint, expirationTime: null, keys: { p256dh, auth } }),
          unsubscribe: async () => true,
        }

        const patch = (pm: PushManager) => {
          pm.subscribe = async () => fakeSub as unknown as PushSubscription
          pm.getSubscription = async () => null
          pm.permissionState = async () => 'granted' as PermissionState
        }

        const wrapReady = navigator.serviceWorker.ready.then.bind(navigator.serviceWorker.ready)
        // Patch current registration when ready resolves
        void navigator.serviceWorker.ready.then((reg) => patch(reg.pushManager))

        // Also patch after register()
        const origRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker)
        navigator.serviceWorker.register = async (...args: Parameters<typeof origRegister>) => {
          const reg = await origRegister(...args)
          patch(reg.pushManager)
          return reg
        }

        void wrapReady
      },
      { endpoint: FAKE_ENDPOINT, p256dh: FAKE_P256DH, auth: FAKE_AUTH },
    )

    // Ensure SW register path runs against mock
    await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
      await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
    })

    const pushCard = page.locator('button.choice-card').filter({ hasText: 'Push notifications' })
    await expect(pushCard).toBeVisible()
    await expect(pushCard).toBeEnabled({ timeout: 20_000 })

    if ((await pushCard.getAttribute('aria-pressed')) === 'true') {
      await pushCard.click()
      await page.waitForTimeout(1000)
    }

    const postPromise = page.waitForResponse(
      (r) => r.url().includes('/api/notifications/push-subscription') && r.request().method() === 'POST',
      { timeout: 20_000 },
    )
    await pushCard.click()
    const post = await postPromise
    const body = await post.text()
    console.log('UI POST', post.status(), body)
    expect(post.status(), body).toBeLessThan(300)
    expect(await pushCard.getAttribute('aria-pressed')).toBe('true')

    // --- 4) Direct API round-trip with another allowlisted endpoint ---
    const cookies = await context.cookies('http://127.0.0.1:3000')
    expect(cookies.some((c) => c.name.includes('auth') || c.name.includes('sb-'))).toBeTruthy()

    const apiRes = await page.evaluate(async () => {
      const endpoint = `https://fcm.googleapis.com/fcm/send/evenzi-api-${Date.now()}`
      const res = await fetch('/api/notifications/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          p256dh: 'BPtestP256dhKeyForPlaywrightOnly0123456789abcdef',
          auth: 'authKeyForPlaywrightTest02',
        }),
      })
      return { status: res.status, body: await res.text(), endpoint }
    })
    console.log('API POST', apiRes.status, apiRes.body)
    expect(apiRes.status, apiRes.body).toBeLessThan(300)

    // Cleanup fake rows
    await page.evaluate(async (endpoint) => {
      await fetch('/api/notifications/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
    }, FAKE_ENDPOINT)
    await page.evaluate(async (endpoint) => {
      await fetch('/api/notifications/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
    }, apiRes.endpoint)

    await context.close()
    await browser.close()
  })
})
