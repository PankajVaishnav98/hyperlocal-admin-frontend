import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates after the delay, not on every keystroke', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: 'm' },
    })

    rerender({ value: 'mi' })
    rerender({ value: 'mil' })
    expect(result.current).toBe('m')

    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(result.current).toBe('mil')
  })
})
