const LOCAL_MEDIA_PATH = /\/api\/v1\/media\/[a-z0-9_-]{16,80}$/i

function apiOrigin(): string {
  const base =
    import.meta.env.VITE_API_URL?.trim() ||
    (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1')
  return base.replace(/\/api\/v1\/?$/, '')
}

export function canonicalizeStoredImageUrl(value: string): string {
  const trimmed = value.trim()
  const lastHttps = trimmed.lastIndexOf('https://')
  if (lastHttps > 0) {
    return trimmed.slice(lastHttps)
  }
  return trimmed
}

export function catalogMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null
  const source = canonicalizeStoredImageUrl(value)
  if (!source || source.startsWith('blob:')) return null
  if (source.startsWith('https://')) return source

  try {
    const url = new URL(source)
    if (LOCAL_MEDIA_PATH.test(url.pathname)) {
      return source
    }
  } catch {
    const path = source.startsWith('/') ? source : `/${source}`
    if (LOCAL_MEDIA_PATH.test(path)) {
      const origin = apiOrigin()
      if (!origin || origin.startsWith('/')) {
        return path
      }
      return `${origin}${path}`
    }
  }

  return null
}

export function isStoredImageUrl(value: string): boolean {
  return catalogMediaUrl(value) !== null
}
