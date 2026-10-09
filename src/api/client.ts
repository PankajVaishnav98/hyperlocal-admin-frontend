import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { normalizeApiError } from './errors'

const apiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1')

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData
}

type UnauthorizedListener = () => void
type AccessTokenProvider = () => string | null

const unauthorizedListeners = new Set<UnauthorizedListener>()
let getAccessToken: AccessTokenProvider = () => null
let refreshInFlight: Promise<void> | null = null

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-tokri-client': 'web',
  },
})

function isAuthPath(url: string | undefined): boolean {
  const path = url ?? ''
  return (
    path.includes('/auth/admin/login') ||
    path.includes('/auth/admin/refresh') ||
    path.includes('/auth/admin/logout')
  )
}

apiClient.interceptors.request.use((config) => {
  if (isFormData(config.data)) {
    config.headers.delete('Content-Type')
    config.headers.delete('content-type')
  }
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as AxiosError
    const original = axiosError.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined
    const status = axiosError.response?.status

    if (
      status === 401 &&
      original &&
      !original._retried &&
      !isAuthPath(original.url)
    ) {
      original._retried = true
      try {
        refreshInFlight ??= apiClient.post('/auth/admin/refresh', {}).then(() => undefined)
        await refreshInFlight
        refreshInFlight = null
        return apiClient(original)
      } catch {
        refreshInFlight = null
      }
    }

    const normalizedError = normalizeApiError(error)
    if (normalizedError.status === 401 && !isAuthPath(original?.url)) {
      unauthorizedListeners.forEach((listener) => listener())
    }
    return Promise.reject(normalizedError)
  },
)

export function setAccessTokenProvider(provider: AccessTokenProvider) {
  getAccessToken = provider
}

export function subscribeToUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}
