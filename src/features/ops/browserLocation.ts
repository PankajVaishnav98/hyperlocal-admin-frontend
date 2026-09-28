import { LOCATION_PERMISSION_DENIED, LOCATION_UNAVAILABLE, persistWgs84 } from './serviceAreaHub'

export class LocationPermissionError extends Error {
  readonly code = 'LOCATION_PERMISSION_DENIED'

  constructor(message = LOCATION_PERMISSION_DENIED) {
    super(message)
    this.name = 'LocationPermissionError'
  }
}

export class LocationUnavailableError extends Error {
  readonly code = 'LOCATION_UNAVAILABLE'

  constructor(message = LOCATION_UNAVAILABLE) {
    super(message)
    this.name = 'LocationUnavailableError'
  }
}

const POSITION_TIMEOUT_MS = 12_000

export type BrowserCoordinates = { latitude: number; longitude: number }

export function requestBrowserCoordinates(
  geolocation: Geolocation | undefined = globalThis.navigator?.geolocation,
): Promise<BrowserCoordinates> {
  return new Promise((resolve, reject) => {
    if (!geolocation) {
      reject(new LocationUnavailableError())
      return
    }

    geolocation.getCurrentPosition(
      (position) => {
        const latitude = persistWgs84(position.coords.latitude)
        const longitude = persistWgs84(position.coords.longitude)
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          reject(new LocationUnavailableError())
          return
        }
        resolve({ latitude, longitude })
      },
      (error) => {
        if (error.code === 1) {
          reject(new LocationPermissionError())
          return
        }
        reject(new LocationUnavailableError())
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: POSITION_TIMEOUT_MS,
      },
    )
  })
}
