export const ADMIN_SOCKET_PATH = '/api/v1/socket.io'

export const ORDER_SOCKET_EVENTS = [
  'order:placed',
  'order:accepted',
  'order:cancelled',
  'order:completed',
  'order:return_requested',
  'order:return_completed',
  'order:return_rejected',
] as const

export function isAllowedSocketOrigin(origin: string): boolean {
  try {
    const protocol = new URL(origin).protocol
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export function socketOriginFromApiBaseUrl(apiBaseUrl: string, pageOrigin?: string): string {
  try {
    return new URL(apiBaseUrl, pageOrigin ?? 'http://localhost').origin
  } catch {
    return pageOrigin ?? 'http://localhost'
  }
}

export function adminSocketOrigin(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (configured) {
    return socketOriginFromApiBaseUrl(configured, window.location.origin)
  }
  return import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin
}

export function adminSocketOptions() {
  return {
    path: ADMIN_SOCKET_PATH,
    withCredentials: true as const,
    transports: ['websocket', 'polling'] as ['websocket', 'polling'],
    reconnection: true as const,
    reconnectionAttempts: Number.POSITIVE_INFINITY,
    reconnectionDelay: 400,
    reconnectionDelayMax: 4_000,
    timeout: 8_000,
  }
}

export interface AdminOrderSocket {
  on: (event: string, handler: (payload?: unknown) => void) => void
  io: {
    on: (event: string, handler: (...args: unknown[]) => void) => void
    removeAllListeners: () => void
  }
  removeAllListeners: () => void
  disconnect: () => void
}

export type AdminSocketFactory = (
  origin: string,
  options: ReturnType<typeof adminSocketOptions>,
) => AdminOrderSocket

export function startAdminOrderSocket(input: {
  origin: string
  createSocket: AdminSocketFactory
  onOrdersChanged: () => void
  onReconnect: () => void
  onOrderPlaced?: (payload: unknown) => void
  onDisconnect?: () => void
}): () => void {
  if (!isAllowedSocketOrigin(input.origin)) {
    return () => undefined
  }

  const socket = input.createSocket(input.origin, adminSocketOptions())
  socket.io.on('reconnect', input.onReconnect)
  if (input.onDisconnect) {
    socket.on('disconnect', input.onDisconnect)
  }
  for (const event of ORDER_SOCKET_EVENTS) {
    socket.on(event, (payload) => {
      input.onOrdersChanged()
      if (event === 'order:placed') {
        input.onOrderPlaced?.(payload)
      }
    })
  }

  return () => {
    socket.removeAllListeners()
    socket.io.removeAllListeners()
    socket.disconnect()
  }
}

export function invalidateAdminOrderQueries(
  queryClient: { invalidateQueries: (filters: { queryKey: string[] }) => unknown },
) {
  void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
  void queryClient.invalidateQueries({ queryKey: ['admin', 'returns'] })
  void queryClient.invalidateQueries({ queryKey: ['admin', 'analysis'] })
}

export function invalidateAdminCatalogQueries(
  queryClient: { invalidateQueries: (filters: { queryKey: string[] }) => unknown },
) {
  void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
  void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
}
