import axios from 'axios'

import { normalizeApiError } from './errors'

const apiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1')

type UnauthorizedListener = () => void
type AccessTokenProvider = () => string | null

const unauthorizedListeners = new Set<UnauthorizedListener>()
let getAccessToken: AccessTokenProvider = () => null

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()

  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalizedError = normalizeApiError(error)

    if (normalizedError.status === 401) {
      unauthorizedListeners.forEach((listener) => listener())
    }

    return Promise.reject(normalizedError)
  },
)

/**
 * Phase 2 auth can provide its short-lived, in-memory access token here.
 * Refresh credentials remain server-managed Secure/HttpOnly cookies.
 */
export function setAccessTokenProvider(provider: AccessTokenProvider) {
  getAccessToken = provider
}

export function subscribeToUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener)

  return () => {
    unauthorizedListeners.delete(listener)
  }
}
