import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mapRpcError } from './_lib'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params
    if (!slug || slug.length > 200) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .rpc('get_public_website_payload', { p_slug: slug })

    if (error) {
      console.error('GET /api/e/[slug] rpc error:', error)
      const mapped = mapRpcError(error.message)
      if (mapped.status === 500) {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
      }
      return NextResponse.json({ error: mapped.body }, { status: mapped.status })
    }

    if (data === null) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ payload: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
