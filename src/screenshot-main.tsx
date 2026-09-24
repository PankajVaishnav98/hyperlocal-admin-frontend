import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import { apiClient } from './api/client'
import { AnalysisPage } from './pages/AnalysisPage'
import { ProductFormPage } from './pages/ProductFormPage'
import type { AnalysisReport } from './features/ops/types'
import './app.css'

const screen = new URLSearchParams(window.location.search).get('screen') ?? 'analysis'

const analysis: AnalysisReport = {
  timeZone: 'Asia/Kolkata',
  from: '2026-08-26',
  to: '2026-09-24',
  today: '2026-09-24',
  definitions: {
    merchandiseRevenue: 'Sum of item line totals on non-cancelled orders. Delivery charges are excluded.',
    deliveryFees: 'Sum of delivery fees on the same non-cancelled orders, shown separately.',
    platformProfit:
      'Merchandise revenue minus snapshot product cost (costPaise × quantity). Lines without cost are omitted from COGS and mark profit incomplete — profit is never revenue minus delivery.',
  },
  range: {
    orderCount: 128,
    merchandiseRevenuePaise: 184_500_00,
    deliveryFeePaise: 12_400_00,
    cogsPaise: 121_200_00,
    profitPaise: 63_300_00,
    profitComplete: true,
    linesMissingCost: 0,
  },
  todayMetrics: {
    orderCount: 9,
    merchandiseRevenuePaise: 14_200_00,
    deliveryFeePaise: 1_100_00,
    cogsPaise: 9_050_00,
    profitPaise: 5_150_00,
    profitComplete: true,
    linesMissingCost: 0,
  },
  topProducts: [
    { id: 'prd-milk', name: 'Toned milk 1 L', quantity: 86, merchandisePaise: 49_880_0 },
    { id: 'prd-atta', name: 'Atta 5 kg', quantity: 41, merchandisePaise: 32_390_0 },
  ],
  topCategories: [
    { id: 'cat-dairy', name: 'Dairy', quantity: 120, merchandisePaise: 68_000_0 },
    { id: 'cat-staples', name: 'Staples', quantity: 73, merchandisePaise: 51_200_0 },
  ],
  ordersByWeekday: [
    { weekday: 0, label: 'Sun', count: 11 },
    { weekday: 1, label: 'Mon', count: 18 },
    { weekday: 2, label: 'Tue', count: 22 },
    { weekday: 3, label: 'Wed', count: 19 },
    { weekday: 4, label: 'Thu', count: 24 },
    { weekday: 5, label: 'Fri', count: 21 },
    { weekday: 6, label: 'Sat', count: 13 },
  ],
  ordersByHour: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hour >= 7 && hour <= 21 ? Math.max(1, 14 - Math.abs(11 - hour)) : 0,
  })),
  heatmap: Array.from({ length: 7 }, (_, weekday) =>
    Array.from({ length: 24 }, (_, hour) => ({
      weekday,
      hour,
      count: hour >= 7 && hour <= 21 ? ((weekday + hour) % 5) + (hour === 10 ? 4 : 0) : 0,
    })),
  ).flat(),
}

const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`
  const ok = (data: unknown) =>
    ({
      data: { success: true, message: 'ok', data },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }) as AxiosResponse

  if (url.includes('/admin/analysis')) {
    return ok({ analysis })
  }
  if (url.includes('/admin/categories')) {
    return ok({
      categories: [
        {
          id: 'cat-dairy',
          slug: 'dairy',
          nameEn: 'Dairy',
          nameHi: 'दूध',
          description: '',
          accent: '#D7E8DC',
          imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80',
          sortOrder: 10,
          isActive: true,
        },
      ],
    })
  }
  if (url.includes('/admin/products/prd-milk')) {
    return ok({
      product: {
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
        imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        isActive: true,
        inventoryStatus: 'IN_STOCK',
      },
    })
  }
  return ok({})
}

apiClient.defaults.adapter = adapter

const client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="min-h-screen bg-canvas p-8">
      <div className="mx-auto max-w-6xl">
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[screen === 'product' ? '/products/prd-milk' : '/analysis']}>
            <Routes>
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/products/:productId" element={<ProductFormPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </div>
    </div>
  </StrictMode>,
)
