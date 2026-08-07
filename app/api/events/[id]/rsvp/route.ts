import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

/**
 * Legacy open RSVP insert (service-role) — disabled (platform truth audit P1-4).
 * Canonical guest RSVP is POST /api/e/[slug]/rsvp after guest lookup session.
 * Only caller was the design-test page wedding-invitation-temp-1.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  }

  return NextResponse.json(
    {
      error: 'This RSVP endpoint is retired. Use the event guest website RSVP flow.',
      code: 'rsvp_endpoint_retired',
    },
    { status: 410 }
  )
}
