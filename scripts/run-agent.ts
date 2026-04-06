import { executePipeline } from '../lib/runner/executor'
import { fetchTaskAsRunConfig } from '../lib/runner/clickup'
import { readFile } from 'fs/promises'
import type { RunConfig, BudgetTier } from '../lib/runner/types'

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag)
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined
  }

  const hasFlag = (flag: string): boolean => args.includes(flag)

  // ClickUp mode
  const clickupTaskId = getArg('--clickup')
  if (clickupTaskId) {
    console.log(`[runner] Fetching ClickUp task: ${clickupTaskId}`)
    const config = await fetchTaskAsRunConfig(clickupTaskId)
    await executePipeline(config)
    return
  }

  // File mode
  const filePath = getArg('--file')
  let input: string
  if (filePath) {
    input = await readFile(filePath, 'utf-8')
  } else {
    input = getArg('--input') ?? ''
  }

  if (!input) {
    console.error('Usage:')
    console.error('  npm run agent -- --input "feature description"')
    console.error('  npm run agent -- --file ./features/my-feature.md')
    console.error('  npm run agent -- --clickup TASK_ID')
    console.error('')
    console.error('Options:')
    console.error('  --pipeline <name>    Pipeline type (default: feature)')
    console.error('  --priority <tier>    Budget tier (default: normal)')
    console.error('  --no-budget-limit    Disable budget enforcement')
    process.exit(1)
  }

  const config: RunConfig = {
    pipeline: getArg('--pipeline') ?? 'feature',
    input,
    priority: (getArg('--priority') as BudgetTier) ?? 'normal',
    source: 'cli',
    noBudgetLimit: hasFlag('--no-budget-limit'),
  }

  await executePipeline(config)
}

main().catch(err => {
  console.error('[runner] Fatal error:', err.message)
  process.exit(1)
})
