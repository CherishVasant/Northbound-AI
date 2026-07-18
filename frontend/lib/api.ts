export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()

  if (backendUrl) {
    const sanitizedBase = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl
    return `${sanitizedBase}${normalizedPath}`
  }

  return normalizedPath
}

export async function parseResponseBody<T = unknown>(response: Response, fallback: T | null = null): Promise<T | null> {
  const rawText = await response.text()
  if (!rawText.trim()) return fallback

  try {
    return JSON.parse(rawText) as T
  } catch {
    return fallback ?? (rawText as T)
  }
}
