export function visiblePageNumbers(current: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 0) return []
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  const pages = new Set([1, totalPages, current])
  if (current - 1 > 1) pages.add(current - 1)
  if (current + 1 < totalPages) pages.add(current + 1)
  const sorted = [...pages].sort((left, right) => left - right)
  const items: Array<number | 'gap'> = []
  for (let index = 0; index < sorted.length; index += 1) {
    const value = sorted[index]!
    if (index > 0 && value - sorted[index - 1]! > 1) items.push('gap')
    items.push(value)
  }
  return items
}
