import { apiClient } from '../../api/client'
import { ApiError } from '../../api/errors'
import type { AdminSession } from './auth.types'

type Envelope<T> = {
  success: boolean
  message: string
  data: T
}

function asSession(value: unknown): AdminSession | null {
  if (!value || typeof value !== 'object') return null
  const session = value as { admin?: { id?: unknown; displayName?: unknown; email?: unknown } }
  const admin = session.admin
  if (
    !admin ||
    typeof admin.id !== 'string' ||
    typeof admin.displayName !== 'string' ||
    typeof admin.email !== 'string'
  ) {
    return null
  }
  return {
    adminId: admin.id,
    displayName: admin.displayName,
    email: admin.email,
  }
}

export async function restoreAdminSession(): Promise<AdminSession | null> {
  try {
    const response = await apiClient.get<Envelope<{ session: unknown }>>('/auth/admin/session')
    return asSession(response.data.data.session)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const response = await apiClient.post<Envelope<{ session: unknown }>>('/auth/admin/login', {
    email,
    password,
  })
  const session = asSession(response.data.data.session)
  if (!session) {
    throw new ApiError({
      message: 'The server returned an incomplete admin session.',
      code: 'INVALID_SESSION',
    })
  }
  return session
}

export async function logoutAdmin(): Promise<void> {
  try {
    await apiClient.post('/auth/admin/logout', {})
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return
    }
    throw error
  }
}

export type AdminDeviceSession = {
  sessionId: string
  current: boolean
  deviceId: string | null
  userAgent: string | null
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string
}

export async function listAdminSessions(): Promise<AdminDeviceSession[]> {
  const response = await apiClient.get<Envelope<{ sessions: AdminDeviceSession[] }>>(
    '/auth/admin/sessions',
  )
  return response.data.data.sessions
}

export async function revokeAdminSession(sessionId: string): Promise<{ revoked: true; current: boolean }> {
  const response = await apiClient.delete<Envelope<{ revoked: true; current: boolean }>>(
    `/auth/admin/sessions/${encodeURIComponent(sessionId)}`,
  )
  return response.data.data
}
