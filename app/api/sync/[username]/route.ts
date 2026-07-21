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
  ai_chats: 'chats',
}

/**
 * Reserved key carrying each collection's last-write time. Sent alongside the
 * data on GET so the client can tell whether the server moved on since it last
 * synced. Not a storage key — the client strips it before writing localStorage.
 */
export const SYNC_META_KEY = '_syncMeta'

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

    let meta = (userData.syncMeta ?? {}) as Record<string, string>

    /**
     * Backfill timestamps for collections that hold data but were never written
     * through this API — an import or a manual restore. Without this they look
     * unversioned forever, and the conflict guard has nothing to compare.
     */
    const missing = Object.entries(KEY_MAP).filter(
      ([storageKey, dbField]) =>
        !meta[storageKey] && Array.isArray(userData[dbField]) && userData[dbField].length > 0,
    )
    if (missing.length > 0) {
      const now = new Date().toISOString()
      meta = { ...meta, ...Object.fromEntries(missing.map(([k]) => [k, now])) }
      userData.syncMeta = meta
      userData.markModified('syncMeta')
      await userData.save({ validateBeforeSave: false })
    }

    const response: Record<string, unknown> = {}
    for (const [storageKey, dbField] of Object.entries(KEY_MAP)) {
      response[storageKey] = userData[dbField] ?? []
    }
    // Lets the client detect a server that has moved ahead of it.
    response[SYNC_META_KEY] = meta

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
    const { key, value, baseUpdatedAt } = await request.json()

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

    const meta = ((userData.syncMeta ?? {}) as Record<string, string>) || {}
    const serverUpdatedAt = meta[key]

    /**
     * Conflict guard. The client sends the timestamp it last saw for this key;
     * if the server has been written since, this request is based on stale data
     * and applying it would silently destroy the newer copy. Reject instead and
     * hand back what the server holds so the client can adopt it.
     *
     * A client with no timestamp at all is treated as stale whenever the server
     * already has data — that is exactly the "tab open since before the change"
     * case that wiped this collection twice.
     */
    if (serverUpdatedAt) {
      const stale =
        !baseUpdatedAt || new Date(baseUpdatedAt).getTime() < new Date(serverUpdatedAt).getTime()
      if (stale) {
        // If the client has no timestamp (initial sync) and the server's database holds no data,
        // we can safely allow the client to populate the database without a 409 conflict rejection.
        const serverDataValue = userData[dbField]
        const serverIsEmpty =
          !serverDataValue || (Array.isArray(serverDataValue) && serverDataValue.length === 0)

        if (!baseUpdatedAt && serverIsEmpty) {
          // Allow the write to proceed
        } else {
          return NextResponse.json(
            {
              conflict: true,
              error: 'The server has newer data for this key.',
              serverValue: userData[dbField] ?? [],
              serverUpdatedAt,
            },
            { status: 409 },
          )
        }
      }
    }

    /**
     * Field-preserving merge for the company list.
     *
     * A browser tab left open across a deploy runs the old bundle, which does
     * not know about newer fields and writes records without them — silently
     * erasing `year`, `kind` and `compensation` for every company. That has
     * destroyed this collection repeatedly.
     *
     * So for each incoming record, any key the stored record has but the
     * incoming one omits is carried over. A client can still change or clear a
     * field (it sends '' or 0); it just cannot delete one by not knowing it
     * exists.
     */
    if (key === 'placement_companies' && Array.isArray(value)) {
      const existing = new Map<unknown, Record<string, unknown>>()
      for (const rec of (userData[dbField] ?? []) as Record<string, unknown>[]) {
        const plain = typeof (rec as any)?.toObject === 'function' ? (rec as any).toObject() : rec
        if (plain?.id !== undefined) existing.set(plain.id, plain)
      }

      userData[dbField] = (value as Record<string, unknown>[]).map((incoming) => {
        const prior = existing.get(incoming?.id)
        if (!prior) return incoming
        const merged: Record<string, unknown> = { ...incoming }
        for (const [k, v] of Object.entries(prior)) {
          if (k === '_id') continue
          if (merged[k] === undefined) merged[k] = v
        }
        return merged
      })
    } else {
      userData[dbField] = value
    }

    userData.markModified(dbField)
    const now = new Date().toISOString()
    userData.syncMeta = { ...meta, [key]: now }
    userData.markModified('syncMeta')

    // The browser's localStorage is the source of truth for shape, so persist
    // client data as-is: one record with an unexpected enum value must never
    // block the whole sync. Type casting still applies.
    await userData.save({ validateBeforeSave: false })

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${key}`,
      updatedAt: now,
    })
  } catch (error) {
    console.error('[sync/POST] error:', error)
    return NextResponse.json(
      { error: (error as Error)?.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
