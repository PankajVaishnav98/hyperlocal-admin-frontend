import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getOrderPhoto } from './api'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock('../../api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
  },
}))

describe('getOrderPhoto', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('loads image bytes from the authenticated admin photo route', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer
    getMock.mockResolvedValue({
      data: bytes,
      headers: { 'content-type': 'image/png' },
    })

    const blob = await getOrderPhoto('ord_photo', 'pht_test')

    expect(getMock).toHaveBeenCalledWith('/admin/orders/ord_photo/photos/pht_test', {
      responseType: 'arraybuffer',
      timeout: 30_000,
    })
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBe(3)
  })

  it('refuses a response that is not a jpeg, png, or webp', async () => {
    getMock.mockResolvedValue({
      data: new ArrayBuffer(2),
      headers: { 'content-type': 'text/plain' },
    })
    await expect(getOrderPhoto('ord_photo', 'pht_test')).rejects.toThrow(
      'The photo could not be shown.',
    )
  })
})