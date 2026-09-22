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
