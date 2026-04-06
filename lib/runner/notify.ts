import type { RunLog, StepResult } from './types'

interface EmailPayload {
  subject: string
  html: string
}

/**
 * Builds an email payload for a completed run summary.
 */
export function buildRunSummaryEmail(log: RunLog): EmailPayload {
  const stepRows = log.steps
    .map(s => {
      const tokens = s.inputTokens + s.outputTokens
      return `<tr>
        <td>${s.stepName}</td>
        <td>${s.agentRole}</td>
        <td>${s.model}</td>
        <td>${tokens.toLocaleString()}</td>
        <td>$${s.estimatedCostUsd.toFixed(4)}</td>
        <td>${(s.durationMs / 1000).toFixed(1)}s</td>
        <td>${s.status}</td>
      </tr>`
    })
    .join('\n')

  return {
    subject: `[Runner] ${log.config.pipeline} — ${log.status} — $${log.totalCostUsd.toFixed(2)}`,
    html: `
      <h2>Pipeline Run: ${log.config.pipeline}</h2>
      <p><strong>Status:</strong> ${log.status}</p>
      <p><strong>Total:</strong> ${(log.totalInputTokens + log.totalOutputTokens).toLocaleString()} tokens | $${log.totalCostUsd.toFixed(2)} | ${(log.totalDurationMs / 1000).toFixed(1)}s</p>
      <p><strong>Priority:</strong> ${log.config.priority} | <strong>Source:</strong> ${log.config.source}</p>
      <table border="1" cellpadding="4" cellspacing="0">
        <tr><th>Step</th><th>Agent</th><th>Model</th><th>Tokens</th><th>Cost</th><th>Duration</th><th>Status</th></tr>
        ${stepRows}
      </table>
      <p><strong>Run ID:</strong> ${log.id}</p>
    `.trim(),
  }
}

/**
 * Builds an email payload for a budget alert.
 */
export function buildBudgetAlertEmail(
  step: StepResult,
  stepCost: number,
  stepLimit: number,
  runTotal: number,
  runLimit: number
): EmailPayload {
  return {
    subject: `[Runner] Budget Alert — ${step.stepName} ($${stepCost.toFixed(2)} > $${stepLimit.toFixed(2)})`,
    html: `
      <h2>Budget Alert</h2>
      <p><strong>Step:</strong> ${step.stepName} (${step.agentRole} → ${step.model})</p>
      <p><strong>Step cost:</strong> $${stepCost.toFixed(2)} (limit: $${stepLimit.toFixed(2)})</p>
      <p><strong>Run total:</strong> $${runTotal.toFixed(2)} (limit: $${runLimit === Infinity ? 'unlimited' : runLimit.toFixed(2)})</p>
      <p><strong>Tokens:</strong> ${(step.inputTokens + step.outputTokens).toLocaleString()}</p>
    `.trim(),
  }
}

/**
 * Builds an email payload for an approval gate notification.
 */
export function buildApprovalEmail(
  featureName: string,
  pipeline: string,
  planSummary: string,
  costSoFar: number,
  estimatedRemaining: number,
  clickupTaskId?: string
): EmailPayload {
  const taskLink = clickupTaskId
    ? `<p><a href="https://app.clickup.com/t/${clickupTaskId}">View in ClickUp</a></p>`
    : ''

  return {
    subject: `[Runner] Approval Needed — ${featureName} — $${costSoFar.toFixed(2)} spent, ~$${estimatedRemaining.toFixed(2)} remaining`,
    html: `
      <h2>Approval Needed: ${featureName}</h2>
      <p><strong>Pipeline:</strong> ${pipeline}</p>
      <p><strong>Cost so far:</strong> $${costSoFar.toFixed(2)}</p>
      <p><strong>Estimated remaining:</strong> ~$${estimatedRemaining.toFixed(2)}</p>
      ${taskLink}
      <h3>Plan Summary</h3>
      <pre>${planSummary}</pre>
    `.trim(),
  }
}

/**
 * Sends an email using Resend. No-ops if RESEND_API_KEY or RUNNER_ALERT_EMAIL is not set.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.RUNNER_ALERT_EMAIL

  if (!apiKey || !to) return false

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'Runner <noreply@resend.dev>',
      to,
      subject: payload.subject,
      html: payload.html,
    })
    return true
  } catch {
    console.error(`\x1b[31m[runner] Failed to send email\x1b[0m`)
    return false
  }
}

/**
 * Sends a run summary email if configured.
 */
export async function notifyRunComplete(log: RunLog): Promise<void> {
  if (process.env.RUNNER_EMAIL_ON_COMPLETE !== 'true') return
  const payload = buildRunSummaryEmail(log)
  await sendEmail(payload)
}

/**
 * Sends a budget alert email if configured.
 */
export async function notifyBudgetAlert(
  step: StepResult,
  stepCost: number,
  stepLimit: number,
  runTotal: number,
  runLimit: number
): Promise<void> {
  if (process.env.RUNNER_EMAIL_ON_ALERT !== 'true') return
  const payload = buildBudgetAlertEmail(step, stepCost, stepLimit, runTotal, runLimit)
  await sendEmail(payload)
}

/**
 * Sends an approval needed email if configured.
 */
export async function notifyApprovalNeeded(
  featureName: string,
  pipeline: string,
  planSummary: string,
  costSoFar: number,
  estimatedRemaining: number,
  clickupTaskId?: string
): Promise<void> {
  if (process.env.RUNNER_EMAIL_ON_ALERT !== 'true') return
  const payload = buildApprovalEmail(featureName, pipeline, planSummary, costSoFar, estimatedRemaining, clickupTaskId)
  await sendEmail(payload)
}
