'use client'

/**
 * Per-key sync bookkeeping shared by the storage hook and the sync manager.
 *
 * The client records the server timestamp it last saw for each storage key and
 * sends it back on write. The server rejects a write whose base timestamp is
 * older than its own, which is what stops a long-open tab from overwriting data
 * saved elsewhere.
 */

/** Reserved key the server uses to carry timestamps alongside the data. */
export const SYNC_META_KEY = '_syncMeta'

const stamp = (key: string) => `${key}__syncedAt`

export function getSyncedAt(key: string): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(stamp(key))
}

export function setSyncedAt(key: string, iso: string) {
  if (typeof window === 'undefined' || !iso) return
  window.localStorage.setItem(stamp(key), iso)
}

/** True when the server's timestamp is ahead of what this browser last saw. */
export function serverIsAhead(key: string, serverUpdatedAt?: string | null): boolean {
  if (!serverUpdatedAt) return false
  const local = getSyncedAt(key)
  if (!local) return true
  return new Date(serverUpdatedAt).getTime() > new Date(local).getTime()
}

/**
 * Writes a server value into localStorage and tells every mounted hook, so the
 * UI updates without a reload.
 */
export function adoptServerValue(key: string, value: unknown, updatedAt?: string | null) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
  if (updatedAt) setSyncedAt(key, updatedAt)
  window.dispatchEvent(
    new CustomEvent('preptrack_storage_update', { detail: { key, value } }),
  )
}
