import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../features/auth/AuthProvider'
import type { AdminSession } from '../features/auth/auth.types'
import { AppRouter } from './AppRouter'

vi.mock('../features/auth/sessionService', async () => {
  const actual = await vi.importActual<typeof import('../features/auth/sessionService')>(
    '../features/auth/sessionService',
  )
  return {
    ...actual,
    listAdminSessions: vi.fn(async () => []),
  }
})
vi.mock('../features/ops/api', () => ({
  listOrders: () =>
    Promise.resolve({
      items: [],
      meta: {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
  ADMIN_LIST_PAGE_SIZE: 25,
  countOrders: () => Promise.resolve(0),
  getOrder: () => Promise.reject(new Error('not used')),
  listHomeBanners: () => Promise.resolve([]),
  disableHomeBanner: () => Promise.resolve({ id: 'ban_1', isActive: false }),
  listCategories: () =>
    Promise.resolve({
      items: [],
      meta: {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
  listCategoryOptions: () => Promise.resolve([]),
  listProducts: () =>
    Promise.resolve({
      items: [],
      meta: {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
  listProductOptions: () => Promise.resolve([]),
  listServiceAreas: () => Promise.resolve([]),
  getAnalysis: () => Promise.resolve(null),
  downloadCatalogImportTemplate: () => Promise.resolve(new Blob(['xlsx'])),
  importCatalogWorkbook: () => Promise.reject(new Error('not used')),
}))
vi.mock('../features/ops/OrderAlertHost', () => ({
  OrderAlertHost: () => null,
}))

function renderRouter({
  path = '/',
  session = null,
}: {
  path?: string
  session?: AdminSession | null
} = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider sessionLoader={() => Promise.resolve(session)}>
        <MemoryRouter initialEntries={[path]}>
          <AppRouter />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
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
      await screen.findByRole('heading', { name: 'Operations' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('No COD tickets yet')).toBeInTheDocument()
  })

  it('renders the operator device session screen', async () => {
    renderRouter({
      path: '/sessions',
      session: {
        adminId: 'admin-1',
        displayName: 'Operations Admin',
        email: 'ops@hyperlocal.test',
      },
    })

    expect(
      await screen.findByRole('heading', { name: 'Signed-in devices' }),
    ).toBeInTheDocument()
  })

  it('renders the orders inbox empty state when there are no COD orders', async () => {
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
    expect(await screen.findByText('No COD orders yet')).toBeInTheDocument()
  })

  it('renders the dedicated returns inbox', async () => {
    renderRouter({
      path: '/returns',
      session: {
        adminId: 'admin-1',
        displayName: 'Operations Admin',
        email: 'ops@hyperlocal.test',
      },
    })

    expect(await screen.findByRole('heading', { name: 'Returns' })).toBeInTheDocument()
    expect(await screen.findByText('No return requests')).toBeInTheDocument()
  })

  it('renders catalog import for an authenticated operator', async () => {
    renderRouter({
      path: '/catalog-import',
      session: {
        adminId: 'admin-1',
        displayName: 'Operations Admin',
        email: 'ops@hyperlocal.test',
      },
    })

    expect(await screen.findByRole('heading', { name: 'Catalog import' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download template' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Catalog import' })).toBeInTheDocument()
  })

  it('renders the home banners empty state', async () => {
    renderRouter({
      path: '/home-banners',
      session: {
        adminId: 'admin-1',
        displayName: 'Operations Admin',
        email: 'ops@hyperlocal.test',
      },
    })

    expect(
      await screen.findByRole('heading', { name: 'Home banners' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('No home banners yet')).toBeInTheDocument()
  })

  it('renders public legal policy pages without a session', async () => {
    renderRouter({ path: '/legal/returns' })

    expect(
      await screen.findByRole('heading', { name: 'Order return policy' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/30 minutes of delivery completion/i)).toBeInTheDocument()
    expect(screen.queryByText(/123456/)).not.toBeInTheDocument()
  })

  it('renders a not-found page for unknown locations', () => {
    renderRouter({ path: '/not-a-route' })

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
