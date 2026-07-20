'use client'

import { useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'
import { adoptServerValue, getSyncedAt, setSyncedAt } from '@/lib/syncMeta'

// Global tracking objects for sync status and timeouts
if (typeof window !== 'undefined') {
  (window as any)._savingKeys = (window as any)._savingKeys || new Set<string>();
  (window as any)._syncTimeouts = (window as any)._syncTimeouts || {};
}

function updateGlobalSyncStatus(key: string, status: 'saving' | 'saved' | 'error') {
  if (typeof window === 'undefined') return;
  const savingKeys = (window as any)._savingKeys as Set<string>;
  if (status === 'saving') {
    savingKeys.add(key);
  } else {
    savingKeys.delete(key);
  }
  
  let finalStatus: 'saving' | 'saved' | 'error' = 'saved';
  if (savingKeys.size > 0) {
    finalStatus = 'saving';
  } else if (status === 'error') {
    finalStatus = 'error';
  }
  
  window.dispatchEvent(new CustomEvent('preptrack_sync_status', { detail: finalStatus }));
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`[v0] Error loading from localStorage:`, error)
    }
    setIsLoaded(true)
  }, [key])

  // Listen to custom cross-hook updates to avoid full page reloads
  useEffect(() => {
    const handleStorageUpdate = (e: any) => {
      if (e.detail && e.detail.key === key) {
        setStoredValue(e.detail.value)
      }
    }
    window.addEventListener('preptrack_storage_update' as any, handleStorageUpdate)
    return () => {
      window.removeEventListener('preptrack_storage_update' as any, handleStorageUpdate)
    }
  }, [key])

  // Update localStorage and trigger debounced sync to backend
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // For functional updates, compose against the freshest persisted value
      // rather than the captured closure. This ensures several updates fired in
      // the same tick (e.g. the AI adding multiple projects at once) accumulate
      // instead of overwriting one another.
      let base = storedValue
      if (value instanceof Function) {
        try {
          const raw = window.localStorage.getItem(key)
          if (raw !== null) base = JSON.parse(raw)
        } catch {
          /* fall back to the in-memory value */
        }
      }
      const valueToStore = value instanceof Function ? (value as (val: T) => T)(base) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))

      // Notify other hooks in the application
      window.dispatchEvent(
        new CustomEvent('preptrack_storage_update', { detail: { key, value: valueToStore } })
      )

      // Debounced backend synchronization
      const username = window.localStorage.getItem('preptrack_username')
      if (username) {
        const timeouts = (window as any)._syncTimeouts
        if (timeouts[key]) {
          clearTimeout(timeouts[key])
        }

        updateGlobalSyncStatus(key, 'saving')

        timeouts[key] = setTimeout(() => {
          fetch(getApiUrl(`/api/sync/${username}`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // The server compares this against its own timestamp and refuses
            // the write if it has newer data, rather than letting a stale tab
            // overwrite it.
            body: JSON.stringify({ key, value: valueToStore, baseUpdatedAt: getSyncedAt(key) }),
          })
            .then(async (res) => {
              if (res.status === 409) {
                // The server moved on. Take its copy rather than clobbering it;
                // this browser's edit is discarded on purpose.
                const body = await res.json().catch(() => null)
                if (body?.serverValue !== undefined) {
                  console.warn(
                    `[Sync] Server had newer data for ${key}; adopting the server copy.`,
                  )
                  
                  let valueToAdopt = body.serverValue;
                  if (key === 'ai_chats' && Array.isArray(valueToStore) && Array.isArray(body.serverValue)) {
                    try {
                      const mergedMap = new Map<string, any>();
                      body.serverValue.forEach((c) => {
                        if (c && c.id) mergedMap.set(c.id, c);
                      });
                      valueToStore.forEach((c) => {
                        if (c && c.id) {
                          const existing = mergedMap.get(c.id);
                          if (existing) {
                            const mergedMsgs = [...(existing.messages || [])];
                            (c.messages || []).forEach((m: any) => {
                              if (!mergedMsgs.some((em: any) => em.id === m.id)) {
                                  mergedMsgs.push(m);
                              }
                            });
                            mergedMap.set(c.id, {
                              ...existing,
                              ...c,
                              messages: mergedMsgs,
                              updatedAt: new Date(c.updatedAt || 0) > new Date(existing.updatedAt || 0) ? c.updatedAt : existing.updatedAt,
                            });
                          } else {
                            mergedMap.set(c.id, c);
                          }
                        }
                      });
                      valueToAdopt = Array.from(mergedMap.values());
                    } catch (e) {
                      // ignore
                    }
                  }
                  
                  adoptServerValue(key, valueToAdopt, body.serverUpdatedAt)
                }
                updateGlobalSyncStatus(key, 'saved')
                return
              }
              if (!res.ok) throw new Error(`Server returned ${res.status}`)
              const body = await res.json().catch(() => null)
              if (body?.updatedAt) setSyncedAt(key, body.updatedAt)
              updateGlobalSyncStatus(key, 'saved')
            })
            .catch((err) => {
              console.error(`[Sync Error] Failed to sync ${key} to MongoDB:`, err)
              updateGlobalSyncStatus(key, 'error')
            })
        }, 1000) // 1000ms debounce delay
      }
    } catch (error) {
      console.error(`[v0] Error saving to localStorage:`, error)
    }
  }

  return [storedValue, setValue, isLoaded] as const
}
