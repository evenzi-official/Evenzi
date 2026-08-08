import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { feedbackSchema } from '@/lib/validations/help'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    // Resolve slug → id via the published catalog (readable by anon/authenticated).
    const { data: article, error: articleError } = await supabase
      .schema('config')
      .from('faq_articles')
      .select('id')
      .eq('slug', parsed.data.articleSlug)
      .eq('status', 'published')
      .maybeSingle()

    if (articleError) {
      console.error('POST /api/help/feedback article lookup failed:', articleError.message)
      return NextResponse.json({ error: 'Could not save feedback' }, { status: 500 })
    }
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // user_id from session only — never from the body. Spec §8.6.
    const service = createServiceClient()
    const { error } = await service.from('faq_article_feedback').upsert(
      {
        article_id: article.id as string,
        user_id: user?.id ?? null,
        helpful: parsed.data.helpful,
      },
      { onConflict: 'article_id,user_id' }
    )

    if (error) {
      console.error('POST /api/help/feedback upsert failed:', error.message)
      return NextResponse.json({ error: 'Could not save feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
