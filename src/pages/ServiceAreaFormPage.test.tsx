import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ServiceAreaFormPage } from './ServiceAreaFormPage'

vi.mock('../features/ops/api', () => ({
  getServiceArea: () =>
    Promise.resolve({
      id: 'area-gulabpura',
      slug: 'gulabpura-bhilwara',
      name: 'Gulabpura',
      pincode: '311021',
      perKmFeePaise: 100,
      centerLatitude: 25.9041789,
      centerLongitude: 74.6581456,
      isActive: true,
    }),
  rupeesToPaise: (value: string) => Math.round(Number.parseFloat(value) * 100),
}))

describe('ServiceAreaFormPage', () => {
  it('offers current-location hub fill and disables save while idle GPS is not required', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/service-areas/area-gulabpura']}>
          <Routes>
            <Route path="/service-areas/:serviceAreaId" element={<ServiceAreaFormPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('button', { name: 'Use my current location' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save service area' })).not.toBeDisabled()
    expect(screen.getByLabelText('Hub latitude')).toHaveValue('25.9041789')
    expect(screen.getByText(/Charge per 100 m/)).toBeInTheDocument()
  })
})
