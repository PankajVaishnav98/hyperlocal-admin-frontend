import { describe, expect, it } from 'vitest'

import { parseOptionalHub } from './serviceAreaHub'

describe('service area hub form', () => {
  it('omits coordinates when both fields are blank', () => {
    expect(parseOptionalHub('', '  ')).toEqual({ ok: true })
  })

  it('requires both hub coordinates together', () => {
    const result = parseOptionalHub('26.9124', '')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.hubLongitude).toMatch(/both/i)
  })

  it('accepts a valid Jaipur hub', () => {
    expect(parseOptionalHub('26.9124', '75.7873')).toEqual({
      ok: true,
      hub: { centerLatitude: 26.9124, centerLongitude: 75.7873 },
    })
  })
})
