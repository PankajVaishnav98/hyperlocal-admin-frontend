import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HubMapPicker } from './HubMapPicker'
import { LOCATION_PERMISSION_DENIED } from './serviceAreaHub'

describe('HubMapPicker current location', () => {
  it('shows permission-denied copy and does not invent a hub', async () => {
    const onPick = vi.fn()
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (
          _success: PositionCallback,
          error?: PositionErrorCallback,
        ) => {
          error?.({
            code: 1,
            message: 'denied',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError)
        },
      },
    })
    const user = userEvent.setup()
    render(<HubMapPicker latitude="" longitude="" onPick={onPick} onClear={() => undefined} />)
    await user.click(screen.getByRole('button', { name: 'Use my current location' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(LOCATION_PERMISSION_DENIED)
    expect(onPick).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
