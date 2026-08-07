/**
 * W0 setup for platform truth audit.
 * Run: npx tsx scripts/e2e/w0-setup.ts
 *
 * Creates Account B, Playwright storageStates for A+B, e2e event under A.
 * Does NOT delete fixtures (founder cleans later).
 * Does NOT commit.
 */
import { createClient } from '@supabase/supabase-js'
import { chromium, type BrowserContext } from '@playwright/test'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../..')
const BASE = 'http://127.0.0.1:3000'
const ACCOUNT_B_EMAIL = 'e2e.collab.b@evenzi.test'
const ACCOUNT_B_PASSWORD = 'E2eTruthAudit!2026-08-07'
const EVENT_NAME = 'e2e-truth-audit'

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    env[k] = v
  }
  return env
}

async function loginPhoneA(context: BrowserContext): Promise<void> {
  const page = await context.newPage()
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
  await page.close()
}

/** Inject a session the same way @supabase/ssr browser client would. */
async function injectSession(
  context: BrowserContext,
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const page = await context.newPage()
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    async ({ supabaseUrl, anonKey, accessToken, refreshToken }) => {
      // Dynamic import from the app's bundled path is hard; use CDN ESM for one-shot setSession
      // then let the next navigation use cookies set by createBrowserClient pattern via document.cookie
      const { createBrowserClient } = await import('https://esm.sh/@supabase/ssr@0.6.1')
      const sb = createBrowserClient(supabaseUrl, anonKey)
      const { error } = await sb.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) throw new Error(error.message)
    },
    { supabaseUrl, anonKey, accessToken, refreshToken }
  )
  // Navigate so middleware picks up cookies
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle', timeout: 45_000 })
  if (page.url().includes('/auth')) {
    throw new Error('Account B session inject failed — still on /auth')
  }
  if (page.url().includes('role-selection')) {
    const host = page.getByRole('button', { name: /host|continue|get started/i }).first()
    if (await host.count()) await host.click()
    await page.waitForURL('**/home', { timeout: 30_000 })
  }
  await page.close()
}

async function main(): Promise<void> {
  const env = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Missing Supabase env vars')
  }

  mkdirSync(resolve(ROOT, 'tests/.auth'), { recursive: true })
  mkdirSync(resolve(ROOT, 'scripts/e2e'), { recursive: true })

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // --- Account A id ---
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listErr) throw listErr
  const userA = listed.users.find((u) => (u.phone || '').includes('9999999999'))
  if (!userA) throw new Error('Account A phone user not found')
  console.log('Account A', userA.id)

  // --- Account B upsert ---
  let userB = listed.users.find((u) => (u.email || '').toLowerCase() === ACCOUNT_B_EMAIL)
  if (!userB) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: ACCOUNT_B_EMAIL,
      password: ACCOUNT_B_PASSWORD,
      email_confirm: true,
      user_metadata: { e2e: true, purpose: 'platform-truth-audit' },
    })
    if (createErr) throw createErr
    userB = created.user
    console.log('Created Account B', userB.id)
  } else {
    // ensure confirmed + password known
    await admin.auth.admin.updateUserById(userB.id, {
      email_confirm: true,
      password: ACCOUNT_B_PASSWORD,
    })
    console.log('Reused Account B', userB.id)
  }

  // Ensure host profile for B (role selection gate)
  const { error: profErr } = await admin.from('user_profiles').upsert(
    {
      id: userB.id,
      role_slug: 'host',
      display_name: 'E2E Collab B',
      email: ACCOUNT_B_EMAIL,
      auth_provider: 'email',
      onboarding_completed: true,
    },
    { onConflict: 'id' }
  )
  if (profErr) {
    console.warn('user_profiles upsert warning:', profErr.message)
    // try update only
    await admin.from('user_profiles').update({
      role_slug: 'host',
      display_name: 'E2E Collab B',
      email: ACCOUNT_B_EMAIL,
      onboarding_completed: true,
    }).eq('id', userB.id)
  }

  // Sign in B to get tokens
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: signed, error: signErr } = await anon.auth.signInWithPassword({
    email: ACCOUNT_B_EMAIL,
    password: ACCOUNT_B_PASSWORD,
  })
  if (signErr || !signed.session) throw signErr ?? new Error('No session for B')

  // --- Playwright storageStates ---
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })

  const ctxA = await browser.newContext()
  await loginPhoneA(ctxA)
  await ctxA.storageState({ path: resolve(ROOT, 'tests/.auth/user-a.json') })
  console.log('Wrote tests/.auth/user-a.json')

  const ctxB = await browser.newContext()
  await injectSession(
    ctxB,
    supabaseUrl,
    anonKey,
    signed.session.access_token,
    signed.session.refresh_token
  )
  await ctxB.storageState({ path: resolve(ROOT, 'tests/.auth/user-b.json') })
  console.log('Wrote tests/.auth/user-b.json')

  // --- Create e2e event as A via authenticated API (reuse if exists) ---
  // Note: service_role cannot call create_event_with_details (requires auth.uid());
  // config schema also denied via PostgREST for service_role — use Account A session.
  const page = await ctxA.newPage()
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' })

  const eventsRes = await page.request.get(`${BASE}/api/events`)
  const eventsJson = (await eventsRes.json()) as {
    events?: Array<{ id: string; name: string }>
  }
  let eventId = eventsJson.events?.find((e) => e.name === EVENT_NAME)?.id

  if (!eventId) {
    const WEDDING_TYPE_ID = 'b2fbb279-600b-4032-81cf-1dc6cfb1020d'
    const createRes = await page.request.post(`${BASE}/api/events`, {
      data: {
        eventTypeId: WEDDING_TYPE_ID,
        eventTitle: EVENT_NAME,
        primaryDate: '2026-12-15',
        primaryVenue: 'E2E Test Venue',
        guestCapacity: 50,
        metadata: { partner_1_name: 'E2E', partner_2_name: 'Audit' },
        subEvents: [],
      },
    })
    const body = (await createRes.json()) as { event?: { id: string; name: string }; error?: string }
    if (!createRes.ok() || !body.event?.id) {
      throw new Error(`Event create failed: ${createRes.status()} ${JSON.stringify(body)}`)
    }
    eventId = body.event.id
    console.log('Created event', eventId)
  } else {
    console.log('Reused event', eventId)
  }

  await page.close()
  await browser.close()

  const w0 = {
    createdAt: new Date().toISOString(),
    accountAId: userA.id,
    accountBId: userB.id,
    accountBEmail: ACCOUNT_B_EMAIL,
    eventId,
    eventName: EVENT_NAME,
    note: 'Do not auto-delete — founder cleans after review',
  }
  writeFileSync(resolve(ROOT, 'scripts/e2e/w0-env.json'), JSON.stringify(w0, null, 2))
  console.log('Wrote scripts/e2e/w0-env.json')
  console.log(JSON.stringify(w0, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
