import { describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SOCKET_PATH,
  adminSocketOptions,
  isAllowedSocketOrigin,
  startAdminOrderSocket,
  type AdminOrderSocket,
} from './realtime'

describe('admin order socket contract', () => {
  it('only allows http(s) origins', () => {
    expect(isAllowedSocketOrigin('https://api.hyperlocal.test')).toBe(true)
    expect(isAllowedSocketOrigin('http://localhost:3000')).toBe(true)
    expect(isAllowedSocketOrigin('ws://api.hyperlocal.test')).toBe(false)
    expect(isAllowedSocketOrigin('not-a-url')).toBe(false)
  })

  it('reconnects over the authenticated Socket.IO path', () => {
    expect(adminSocketOptions()).toMatchObject({
      path: ADMIN_SOCKET_PATH,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
    })
  })

  it('does not open a socket for a disallowed origin', () => {
    const createSocket = vi.fn()
    startAdminOrderSocket({
      origin: 'ws://insecure.example',
      createSocket,
      onOrdersChanged: vi.fn(),
      onReconnect: vi.fn(),
    })
    expect(createSocket).not.toHaveBeenCalled()
  })

  it('subscribes to order events, reconnect, and cleans up io listeners', () => {
    const handlers: Record<string, (payload?: unknown) => void> = {}
    const ioOn = vi.fn((event: string, handler: () => void) => {
      handlers[`io:${event}`] = handler
    })
    const ioRemove = vi.fn()
    const socket: AdminOrderSocket = {
      on: (event, handler) => {
        handlers[event] = handler
      },
      io: {
        on: ioOn,
        removeAllListeners: ioRemove,
      },
      removeAllListeners: vi.fn(),
      disconnect: vi.fn(),
    }
    const createSocket = vi.fn(() => socket)
    const onOrdersChanged = vi.fn()
    const onReconnect = vi.fn()
    const onOrderPlaced = vi.fn()
    const onDisconnect = vi.fn()

    const stop = startAdminOrderSocket({
      origin: 'https://api.hyperlocal.test',
      createSocket,
      onOrdersChanged,
      onReconnect,
      onOrderPlaced,
      onDisconnect,
    })

    expect(createSocket).toHaveBeenCalledWith(
      'https://api.hyperlocal.test',
      expect.objectContaining({ path: ADMIN_SOCKET_PATH, reconnection: true }),
    )
    const payload = { eventId: 'evt_1', orderId: 'ord_9', orderNumber: 'HL-100' }
    handlers['order:placed']?.(payload)
    expect(onOrdersChanged).toHaveBeenCalledTimes(1)
    expect(onOrderPlaced).toHaveBeenCalledWith(payload)
    handlers['order:accepted']?.({ orderId: 'ord_9' })
    expect(onOrdersChanged).toHaveBeenCalledTimes(2)
    expect(onOrderPlaced).toHaveBeenCalledTimes(1)
    handlers['disconnect']?.()
    expect(onDisconnect).toHaveBeenCalledTimes(1)
    handlers['io:reconnect']?.()
    expect(onReconnect).toHaveBeenCalledTimes(1)
    stop()
    expect(socket.removeAllListeners).toHaveBeenCalled()
    expect(ioRemove).toHaveBeenCalled()
    expect(socket.disconnect).toHaveBeenCalled()
  })
})
