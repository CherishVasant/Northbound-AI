/**
 * All API endpoints are Next.js Route Handlers served from this same origin
 * (see app/api/**), so requests are always relative.
 *
 * There is deliberately no configurable base URL any more: the previous
 * `NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'` default is exactly what
 * broke authentication in production, because on a deployed host `localhost`
 * is the server's own sandbox (or, in client code, the visitor's machine).
 */
export function getApiUrl(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

export async function parseResponseBody<T = unknown>(
  response: Response,
  fallback: T | null = null,
): Promise<T | null> {
  const rawText = await response.text()
  if (!rawText.trim()) return fallback

  try {
    return JSON.parse(rawText) as T
  } catch {
    return fallback ?? (rawText as T)
  }
}
