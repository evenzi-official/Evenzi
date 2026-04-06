import { runIntakeAndCreateTask } from '../lib/runner/intake'

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  // First non-flag argument is the initial idea
  const initialIdea = args.find(a => !a.startsWith('--')) || undefined

  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag)
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined
  }

  const clickupListId = getArg('--list') ?? process.env.CLICKUP_DEFAULT_LIST_ID

  const { intake, taskId } = await runIntakeAndCreateTask(initialIdea, clickupListId)

  console.log('\n[intake] Done.')
  console.log(`  Title: ${intake.title}`)
  console.log(`  Pipeline: ${intake.pipeline}`)
  console.log(`  Priority: ${intake.priority}`)
  if (taskId) {
    console.log(`  ClickUp Task: ${taskId}`)
  }
}

main().catch(err => {
  console.error('[intake] Fatal error:', err.message)
  process.exit(1)
})
