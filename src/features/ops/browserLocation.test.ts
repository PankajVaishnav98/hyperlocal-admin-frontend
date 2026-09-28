import { describe, expect, it, vi } from 'vitest'

import { LocationPermissionError, requestBrowserCoordinates } from './browserLocation'

describe('admin hub geolocation', () => {
  it('fills WGS84 GPS without substituting a city center', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 25.90417891, longitude: 74.65814567 },
      } as GeolocationPosition)
    })
    await expect(
      requestBrowserCoordinates({ getCurrentPosition } as unknown as Geolocation),
    ).resolves.toEqual({ latitude: 25.9041789, longitude: 74.6581457 })
  })

  it('explains permission denied instead of inventing coordinates', async () => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, error?: PositionErrorCallback) => {
      error?.({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
    })
    await expect(
      requestBrowserCoordinates({ getCurrentPosition } as unknown as Geolocation),
    ).rejects.toBeInstanceOf(LocationPermissionError)
  })
})
