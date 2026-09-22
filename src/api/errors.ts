import axios from 'axios'

type ErrorEnvelope = {
  message?: string
  code?: string
  errors?: unknown
  requestId?: string
}

export class ApiError extends Error {
  readonly status: number | null
  readonly code: string
  readonly details?: unknown
  readonly requestId?: string
  readonly isNetworkError: boolean

  constructor({
    message,
    status = null,
    code = 'UNKNOWN_ERROR',
    details,
    requestId,
    isNetworkError = false,
  }: {
    message: string
    status?: number | null
    code?: string
    details?: unknown
    requestId?: string
    isNetworkError?: boolean
  }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
    this.isNetworkError = isNetworkError
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (!axios.isAxiosError<ErrorEnvelope>(error)) {
    return new ApiError({
      message: 'An unexpected error occurred.',
      code: 'UNEXPECTED_ERROR',
    })
  }

  const status = error.response?.status ?? null
  const payload = error.response?.data
  const isTimeout = error.code === 'ECONNABORTED'
  const isNetworkError = !error.response

  return new ApiError({
    message:
      payload?.message ??
      (isTimeout
        ? 'The request timed out. Please try again.'
        : isNetworkError
          ? 'Unable to reach the service. Check your connection and try again.'
          : 'The request could not be completed.'),
    status,
    code:
      payload?.code ??
      (isTimeout ? 'REQUEST_TIMEOUT' : isNetworkError ? 'NETWORK_ERROR' : 'API_ERROR'),
    details: payload?.errors,
    requestId: payload?.requestId,
    isNetworkError,
  })
}
