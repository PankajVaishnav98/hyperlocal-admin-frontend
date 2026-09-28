import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../components/ui/Primitives'
import { clickToCoordinates, INDIA_VIEWPORT, latToTileY, lonToTileX, tileUrl } from './hubMap'

const MAP_HEIGHT = 280

export function HubMapPicker({
  latitude,
  longitude,
  onPick,
  onClear,
}: {
  latitude: string
  longitude: string
  onPick: (latitude: number, longitude: number) => void
  onClear: () => void
}) {
  const mapRef = useRef<HTMLButtonElement>(null)
  const [width, setWidth] = useState(640)
  const parsedLat = Number(latitude)
  const parsedLng = Number(longitude)
  const hasHub = Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && latitude.trim() && longitude.trim()
  const [zoom, setZoom] = useState(hasHub ? 13 : INDIA_VIEWPORT.zoom)
  const centerLatitude = hasHub ? parsedLat : INDIA_VIEWPORT.latitude
  const centerLongitude = hasHub ? parsedLng : INDIA_VIEWPORT.longitude

  useEffect(() => {
    const node = mapRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setWidth(node.clientWidth || 640))
    observer.observe(node)
    setWidth(node.clientWidth || 640)
    return () => observer.disconnect()
  }, [])

  const tiles = useMemo(() => {
    const height = MAP_HEIGHT
    const centerTx = lonToTileX(centerLongitude, zoom)
    const centerTy = latToTileY(centerLatitude, zoom)
    const topLeftX = centerTx - width / 2 / 256
    const topLeftY = centerTy - height / 2 / 256
    const startX = Math.floor(topLeftX)
    const startY = Math.floor(topLeftY)
    const cols = Math.ceil(width / 256) + 1
    const rows = Math.ceil(height / 256) + 1
    const max = 2 ** zoom
    const cells: Array<{ key: string; left: number; top: number; src: string }> = []
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const tileX = ((startX + col) % max + max) % max
        const tileY = startY + row
        if (tileY < 0 || tileY >= max) continue
        cells.push({
          key: `${zoom}-${tileX}-${tileY}`,
          left: (startX + col - topLeftX) * 256,
          top: (startY + row - topLeftY) * 256,
          src: tileUrl(tileX, tileY, zoom),
        })
      }
    }
    return cells
  }, [centerLatitude, centerLongitude, width, zoom])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-800">Delivery hub on the map</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setZoom((value) => Math.min(18, value + 1))}>
            Zoom in
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setZoom((value) => Math.max(3, value - 1))}>
            Zoom out
          </Button>
        </div>
      </div>
      <button
        ref={mapRef}
        type="button"
        className="relative block w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-100"
        style={{ height: MAP_HEIGHT }}
        aria-label="Set delivery hub from map. Click to place the hub. The map starts on India and does not save coordinates until you click or type them."
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const point = clickToCoordinates({
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            width: rect.width,
            height: rect.height,
            centerLatitude,
            centerLongitude,
            zoom,
          })
          onPick(point.latitude, point.longitude)
          setZoom((value) => Math.max(value, 12))
        }}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            alt=""
            src={tile.src}
            className="pointer-events-none absolute max-w-none"
            style={{ left: tile.left, top: tile.top, width: 256, height: 256 }}
          />
        ))}
        {hasHub ? (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-full rounded-full border-2 border-white bg-brand-600 shadow"
            aria-hidden="true"
          />
        ) : (
          <span className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-lg bg-white/90 px-3 py-2 text-left text-xs text-ink-600">
            Click the map to set the hub. Coordinates are not invented — India is only the starting view.
          </span>
        )}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs leading-5 text-ink-500">
          Map data © OpenStreetMap contributors. Customer delivery fee is metres from this hub × ₹ per
          100 m after PIN coverage matches.
        </p>
        {hasHub ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Clear hub
          </Button>
        ) : null}
      </div>
    </div>
  )
}
