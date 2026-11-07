import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrderDetailPage } from './OrderDetailPage'

const { getOrderMock, transitionMock, photoMock } = vi.hoisted(() => ({
  getOrderMock: vi.fn(),
  transitionMock: vi.fn(),
  photoMock: vi.fn(),
}))

vi.mock('../features/ops/api', () => ({
  formatPaise: (value: number) => `₹${(value / 100).toFixed(0)}`,
  getOrder: (...args: unknown[]) => getOrderMock(...args),
  transitionOrder: (...args: unknown[]) => transitionMock(...args),
  resolveReturn: vi.fn(),
  getOrderPhoto: (...args: unknown[]) => photoMock(...args),
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

function renderOrder(orderId = 'ord_1') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const photoOrder = {
  ...order,
  id: 'ord_photo',
  orderNumber: 'HL-PHOTO-1',
  orderType: 'PHOTO',
  status: 'placed',
  items: [],
  photos: [{ imageId: 'pht_1', mimeType: 'image/jpeg', bytes: 12 }],
  pricing: null,
  payment: { method: 'cod', status: 'pending', amountPaise: 0 },
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    photoMock.mockReset()
    transitionMock.mockReset()
    photoMock.mockResolvedValue(new Blob([Uint8Array.from([1, 2, 3])], { type: 'image/jpeg' }))
    URL.createObjectURL = vi.fn(() => 'blob:photo-preview')
    URL.revokeObjectURL = vi.fn()
  })

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

  it('keeps accept, reject, and deliver on a regular order', async () => {
    getOrderMock.mockResolvedValue(order)
    renderOrder()
    expect(await screen.findByRole('button', { name: 'Mark delivered' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start Review' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accept Order' })).not.toBeInTheDocument()
  })

  it('reviews, accepts, and delivers a photo order without a catalog price', async () => {
    const user = userEvent.setup()
    getOrderMock.mockResolvedValue(photoOrder)
    transitionMock.mockImplementation(async (_id: string, action: string) => ({
      ...photoOrder,
      status: action === 'review' ? 'under_review' : action === 'accept' ? 'accepted' : 'completed',
    }))
    renderOrder('ord_photo')

    expect(await screen.findByText('Photo Se Order')).toBeInTheDocument()
    expect(screen.getByText('Asha')).toBeInTheDocument()
    expect(screen.getByText('1 photo')).toBeInTheDocument()
    expect(screen.getByText('No catalog total. The shop has not priced this photo order.')).toBeInTheDocument()
    expect(screen.queryByText('Toned milk')).not.toBeInTheDocument()
    expect(photoMock).toHaveBeenCalledWith('ord_photo', 'pht_1')

    const thumb = await screen.findByRole('img', { name: 'Photo 1' })
    expect(thumb).toHaveAttribute('src', 'blob:photo-preview')
    await user.click(screen.getByRole('button', { name: 'View photo 1' }))
    expect(screen.getByRole('img', { name: 'Full size photo' })).toHaveAttribute('src', 'blob:photo-preview')
    expect(screen.queryByText(/cloudinary|storageKey|secure_url/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start Review' }))
    const reviewButtons = screen.getAllByRole('button', { name: 'Start Review' })
    await user.click(reviewButtons[reviewButtons.length - 1]!)
    expect(transitionMock).toHaveBeenCalledWith('ord_photo', 'review')

    cleanup()
    getOrderMock.mockResolvedValue({ ...photoOrder, status: 'under_review' })
    renderOrder('ord_photo')
    await user.click(await screen.findByRole('button', { name: 'Accept Order' }))
    await user.click(screen.getByRole('button', { name: 'Accept order' }))
    expect(transitionMock).toHaveBeenCalledWith('ord_photo', 'accept')

    cleanup()
    getOrderMock.mockResolvedValue({ ...photoOrder, status: 'accepted' })
    renderOrder('ord_photo')
    expect(await screen.findByRole('button', { name: 'Mark delivered' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark delivered' }))
    const deliverButtons = screen.getAllByRole('button', { name: 'Mark delivered' })
    await user.click(deliverButtons[deliverButtons.length - 1]!)
    expect(transitionMock).toHaveBeenCalledWith('ord_photo', 'deliver')
  })

  it('rejects a placed or under-review photo order without the regular stock warning', async () => {
    const user = userEvent.setup()
    getOrderMock.mockResolvedValue(photoOrder)
    transitionMock.mockResolvedValue({ ...photoOrder, status: 'rejected' })
    renderOrder('ord_photo')

    await user.click(await screen.findByRole('button', { name: 'Reject Order' }))
    expect(screen.getByText('The photo order will be marked Rejected. No stock is restored and no payment is changed.')).toBeInTheDocument()
    expect(screen.queryByText(/Stock is restored/)).not.toBeInTheDocument()
    const rejectButtons = screen.getAllByRole('button', { name: 'Reject Order' })
    await user.click(rejectButtons[rejectButtons.length - 1]!)
    expect(transitionMock).toHaveBeenCalledWith('ord_photo', 'reject')

    cleanup()
    getOrderMock.mockResolvedValue({ ...photoOrder, status: 'under_review' })
    renderOrder('ord_photo')
    expect(await screen.findByRole('button', { name: 'Reject Order' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accept Order' })).toBeInTheDocument()

    cleanup()
    getOrderMock.mockResolvedValue({ ...photoOrder, status: 'accepted' })
    renderOrder('ord_photo')
    expect(await screen.findByRole('button', { name: 'Mark delivered' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject Order' })).not.toBeInTheDocument()
  })
})
