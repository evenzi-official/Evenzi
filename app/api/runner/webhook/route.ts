import { NextResponse, type NextRequest } from 'next/server'
import { executePipeline } from '@/lib/runner/executor'
import { fetchTaskAsRunConfig, postTaskComment, buildResultComment, updateTaskStatus } from '@/lib/runner/clickup'
import { createHmac, timingSafeEqual } from 'crypto'

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.CLICKUP_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expected = createHmac('sha256', secret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    // Verify webhook signature if secret is configured
    if (process.env.CLICKUP_WEBHOOK_SECRET) {
      if (!verifyWebhookSignature(body, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)

    // ClickUp sends different event types — we care about task status changes
    // and tag additions
    const eventType = payload.event
    const taskId = payload.task_id

    if (!taskId) {
      return NextResponse.json({ error: 'No task_id in payload' }, { status: 400 })
    }

    // Only process relevant events
    const relevantEvents = ['taskStatusUpdated', 'taskTagUpdated']
    if (!relevantEvents.includes(eventType)) {
      return NextResponse.json({ status: 'ignored', event: eventType })
    }

    // Fetch the full task and check if it should trigger the runner
    const config = await fetchTaskAsRunConfig(taskId)

    // Determine if this is a new run or a resume from approval gate
    // Status "Approved" means the user approved a pending pipeline
    // Status "Ready for Agent" or tag "run-agent" means new pipeline run
    const isApprovalResume = payload.history_items?.some(
      (h: { field: string; after: { status: string } }) =>
        h.field === 'status' && h.after?.status === 'Approved'
    )

    if (isApprovalResume) {
      console.log(`[webhook] Approval received for task ${taskId}, resuming pipeline`)
    }

    // Execute pipeline (async — respond immediately, run in background)
    // executePipeline automatically detects and resumes pending runs via .runner/pending/<taskId>.json
    executePipeline(config)
      .then(async log => {
        if (log.status !== 'aborted') {
          // Only post results if pipeline actually completed (not paused at another gate)
          const comment = buildResultComment(log)
          await postTaskComment(taskId, comment)
          await updateTaskStatus(taskId, 'Agent Complete')
        }
      })
      .catch(async err => {
        await postTaskComment(taskId, `## Pipeline Error\n\n${err.message}`)
        await updateTaskStatus(taskId, 'Agent Failed')
      })

    return NextResponse.json({ status: isApprovalResume ? 'resuming' : 'accepted', taskId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
