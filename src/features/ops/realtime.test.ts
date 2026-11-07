import { describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SOCKET_PATH,
  adminSocketOptions,
  isAllowedSocketOrigin,
  startAdminOrderSocket,
  type AdminOrderSocket,
} from './realtime'

async function flushSocketConnect() {
  await Promise.resolve()
}

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

  it('subscribes to order events, reconnect, and cleans up io listeners', async () => {
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
    const onOrderResolved = vi.fn()
    const onReturnRequested = vi.fn()
    const onReturnResolved = vi.fn()
    const onDisconnect = vi.fn()

    const stop = startAdminOrderSocket({
      origin: 'https://api.hyperlocal.test',
      createSocket,
      onOrdersChanged,
      onReconnect,
      onOrderPlaced,
      onOrderResolved,
      onReturnRequested,
      onReturnResolved,
      onDisconnect,
    })
    await flushSocketConnect()

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
    expect(onOrderResolved).toHaveBeenCalledWith({ orderId: 'ord_9' })
    handlers['order:cancelled']?.({ orderId: 'ord_8' })
    expect(onOrderResolved).toHaveBeenCalledTimes(2)
    handlers['order:return_requested']?.({ orderId: 'ord_9', orderNumber: 'HL-100' })
    expect(onReturnRequested).toHaveBeenCalledWith({ orderId: 'ord_9', orderNumber: 'HL-100' })
    handlers['order:return_accepted']?.({ orderId: 'ord_9' })
    expect(onReturnResolved).toHaveBeenCalledWith({ orderId: 'ord_9' })
    handlers['order:return_rejected']?.({ orderId: 'ord_8' })
    expect(onReturnResolved).toHaveBeenCalledWith({ orderId: 'ord_8' })
    expect(onOrderResolved).toHaveBeenCalledTimes(2)
    handlers['order:under_review']?.({ orderId: 'ord_photo' })
    expect(onOrdersChanged).toHaveBeenCalledTimes(7)
    expect(onOrderResolved).toHaveBeenCalledTimes(2)
    handlers['order:rejected']?.({ orderId: 'ord_photo' })
    expect(onOrdersChanged).toHaveBeenCalledTimes(8)
    expect(onOrderResolved).toHaveBeenCalledTimes(3)
    handlers['disconnect']?.()
    expect(onDisconnect).toHaveBeenCalledTimes(1)
    handlers['io:reconnect']?.()
    expect(onReconnect).toHaveBeenCalledTimes(1)
    stop()
    expect(socket.removeAllListeners).toHaveBeenCalled()
    expect(ioRemove).toHaveBeenCalled()
    expect(socket.disconnect).toHaveBeenCalled()
  })

  it('skips the StrictMode unmount so the first handshake is never torn down', async () => {
    const disconnect = vi.fn()
    const createSocket = vi.fn(() => ({
      on: vi.fn(),
      io: { on: vi.fn(), removeAllListeners: vi.fn() },
      removeAllListeners: vi.fn(),
      disconnect,
    }))

    const stopFirst = startAdminOrderSocket({
      origin: 'https://api.hyperlocal.test',
      createSocket,
      onOrdersChanged: vi.fn(),
      onReconnect: vi.fn(),
    })
    stopFirst()
    await flushSocketConnect()
    expect(createSocket).not.toHaveBeenCalled()

    const stopSecond = startAdminOrderSocket({
      origin: 'https://api.hyperlocal.test',
      createSocket,
      onOrdersChanged: vi.fn(),
      onReconnect: vi.fn(),
    })
    await flushSocketConnect()
    expect(createSocket).toHaveBeenCalledTimes(1)
    expect(disconnect).not.toHaveBeenCalled()
    stopSecond()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
