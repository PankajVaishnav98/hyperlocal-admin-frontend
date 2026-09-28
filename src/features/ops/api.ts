import { apiClient } from '../../api/client'
import type {
  AdminCategory,
  AdminProduct,
  CategoryPayload,
  ProductPayload,
  ServiceArea,
  ServiceAreaPayload,
  AdminOrder,
  AdminOrderAction,
  AdminReturnAction,
  AdminHomeBanner,
  HomeBannerPayload,
  AnalysisReport,
  CatalogImportResult,
  ImageFolder,
  OrderStatus,
  PagedList,
  PaginationMeta,
} from './types'

type Envelope<T> = {
  success: boolean
  data: T
  meta?: PaginationMeta & { total?: number; limit?: number; offset?: number }
}

export const ADMIN_LIST_PAGE_SIZE = 25

function paged<T>(items: T[], meta?: Envelope<unknown>['meta']): PagedList<T> {
  const total = meta?.total ?? items.length
  const limit = meta?.limit ?? ADMIN_LIST_PAGE_SIZE
  const page = meta?.page ?? 1
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: meta?.totalPages ?? (limit > 0 && total > 0 ? Math.ceil(total / limit) : 0),
      hasNextPage: meta?.hasNextPage ?? page * limit < total,
      hasPreviousPage: meta?.hasPreviousPage ?? page > 1,
      offset: meta?.offset,
    },
  }
}

export async function listCategories(query?: {
  q?: string
  active?: 'true' | 'false'
  page?: number
  limit?: number
}): Promise<PagedList<AdminCategory>> {
  const response = await apiClient.get<Envelope<{ categories: AdminCategory[] }>>('/admin/categories', {
    params: {
      page: query?.page ?? 1,
      limit: query?.limit ?? ADMIN_LIST_PAGE_SIZE,
      ...(query?.q ? { q: query.q } : {}),
      ...(query?.active ? { active: query.active } : {}),
    },
  })
  return paged(response.data.data.categories, response.data.meta)
}

export async function listCategoryOptions(): Promise<AdminCategory[]> {
  const result = await listCategories({ page: 1, limit: 100 })
  return result.items
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
  active?: 'true' | 'false'
  page?: number
  limit?: number
}): Promise<PagedList<AdminProduct>> {
  const response = await apiClient.get<Envelope<{ products: AdminProduct[] }>>('/admin/products', {
    params: {
      page: query?.page ?? 1,
      limit: query?.limit ?? ADMIN_LIST_PAGE_SIZE,
      includeInactive: 'true',
      ...(query?.q ? { q: query.q } : {}),
      ...(query?.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query?.active ? { active: query.active } : {}),
    },
  })
  return paged(response.data.data.products, response.data.meta)
}

export async function listProductOptions(): Promise<AdminProduct[]> {
  const result = await listProducts({ page: 1, limit: 100 })
  return result.items
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

export async function listOrders(query?: {
  status?: OrderStatus
  q?: string
  page?: number
  limit?: number
  returnRequested?: boolean
}): Promise<PagedList<AdminOrder>> {
  const page = query?.page ?? 1
  const limit = query?.limit ?? ADMIN_LIST_PAGE_SIZE
  const response = await apiClient.get<Envelope<{ orders: AdminOrder[] }>>('/admin/orders', {
    params: {
      page,
      limit,
      ...(query?.q ? { q: query.q } : {}),
      ...(query?.status ? { status: query.status } : {}),
      ...(query?.returnRequested ? { returnRequested: 'true' } : {}),
    },
  })
  return paged(response.data.data.orders, response.data.meta)
}

export async function countOrders(status?: OrderStatus): Promise<number> {
  const response = await apiClient.get<Envelope<{ orders: AdminOrder[] }>>('/admin/orders', {
    params: {
      limit: 1,
      offset: 0,
      ...(status ? { status } : {}),
    },
  })
  return response.data.meta?.total ?? response.data.data.orders.length
}

export async function getOrder(id: string): Promise<AdminOrder> {
  const response = await apiClient.get<Envelope<{ order: AdminOrder }>>(
    `/admin/orders/${encodeURIComponent(id)}`,
  )
  return response.data.data.order
}

export async function transitionOrder(
  id: string,
  action: AdminOrderAction,
): Promise<AdminOrder> {
  const response = await apiClient.post<Envelope<{ order: AdminOrder }>>(
    `/admin/orders/${encodeURIComponent(id)}/status`,
    { action },
  )
  return response.data.data.order
}

export async function resolveReturn(
  id: string,
  action: AdminReturnAction,
): Promise<AdminOrder> {
  const response = await apiClient.post<Envelope<{ order: AdminOrder }>>(
    `/admin/orders/${encodeURIComponent(id)}/return`,
    { action },
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

export async function uploadImage(folder: ImageFolder, file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  const response = await apiClient.post<Envelope<{ image: { imageUrl: string } }>>(
    '/admin/images',
    body,
    {
      params: { folder },
      timeout: 30_000,
    },
  )
  const imageUrl = response.data.data.image.imageUrl
  if (!imageUrl || imageUrl.startsWith('blob:')) {
    throw new Error('Upload did not return a stored image URL')
  }
  return imageUrl
}

export async function getAnalysis(query: {
  from: string
  to: string
  timeZone?: 'Asia/Kolkata' | 'UTC'
}): Promise<AnalysisReport> {
  const response = await apiClient.get<Envelope<{ analysis: AnalysisReport }>>('/admin/analysis', {
    params: query,
  })
  return response.data.data.analysis
}

export async function downloadCatalogImportTemplate(): Promise<Blob> {
  const response = await apiClient.get<Blob>('/admin/catalog-import/template', {
    responseType: 'blob',
  })
  return response.data
}

export async function importCatalogWorkbook(file: File): Promise<CatalogImportResult> {
  const body = new FormData()
  body.append('file', file)
  const response = await apiClient.post<Envelope<{ import: CatalogImportResult }>>(
    '/admin/catalog-import',
    body,
    { timeout: 60_000 },
  )
  return response.data.data.import
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
