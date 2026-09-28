/** ~1.1 cm on WGS84. GPS and map clicks keep this precision; values are never invented. */
export const WGS84_DECIMALS = 7

export function persistWgs84(value: number): number {
  if (!Number.isFinite(value)) {
    return value
  }
  return Number(value.toFixed(WGS84_DECIMALS))
}

export function formatWgs84(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return ''
  }
  return String(persistWgs84(value))
}

export const LOCATION_PERMISSION_DENIED =
  'Location permission was denied. Enable location access in the browser, then try again, or type both coordinates. Coordinates are never invented.'

export const LOCATION_UNAVAILABLE =
  'Location is unavailable. Enter coordinates from the map or type them. Coordinates are never invented.'

export function parseOptionalHub(
  latitudeRaw: string,
  longitudeRaw: string,
):
  | { ok: true; hub?: { centerLatitude: number; centerLongitude: number } }
  | { ok: false; errors: Record<string, string> } {
  const latitude = latitudeRaw.trim()
  const longitude = longitudeRaw.trim()
  if (!latitude && !longitude) {
    return { ok: true }
  }
  if (!latitude || !longitude) {
    const errors: Record<string, string> = {}
    if (!latitude) errors.hubLatitude = 'Enter both hub coordinates, or leave both blank'
    if (!longitude) errors.hubLongitude = 'Enter both hub coordinates, or leave both blank'
    return { ok: false, errors }
  }
  const centerLatitude = persistWgs84(Number(latitude))
  const centerLongitude = persistWgs84(Number(longitude))
  const errors: Record<string, string> = {}
  if (!Number.isFinite(centerLatitude) || centerLatitude < -90 || centerLatitude > 90) {
    errors.hubLatitude = 'Latitude must be between -90 and 90'
  }
  if (!Number.isFinite(centerLongitude) || centerLongitude < -180 || centerLongitude > 180) {
    errors.hubLongitude = 'Longitude must be between -180 and 180'
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }
  return { ok: true, hub: { centerLatitude, centerLongitude } }
}
