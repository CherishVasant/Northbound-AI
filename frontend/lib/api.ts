export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()

  if (backendUrl) {
    const sanitizedBase = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl
    return `${sanitizedBase}${normalizedPath}`
  }

  return normalizedPath
}
