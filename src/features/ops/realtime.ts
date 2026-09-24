import { io, type Socket } from 'socket.io-client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const ORDER_EVENTS = [
  'order:placed',
  'order:accepted',
  'order:cancelled',
  'order:completed',
] as const

function socketOrigin(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (configured) {
    try {
      return new URL(configured, window.location.origin).origin
    } catch {
      return window.location.origin
    }
  }
  return import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin
}

export function useAdminOrderSocket(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || import.meta.env.VITE_SCREENSHOT === '1') return

    const socket: Socket = io(socketOrigin(), {
      path: '/api/v1/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    const refreshOrders = () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    }

    for (const event of ORDER_EVENTS) {
      socket.on(event, refreshOrders)
    }

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [enabled, queryClient])
}
