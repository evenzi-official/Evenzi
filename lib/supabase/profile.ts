import type { SupabaseClient } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  role_slug: 'host' | 'vendor' | null
  display_name: string | null
  avatar_url: string | null
  onboarding_completed: boolean
}

const PROFILE_FIELDS = 'id, role_slug, display_name, avatar_url, onboarding_completed'

export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as UserProfile
}
