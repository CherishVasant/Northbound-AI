import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Uptime probe, ported from the retired Express server's /health.
 *
 * Reports database reachability separately from process health: the function
 * answering at all proves the app is up, while `database` tells you whether
 * Atlas is reachable — the distinction that made the old auth bypass dangerous.
 */
export async function GET() {
  let database: 'connected' | 'unreachable' = 'connected'
  try {
    await connectToDatabase()
  } catch {
    database = 'unreachable'
  }

  return NextResponse.json(
    { status: 'ok', database, time: new Date().toISOString() },
    { status: database === 'connected' ? 200 : 503 },
  )
}
