import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../features/auth/AuthProvider'
import type { AdminSession } from '../features/auth/auth.types'
import { AppRouter } from './AppRouter'

function renderRouter({
  path = '/',
  session = null,
}: {
  path?: string
  session?: AdminSession | null
} = {}) {
  return render(
    <AuthProvider sessionLoader={() => Promise.resolve(session)}>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('AppRouter', () => {
  it('redirects anonymous visitors from protected routes to sign in', async () => {
    renderRouter()

    expect(
      await screen.findByRole('heading', { name: 'Admin sign in' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('renders the dashboard shell for an authenticated session', async () => {
    renderRouter({
      session: {
        adminId: 'admin-1',
        displayName: 'Operations Admin',
        email: 'ops@hyperlocal.test',
      },
    })

    expect(
      await screen.findByRole('heading', { name: 'Catalog and coverage' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No order metrics yet')).toBeInTheDocument()
  })

  it('renders the honest empty orders screen', async () => {
    renderRouter({
      path: '/orders',
      session: {
        adminId: 'admin-1',
        displayName: 'Operations Admin',
        email: 'ops@hyperlocal.test',
      },
    })

    expect(
      await screen.findByRole('heading', { name: 'Orders' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No orders to operate')).toBeInTheDocument()
  })

  it('renders a not-found page for unknown locations', () => {
    renderRouter({ path: '/not-a-route' })

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
