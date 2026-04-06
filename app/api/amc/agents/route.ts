import { NextRequest, NextResponse } from 'next/server'
import { listAgents, createAgent } from '@/lib/amc/db/queries'
import type { CreateAgentInput } from '@/lib/amc/types'

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('project_id') ?? undefined
    const agents = await listAgents(projectId)
    return NextResponse.json({ agents })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateAgentInput

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!body.role || body.role.trim() === '') {
      return NextResponse.json({ error: 'role is required' }, { status: 400 })
    }

    const agent = await createAgent({ ...body, name: body.name.trim(), role: body.role.trim() })
    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
