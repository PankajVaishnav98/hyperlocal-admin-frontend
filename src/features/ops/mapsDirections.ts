type DeliveryAddress = {
  line1: string
  city: string
  pincode: string
  latitude?: number | null
  longitude?: number | null
}

function isFiniteCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function hasSnapshotCoordinates(address: DeliveryAddress): boolean {
  const { latitude, longitude } = address
  return (
    isFiniteCoordinate(latitude) &&
    isFiniteCoordinate(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function addressQuery(address: DeliveryAddress): string {
  return [address.line1, address.city, address.pincode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')
}

export function mapsDirectionsUrl(address: DeliveryAddress): string {
  const destination = hasSnapshotCoordinates(address)
    ? `${address.latitude},${address.longitude}`
    : addressQuery(address)
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('destination', destination)
  return url.toString()
}
