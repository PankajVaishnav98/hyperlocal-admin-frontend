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

  it('filters the list to Photo Se Order tickets', async () => {
    const meta = {
      page: 1,
      limit: 25,
      total: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }
    const photo = {
      ...ticket,
      id: 'ord_photo',
      orderNumber: 'HL-PHOTO-1',
      orderType: 'PHOTO',
      items: [],
      photos: [{ imageId: 'pht_1', mimeType: 'image/jpeg', bytes: 10 }],
      pricing: null,
    }
    listOrdersMock.mockImplementation(async (query?: { orderType?: string }) => ({
      items: query?.orderType === 'PHOTO' ? [photo] : [ticket, photo],
      meta: {
        ...meta,
        total: query?.orderType === 'PHOTO' ? 1 : 2,
      },
    }))
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

    expect(await screen.findByText('HL-20260924-184221')).toBeInTheDocument()
    expect(screen.getByText('HL-PHOTO-1')).toBeInTheDocument()
    expect(screen.getByText('Photo Se Order · 1 photo')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Photo Orders' }))
    expect(await screen.findByText('HL-PHOTO-1')).toBeInTheDocument()
    expect(screen.queryByText('HL-20260924-184221')).not.toBeInTheDocument()
    expect(screen.getByText('Not priced')).toBeInTheDocument()
    expect(listOrdersMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderType: 'PHOTO', page: 1, limit: 25 }),
    )
    expect(screen.getByRole('option', { name: 'Under Review' })).toBeInTheDocument()
  })
})
