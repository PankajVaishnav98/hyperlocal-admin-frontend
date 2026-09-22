import type { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'

import { ApiError, normalizeApiError } from './errors'

describe('normalizeApiError', () => {
  it('preserves the backend error contract', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          message: 'Request validation failed.',
          code: 'VALIDATION_ERROR',
          errors: [{ field: 'email', message: 'Invalid email.' }],
          requestId: 'request-123',
        },
      },
    } as unknown as AxiosError<{
      message: string
      code: string
      errors: unknown
      requestId: string
    }>

    const normalized = normalizeApiError(error)

    expect(normalized).toBeInstanceOf(ApiError)
    expect(normalized).toMatchObject({
      message: 'Request validation failed.',
      status: 422,
      code: 'VALIDATION_ERROR',
      requestId: 'request-123',
      isNetworkError: false,
    })
  })

  it('creates a safe, retryable network error', () => {
    const error = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
    } as unknown as AxiosError

    expect(normalizeApiError(error)).toMatchObject({
      code: 'NETWORK_ERROR',
      status: null,
      isNetworkError: true,
    })
  })

  it('normalizes non-transport failures without leaking details', () => {
    expect(normalizeApiError(new Error('Sensitive detail'))).toMatchObject({
      message: 'An unexpected error occurred.',
      code: 'UNEXPECTED_ERROR',
      status: null,
    })
  })
})
