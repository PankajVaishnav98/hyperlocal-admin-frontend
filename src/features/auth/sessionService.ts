import type { AdminSession } from './auth.types'

/**
 * Phase 1 intentionally has no client-side credential persistence and no
 * pretend login. Phase 2 will replace this boundary with the backend admin
 * session bootstrap flow backed by a Secure, HttpOnly refresh cookie.
 */
export async function restoreAdminSession(): Promise<AdminSession | null> {
  return null
}
