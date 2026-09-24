import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ReturnsPage } from './ReturnsPage'

vi.mock('../features/ops/api', () => ({
  formatPaise: (value: number) => `₹${(value / 100).toFixed(0)}`,
  listOrders: () =>
    Promise.resolve([
      {
        id: 'ord_return_1',
        orderNumber: 'HL-20260924-111111',
        status: 'completed',
        customerMobile: '+919876543210',
        items: [{ productId: 'prd-1', nameEn: 'Milk', quantity: 1, lineTotalPaise: 5800 }],
        address: { recipientName: 'Asha', line1: '12 Market Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
        service: { serviceAreaName: 'Jaipur', distanceKm: 1 },
        pricing: { itemsPaise: 5800, deliveryFeePaise: 2000, grandTotalPaise: 7800 },
        payment: { method: 'cod', status: 'pending', amountPaise: 7800 },
        statusHistory: [],
        placedAt: '2026-09-24T10:00:00.000Z',
        cancelledAt: null,
        completedAt: '2026-09-24T10:20:00.000Z',
        returnRequest: {
          status: 'return_requested',
          requestedAt: '2026-09-24T10:25:00.000Z',
          reason: 'Wrong item',
        },
      },
    ]),
}))

describe('ReturnsPage', () => {
  it('lists return_requested orders', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ReturnsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Returns' })).toBeInTheDocument()
    expect(await screen.findByText('HL-20260924-111111')).toBeInTheDocument()
    expect(screen.getByText('Wrong item')).toBeInTheDocument()
    expect(screen.getByText('Return requested')).toBeInTheDocument()
  })
})
