import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { createTicketSchema } from '@/lib/validations/help'

/** Strip query string and fragment — a user who searched their own phone
 *  number would otherwise carry it into the ticket row. Spec section 8.6. */
function stripUrl(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    return `${u.origin}${u.pathname}`
  } catch {
    return null
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createTicketSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const service = createServiceClient()

    // Rate limit: 5 tickets per user per hour. Spec section 8.4.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await service
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since)

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        {
          error:
            'You have sent several messages recently. Please wait before sending another.',
        },
        { status: 429 }
      )
    }

    // context is built from an explicit allow-list, never spread from the
    // client. Same discipline as D50's jsonb_build_object. Spec section 8.6.
    const context: Record<string, string> = {}
    if (parsed.data.articleSlug) context.article_slug = parsed.data.articleSlug
    if (parsed.data.topicSlug) context.category_slug = parsed.data.topicSlug

    const { data, error } = await service
      .from('support_tickets')
      .insert({
        user_id: user.id, // session identity, never the body
        email: parsed.data.email,
        topic_slug: parsed.data.topicSlug ?? null,
        message: parsed.data.message,
        context,
        page_url: stripUrl(parsed.data.pageUrl),
      })
      .select('reference')
      .single()

    if (error || !data) {
      // Never log the message body — spec §8.2.
      console.error('POST /api/help/tickets insert failed:', error?.message)
      return NextResponse.json({ error: 'Could not send that just now' }, { status: 500 })
    }

    // Email is best-effort and no-ops while RESEND_API_KEY is unset, per
    // .cursor/rules/resend-deferred.mdc. A failure here must never fail the
    // ticket — the database row is the source of truth.
    // (Wire the Resend call here when keys are configured.)

    return NextResponse.json({ reference: data.reference }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
