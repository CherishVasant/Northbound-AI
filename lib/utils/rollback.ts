import { PlacementCompanyBackup } from '@/lib/models/PlacementCompanyArchive'

/**
 * Server-side half of the two-store setup. Never import this from a client
 * component — it pulls in mongoose. The browser talks to /api/placement-archive.
 */

/**
 * How long an edit stays undoable. Once a company has gone this long without
 * changing, its live copy is accepted as the new restore point and the two
 * stores agree again.
 */
export const COMMIT_WINDOW_MS = 30 * 60 * 1000

export interface RestorePoint {
  companyId: unknown
  name: string
  /** ISO — when the restorable copy was captured. */
  committedAt: string
  /** ISO — when the live copy last changed. */
  pendingAt: string
  /** ms until the live copy becomes the restore point; 0 once it already has. */
  commitsInMs: number
  /** False when the two copies match, i.e. there is nothing to undo. */
  differs: boolean
  /** The copy a restore brings back. Omitted from list results. */
  snapshot?: Record<string, unknown>
}

type BackupDoc = {
  _id: unknown
  companyId: unknown
  name?: string
  committed: Record<string, unknown>
  committedAt: Date | string
  pending: Record<string, unknown>
  pendingAt: Date | string
}

/**
 * Applies the commit window: a live copy that has been untouched for longer
 * than COMMIT_WINDOW_MS *is* the restore point, whether or not anything has
 * written since. Returns the effective pair plus whether it changed, so callers
 * can persist the promotion rather than recomputing it forever.
 */
function settle(doc: BackupDoc, now: number) {
  const pendingAt = new Date(doc.pendingAt).getTime()
  const settled = now - pendingAt >= COMMIT_WINDOW_MS
  if (settled) {
    return {
      committed: doc.pending,
      committedAt: new Date(pendingAt),
      promoted: stableStringify(doc.committed) !== stableStringify(doc.pending),
    }
  }
  return {
    committed: doc.committed,
    committedAt: new Date(doc.committedAt),
    promoted: false,
  }
}

/**
 * Mirrors the live company list into the secondary store.
 *
 * A company whose live copy is unchanged is skipped entirely — deliberately,
 * because refreshing `pendingAt` on a no-op write would restart the commit
 * window and an edit would never settle.
 *
 * Companies missing from `companies` are left alone rather than deleted. That
 * is what makes a deleted company recoverable: its backup row outlives it.
 */
export async function backupCompanies(
  username: string,
  companies: Record<string, unknown>[],
): Promise<{ written: number; committed: number }> {
  const now = Date.now()
  let written = 0
  let committed = 0

  for (const company of companies) {
    const companyId = company?.id
    if (companyId === undefined || companyId === null) continue

    const doc = (await PlacementCompanyBackup.findOne({ username, companyId })
      .lean()
      .exec()) as BackupDoc | null

    const name = typeof company.name === 'string' ? company.name : ''

    // First sighting: both copies are the current state. There is nothing
    // older to restore to, and pretending otherwise would offer a no-op undo.
    if (!doc) {
      await PlacementCompanyBackup.create({
        username,
        companyId,
        name,
        committed: company,
        committedAt: new Date(now),
        pending: company,
        pendingAt: new Date(now),
      })
      written++
      continue
    }

    if (stableStringify(doc.pending) === stableStringify(company)) continue

    const s = settle(doc, now)
    if (s.promoted) committed++

    await PlacementCompanyBackup.updateOne(
      { _id: doc._id },
      {
        $set: {
          name,
          committed: s.committed,
          committedAt: s.committedAt,
          pending: company,
          pendingAt: new Date(now),
        },
      },
    )
    written++
  }

  return { written, committed }
}

/** The restorable copy of one company, or null when it has never been backed up. */
export async function getRestorePoint(
  username: string,
  companyId: unknown,
): Promise<RestorePoint | null> {
  const doc = (await PlacementCompanyBackup.findOne({ username, companyId })
    .lean()
    .exec()) as BackupDoc | null
  if (!doc) return null

  return toRestorePoint(await persistSettled(doc), Date.now(), true)
}

/** Every company this user has a backup for, including ones no longer live. */
export async function listRestorePoints(username: string): Promise<RestorePoint[]> {
  const docs = (await PlacementCompanyBackup.find({ username })
    .sort({ pendingAt: -1 })
    .lean()
    .exec()) as BackupDoc[]

  const now = Date.now()
  const out: RestorePoint[] = []
  for (const doc of docs) {
    out.push(toRestorePoint(await persistSettled(doc), now, false))
  }
  return out
}

/**
 * Writes back a promotion the commit window has already made true, so the
 * stored document matches what callers are told. Cheap and idempotent: it only
 * fires on the first read after an edit settles.
 */
async function persistSettled(doc: BackupDoc): Promise<BackupDoc> {
  const s = settle(doc, Date.now())
  if (!s.promoted) return doc

  await PlacementCompanyBackup.updateOne(
    { _id: doc._id },
    { $set: { committed: s.committed, committedAt: s.committedAt } },
  )
  return { ...doc, committed: s.committed, committedAt: s.committedAt }
}

function toRestorePoint(doc: BackupDoc, now: number, withSnapshot: boolean): RestorePoint {
  const pendingAt = new Date(doc.pendingAt).getTime()
  const differs = stableStringify(doc.committed) !== stableStringify(doc.pending)

  return {
    companyId: doc.companyId,
    name: doc.name ?? '',
    committedAt: new Date(doc.committedAt).toISOString(),
    pendingAt: new Date(pendingAt).toISOString(),
    commitsInMs: differs ? Math.max(0, pendingAt + COMMIT_WINDOW_MS - now) : 0,
    differs,
    ...(withSnapshot ? { snapshot: doc.committed } : {}),
  }
}

/**
 * Key-order-independent serialisation, so a copy that differs only in the order
 * React happened to spread its fields doesn't read as a change — which would
 * restart the commit window on every save.
 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter((k) => k !== '_id' && k !== '__v')
    .sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}
