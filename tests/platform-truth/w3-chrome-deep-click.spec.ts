/**
 * Headed Chrome deep click-through — opens real Chrome and exercises host + collab UI.
 *
 *   HEADED=1 E2E_BASE_URL=http://127.0.0.1:3002 npx playwright test \
 *     tests/platform-truth/w3-chrome-deep-click.spec.ts --reporter=line
 */
import { chromium, expect, test, type Browser, type Page } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3002'
const HEADED = process.env.HEADED !== '0'
const SLOW = Number(process.env.SLOW_MO_MS ?? (HEADED ? '120' : '0'))
const ROOT = resolve(__dirname, '../..')
const OUT_DIR = resolve(ROOT, 'docs/testing/audit-2026-08-07')
const AUTH_A = resolve(ROOT, 'tests/.auth/user-a.json')
const AUTH_B = resolve(ROOT, 'tests/.auth/user-b.json')

const w0 = JSON.parse(readFileSync(resolve(ROOT, 'scripts/e2e/w0-env.json'), 'utf8')) as {
  eventId: string
  accountBEmail: string
  eventName: string
}
const id = w0.eventId

const log: Array<{ step: string; ok: boolean; detail?: string }> = []

function record(step: string, ok: boolean, detail?: string): void {
  log.push({ step, ok, detail })
  // eslint-disable-next-line no-console
  console.log(`${ok ? '✓' : '✗'} ${step}${detail ? ` — ${detail}` : ''}`)
}

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(resolve(OUT_DIR, 'chrome-shots'), { recursive: true })
  await page.screenshot({
    path: resolve(OUT_DIR, 'chrome-shots', `${name}.png`),
    fullPage: false,
  })
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

async function clearBCollabs(page: Page): Promise<void> {
  const { url, key } = loadServiceKey()
  const listRes = await fetch(
    `${url}/rest/v1/event_collaborators?event_id=eq.${id}&invited_email=eq.${encodeURIComponent(w0.accountBEmail)}&select=id`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  const rows = (await listRes.json()) as Array<{ id: string }>
  for (const row of rows) {
    const del = await page.request.delete(`${BASE}/api/events/${id}/admins/${row.id}`)
    if (!del.ok() && del.status() !== 204) {
      await fetch(`${url}/rest/v1/event_collaborators?id=eq.${row.id}`, {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
    }
  }
}

async function safeClick(page: Page, step: string, click: () => Promise<void>): Promise<boolean> {
  try {
    await click()
    record(step, true)
    return true
  } catch (e) {
    record(step, false, e instanceof Error ? e.message.slice(0, 160) : String(e))
    return false
  }
}

async function visitOk(page: Page, path: string, assert: () => Promise<void>): Promise<void> {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  const status = res?.status() ?? 0
  const bounced = page.url().includes('/auth')
  try {
    expect(bounced).toBeFalsy()
    expect(status).toBeLessThan(400)
    await assert()
    record(`visit ${path}`, true, `status=${status}`)
  } catch (e) {
    record(`visit ${path}`, false, e instanceof Error ? e.message.slice(0, 160) : String(e))
    throw e
  }
}

test.describe.configure({ mode: 'serial' })
test.setTimeout(900_000)

test('Chrome deep click — host surfaces', async () => {
  log.length = 0
  const browser = await chromium.launch({
    headless: !HEADED,
    channel: 'chrome',
    slowMo: SLOW,
  })
  const context = await browser.newContext({
    storageState: AUTH_A,
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // —— Home filters ——
  await visitOk(page, '/home', async () => {
    await expect(page.getByRole('heading', { name: /your events/i })).toBeVisible()
  })
  await shot(page, '01-home')
  await safeClick(page, 'home → Collaborations filter', async () => {
    await page.getByRole('radio', { name: /collaborations/i }).click()
  })
  await safeClick(page, 'home → My events filter', async () => {
    await page.getByRole('radio', { name: /my events/i }).click()
  })
  await safeClick(page, 'home → Past filter', async () => {
    await page.getByRole('radio', { name: /^past$/i }).click()
  })
  await safeClick(page, 'home → Active filter', async () => {
    await page.getByRole('radio', { name: /^active$/i }).click()
  })

  // Open hub
  const hubLink = page.locator(`a[href="/events/${id}"]`).first()
  if (await hubLink.count()) {
    await hubLink.click()
  } else {
    await page.goto(`${BASE}/events/${id}`, { waitUntil: 'domcontentloaded' })
  }
  await expect(page.getByRole('heading', { name: new RegExp(w0.eventName, 'i') })).toBeVisible({
    timeout: 20_000,
  })
  record('open hub', true)
  await shot(page, '02-hub')

  // Quick actions
  for (const label of ['Send invites', 'Track RSVPs', 'Manage budget', 'Plan timeline']) {
    await page.goto(`${BASE}/events/${id}`, { waitUntil: 'domcontentloaded' })
    await safeClick(page, `hub QA → ${label}`, async () => {
      await page.getByRole('link', { name: new RegExp(label, 'i') }).first().click()
      await page.waitForLoadState('domcontentloaded')
      expect(page.url().includes('/auth')).toBeFalsy()
    })
  }
  await shot(page, '03-after-qa')

  // Guests — filters + add modal open/close
  await visitOk(page, `/events/${id}/guests`, async () => {
    await expect(page.getByText(/guest/i).first()).toBeVisible()
  })
  await shot(page, '04-guests')
  for (const f of ['All', 'Confirmed', 'Pending', 'Declined', 'Maybe']) {
    const btn = page.getByRole('button', { name: new RegExp(`^${f}$`, 'i') }).or(
      page.getByRole('radio', { name: new RegExp(`^${f}$`, 'i') }),
    )
    if (await btn.count()) {
      await safeClick(page, `guests filter ${f}`, async () => {
        await btn.first().click()
      })
    }
  }
  await safeClick(page, 'guests Add FAB open', async () => {
    await page.locator('.gm-add-fab').click()
    await expect(page.getByRole('dialog', { name: /add guest/i })).toBeVisible({ timeout: 10_000 })
  })
  await safeClick(page, 'guests Add modal close', async () => {
    await page.getByRole('dialog', { name: /add guest/i }).getByRole('button', { name: /^close$/i }).click()
    await expect(page.getByRole('dialog', { name: /add guest/i })).toHaveCount(0, { timeout: 10_000 })
  })

  // Planning — tabs + FAB modal
  await visitOk(page, `/events/${id}/planning`, async () => {
    await expect(page.locator('#plan-tab-checklist, [data-page="planning"]').first()).toBeVisible({
      timeout: 15_000,
    })
  })
  await shot(page, '05-planning')
  await safeClick(page, 'planning → Budget tab', async () => {
    await page.locator('#plan-tab-budget').click()
  })
  await safeClick(page, 'planning → Checklist tab', async () => {
    await page.locator('#plan-tab-checklist').click()
  })
  await safeClick(page, 'planning → Timeline view', async () => {
    await page.locator('#plan-view-timeline').click()
  })
  await safeClick(page, 'planning → List view', async () => {
    await page.locator('#plan-view-list').click()
  })
  await safeClick(page, 'planning Add task FAB', async () => {
    await page.locator('#plan-tab-checklist').click()
    await page.locator('#plan-add-fab').click()
    await expect(page.locator('#plan-task-modal.is-open')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('dialog', { name: /add task/i })).toBeVisible()
  })
  await safeClick(page, 'planning task modal close', async () => {
    await page.locator('#plan-task-modal.is-open').getByRole('button', { name: /^close$/i }).click()
    await expect(page.locator('#plan-task-modal.is-open')).toHaveCount(0, { timeout: 10_000 })
  })

  // Media tabs
  await visitOk(page, `/events/${id}/media`, async () => {
    await expect(page.getByText(/media|photo|memories/i).first()).toBeVisible()
  })
  await shot(page, '06-media')
  for (const tab of [/photos/i, /videos/i, /albums/i]) {
    const t = page.getByRole('tab', { name: tab })
    if (await t.count()) {
      await safeClick(page, `media tab ${tab}`, async () => {
        await t.first().click()
      })
    }
  }

  // Website nav
  await visitOk(page, `/events/${id}/website`, async () => {
    await expect(page.getByText(/overview|website|site/i).first()).toBeVisible()
  })
  await shot(page, '07-website')
  for (const label of ['Design', 'Photos', 'Pages', 'Overview']) {
    await safeClick(page, `website → ${label}`, async () => {
      await page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') }).first().click()
      await page.waitForLoadState('domcontentloaded')
    })
  }

  // Journey
  await visitOk(page, `/events/${id}/journey`, async () => {
    await expect(page.getByText(/journey|timeline|sub-event|event hub/i).first()).toBeVisible()
  })
  await shot(page, '08-journey')

  // Invitations
  await visitOk(page, `/events/${id}/invitations`, async () => {
    await expect(page.getByText(/invitation|draft|template/i).first()).toBeVisible()
  })
  await shot(page, '09-invitations')
  const templates = page.locator('[data-template], .template-card, button:has-text("Template"), .inv-template')
  const tCount = await templates.count()
  if (tCount > 0) {
    await safeClick(page, 'invitations pick template', async () => {
      await templates.nth(Math.min(1, tCount - 1)).click()
    })
  } else {
    record('invitations pick template', true, 'no discrete template cards — skipped')
  }

  // Settings — every nav tab
  const settingsTabs = [
    'General',
    'Website',
    'Admins',
    'Guest list',
    'Registry',
    'Plan & billing',
    'Usage',
  ]
  await page.goto(`${BASE}/events/${id}/settings`, { waitUntil: 'domcontentloaded' })
  for (const label of settingsTabs) {
    await safeClick(page, `settings → ${label}`, async () => {
      await page.getByRole('navigation', { name: /event settings/i }).getByRole('link', { name: new RegExp(label, 'i') }).click()
      await page.waitForLoadState('domcontentloaded')
      expect(page.url().includes('/auth')).toBeFalsy()
    })
  }
  await shot(page, '10-settings')

  // Notification bell
  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' })
  await safeClick(page, 'open notification bell', async () => {
    const bell = page.getByRole('button', { name: /notification/i }).or(
      page.locator('button[aria-label*="otif" i], .fn-bell, [data-notif-bell]').first(),
    )
    await bell.first().click()
    await page.waitForTimeout(500)
  })
  await shot(page, '11-bell')

  // User settings sections (scroll/click if present)
  await visitOk(page, '/settings', async () => {
    await expect(page.getByText(/profile|account|security|notification/i).first()).toBeVisible()
  })
  await shot(page, '12-user-settings')
  for (const section of [/profile/i, /security/i, /notification/i, /account/i]) {
    const link = page.getByRole('link', { name: section }).or(page.getByRole('button', { name: section }))
    if (await link.count()) {
      await safeClick(page, `user settings → ${section}`, async () => {
        await link.first().click()
      })
    }
  }

  // Public guest site if slug discoverable from website overview
  await page.goto(`${BASE}/events/${id}/website`, { waitUntil: 'domcontentloaded' })
  const slugLink = page.locator('a[href*="/e/"]').first()
  if (await slugLink.count()) {
    const href = await slugLink.getAttribute('href')
    if (href) {
      await safeClick(page, `public site ${href}`, async () => {
        await page.goto(href.startsWith('http') ? href : `${BASE}${href}`, {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        })
        expect(page.url()).toMatch(/\/e\//)
      })
      await shot(page, '13-public-site')
    }
  } else {
    record('public site', true, 'no /e/ link on overview — skipped')
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(resolve(OUT_DIR, 'w3-chrome-deep-host.json'), JSON.stringify({ base: BASE, log }, null, 2))
  await browser.close()

  const failed = log.filter((l) => !l.ok)
  expect(failed, `host failures: ${JSON.stringify(failed, null, 2)}`).toHaveLength(0)
})

test('Chrome deep click — collab invite Accept + surfaces + decline', async () => {
  log.length = 0
  const browser = await chromium.launch({
    headless: !HEADED,
    channel: 'chrome',
    slowMo: SLOW,
  })
  const aCtx = await browser.newContext({ storageState: AUTH_A, viewport: { width: 1280, height: 800 } })
  const aPage = await aCtx.newPage()
  await aPage.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' })
  await clearBCollabs(aPage)

  // Invite viewer via Admins UI
  await aPage.goto(`${BASE}/events/${id}/settings/admins`, { waitUntil: 'domcontentloaded' })
  await aPage.getByRole('button', { name: /add co-host/i }).click()
  const dialog = aPage.getByRole('dialog', { name: /invite a co-host/i })
  await expect(dialog).toBeVisible()
  await dialog.locator('#es-cohost-email').fill(w0.accountBEmail)
  await dialog.locator('#es-cohost-role').selectOption('viewer')
  await dialog.getByRole('button', { name: /send invite/i }).click()
  await expect(aPage.getByRole('status').filter({ hasText: /invite sent/i })).toBeVisible({ timeout: 20_000 })
  record('collab invite UI', true)
  await shot(aPage, '20-invite-sent')

  const bCtx = await browser.newContext({ storageState: AUTH_B, viewport: { width: 1280, height: 800 } })
  const bPage = await bCtx.newPage()
  await bPage.goto(`${BASE}/home`, { waitUntil: 'networkidle' })

  // Bell path (best-effort) then Collaborations Accept
  await safeClick(bPage, 'collab open bell', async () => {
    const bell = bPage.getByRole('button', { name: /notification/i }).or(
      bPage.locator('button[aria-label*="otif" i], .fn-bell').first(),
    )
    await bell.first().click()
    await bPage.waitForTimeout(600)
  })
  await shot(bPage, '21-bell-b')

  await bPage.getByRole('radio', { name: /collaborations/i }).click()
  await expect(bPage.locator('.pending-invite-card').first()).toBeVisible({ timeout: 20_000 })
  await shot(bPage, '22-pending')
  await bPage.locator('.pending-invite-card').first().getByRole('button', { name: /^accept$/i }).click()
  await expect(bPage.locator('.pending-invite-card')).toHaveCount(0, { timeout: 25_000 })
  record('collab Accept UI', true)

  const eventLink = bPage.locator(`a[href="/events/${id}"]`).first()
  await expect(eventLink).toBeVisible({ timeout: 25_000 })
  await eventLink.click()
  await expect(bPage.getByRole('heading', { name: new RegExp(w0.eventName, 'i') })).toBeVisible()
  record('collab open hub', true)
  await shot(bPage, '23-collab-hub')

  // Click through collab-visible surfaces (retry once — Next HMR can 500 mid-run)
  for (const path of [
    `/events/${id}/guests`,
    `/events/${id}/planning`,
    `/events/${id}/media`,
    `/events/${id}/website`,
    `/events/${id}/settings`,
    `/events/${id}/settings/billing`,
  ]) {
    let res = await bPage.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    let status = res?.status() ?? 0
    if (!status || status >= 500) {
      await bPage.waitForTimeout(1200)
      res = await bPage.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      status = res?.status() ?? 0
    }
    const bounced = bPage.url().includes('/auth')
    const ok = !bounced && status > 0 && status < 500
    record(`collab visit ${path}`, ok, `status=${status || 'undefined'}`)
  }

  // Forbidden write as viewer
  const guests = await bPage.request.post(`${BASE}/api/events/${id}/guests`, {
    data: { name: 'Should Fail' },
  })
  expect(guests.status()).toBe(404)
  record('viewer guests write forbidden', true, '404')

  // Remove collab as host, re-invite + Decline UI
  await clearBCollabs(aPage)
  await aPage.goto(`${BASE}/events/${id}/settings/admins`, { waitUntil: 'domcontentloaded' })
  await aPage.getByRole('button', { name: /add co-host/i }).click()
  const d2 = aPage.getByRole('dialog', { name: /invite a co-host/i })
  await d2.locator('#es-cohost-email').fill(w0.accountBEmail)
  await d2.locator('#es-cohost-role').selectOption('planner')
  await d2.getByRole('button', { name: /send invite/i }).click()
  await expect(aPage.getByRole('status').filter({ hasText: /invite sent/i })).toBeVisible({ timeout: 20_000 })

  await bPage.goto(`${BASE}/home`, { waitUntil: 'networkidle' })
  await bPage.getByRole('radio', { name: /collaborations/i }).click()
  await expect(bPage.locator('.pending-invite-card').first()).toBeVisible({ timeout: 20_000 })
  bPage.once('dialog', async (dlg) => {
    await dlg.accept()
  })
  await bPage.locator('.pending-invite-card').first().getByRole('button', { name: /^decline$/i }).click()
  await expect(bPage.locator('.pending-invite-card')).toHaveCount(0, { timeout: 25_000 })
  record('collab Decline UI', true)
  await shot(bPage, '24-declined')

  await clearBCollabs(aPage)
  writeFileSync(resolve(OUT_DIR, 'w3-chrome-deep-collab.json'), JSON.stringify({ base: BASE, log }, null, 2))
  await browser.close()

  const failed = log.filter((l) => !l.ok)
  expect(failed, `collab failures: ${JSON.stringify(failed, null, 2)}`).toHaveLength(0)
})
