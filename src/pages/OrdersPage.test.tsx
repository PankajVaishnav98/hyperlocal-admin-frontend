import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { OrdersPage } from './OrdersPage'

const { listOrdersMock } = vi.hoisted(() => ({ listOrdersMock: vi.fn() }))

vi.mock('../features/ops/api', () => ({
  ADMIN_LIST_PAGE_SIZE: 25,
  formatPaise: (value: number) => `₹${(value / 100).toFixed(0)}`,
  listOrders: (...args: unknown[]) => listOrdersMock(...args),
}))

const ticket = {
  id: 'ord_1',
  orderNumber: 'HL-20260924-184221',
  status: 'placed',
  customerMobile: '+919876543210',
  items: [{ productId: 'prd-1', nameEn: 'Milk', quantity: 1 }],
  pricing: { grandTotalPaise: 7800 },
  placedAt: '2026-09-24T10:00:00.000Z',
}

describe('OrdersPage', () => {
  it('searches and distinguishes no-match from an empty inbox', async () => {
    listOrdersMock.mockResolvedValue({
      items: [ticket],
      meta: {
        page: 1,
        limit: 25,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <OrdersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Orders' })).toBeInTheDocument()
    expect(await screen.findByText('HL-20260924-184221')).toBeInTheDocument()
    expect(screen.getByLabelText('Search orders')).toBeInTheDocument()

    listOrdersMock.mockResolvedValue({
      items: [],
      meta: {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    await user.type(screen.getByLabelText('Search orders'), 'no-such')
    expect(await screen.findByText('No matching orders')).toBeInTheDocument()
  })
})
