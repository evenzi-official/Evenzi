import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateProfileSchema } from '@/lib/validations/settings'

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: parsed.data.display_name })
      .eq('id', user.id)

    if (error) {
      console.error('PATCH /api/settings/profile failed:', error)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
