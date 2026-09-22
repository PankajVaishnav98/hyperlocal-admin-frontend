import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { LoadingState } from '../../components/states/SystemStates'
import { useAuth } from './authContext'

export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas px-5">
        <div className="w-full max-w-md">
          <LoadingState label="Restoring admin session" rows={2} />
        </div>
      </main>
    )
  }

  if (auth.status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
