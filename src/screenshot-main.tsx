import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import { apiClient } from './api/client'
import { AnalysisPage } from './pages/AnalysisPage'
import { CatalogImportPage } from './pages/CatalogImportPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductFormPage } from './pages/ProductFormPage'
import { ServiceAreaFormPage } from './pages/ServiceAreaFormPage'
import { OrderAlertStack } from './features/ops/OrderAlertHost'
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
  const params = config.params as { q?: string; status?: string } | undefined
  const ok = (data: unknown, meta?: Record<string, unknown>) =>
    ({
      data: { success: true, message: 'ok', data, ...(meta ? { meta } : {}) },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }) as AxiosResponse

  if (url.includes('/admin/catalog-import/template')) {
    return {
      data: new Blob(['xlsx'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse
  }
  if (url.includes('/admin/catalog-import')) {
    return ok({
      import: {
        importId: 'imp_demo',
        categories: { created: 1, updated: 1, failed: 1 },
        products: { created: 2, updated: 0, failed: 0 },
        errors: [
          {
            sheet: 'categories',
            row: 4,
            key: '(missing slug)',
            message: 'slug is required',
          },
        ],
      },
    })
  }
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
  if (url.includes('/admin/service-areas/area-jaipur')) {
    return ok({
      serviceArea: {
        id: 'area-jaipur',
        slug: 'gulabpura-bhilwara',
        name: 'Gulabpura',
        pincode: '311021',
        perKmFeePaise: 100,
        centerLatitude: 25.9041789,
        centerLongitude: 74.6581456,
        isActive: true,
      },
    })
  }
  if (url.includes('/admin/orders/ord_1')) {
    return ok({
      order: {
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
        statusHistory: [
          { status: 'placed', at: '2026-09-24T10:00:00.000Z' },
          { status: 'accepted', at: '2026-09-24T10:05:00.000Z' },
        ],
        placedAt: '2026-09-24T10:00:00.000Z',
        cancelledAt: null,
      },
    })
  }
  if (url.includes('/admin/orders')) {
    const orders = [
      {
        id: 'ord_1',
        orderNumber: 'HL-20260924-184221',
        status: 'placed',
        customerMobile: '+919876543210',
        items: [{ productId: 'prd-1', nameEn: 'Toned milk', quantity: 2 }],
        pricing: { itemsPaise: 11600, deliveryFeePaise: 4000, grandTotalPaise: 15600 },
        placedAt: '2026-09-24T10:00:00.000Z',
      },
      {
        id: 'ord_2',
        orderNumber: 'HL-20260924-199001',
        status: 'accepted',
        customerMobile: '+919111111111',
        items: [{ productId: 'prd-2', nameEn: 'Atta 5 kg', quantity: 1 }],
        pricing: { itemsPaise: 24500, deliveryFeePaise: 2000, grandTotalPaise: 26500 },
        placedAt: '2026-09-24T09:12:00.000Z',
      },
    ].filter((order) => {
      if (params?.status && order.status !== params.status) return false
      if (params?.q) {
        const hay = `${order.orderNumber} ${order.customerMobile}`.toLowerCase()
        return hay.includes(params.q.toLowerCase())
      }
      return true
    })
    return ok(
      { orders },
      {
        page: 1,
        limit: 25,
        total: orders.length,
        totalPages: orders.length > 0 ? 1 : 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    )
  }
  return ok({})
}

apiClient.defaults.adapter = adapter

const client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

const path =
  screen === 'product'
    ? '/products/prd-milk'
    : screen === 'service-area'
      ? '/service-areas/area-jaipur'
      : screen === 'orders'
        ? '/orders'
        : screen === 'order-detail'
          ? '/orders/ord_1'
          : screen === 'catalog-import'
            ? '/catalog-import'
            : '/analysis'

function FillCatalogImport() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const input = document.querySelector('input[type="file"]')
      if (!(input instanceof HTMLInputElement)) return
      const file = new File(['demo'], 'catalog.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const transfer = new DataTransfer()
      transfer.items.add(file)
      input.files = transfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
      document.querySelector<HTMLButtonElement>('button[type="submit"]')?.click()
    }, 80)
    return () => window.clearTimeout(timer)
  }, [])
  return null
}

function FillOrdersSearch() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const input = document.querySelector('input[aria-label="Search orders"]')
      if (!(input instanceof HTMLInputElement)) return
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, '184221')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, 50)
    return () => window.clearTimeout(timer)
  }, [])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="min-h-screen bg-canvas p-8">
      <div className="mx-auto max-w-6xl">
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[path]}>
            {screen === 'orders' ? <FillOrdersSearch /> : null}
            {screen === 'catalog-import' ? <FillCatalogImport /> : null}
            {screen === 'order-alert' || screen === 'analysis' ? (
              <OrderAlertStack
                alerts={[
                  {
                    eventId: 'evt_demo',
                    orderId: 'ord_1',
                    orderNumber: 'HL-20260924-184221',
                    occurredAt: '2026-09-24T10:00:00.000Z',
                  },
                ]}
                audioUnlocked
                onDismiss={() => undefined}
                onUnlock={() => undefined}
              />
            ) : null}
            <Routes>
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/products/:productId" element={<ProductFormPage />} />
              <Route path="/service-areas/:serviceAreaId" element={<ServiceAreaFormPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/catalog-import" element={<CatalogImportPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </div>
    </div>
  </StrictMode>,
)
