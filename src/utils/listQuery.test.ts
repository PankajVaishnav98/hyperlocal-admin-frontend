import { describe, expect, it } from 'vitest'

import { paginateItems, textMatches } from './listQuery'

describe('list query helpers', () => {
  it('treats blank search as a match and compares case-insensitively', () => {
    expect(textMatches('', 'Milk')).toBe(true)
    expect(textMatches('mlk', 'MLK-1L')).toBe(true)
    expect(textMatches('bread', 'Milk')).toBe(false)
  })

  it('paginates local lists and reports empty totals', () => {
    const page = paginateItems(['a', 'b', 'c'], 2, 2)
    expect(page.items).toEqual(['c'])
    expect(page.meta).toMatchObject({ page: 2, total: 3, hasNextPage: false, hasPreviousPage: true })
    expect(paginateItems([], 1, 25).meta.total).toBe(0)
  })
})
