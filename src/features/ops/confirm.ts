import { useState } from 'react'

export function useConfirmTarget<T>() {
  const [target, setTarget] = useState<T | null>(null)
  return {
    target,
    open: setTarget,
    close: () => setTarget(null),
  }
}
