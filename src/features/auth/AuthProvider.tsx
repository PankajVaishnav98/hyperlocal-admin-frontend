import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  setAccessTokenProvider,
  subscribeToUnauthorized,
} from '../../api/client'
import { queryClient } from '../../services/queryClient'
import { AuthContext } from './authContext'
import type { AdminSession, AuthState } from './auth.types'
import { restoreAdminSession } from './sessionService'

type AuthProviderProps = PropsWithChildren<{
  sessionLoader?: () => Promise<AdminSession | null>
}>

export function AuthProvider({
  children,
  sessionLoader = restoreAdminSession,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
  })

  const clearSession = useCallback(() => {
    setState({ status: 'anonymous', session: null })
    queryClient.clear()
  }, [])

  const beginSession = useCallback((session: AdminSession) => {
    queryClient.clear()
    setState({ status: 'authenticated', session })
  }, [])

  useEffect(() => {
    let active = true

    void sessionLoader()
      .then((session) => {
        if (!active) return

        setState(
          session
            ? { status: 'authenticated', session }
            : { status: 'anonymous', session: null },
        )
      })
      .catch(() => {
        if (active) {
          setState({ status: 'anonymous', session: null })
        }
      })

    return () => {
      active = false
    }
  }, [sessionLoader])

  useEffect(() => {
    setAccessTokenProvider(() =>
      state.status === 'authenticated' ? state.session.accessToken : null,
    )

    return () => {
      setAccessTokenProvider(() => null)
    }
  }, [state])

  useEffect(() => subscribeToUnauthorized(clearSession), [clearSession])

  const value = useMemo(
    () => ({ ...state, beginSession, clearSession }),
    [beginSession, clearSession, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
