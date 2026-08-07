/**
 * Vitest global setup — dummy Supabase public env so accidental real
 * createClient() calls do not throw "Missing Supabase environment variables".
 * API tests should still mock `@/lib/supabase/server`.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://127.0.0.1:54321'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??= 'test-publishable-key'
