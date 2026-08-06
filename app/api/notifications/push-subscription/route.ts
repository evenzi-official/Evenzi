import { createClient } from '@/lib/supabase/server'
import { isAllowedPushEndpoint, isValidBase64Url } from '@/lib/notifications/pushEndpoint'
import { NextResponse } from 'next/server'

const MAX_SUBSCRIPTIONS_PER_USER = 10

interface PushSubscriptionBody {
  endpoint?: unknown
  p256dh?: unknown
  auth?: unknown
}

function parseBody(raw: unknown): { endpoint: string; p256dh: string; auth: string } | null {
  if (typeof raw !== 'object' || raw === null) return null
  const body = raw as PushSubscriptionBody
  if (typeof body.endpoint !== 'string' || typeof body.p256dh !== 'string' || typeof body.auth !== 'string') {
    return null
  }
  return { endpoint: body.endpoint, p256dh: body.p256dh, auth: body.auth }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = parseBody(raw)
    if (!parsed) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const { endpoint, p256dh, auth } = parsed

    if (!isAllowedPushEndpoint(endpoint)) {
      return NextResponse.json({ error: 'Invalid push endpoint' }, { status: 400 })
    }
    if (!isValidBase64Url(p256dh) || !isValidBase64Url(auth)) {
      return NextResponse.json({ error: 'Invalid subscription keys' }, { status: 400 })
    }

    const { data: existing, error: existingError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id')
      .eq('endpoint', endpoint)
      .maybeSingle()

    if (existingError) {
      console.error('POST push-subscription lookup failed:', existingError)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    if (existing && existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Endpoint already registered' }, { status: 409 })
    }

    if (existing && existing.user_id === user.id) {
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({ p256dh, auth_key: auth })
        .eq('id', existing.id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('POST push-subscription update failed:', updateError)
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const { count, error: countError } = await supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('POST push-subscription count failed:', countError)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    if ((count ?? 0) >= MAX_SUBSCRIPTIONS_PER_USER) {
      return NextResponse.json({ error: 'Subscription limit reached' }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth_key: auth,
      })

    if (insertError) {
      // Unique endpoint owned by another user (RLS hid the row on lookup)
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Endpoint already registered' }, { status: 409 })
      }
      console.error('POST push-subscription insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof raw !== 'object' || raw === null || typeof (raw as { endpoint?: unknown }).endpoint !== 'string') {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const endpoint = (raw as { endpoint: string }).endpoint

    const { data, error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', user.id)
      .select('id')

    if (deleteError) {
      console.error('DELETE push-subscription failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
