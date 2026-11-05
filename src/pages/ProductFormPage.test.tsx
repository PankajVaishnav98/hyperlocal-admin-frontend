import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ProductFormPage } from './ProductFormPage'

vi.mock('../features/ops/api', () => ({
  listCategoryOptions: () =>
    Promise.resolve([{ id: 'cat-dairy', nameEn: 'Dairy', nameHi: 'दूध', slug: 'dairy' }]),
  getProduct: () =>
    Promise.resolve({
      id: 'prd-milk',
      categoryId: 'cat-dairy',
      sku: 'MLK-1L',
      nameEn: 'Toned milk',
      nameHi: 'टोन्ड दूध',
      description: 'Fresh pouch milk',
      unit: '1 L',
      pricePaise: 5800,
      mrpPaise: 6200,
      stockQuantity: 40,
      lowStockThreshold: 5,
      costPaise: 4200,
      imageUrl: '',
      inStock: true,
      isActive: true,
      inventoryStatus: 'IN_STOCK',
    }),
  rupeesToPaise: (value: string) => Math.round(Number.parseFloat(value) * 100),
}))

describe('ProductFormPage', () => {
  it('labels cost as platform COGS for profit, not customer price', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/products/prd-milk']}>
          <Routes>
            <Route path="/products/:productId" element={<ProductFormPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(
      await screen.findByLabelText('Cost to platform / COGS (₹, optional)'),
    ).toBeInTheDocument()
    expect(screen.getByText(/used for profit, not customer price/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Product details (optional)')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'This product can be returned' })).not.toBeChecked()
  })
})
