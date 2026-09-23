export type AdminCategory = {
  id: string
  slug: string
  nameEn: string
  nameHi: string
  description: string
  accent: string
  sortOrder: number
  isActive: boolean
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
  inStock: boolean
  isActive: boolean
  inventoryStatus: InventoryStatus
}

export type ServiceArea = {
  id: string
  slug: string
  name: string
  centerLatitude: number
  centerLongitude: number
  radiusKm: number
  baseDistanceKm: number
  baseFeePaise: number
  additionalDistanceKm: number
  additionalFeePaise: number
  maxDistanceKm: number
  isActive: boolean
}

export type CategoryPayload = Omit<AdminCategory, 'id'>
export type ProductPayload = Omit<AdminProduct, 'id' | 'inventoryStatus'>
export type ServiceAreaPayload = Omit<ServiceArea, 'id'>

export type OrderStatus = 'placed' | 'cancelled'

export type AdminOrder = {
  id: string
  orderNumber: string
  status: OrderStatus
  customerMobile: string
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
  }
  service: {
    serviceAreaName: string
    distanceKm: number
  }
  pricing: {
    itemsPaise: number
    deliveryFeePaise: number
    grandTotalPaise: number
  }
  payment: {
    method: 'cod'
    status: 'pending'
    amountPaise: number
  }
  placedAt: string
  cancelledAt: string | null
}

export type HomeBannerLinkType = 'none' | 'category' | 'product'

export type AdminHomeBanner = {
  id: string
  imageUrl: string
  title: string
  subtitle: string
  linkType: HomeBannerLinkType
  categoryId?: string
  productId?: string
  sortOrder: number
  isActive: boolean
}

export type HomeBannerPayload = Omit<AdminHomeBanner, 'id'>
