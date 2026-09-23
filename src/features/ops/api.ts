import { apiClient } from '../../api/client'
import type {
  AdminCategory,
  AdminProduct,
  CategoryPayload,
  ProductPayload,
  ServiceArea,
  ServiceAreaPayload,
  AdminOrder,
  AdminHomeBanner,
  HomeBannerPayload,
} from './types'

type Envelope<T> = { success: boolean; data: T; meta?: { total?: number; limit?: number; offset?: number } }

export async function listCategories(): Promise<AdminCategory[]> {
  const response = await apiClient.get<Envelope<{ categories: AdminCategory[] }>>('/admin/categories')
  return response.data.data.categories
}

export async function getCategory(id: string): Promise<AdminCategory> {
  const response = await apiClient.get<Envelope<{ category: AdminCategory }>>(
    `/admin/categories/${encodeURIComponent(id)}`,
  )
  return response.data.data.category
}

export async function createCategory(payload: CategoryPayload): Promise<AdminCategory> {
  const response = await apiClient.post<Envelope<{ category: AdminCategory }>>(
    '/admin/categories',
    payload,
  )
  return response.data.data.category
}

export async function updateCategory(id: string, payload: Partial<CategoryPayload>): Promise<AdminCategory> {
  const response = await apiClient.patch<Envelope<{ category: AdminCategory }>>(
    `/admin/categories/${encodeURIComponent(id)}`,
    payload,
  )
  return response.data.data.category
}

export async function disableCategory(id: string): Promise<AdminCategory> {
  const response = await apiClient.delete<Envelope<{ category: AdminCategory }>>(
    `/admin/categories/${encodeURIComponent(id)}`,
  )
  return response.data.data.category
}

export async function listProducts(query?: {
  q?: string
  categoryId?: string
}): Promise<AdminProduct[]> {
  const response = await apiClient.get<Envelope<{ products: AdminProduct[] }>>('/admin/products', {
    params: { limit: 50, offset: 0, ...query },
  })
  return response.data.data.products
}

export async function getProduct(id: string): Promise<AdminProduct> {
  const response = await apiClient.get<Envelope<{ product: AdminProduct }>>(
    `/admin/products/${encodeURIComponent(id)}`,
  )
  return response.data.data.product
}

export async function createProduct(payload: ProductPayload): Promise<AdminProduct> {
  const response = await apiClient.post<Envelope<{ product: AdminProduct }>>(
    '/admin/products',
    payload,
  )
  return response.data.data.product
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>): Promise<AdminProduct> {
  const response = await apiClient.patch<Envelope<{ product: AdminProduct }>>(
    `/admin/products/${encodeURIComponent(id)}`,
    payload,
  )
  return response.data.data.product
}

export async function disableProduct(id: string): Promise<AdminProduct> {
  const response = await apiClient.delete<Envelope<{ product: AdminProduct }>>(
    `/admin/products/${encodeURIComponent(id)}`,
  )
  return response.data.data.product
}

export async function listServiceAreas(): Promise<ServiceArea[]> {
  const response = await apiClient.get<Envelope<{ serviceAreas: ServiceArea[] }>>(
    '/admin/service-areas',
  )
  return response.data.data.serviceAreas
}

export async function getServiceArea(id: string): Promise<ServiceArea> {
  const response = await apiClient.get<Envelope<{ serviceArea: ServiceArea }>>(
    `/admin/service-areas/${encodeURIComponent(id)}`,
  )
  return response.data.data.serviceArea
}

export async function createServiceArea(payload: ServiceAreaPayload): Promise<ServiceArea> {
  const response = await apiClient.post<Envelope<{ serviceArea: ServiceArea }>>(
    '/admin/service-areas',
    payload,
  )
  return response.data.data.serviceArea
}

export async function updateServiceArea(
  id: string,
  payload: Partial<ServiceAreaPayload>,
): Promise<ServiceArea> {
  const response = await apiClient.patch<Envelope<{ serviceArea: ServiceArea }>>(
    `/admin/service-areas/${encodeURIComponent(id)}`,
    payload,
  )
  return response.data.data.serviceArea
}

export async function disableServiceArea(id: string): Promise<ServiceArea> {
  const response = await apiClient.delete<Envelope<{ serviceArea: ServiceArea }>>(
    `/admin/service-areas/${encodeURIComponent(id)}`,
  )
  return response.data.data.serviceArea
}

export async function listOrders(): Promise<AdminOrder[]> {
  const response = await apiClient.get<Envelope<{ orders: AdminOrder[] }>>('/admin/orders', {
    params: { limit: 50, offset: 0 },
  })
  return response.data.data.orders
}

export async function getOrder(id: string): Promise<AdminOrder> {
  const response = await apiClient.get<Envelope<{ order: AdminOrder }>>(
    `/admin/orders/${encodeURIComponent(id)}`,
  )
  return response.data.data.order
}

export async function listHomeBanners(): Promise<AdminHomeBanner[]> {
  const response = await apiClient.get<Envelope<{ banners: AdminHomeBanner[] }>>(
    '/admin/home-banners',
  )
  return response.data.data.banners
}

export async function getHomeBanner(id: string): Promise<AdminHomeBanner> {
  const response = await apiClient.get<Envelope<{ banner: AdminHomeBanner }>>(
    `/admin/home-banners/${encodeURIComponent(id)}`,
  )
  return response.data.data.banner
}

export async function createHomeBanner(payload: HomeBannerPayload): Promise<AdminHomeBanner> {
  const response = await apiClient.post<Envelope<{ banner: AdminHomeBanner }>>(
    '/admin/home-banners',
    payload,
  )
  return response.data.data.banner
}

export async function updateHomeBanner(
  id: string,
  payload: Partial<HomeBannerPayload>,
): Promise<AdminHomeBanner> {
  const response = await apiClient.patch<Envelope<{ banner: AdminHomeBanner }>>(
    `/admin/home-banners/${encodeURIComponent(id)}`,
    payload,
  )
  return response.data.data.banner
}

export async function disableHomeBanner(id: string): Promise<AdminHomeBanner> {
  const response = await apiClient.delete<Envelope<{ banner: AdminHomeBanner }>>(
    `/admin/home-banners/${encodeURIComponent(id)}`,
  )
  return response.data.data.banner
}

export function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(paise / 100)
}

export function rupeesToPaise(value: string): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return Number.NaN
  return Math.round(parsed * 100)
}
