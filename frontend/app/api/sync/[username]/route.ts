import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { UserData } from '@/lib/models/UserData'

export const dynamic = 'force-dynamic'

/** Maps frontend STORAGE_KEYS to UserData document fields. */
const KEY_MAP: Record<string, string> = {
  placement_dsa_problems: 'dsaProblems',
  placement_subjects: 'subjects',
  placement_projects: 'projects',
  placement_certifications: 'certifications',
  placement_aptitude_topics: 'aptitudeTopics',
  placement_hr_questions: 'hrQuestions',
  placement_concepts: 'dsaConcepts',
  placement_companies: 'placementCompanies',
  placement_custom_options: 'placementCustomOptions',
}

function dbUnavailable(scope: string, err: unknown) {
  console.error(`[sync/${scope}] database unavailable:`, err)
  // Report the failure rather than faking success — the client surfaces this as
  // a sync error instead of showing "saved" for data that never persisted.
  return NextResponse.json(
    { error: 'Cannot reach the database right now. Your changes are saved locally.' },
    { status: 503 },
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username: raw } = await params
    const username = decodeURIComponent(raw).trim().toLowerCase()
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    try {
      await connectToDatabase()
    } catch (err) {
      return dbUnavailable('GET', err)
    }

    let userData = await UserData.findOne({ username })
    if (!userData) {
      userData = new UserData({ username })
      await userData.save()
    }

    const response: Record<string, unknown> = {}
    for (const [storageKey, dbField] of Object.entries(KEY_MAP)) {
      response[storageKey] = userData[dbField] ?? []
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[sync/GET] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username: raw } = await params
    const username = decodeURIComponent(raw).trim().toLowerCase()
    const { key, value } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const dbField = KEY_MAP[key]
    if (!dbField) {
      return NextResponse.json({ error: `Invalid sync key: ${key}` }, { status: 400 })
    }

    try {
      await connectToDatabase()
    } catch (err) {
      return dbUnavailable('POST', err)
    }

    let userData = await UserData.findOne({ username })
    if (!userData) {
      userData = new UserData({ username })
    }

    userData[dbField] = value

    // The browser's localStorage is the source of truth, so persist client data
    // as-is: one record with an unexpected enum value must never block the whole
    // sync and cause silent data loss. Type casting still applies.
    await userData.save({ validateBeforeSave: false })

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${key}`,
      updatedAt: userData.updatedAt,
    })
  } catch (error) {
    console.error('[sync/POST] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
