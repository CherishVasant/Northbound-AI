'use client'

import { useState, useEffect } from 'react'

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
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
          fetch(`${backendUrl}/api/sync/${username}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: valueToStore })
          })
            .then((res) => {
              if (!res.ok) throw new Error('Server returned non-2xx status')
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
