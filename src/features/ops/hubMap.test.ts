import { describe, expect, it } from 'vitest'

import { clickToCoordinates, INDIA_VIEWPORT, lonToTileX, tileXToLon } from './hubMap'

describe('hub map projection', () => {
  it('round-trips longitude through web mercator tiles', () => {
    const zoom = 8
    const longitude = 75.7873
    expect(tileXToLon(lonToTileX(longitude, zoom), zoom)).toBeCloseTo(longitude, 5)
  })

  it('maps a center click back to the viewport center', () => {
    const point = clickToCoordinates({
      offsetX: 160,
      offsetY: 140,
      width: 320,
      height: 280,
      centerLatitude: INDIA_VIEWPORT.latitude,
      centerLongitude: INDIA_VIEWPORT.longitude,
      zoom: INDIA_VIEWPORT.zoom,
    })
    expect(point.latitude).toBeCloseTo(INDIA_VIEWPORT.latitude, 3)
    expect(point.longitude).toBeCloseTo(INDIA_VIEWPORT.longitude, 3)
  })
})
