import { describe, expect, it } from 'vitest'

import { canonicalizeStoredImageUrl, catalogMediaUrl } from './catalogMediaUrl'

describe('catalogMediaUrl', () => {
  it('returns Cloudinary HTTPS URLs unchanged', () => {
    const url = 'https://res.cloudinary.com/hyperlocal-test/image/upload/v1/hyperlocal/products/milk.png'
    expect(catalogMediaUrl(url)).toBe(url)
  })

  it('does not prepend the API origin onto an already-absolute Cloudinary URL', () => {
    expect(
      catalogMediaUrl(
        'http://localhost:3000/api/v1/https://res.cloudinary.com/hyperlocal-test/image/upload/milk.png',
      ),
    ).toBe('https://res.cloudinary.com/hyperlocal-test/image/upload/milk.png')
  })

  it('keeps local media URLs and drops blob URLs', () => {
    expect(
      catalogMediaUrl('http://localhost:3000/api/v1/media/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    ).toBe('http://localhost:3000/api/v1/media/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    expect(catalogMediaUrl('blob:http://localhost:5173/abc')).toBeNull()
    expect(catalogMediaUrl('')).toBeNull()
  })

  it('canonicalizes nested https before display', () => {
    expect(
      canonicalizeStoredImageUrl(
        'https://admin.example/proxy/https://res.cloudinary.com/hyperlocal-test/image/upload/x.png',
      ),
    ).toBe('https://res.cloudinary.com/hyperlocal-test/image/upload/x.png')
  })
})
