import { useState } from 'react'

export function useResettingPage(filterKey: string): [number, (page: number) => void] {
  const [page, setPage] = useState(1)
  const [seenKey, setSeenKey] = useState(filterKey)
  if (seenKey !== filterKey) {
    setSeenKey(filterKey)
    setPage(1)
  }
  return [page, setPage]
}
