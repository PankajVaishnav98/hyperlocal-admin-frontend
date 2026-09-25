/** India overview only — never written as a hub unless the operator clicks or types coordinates. */
export const INDIA_VIEWPORT = {
  latitude: 22.9734,
  longitude: 78.6569,
  zoom: 5,
}

export function lonToTileX(longitude: number, zoom: number): number {
  return ((longitude + 180) / 360) * 2 ** zoom
}

export function latToTileY(latitude: number, zoom: number): number {
  const rad = (latitude * Math.PI) / 180
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom
}

export function tileXToLon(x: number, zoom: number): number {
  return (x / 2 ** zoom) * 360 - 180
}

export function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom
  return (180 / Math.PI) * Math.atan(Math.sinh(n))
}

export function clickToCoordinates(input: {
  offsetX: number
  offsetY: number
  width: number
  height: number
  centerLatitude: number
  centerLongitude: number
  zoom: number
}): { latitude: number; longitude: number } {
  const centerX = lonToTileX(input.centerLongitude, input.zoom) * 256
  const centerY = latToTileY(input.centerLatitude, input.zoom) * 256
  const worldX = centerX - input.width / 2 + input.offsetX
  const worldY = centerY - input.height / 2 + input.offsetY
  return {
    latitude: Number(tileYToLat(worldY / 256, input.zoom).toFixed(6)),
    longitude: Number(tileXToLon(worldX / 256, input.zoom).toFixed(6)),
  }
}

export function tileUrl(x: number, y: number, zoom: number): string {
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
}
