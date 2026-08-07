import { describe, it, expect, vi } from 'vitest'
import { getUserProfile } from '@/lib/supabase/profile'

describe('getUserProfile', () => {
  it('returns profile when user has one', async () => {
    const mockProfile = {
      id: 'user-123',
      role_slug: 'host',
      display_name: 'Test User',
      avatar_url: null,
      onboarding_completed: false,
    }

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getUserProfile(mockSupabase as any, 'user-123')
    expect(result).toEqual(mockProfile)
    expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
    expect(mockSupabase.select).toHaveBeenCalledWith('id, role_slug, display_name, avatar_url, onboarding_completed')
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123')
  })

  it('returns null when no profile exists', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getUserProfile(mockSupabase as any, 'user-456')
    expect(result).toBeNull()
  })

  it('returns null when supabase errors', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection failed' } }),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getUserProfile(mockSupabase as any, 'user-789')
    expect(result).toBeNull()
  })
})
