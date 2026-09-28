import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { OrderDetailPage } from './OrderDetailPage'

const { getOrderMock } = vi.hoisted(() => ({ getOrderMock: vi.fn() }))

vi.mock('../features/ops/api', () => ({
  formatPaise: (value: number) => `₹${(value / 100).toFixed(0)}`,
  getOrder: (...args: unknown[]) => getOrderMock(...args),
}))

const order = {
  id: 'ord_1',
  orderNumber: 'HL-20260924-184221',
  status: 'accepted',
  customerMobile: '+919876543210',
  items: [{ productId: 'prd-1', nameEn: 'Toned milk', quantity: 2, lineTotalPaise: 11600 }],
  address: {
    recipientName: 'Asha',
    line1: '12 Market Road',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    latitude: 26.9124,
    longitude: 75.7873,
  },
  service: { serviceAreaName: 'Jaipur', distanceKm: 1.2 },
  pricing: { itemsPaise: 11600, deliveryFeePaise: 4000, grandTotalPaise: 15600 },
  payment: { method: 'cod', status: 'pending', amountPaise: 15600 },
  statusHistory: [{ status: 'accepted', at: '2026-09-24T10:05:00.000Z' }],
  placedAt: '2026-09-24T10:00:00.000Z',
  cancelledAt: null,
}

function renderOrder() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/orders/ord_1']}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OrderDetailPage', () => {
  it('links the delivery address to Google Maps using snapshot coordinates', async () => {
    getOrderMock.mockResolvedValue(order)
    renderOrder()

    const link = await screen.findByRole('link', { name: 'Open Google Maps directions' })
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=26.9124%2C75.7873',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('uses line, locality, and PIN when coordinates are absent', async () => {
    getOrderMock.mockResolvedValue({
      ...order,
      address: {
        recipientName: 'Asha',
        line1: '12 Market Road',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
      },
    })
    renderOrder()

    const link = await screen.findByRole('link', { name: 'Open Google Maps directions' })
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=12+Market+Road%2C+Jaipur%2C+302001',
    )
  })
})
