import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const EVENT_ID = 'db6a6dc2-3e3b-4f58-a830-434f1f7cd7d4'
const BASE = 'http://localhost:3000'
const OUT = 'qa/_shots/website-parity'
const WIDTHS = [360, 768, 1024, 1440]
const PAGES = [
  ['overview', `/events/${EVENT_ID}/website`],
  ['design', `/events/${EVENT_ID}/website/design`],
  ['photos', `/events/${EVENT_ID}/website/photos`],
  ['pages', `/events/${EVENT_ID}/website/edit`],
  ['editor-home', `/events/${EVENT_ID}/website/edit/home`],
]

async function login(page) {
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' })
  if (!page.url().includes('/auth')) return
  const tel = page.locator('input[type="tel"]').first()
  if (await tel.count() === 0) return
  await tel.fill('9999999999')
  const send = page.getByRole('button', { name: /send otp|continue|get otp/i }).first()
  await send.click()
  await page.waitForTimeout(800)
  const cells = page.locator('input.pin-input-cell, input[autocomplete="one-time-code"], input[inputmode="numeric"]')
  const n = await cells.count()
  const otp = '123456'
  if (n >= 6) {
    for (let i = 0; i < 6; i++) await cells.nth(i).fill(otp[i])
  } else if (n === 1) {
    await cells.first().fill(otp)
  }
  const verify = page.getByRole('button', { name: /verify|continue/i }).first()
  if (await verify.count()) await verify.click()
  await page.waitForTimeout(2500)
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  const page = await context.newPage()
  await login(page)

  for (const [name, path] of PAGES) {
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: w <= 768 ? 900 : 1100 })
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.locator('.preloader').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(400)
      const dest = `${OUT}/${name}-${w}.png`
      await page.screenshot({ path: dest, fullPage: true })
      console.log('wrote', dest, 'url=', page.url())
    }
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
