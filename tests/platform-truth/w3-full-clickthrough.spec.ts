/**
 * W3 — full UI click-through (host surfaces + collab Accept UI + forbidden writes).
 *
 * Requires: Next on E2E_BASE_URL (default http://127.0.0.1:3002), W0 fixtures.
 * Does NOT delete the e2e event / Account B — only clears B's collab rows between roles.
 *
 * Run:
 *   E2E_BASE_URL=http://127.0.0.1:3002 npx playwright test \
 *     tests/platform-truth/w3-full-clickthrough.spec.ts --reporter=line
 */
import { chromium, expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3002'
const ROOT = resolve(__dirname, '../..')
const OUT_DIR = resolve(ROOT, 'docs/testing/audit-2026-08-07')
const AUTH_A = resolve(ROOT, 'tests/.auth/user-a.json')
const AUTH_B = resolve(ROOT, 'tests/.auth/user-b.json')

const w0 = JSON.parse(readFileSync(resolve(ROOT, 'scripts/e2e/w0-env.json'), 'utf8')) as {
  eventId: string
  accountBEmail: string
  eventName: string
}

const ROLES = ['co-host', 'planner', 'photographer', 'viewer'] as const
type Role = (typeof ROLES)[number]

const results: Record<string, unknown> = {
  base: BASE,
  eventId: w0.eventId,
  host: {},
  roles: {} as Record<string, unknown>,
  decline: {},
}

function loadServiceKey(): { url: string; key: string } {
  const env: Record<string, string> = {}
  for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return { url: env.NEXT_PUBLIC_SUPABASE_URL!, key: env.SUPABASE_SERVICE_ROLE_KEY! }
}

async function ctxA(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: AUTH_A })
}
async function ctxB(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: AUTH_B })
}

async function clearBCollabs(ownerPage: Page): Promise<void> {
  const { url, key } = loadServiceKey()
  const listRes = await fetch(
    `${url}/rest/v1/event_collaborators?event_id=eq.${w0.eventId}&invited_email=eq.${encodeURIComponent(w0.accountBEmail)}&select=id`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  const rows = (await listRes.json()) as Array<{ id: string }>
  for (const row of rows) {
    const del = await ownerPage.request.delete(`${BASE}/api/events/${w0.eventId}/admins/${row.id}`)
    if (!del.ok() && del.status() !== 204) {
      await fetch(`${url}/rest/v1/event_collaborators?id=eq.${row.id}`, {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
    }
  }
}

async function inviteViaAdminsUi(page: Page, role: Role): Promise<void> {
  await page.goto(`${BASE}/events/${w0.eventId}/settings/admins`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  await expect(page.getByRole('heading', { name: /manage admins/i })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: /add co-host/i }).click()
  const dialog = page.getByRole('dialog', { name: /invite a co-host/i })
  await expect(dialog).toBeVisible()
  await dialog.locator('#es-cohost-email').fill(w0.accountBEmail)
  await dialog.locator('#es-cohost-role').selectOption(role)
  await dialog.getByRole('button', { name: /send invite/i }).click()

  await expect(page.getByRole('status').filter({ hasText: /invite sent/i })).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByText(w0.accountBEmail).first()).toBeVisible()
  await expect(page.getByText(/pending invite/i).first()).toBeVisible()
}

async function acceptViaCollaborationsUi(page: Page): Promise<void> {
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle', timeout: 45_000 })
  await page.getByRole('radio', { name: /collaborations/i }).click()
  await expect(page.locator('.pending-invite-card').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(new RegExp(w0.eventName, 'i')).first()).toBeVisible()

  await page.locator('.pending-invite-card').first().getByRole('button', { name: /^accept$/i }).click()

  // Pending card should clear; event should appear under Collaborations.
  await expect(page.locator('.pending-invite-card')).toHaveCount(0, { timeout: 25_000 })
  await page.getByRole('radio', { name: /collaborations/i }).click()
  const eventLink = page.locator(`a[href="/events/${w0.eventId}"]`).first()
  await expect(eventLink).toBeVisible({ timeout: 25_000 })
  await eventLink.click()
  await expect(page).toHaveURL(new RegExp(`/events/${w0.eventId}`))
  await expect(page.getByRole('heading', { name: new RegExp(w0.eventName, 'i') })).toBeVisible({
    timeout: 20_000,
  })
}

/** Forbidden = 404 (requireEventWrite hides as not found). Allowed = not 401/403/404. */
async function probeWrites(page: Page): Promise<Record<string, number>> {
  const guests = await page.request.post(`${BASE}/api/events/${w0.eventId}/guests`, {
    data: { name: 'E2E Probe Guest' },
  })
  const media = await page.request.post(`${BASE}/api/events/${w0.eventId}/media/upload-url`, {
    data: { contentType: 'image/jpeg', kind: 'photo' },
  })
  const admins = await page.request.post(`${BASE}/api/events/${w0.eventId}/admins`, {
    data: { email: 'e2e.probe.extra@evenzi.test', role: 'viewer' },
  })
  return {
    guests: guests.status(),
    media: media.status(),
    admins: admins.status(),
  }
}

function expectForbidden(status: number, label: string): void {
  expect(status, `${label} should be forbidden (404)`).toBe(404)
}

function expectAllowedReach(status: number, label: string): void {
  expect([401, 403, 404], `${label} should reach handler`).not.toContain(status)
}

test.describe.configure({ mode: 'serial' })
test.setTimeout(420_000)

test('W3 host — click through hub + key surfaces', async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const context = await ctxA(browser)
  const page = await context.newPage()
  const host: Record<string, unknown> = {}

  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle', timeout: 45_000 })
  await expect(page.getByRole('heading', { name: /your events/i })).toBeVisible()
  host.home = page.url()

  // Open e2e event from dashboard
  const openHub = page.locator(`a[href="/events/${w0.eventId}"]`).first()
  if (await openHub.count()) {
    await openHub.click()
  } else {
    await page.goto(`${BASE}/events/${w0.eventId}`, { waitUntil: 'domcontentloaded' })
  }
  await expect(page.getByRole('heading', { name: new RegExp(w0.eventName, 'i') })).toBeVisible({
    timeout: 20_000,
  })
  host.hub = page.url()

  // Quick-action tiles
  const qaClicks: Array<{ label: string; expectPath: RegExp; heading: RegExp }> = [
    { label: 'Send invites', expectPath: /\/invitations/, heading: /invitation|draft|template/i },
    { label: 'Track RSVPs', expectPath: /\/guests/, heading: /guest/i },
    { label: 'Manage budget', expectPath: /\/planning/, heading: /planning|budget|checklist/i },
  ]

  for (const qa of qaClicks) {
    await page.goto(`${BASE}/events/${w0.eventId}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: new RegExp(qa.label, 'i') }).first().click()
    await expect(page).toHaveURL(qa.expectPath)
    await expect(page.locator('h1, [class*="section-head-title"], [class*="es-content-title"]').first()).toBeVisible()
    host[`qa:${qa.label}`] = { url: page.url(), ok: true }
  }

  // Tool surfaces via direct nav + assert interactive chrome
  const surfaces: Array<{ path: string; check: () => Promise<void> }> = [
    {
      path: `/events/${w0.eventId}/media`,
      check: async () => {
        await expect(page.getByText(/upload|photo|media|memories/i).first()).toBeVisible()
      },
    },
    {
      path: `/events/${w0.eventId}/website`,
      check: async () => {
        await expect(page.getByText(/website|site|overview|design/i).first()).toBeVisible()
      },
    },
    {
      path: `/events/${w0.eventId}/journey`,
      check: async () => {
        await expect(page.getByText(/journey|timeline|sub-event/i).first()).toBeVisible()
      },
    },
    {
      path: `/events/${w0.eventId}/settings`,
      check: async () => {
        await expect(page.getByText(/general|event settings|basics/i).first()).toBeVisible()
      },
    },
    {
      path: `/events/${w0.eventId}/settings/admins`,
      check: async () => {
        await expect(page.getByRole('heading', { name: /manage admins/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /add co-host/i })).toBeVisible()
      },
    },
    {
      path: `/events/${w0.eventId}/settings/billing`,
      check: async () => {
        await expect(page.getByRole('heading', { name: 'Plan & billing', level: 1 })).toBeVisible()
        // Honesty: Upgrade is disabled / coming soon
        const upgrade = page.getByRole('button', { name: /upgrade|coming soon/i }).first()
        if (await upgrade.count()) {
          await expect(upgrade).toBeDisabled()
        }
      },
    },
    {
      path: '/settings',
      check: async () => {
        await expect(page.getByText(/profile|notification|security|account/i).first()).toBeVisible()
      },
    },
  ]

  for (const s of surfaces) {
    const res = await page.goto(`${BASE}${s.path}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    expect(page.url().includes('/auth'), `${s.path} bounced to auth`).toBeFalsy()
    expect(res?.status() ?? 0, s.path).toBeLessThan(400)
    await s.check()
    host[s.path] = { status: res?.status(), url: page.url(), ok: true }
  }

  results.host = host
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(resolve(OUT_DIR, 'w3-full-clickthrough.json'), JSON.stringify(results, null, 2))
  await browser.close()
})

test('W3 collab — UI invite + Accept + forbidden writes per role', async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })

  for (const role of ROLES) {
    const roleOut: Record<string, unknown> = { role }
    const aCtx = await ctxA(browser)
    const aPage = await aCtx.newPage()
    await aPage.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' })
    await clearBCollabs(aPage)

    await inviteViaAdminsUi(aPage, role)
    roleOut.inviteUi = 'ok'

    const bCtx = await ctxB(browser)
    const bPage = await bCtx.newPage()
    await acceptViaCollaborationsUi(bPage)
    roleOut.acceptUi = 'ok'
    roleOut.hubAsCollab = bPage.url()

    // Click a couple hub tiles as collab (read path)
    await bPage.getByRole('link', { name: /track rsvps/i }).first().click()
    await expect(bPage).toHaveURL(/\/guests/)
    roleOut.openedGuests = true
    await bPage.goto(`${BASE}/events/${w0.eventId}/media`, { waitUntil: 'domcontentloaded' })
    await expect(bPage.getByText(/media|photo|upload|memories/i).first()).toBeVisible()
    roleOut.openedMedia = true

    const probes = await probeWrites(bPage)
    roleOut.probes = probes

    if (role === 'viewer') {
      expectForbidden(probes.guests, 'viewer guests write')
      expectForbidden(probes.media, 'viewer media write')
      expectForbidden(probes.admins, 'viewer admins write')
    } else if (role === 'planner') {
      expectAllowedReach(probes.guests, 'planner guests write')
      expectForbidden(probes.media, 'planner media write')
      expectForbidden(probes.admins, 'planner admins write')
    } else if (role === 'photographer') {
      expectForbidden(probes.guests, 'photographer guests write')
      expectAllowedReach(probes.media, 'photographer media write')
      expectForbidden(probes.admins, 'photographer admins write')
    } else if (role === 'co-host') {
      expectAllowedReach(probes.guests, 'co-host guests write')
      expectAllowedReach(probes.media, 'co-host media write')
      expectAllowedReach(probes.admins, 'co-host admins write')
      // Probe may have created a pending invite for the dummy email — scrub it.
      const { url, key } = loadServiceKey()
      await fetch(
        `${url}/rest/v1/event_collaborators?event_id=eq.${w0.eventId}&invited_email=eq.${encodeURIComponent('e2e.probe.extra@evenzi.test')}`,
        { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } },
      )
    }

    await clearBCollabs(aPage)
    ;(results.roles as Record<string, unknown>)[role] = roleOut
    writeFileSync(resolve(OUT_DIR, 'w3-full-clickthrough.json'), JSON.stringify(results, null, 2))
    await bCtx.close()
    await aCtx.close()
  }

  await browser.close()
})

test('W3 decline — Collaborations UI Decline + confirm', async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const aCtx = await ctxA(browser)
  const aPage = await aCtx.newPage()
  await aPage.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' })
  await clearBCollabs(aPage)
  await inviteViaAdminsUi(aPage, 'viewer')

  const bCtx = await ctxB(browser)
  const bPage = await bCtx.newPage()
  await bPage.goto(`${BASE}/home`, { waitUntil: 'networkidle' })
  await bPage.getByRole('radio', { name: /collaborations/i }).click()
  await expect(bPage.locator('.pending-invite-card').first()).toBeVisible({ timeout: 20_000 })

  bPage.once('dialog', async (d) => {
    expect(d.message()).toMatch(/decline/i)
    await d.accept()
  })
  await bPage.locator('.pending-invite-card').first().getByRole('button', { name: /^decline$/i }).click()
  await expect(bPage.locator('.pending-invite-card')).toHaveCount(0, { timeout: 25_000 })

  results.decline = { ok: true }
  writeFileSync(resolve(OUT_DIR, 'w3-full-clickthrough.json'), JSON.stringify(results, null, 2))
  await clearBCollabs(aPage)
  await browser.close()
})
