import type { PagedList } from '../features/ops/types'

export function textMatches(q: string, ...fields: Array<string | number | null | undefined>): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return fields.some((field) => String(field ?? '').toLowerCase().includes(needle))
}

export function paginateItems<T>(
  items: T[],
  page: number,
  limit: number,
): PagedList<T> {
  const total = items.length
  const totalPages = limit > 0 && total > 0 ? Math.ceil(total / limit) : 0
  const offset = Math.max(0, (page - 1) * limit)
  return {
    items: items.slice(offset, offset + limit),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: totalPages > 0 && page < totalPages,
      hasPreviousPage: page > 1 && total > 0,
      offset,
    },
  }
}
