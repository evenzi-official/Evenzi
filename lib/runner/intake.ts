import * as readline from 'readline'
import { loadAgent } from './loader'
import { runAgentLLM } from '@/lib/llm/router'
import { createTask } from './clickup'
import type { IntakeResult, BudgetTier } from './types'

const MAX_TURNS = 10

/**
 * Runs the intake conversation loop.
 * The intake agent asks clarifying questions, user responds,
 * until the agent signals it has enough info.
 */
export async function runIntake(initialIdea?: string): Promise<IntakeResult> {
  const agent = await loadAgent('intake_agent')

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve))

  const conversationHistory: string[] = []

  if (initialIdea) {
    conversationHistory.push(`User: ${initialIdea}`)
    console.log(`\n[intake] Starting with: "${initialIdea}"\n`)
  } else {
    const idea = await ask('[intake] What would you like to build? ')
    conversationHistory.push(`User: ${idea}`)
  }

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const context = conversationHistory.join('\n')
    const prompt = turn === 0 && !initialIdea
      ? 'Start gathering requirements for this feature request. Ask your first clarifying question.'
      : 'Continue the conversation. Ask the next question, or if you have enough info, respond with a JSON block wrapped in ```json``` containing the IntakeResult.'

    const result = await runAgentLLM(
      {
        provider: agent.provider,
        model_id: agent.model,
        prompt: agent.systemPrompt,
        token_budget: agent.tokenBudget,
      },
      prompt,
      context
    )

    const response = result.text

    // Check if agent returned structured JSON (conversation complete)
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      rl.close()
      const intake = JSON.parse(jsonMatch[1]) as IntakeResult
      console.log(`\n[intake] Requirements gathered. Summary:`)
      console.log(`  Title: ${intake.title}`)
      console.log(`  Pipeline: ${intake.pipeline}`)
      console.log(`  Priority: ${intake.priority}`)
      console.log(`  Criteria: ${intake.acceptanceCriteria.length} items`)
      return intake
    }

    // Agent is still asking questions
    console.log(`\n[intake] ${response}\n`)
    conversationHistory.push(`Agent: ${response}`)

    const answer = await ask('[you] ')
    conversationHistory.push(`User: ${answer}`)
  }

  rl.close()
  throw new Error('Intake conversation exceeded maximum turns without producing a result')
}

/**
 * Runs intake and optionally creates a ClickUp task.
 */
export async function runIntakeAndCreateTask(
  initialIdea?: string,
  clickupListId?: string
): Promise<{ intake: IntakeResult; taskId?: string }> {
  const intake = await runIntake(initialIdea)

  if (clickupListId) {
    const priorityMap: Record<BudgetTier, number> = {
      urgent: 1, high: 2, normal: 3, low: 4, override: 3,
    }
    const taskId = await createTask(
      clickupListId,
      intake.title,
      intake.description,
      intake.tags,
      priorityMap[intake.priority]
    )
    console.log(`[intake] ClickUp task created: ${taskId}`)
    return { intake, taskId }
  }

  return { intake }
}
