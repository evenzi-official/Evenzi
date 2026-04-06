import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/amc/utils/webhook'
import type { WebhookPayload } from '@/lib/amc/types'

export async function POST(request: NextRequest) {
  // 1. Extract required headers
  const projectId = request.headers.get('X-AMC-Project-Id')
  const signature = request.headers.get('X-AMC-Signature')

  if (!projectId) {
    return NextResponse.json(
      { error: 'Missing X-AMC-Project-Id header' },
      { status: 400 }
    )
  }
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing X-AMC-Signature header' },
      { status: 400 }
    )
  }

  // 2. Read raw body (needed for signature verification)
  const bodyText = await request.text()

  // 3. Look up project + webhook secret
  const supabase = await createClient()
  const { data: project, error: projectError } = await supabase
    .from('mc_projects')
    .select('id, webhook_secret')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // 4. Verify HMAC signature
  const isValid = verifyWebhookSignature(bodyText, signature, project.webhook_secret)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 5. Parse and persist the event
  let payload: WebhookPayload
  try {
    payload = JSON.parse(bodyText) as WebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { error: insertError } = await supabase.from('mc_events').insert({
    project_id: projectId,
    type: payload.type,
    payload: payload as unknown as Record<string, unknown>,
  })

  if (insertError) {
    console.error('Failed to insert event:', insertError.message)
    return NextResponse.json({ error: 'Failed to store event' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
