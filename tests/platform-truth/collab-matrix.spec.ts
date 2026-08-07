/**
 * Platform truth audit — W3 collab role matrix + host smoke.
 * Fixtures from W0: tests/.auth/*, scripts/e2e/w0-env.json
 * Does NOT delete fixtures.
 *
 * Run: npx playwright test tests/platform-truth/collab-matrix.spec.ts --reporter=line
 */
import { chromium, expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const BASE = 'http://127.0.0.1:3000'
const ROOT = resolve(__dirname, '../..')
const w0 = JSON.parse(readFileSync(resolve(ROOT, 'scripts/e2e/w0-env.json'), 'utf8')) as {
  eventId: string
  accountBEmail: string
  eventName: string
}

const ROLES = ['co-host', 'planner', 'photographer', 'viewer'] as const
type Role = (typeof ROLES)[number]

const results: Record<string, unknown> = {
  eventId: w0.eventId,
  accountBEmail: w0.accountBEmail,
  roles: {} as Record<string, Record<string, unknown>>,
  hostSmoke: {} as Record<string, unknown>,
}

async function ctxA(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: resolve(ROOT, 'tests/.auth/user-a.json') })
}
async function ctxB(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: resolve(ROOT, 'tests/.auth/user-b.json') })
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

/** Remove all B collab rows for the e2e event (no GET /admins route exists). */
async function clearBCollabs(ownerPage: Page): Promise<void> {
  const { url, key } = loadServiceKey()
  const listRes = await fetch(
    `${url}/rest/v1/event_collaborators?event_id=eq.${w0.eventId}&invited_email=eq.${encodeURIComponent(w0.accountBEmail)}&select=id`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const rows = (await listRes.json()) as Array<{ id: string }>
  for (const row of rows) {
    // Prefer owner session DELETE (exercises real API); fall back to service-role
    const del = await ownerPage.request.delete(`${BASE}/api/events/${w0.eventId}/admins/${row.id}`)
    if (!del.ok() && del.status() !== 204) {
      await fetch(`${url}/rest/v1/event_collaborators?id=eq.${row.id}`, {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
    }
  }
}

async function inviteRole(page: Page, role: Role): Promise<{ ok: boolean; status: number; body: unknown; collaboratorId?: string }> {
  const res = await page.request.post(`${BASE}/api/events/${w0.eventId}/admins`, {
    data: { email: w0.accountBEmail, role },
  })
  const body = await res.json().catch(() => ({}))
  const collaboratorId =
    (body as { collaborator?: { id: string }; id?: string; collaboratorId?: string }).collaborator?.id ||
    (body as { id?: string }).id ||
    (body as { collaboratorId?: string }).collaboratorId
  return { ok: res.ok(), status: res.status(), body, collaboratorId }
}

test.describe.configure({ mode: 'serial' })
test.setTimeout(300_000)

test('W3 host smoke — key routes load for Account A', async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const context = await ctxA(browser)
  const page = await context.newPage()
  const id = w0.eventId
  const routes = [
    '/home',
    `/events/${id}`,
    `/events/${id}/guests`,
    `/events/${id}/planning`,
    `/events/${id}/media`,
    `/events/${id}/website`,
    `/events/${id}/settings`,
    `/events/${id}/settings/admins`,
    `/events/${id}/invitations`,
    '/settings',
  ]
  for (const path of routes) {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    const status = res?.status() ?? 0
    const onAuth = page.url().includes('/auth')
    results.hostSmoke[path] = { status, onAuth, finalUrl: page.url() }
    expect(onAuth, `${path} redirected to auth`).toBeFalsy()
    expect(status, `${path} status`).toBeLessThan(400)
  }
  mkdirSync(resolve(ROOT, 'docs/testing/audit-2026-08-07'), { recursive: true })
  writeFileSync(resolve(ROOT, 'docs/testing/audit-2026-08-07/w3-e2e-partial.json'), JSON.stringify(results, null, 2))
  await browser.close()
})

test('W3 collab matrix — invite / accept / capability / cleanup per role', async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })

  for (const role of ROLES) {
    const roleResult: Record<string, unknown> = { role }
    const aCtx = await ctxA(browser)
    const aPage = await aCtx.newPage()
    await aPage.goto(`${BASE}/home`, { waitUntil: 'networkidle' })
    await clearBCollabs(aPage)

    const invited = await inviteRole(aPage, role)
    roleResult.invite = { status: invited.status, ok: invited.ok, body: invited.body, collaboratorId: invited.collaboratorId }
    expect(invited.ok, `invite ${role}`).toBeTruthy()

    // B: Collaborations pending
    const bCtx = await ctxB(browser)
    const bPage = await bCtx.newPage()
    await bPage.goto(`${BASE}/home`, { waitUntil: 'networkidle' })

    // Prefer Collaborations tab if present
    const collabTab = bPage.getByRole('tab', { name: /collaboration/i }).or(bPage.getByRole('button', { name: /collaboration/i })).or(bPage.getByText(/collaborations/i).first())
    if (await collabTab.count()) {
      await collabTab.first().click().catch(() => {})
    }
    await bPage.waitForTimeout(800)

    const pendingVisible =
      (await bPage.getByText(/e2e-truth-audit/i).count()) > 0 ||
      (await bPage.locator('.pending-invite-card').count()) > 0 ||
      (await bPage.getByRole('button', { name: /^accept$/i }).count()) > 0

    roleResult.pendingVisible = pendingVisible

    // Accept via API (bell/collaborations both hit these)
    let acceptStatus = 0
    let acceptBody: unknown = null
    if (invited.collaboratorId) {
      const acc = await bPage.request.post(
        `${BASE}/api/collaborators/invites/${invited.collaboratorId}/accept`,
        { data: {} }
      )
      acceptStatus = acc.status()
      acceptBody = await acc.json().catch(() => null)
    } else {
      const acc = await bPage.request.post(
        `${BASE}/api/collaborators/invites/by-event/${w0.eventId}/accept`,
        { data: {} }
      )
      acceptStatus = acc.status()
      acceptBody = await acc.json().catch(() => null)
    }
    roleResult.accept = { status: acceptStatus, body: acceptBody }
    expect(acceptStatus, `accept ${role}`).toBe(200)

    // Capability probes (expect 403/404 for forbidden writes)
    const probes: Record<string, number> = {}
    const mediaUpload = await bPage.request.post(`${BASE}/api/events/${w0.eventId}/media/upload-url`, {
      data: { contentType: 'image/jpeg', kind: 'photo' },
    })
    probes['media/upload-url'] = mediaUpload.status()

    const guestsGet = await bPage.request.get(`${BASE}/api/events/${w0.eventId}/guests`)
    probes['guests GET'] = guestsGet.status()

    const planningGet = await bPage.request.get(`${BASE}/api/events/${w0.eventId}/planning/tasks`).catch(async () => {
      // fallback path
      return bPage.request.get(`${BASE}/api/events/${w0.eventId}/planning`)
    })
    probes['planning'] = planningGet.status()

    const websiteSettings = await bPage.request.get(`${BASE}/api/events/${w0.eventId}/website-settings`)
    probes['website-settings GET'] = websiteSettings.status()

    const adminsGet = await bPage.request.get(`${BASE}/api/events/${w0.eventId}/admins`)
    probes['admins GET'] = adminsGet.status()

    roleResult.probes = probes
    roleResult.capabilityExpectations = {
      'co-host': 'media/guests/planning/website/admins allowed (2xx)',
      planner: 'guests+planning 2xx; media/website/admins forbidden',
      photographer: 'media 2xx; guests/planning/website/admins forbidden',
      viewer: 'reads may 2xx; writes forbidden',
    }[role]

    await clearBCollabs(aPage)

    ;(results.roles as Record<string, unknown>)[role] = roleResult
    await bCtx.close()
    await aCtx.close()
  }

  writeFileSync(
    resolve(ROOT, 'docs/testing/audit-2026-08-07/w3-e2e.json'),
    JSON.stringify(results, null, 2)
  )
  await browser.close()
})

test('W3 decline path — invite then decline from B', async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const aCtx = await ctxA(browser)
  const aPage = await aCtx.newPage()
  await aPage.goto(`${BASE}/home`, { waitUntil: 'networkidle' })
  await clearBCollabs(aPage)
  const invited = await inviteRole(aPage, 'viewer')
  expect(invited.ok).toBeTruthy()

  const bCtx = await ctxB(browser)
  const bPage = await bCtx.newPage()
  const dec = invited.collaboratorId
    ? await bPage.request.post(`${BASE}/api/collaborators/invites/${invited.collaboratorId}/decline`, { data: {} })
    : await bPage.request.post(`${BASE}/api/collaborators/invites/by-event/${w0.eventId}/decline`, { data: {} })
  results.decline = { status: dec.status(), body: await dec.json().catch(() => null) }
  expect(dec.status()).toBe(200)

  writeFileSync(resolve(ROOT, 'docs/testing/audit-2026-08-07/w3-e2e.json'), JSON.stringify(results, null, 2))
  await browser.close()
})
