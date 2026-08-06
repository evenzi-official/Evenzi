/**
 * Full Phase A + B notifications smoke (Playwright + Chrome).
 * Covers: auth, SW public, VAPID SSR, bell API, mark-all-read, push subscribe POST (mocked PushManager),
 * push-subscription DELETE, dispatch-push HMAC reject/accept.
 *
 * Run: npx playwright test tests/notifications-full.spec.ts
 */
import { chromium, test, expect } from '@playwright/test'
import { createHmac } from 'crypto'

const BASE = 'http://127.0.0.1:3000'

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
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
}

test.describe('Notifications full smoke', () => {
  test.setTimeout(180_000)

  test('Phase A bell + Phase B push wiring + dispatch HMAC', async () => {
    const browser = await chromium.launch({ headless: false, channel: 'chrome' })
    const context = await browser.newContext({
      permissions: ['notifications'],
      serviceWorkers: 'allow',
    })
    await context.grantPermissions(['notifications'], { origin: BASE })
    const page = await context.newPage()

    // --- Public SW (prod-critical) ---
    const sw = await context.request.get(`${BASE}/sw.js`, { maxRedirects: 0 })
    expect(sw.status(), await sw.text()).toBe(200)
    expect(await sw.text()).toContain('push')

    await login(page)

    // --- Phase A: notifications list API ---
    const list = await page.evaluate(async () => {
      const res = await fetch('/api/notifications?limit=20')
      const json = await res.json().catch(() => null)
      return { status: res.status, json }
    })
    expect(list.status).toBe(200)
    expect(list.json).toHaveProperty('notifications')
    expect(Array.isArray(list.json.notifications)).toBe(true)

    // --- Phase A: mark-all-read ---
    const markAll = await page.evaluate(async () => {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      return { status: res.status, body: await res.text() }
    })
    expect(markAll.status).toBeLessThan(300)

    // Bell UI present on home
    await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /notifications/i })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /notifications/i }).click()
    await expect(page.getByRole('dialog', { name: /notifications/i })).toBeVisible({ timeout: 10_000 })

    // --- Phase B: settings VAPID + subscribe POST ---
    await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#notifications', { timeout: 20_000 })
    const vapid = await page.locator('#notifications').getAttribute('data-vapid')
    expect(vapid && vapid.length > 20).toBeTruthy()

    const endpoint = `https://fcm.googleapis.com/fcm/send/evenzi-full-${Date.now()}`
    const p256dh = 'BPtestP256dhKeyForPlaywrightOnly0123456789abcdef'
    const auth = 'authKeyForPlaywrightFull01'

    await page.evaluate(({ endpoint, p256dh, auth }) => {
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
      void navigator.serviceWorker.ready.then((reg) => patch(reg.pushManager))
      const origRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker)
      navigator.serviceWorker.register = async (...args: Parameters<typeof origRegister>) => {
        const reg = await origRegister(...args)
        patch(reg.pushManager)
        return reg
      }
    }, { endpoint, p256dh, auth })

    await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
      await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
    })

    const pushCard = page.locator('button.choice-card').filter({ hasText: 'Push notifications' })
    await expect(pushCard).toBeEnabled({ timeout: 20_000 })
    if ((await pushCard.getAttribute('aria-pressed')) === 'true') {
      await pushCard.click()
      await page.waitForTimeout(800)
    }

    const postPromise = page.waitForResponse(
      (r) => r.url().includes('/api/notifications/push-subscription') && r.request().method() === 'POST',
      { timeout: 20_000 },
    )
    await pushCard.click()
    const post = await postPromise
    expect(post.status(), await post.text()).toBeLessThan(300)
    expect(await pushCard.getAttribute('aria-pressed')).toBe('true')

    // SSRF reject
    const ssrf = await page.evaluate(async () => {
      const res = await fetch('/api/notifications/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://127.0.0.1/push',
          p256dh: 'BPtestP256dhKeyForPlaywrightOnly0123456789abcdef',
          auth: 'authKeyForPlaywrightFull02',
        }),
      })
      return res.status
    })
    expect(ssrf).toBe(400)

    // DELETE subscription
    const del = await page.evaluate(async (ep) => {
      const res = await fetch('/api/notifications/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: ep }),
      })
      return res.status
    }, endpoint)
    expect([200, 404]).toContain(del)

    // --- dispatch-push: bad signature → 401 ---
    const badSig = await context.request.post(`${BASE}/api/notifications/dispatch-push`, {
      data: { type: 'INSERT', record: { id: '00000000-0000-4000-8000-000000000001', user_id: '00000000-0000-4000-8000-000000000002', title: 't', body: 'b', link_path: null } },
      headers: { 'x-evenzi-webhook-signature': 'deadbeef' },
    })
    expect([401, 503]).toContain(badSig.status())

    // --- dispatch-push: valid HMAC (if secret available via env in Next) ---
    // We can't read .env.local here; forge from process if set for the test runner.
    const secret = process.env.NOTIFICATIONS_WEBHOOK_SECRET
    if (secret) {
      const payload = JSON.stringify({
        type: 'INSERT',
        record: {
          id: '00000000-0000-4000-8000-000000000099',
          user_id: '00000000-0000-4000-8000-000000000098',
          title: 'Playwright',
          body: 'dispatch smoke',
          link_path: null,
        },
      })
      const sig = createHmac('sha256', secret).update(payload).digest('hex')
      const ok = await context.request.post(`${BASE}/api/notifications/dispatch-push`, {
        data: payload,
        headers: {
          'content-type': 'application/json',
          'x-evenzi-webhook-signature': sig,
        },
      })
      // 200/204 even with no targets; 404/500 if notification id missing in DB — accept non-401
      expect(ok.status()).not.toBe(401)
      console.log('dispatch signed status', ok.status(), await ok.text())
    } else {
      console.log('skip signed dispatch — NOTIFICATIONS_WEBHOOK_SECRET not in test env')
    }

    await context.close()
    await browser.close()
  })
})
