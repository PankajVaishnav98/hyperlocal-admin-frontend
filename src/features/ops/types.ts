export type AdminCategory = {
  id: string
  slug: string
  nameEn: string
  nameHi: string
  description: string
  accent: string
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  offset?: number
}

export type PagedList<T> = {
  items: T[]
  meta: PaginationMeta
}

export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISABLED'

export type AdminProduct = {
  id: string
  categoryId: string
  sku: string
  nameEn: string
  nameHi: string
  description: string
  unit: string
  pricePaise: number
  mrpPaise: number
  stockQuantity: number
  lowStockThreshold: number
  costPaise: number | null
  imageUrl: string | null
  inStock: boolean
  returnable: boolean
  returnWindowMinutes: number
  isActive: boolean
  inventoryStatus: InventoryStatus
}

export type ServiceArea = {
  id: string
  slug: string
  name: string
  pincode: string
  perKmFeePaise: number
  centerLatitude?: number
  centerLongitude?: number
  isActive: boolean
}

export type CategoryPayload = Omit<AdminCategory, 'id'>
export type ProductPayload = Omit<AdminProduct, 'id' | 'inventoryStatus'>
export type ServiceAreaPayload = {
  name: string
  pincode: string
  perKmFeePaise: number
  isActive: boolean
  centerLatitude?: number | null
  centerLongitude?: number | null
}

export type OrderStatus = 'placed' | 'under_review' | 'accepted' | 'cancelled' | 'rejected' | 'completed'
export type OrderType = 'REGULAR' | 'PHOTO'
export type AdminOrderAction = 'review' | 'accept' | 'reject' | 'deliver'
export type AdminReturnAction = 'accept' | 'complete' | 'reject'
export type ReturnRequestStatus = 'return_requested' | 'accepted' | 'completed' | 'rejected'

export type AdminOrderPhoto = {
  imageId: string
  mimeType: string
  bytes: number
}

export type AdminOrder = {
  id: string
  orderNumber: string
  orderType?: OrderType
  status: OrderStatus
  customerMobile: string
  photos?: AdminOrderPhoto[]
  items: Array<{
    productId: string
    nameEn: string
    quantity: number
    lineTotalPaise: number
  }>
  address: {
    recipientName: string
    line1: string
    city: string
    state: string
    pincode: string
    latitude?: number | null
    longitude?: number | null
  }
  service: {
    serviceAreaName: string
    distanceKm: number
  }
  pricing: {
    itemsPaise: number
    deliveryFeePaise: number
    grandTotalPaise: number
  } | null
  payment: {
    method: 'cod'
    status: 'pending'
    amountPaise: number
  }
  statusHistory: Array<{ status: OrderStatus; at: string }>
  placedAt: string
  cancelledAt: string | null
  completedAt?: string | null
  returnRequest?: {
    status: ReturnRequestStatus
    requestedAt: string
    resolvedAt?: string | null
    reason: string
  } | null
}

export type HomeBannerLinkType = 'none' | 'category' | 'product' | 'url'

export type AdminHomeBanner = {
  id: string
  imageUrl: string
  title: string
  subtitle: string
  linkType: HomeBannerLinkType
  categoryId?: string
  productId?: string
  linkUrl?: string
  sortOrder: number
  isActive: boolean
}

export type HomeBannerPayload = Omit<AdminHomeBanner, 'id'>

export type ImageFolder = 'products' | 'categories' | 'banners'

export type AnalysisReport = {
  timeZone: 'Asia/Kolkata' | 'UTC'
  from: string
  to: string
  today: string
  definitions: {
    merchandiseRevenue: string
    deliveryFees: string
    platformProfit: string
  }
  range: {
    orderCount: number
    merchandiseRevenuePaise: number
    deliveryFeePaise: number
    cogsPaise: number
    profitPaise: number
    profitComplete: boolean
    linesMissingCost: number
  }
  todayMetrics: {
    orderCount: number
    merchandiseRevenuePaise: number
    deliveryFeePaise: number
    cogsPaise: number
    profitPaise: number
    profitComplete: boolean
    linesMissingCost: number
  }
  topProducts: Array<{ id: string; name: string; quantity: number; merchandisePaise: number }>
  topCategories: Array<{ id: string; name: string; quantity: number; merchandisePaise: number }>
  ordersByWeekday: Array<{ weekday: number; label: string; count: number }>
  ordersByHour: Array<{ hour: number; count: number }>
  heatmap: Array<{ weekday: number; hour: number; count: number }>
}

export type CatalogImportError = {
  sheet: string
  row: number
  key: string
  message: string
}

export type CatalogImportCounts = {
  created: number
  updated: number
  failed: number
}

export type AdminOffer = {
  id: string
  title: string
  scope: 'all' | 'product'
  productId: string | null
  productName: string | null
  kind: 'percent' | 'flat'
  percent: number | null
  flatPaise: number | null
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
}

export type OfferPayload = {
  title: string
  scope: 'all' | 'product'
  productId: string | null
  kind: 'percent' | 'flat'
  percent: number | null
  flatPaise: number | null
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
}

export type CatalogImportResult = {
  importId: string
  categories: CatalogImportCounts
  products: CatalogImportCounts
  errors: CatalogImportError[]
}
