import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { putObject, getPublicUrl, R2_BUCKET_PUBLIC } from '@/lib/storage/r2'
import { avatarKey } from '@/lib/storage/keys'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field is required' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 })
  }

  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
  const key = avatarKey(user.id, randomUUID(), ext)

  const arrayBuffer = await file.arrayBuffer()
  const body = Buffer.from(arrayBuffer)

  try {
    await putObject({ bucket: R2_BUCKET_PUBLIC, key, body, contentType: file.type })
  } catch (err) {
    console.error('R2 avatar upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const publicUrl = getPublicUrl(key)

  const { error: dbError } = await supabase
    .from('user_profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (dbError) {
    console.error('avatar_url update failed:', dbError)
    return NextResponse.json({ error: 'Upload succeeded but saving the URL failed' }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl }, { status: 200 })
}
