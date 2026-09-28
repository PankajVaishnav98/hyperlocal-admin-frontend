import { describe, expect, it } from 'vitest'

import { mapsDirectionsUrl } from './mapsDirections'

describe('mapsDirectionsUrl', () => {
  it('uses snapshot coordinates when both are present', () => {
    expect(
      mapsDirectionsUrl({
        line1: '12 Market Road',
        city: 'Jaipur',
        pincode: '302001',
        latitude: 26.9124,
        longitude: 75.7873,
      }),
    ).toBe('https://www.google.com/maps/dir/?api=1&destination=26.9124%2C75.7873')
  })

  it('falls back to line, locality, and PIN without inventing coordinates', () => {
    expect(
      mapsDirectionsUrl({
        line1: '12 Market Road',
        city: 'Jaipur',
        pincode: '302001',
      }),
    ).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=12+Market+Road%2C+Jaipur%2C+302001',
    )
  })

  it('ignores a lone latitude instead of inventing longitude', () => {
    expect(
      mapsDirectionsUrl({
        line1: 'SH39',
        city: 'Gulabpura',
        pincode: '311021',
        latitude: 25.9039,
      }),
    ).toBe('https://www.google.com/maps/dir/?api=1&destination=SH39%2C+Gulabpura%2C+311021')
  })
})
