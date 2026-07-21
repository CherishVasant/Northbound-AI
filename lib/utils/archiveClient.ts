'use client'

import { getApiUrl } from '@/lib/api'
import type { PlacementCompany } from '@/lib/utils/storage'

/**
 * Browser side of the secondary store. Never imports the mongoose model — that
 * only exists on the server; everything here goes through
 * /api/placement-archive.
 */

export interface RestorePoint {
  companyId: number
  name: string
  committedAt: string
  pendingAt: string
  commitsInMs: number
  differs: boolean
  /** Present only when fetched for a single company. */
  snapshot?: PlacementCompany
}

function currentUsername(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('preptrack_username')
}

/**
 * Debounced across the whole list. Every keystroke fires an update, and
 * mirroring each one would be a request per character; 2s after typing stops
 * captures the edit as one write. Deliberately longer than the 1s primary sync
 * so the secondary trails the primary rather than racing it.
 *
 * The whole list is sent, not just the edited company, so the server sees
 * deletions too — it keeps the backup rows of companies that vanished, which is
 * what makes a deleted company restorable.
 */
const MIRROR_DEBOUNCE_MS = 2000
let pendingTimer: ReturnType<typeof setTimeout> | null = null
let pendingCompanies: PlacementCompany[] = []

export function backupCompaniesSoon(companies: PlacementCompany[]): void {
  const username = currentUsername()
  if (!username || !Array.isArray(companies) || companies.length === 0) return

  pendingCompanies = companies
  if (pendingTimer) clearTimeout(pendingTimer)

  pendingTimer = setTimeout(() => {
    pendingTimer = null
    const batch = pendingCompanies
    pendingCompanies = []
    void postBackup(username, batch)
  }, MIRROR_DEBOUNCE_MS)
}

async function postBackup(username: string, companies: PlacementCompany[]): Promise<void> {
  try {
    const res = await fetch(getApiUrl(`/api/placement-archive/${username}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companies }),
    })
    if (!res.ok) throw new Error(`Server returned ${res.status}`)
  } catch (err) {
    // Non-blocking on purpose: the backup is a safety net, and failing to write
    // it must never interrupt an edit that has already landed locally.
    console.error('[Backup] Failed to mirror companies:', err)
  }
}

/** The restorable copy of one company, snapshot included. */
export async function fetchRestorePoint(companyId: number): Promise<RestorePoint | null> {
  const username = currentUsername()
  if (!username) return null

  const res = await fetch(
    getApiUrl(`/api/placement-archive/${username}?companyId=${encodeURIComponent(companyId)}`),
  )
  if (!res.ok) throw new Error(`Server returned ${res.status}`)
  const body = await res.json()
  return body?.point ?? null
}

/** Every backed-up company, snapshots omitted. Used to spot deleted companies. */
export async function fetchRestorePoints(): Promise<RestorePoint[]> {
  const username = currentUsername()
  if (!username) return []

  const res = await fetch(getApiUrl(`/api/placement-archive/${username}`))
  if (!res.ok) throw new Error(`Server returned ${res.status}`)
  const body = await res.json()
  return Array.isArray(body?.points) ? body.points : []
}
