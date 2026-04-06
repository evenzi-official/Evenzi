import { NextRequest, NextResponse } from 'next/server'
import { getAgent, getAgentStats } from '@/lib/amc/db/queries'

interface Params {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const agent = await getAgent(params.id)
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const stats = await getAgentStats(params.id)
    return NextResponse.json({ stats })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
