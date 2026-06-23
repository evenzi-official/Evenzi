import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Return only the minimal identity fields a client needs — never the
      // entire Supabase user object (which leaks email, phone, raw metadata,
      // identities, etc.). `role` here is the Supabase auth role (e.g.
      // "authenticated"); the app-level role lives in the profiles table.
      return NextResponse.json({
        success: true,
        user: { id: user.id, role: user.role ?? null },
      })
    }

    return NextResponse.json({ success: false }, { status: 401 })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to verify session' }, { status: 500 })
  }
}

