import { readFileSync } from 'fs'
import { join } from 'path'
import { runSystemCheck } from '../lib/runner/sys-check'

// Load .env.local manually (no dotenv dependency)
const envPath = join(process.cwd(), '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
} catch {
  console.log('[sys-check] No .env.local found — using existing environment variables\n')
}

async function main() {
  const result = await runSystemCheck()
  console.log(result.output)
  console.log(`\n[sys-check] Duration: ${result.durationMs}ms | Cost: $${result.estimatedCostUsd}`)
  process.exit(result.status === 'completed' ? 0 : 1)
}

main()
