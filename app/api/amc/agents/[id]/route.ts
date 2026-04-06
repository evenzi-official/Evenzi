import { NextRequest, NextResponse } from 'next/server'
import { getAgent, updateAgent, deleteAgent } from '@/lib/amc/db/queries'
import type { UpdateAgentInput } from '@/lib/amc/types'

interface Params {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const agent = await getAgent(params.id)
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    return NextResponse.json({ agent })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const existing = await getAgent(params.id)
    if (!existing) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const body = await request.json() as UpdateAgentInput
    const agent = await updateAgent(params.id, body)
    return NextResponse.json({ agent })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const existing = await getAgent(params.id)
    if (!existing) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    await deleteAgent(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
