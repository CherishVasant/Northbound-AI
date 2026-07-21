import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { backupCompanies, getRestorePoint, listRestorePoints } from '@/lib/utils/rollback'

export const dynamic = 'force-dynamic'

/**
 * The secondary store's HTTP surface. /api/sync owns the live copy in
 * `userdatas`; this owns the restorable copy in `placement_companies_backup`.
 *
 * GET  ?companyId=3  → that company's restore point, snapshot included
 * GET                → every restore point for the user, snapshots omitted
 * POST { companies } → mirror the live list across
 */

function dbUnavailable(scope: string, err: unknown) {
  console.error(`[placement-archive/${scope}] database unavailable:`, err)
  return NextResponse.json({ error: 'Cannot reach the database right now.' }, { status: 503 })
}

function readUsername(raw: string) {
  return decodeURIComponent(raw).trim().toLowerCase()
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username: raw } = await params
    const username = readUsername(raw)
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    try {
      await connectToDatabase()
    } catch (err) {
      return dbUnavailable('GET', err)
    }

    const companyIdRaw = new URL(request.url).searchParams.get('companyId')
    if (companyIdRaw === null) {
      return NextResponse.json({ points: await listRestorePoints(username) })
    }

    // Ids are numeric in the current shape but string in pre-migration records,
    // and Mongo matches Mixed by exact type — so query with a number when it is one.
    const companyId = /^\d+$/.test(companyIdRaw) ? Number(companyIdRaw) : companyIdRaw
    return NextResponse.json({ point: await getRestorePoint(username, companyId) })
  } catch (error) {
    console.error('[placement-archive/GET] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username: raw } = await params
    const username = readUsername(raw)
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const body = await request.json()
    const companies: unknown[] = Array.isArray(body?.companies)
      ? body.companies
      : body?.company
        ? [body.company]
        : []

    if (companies.length === 0) {
      return NextResponse.json({ error: 'companies is required' }, { status: 400 })
    }

    try {
      await connectToDatabase()
    } catch (err) {
      return dbUnavailable('POST', err)
    }

    const result = await backupCompanies(
      username,
      companies.filter(
        (c): c is Record<string, unknown> => Boolean(c) && typeof c === 'object',
      ),
    )

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[placement-archive/POST] error:', error)
    return NextResponse.json(
      { error: (error as Error)?.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
