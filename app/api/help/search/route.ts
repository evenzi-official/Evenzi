import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { helpSearchSchema } from '@/lib/validations/help'
import { shapeSearchResults } from '@/lib/help/search'
import type { HelpSearchRow } from '@/lib/help/types'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = helpSearchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    // Identity and audience are derived here, never read from the body.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const audience = user ? 'app' : 'public'

    // Function lives in config schema (config.search_faq). Spec §6 / plan Task 7.
    const { data, error } = await supabase.schema('config').rpc('search_faq', {
      p_query: parsed.data.q,
      p_audience: audience,
      p_limit: 8,
    })

    if (error) {
      console.error('POST /api/help/search rpc failed:', error.message)
      return NextResponse.json({ error: 'Search unavailable' }, { status: 500 })
    }

    const shaped = shapeSearchResults((data ?? []) as HelpSearchRow[])

    // Log the query for the Phase 2 evidence gate. Never log the text itself
    // to the application log — it goes to the database only.
    const service = createServiceClient()
    const { data: logged } = await service
      .from('help_queries')
      .insert({
        user_id: user?.id ?? null,
        audience,
        query: parsed.data.q,
        result_count: shaped.resultCount,
        top_score: shaped.topScore,
      })
      .select('ref')
      .single()

    return NextResponse.json({
      results: shaped.results,
      confident: shaped.confident,
      queryRef: logged?.ref ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
