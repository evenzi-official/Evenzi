import { NextRequest, NextResponse } from 'next/server'
import { listProjects, createProject } from '@/lib/amc/db/queries'
import type { CreateProjectInput } from '@/lib/amc/types'

export async function GET() {
  try {
    const projects = await listProjects()
    return NextResponse.json({ projects })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateProjectInput

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const project = await createProject({ ...body, name: body.name.trim() })
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
