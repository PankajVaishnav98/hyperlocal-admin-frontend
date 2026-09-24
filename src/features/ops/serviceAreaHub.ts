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
  const centerLatitude = Number(latitude)
  const centerLongitude = Number(longitude)
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
