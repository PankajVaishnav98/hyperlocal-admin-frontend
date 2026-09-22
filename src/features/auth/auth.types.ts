export type AdminSession = {
  adminId: string
  displayName: string
  email: string
}

export type AuthState =
  | { status: 'loading'; session: null }
  | { status: 'anonymous'; session: null }
  | { status: 'authenticated'; session: AdminSession }

export type AuthContextValue = AuthState & {
  beginSession: (session: AdminSession) => void
  clearSession: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
