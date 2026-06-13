/**
 * Cloudflare R2 storage core (server-only).
 * S3-compatible client + presigned upload/download + public URL + delete helpers.
 * Never import this from client components — it reads server-only secrets.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const endpoint =
  process.env.R2_ENDPOINT ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL

export const R2_BUCKET_PUBLIC = process.env.R2_BUCKET_PUBLIC || 'evenzi-public'
export const R2_BUCKET_PRIVATE = process.env.R2_BUCKET_PRIVATE || 'evenzi-private'

let _client: S3Client | null = null

function client(): S3Client {
  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      'Missing R2 environment variables. Required: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT (or R2_ACCOUNT_ID).'
    )
  }
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return _client
}

/** Presigned PUT URL for a direct browser→R2 upload, scoped to key + content-type. */
export async function getSignedUploadUrl(opts: {
  bucket: string
  key: string
  contentType: string
  expiresIn?: number
}): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: opts.bucket,
    Key: opts.key,
    ContentType: opts.contentType,
  })
  return getSignedUrl(client(), cmd, { expiresIn: opts.expiresIn ?? 300 })
}

/** Short-lived presigned GET URL for a private object (default 1h). */
export async function getSignedDownloadUrl(
  key: string,
  opts?: { bucket?: string; expiresIn?: number }
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: opts?.bucket ?? R2_BUCKET_PRIVATE,
    Key: key,
  })
  return getSignedUrl(client(), cmd, { expiresIn: opts?.expiresIn ?? 3600 })
}

/** Permanent public URL via the custom domain (public bucket only). */
export function getPublicUrl(key: string): string {
  if (!publicBaseUrl) {
    throw new Error('Missing R2_PUBLIC_BASE_URL environment variable.')
  }
  return `${publicBaseUrl.replace(/\/$/, '')}/${key}`
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

/** Delete every object under a prefix (e.g. an entire event's assets). */
export async function deletePrefix(bucket: string, prefix: string): Promise<void> {
  const listed = await client().send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
  )
  const objects = (listed.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []))
  if (objects.length === 0) return
  await client().send(
    new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } })
  )
}
