import { Bell, Volume2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'

import { Button } from '../../components/ui/Primitives'
import { listOrders } from './api'
import {
  browserOrderAlertChannel,
  createAlertAudio,
  createSeenOrderStore,
  loadSeenOrderIds,
  missedPlacedOrders,
  parseOrderPlacedPayload,
  persistSeenOrderIds,
  rememberOrder,
  shouldAnnounceAlert,
  type OrderAlert,
} from './orderAlert'
import {
  adminSocketOrigin,
  invalidateAdminCatalogQueries,
  invalidateAdminOrderQueries,
  startAdminOrderSocket,
  type AdminOrderSocket,
} from './realtime'

function storage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

export function OrderAlertHost({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient()
  const [alerts, setAlerts] = useState<OrderAlert[]>([])
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const seenRef = useRef(createSeenOrderStore(loadSeenOrderIds(storage())))
  const disconnectedAtRef = useRef<number | null>(null)
  const seededRef = useRef(false)
  const audioRef = useRef(createAlertAudio())
  const channelRef = useRef<ReturnType<typeof browserOrderAlertChannel>>(null)

  const announce = useCallback(
    async (alert: OrderAlert, options?: { broadcast?: boolean }) => {
      if (!shouldAnnounceAlert(seenRef.current, alert)) return
      rememberOrder(seenRef.current, alert, storage())
      setAlerts((current) => [alert, ...current.filter((item) => item.orderId !== alert.orderId)].slice(0, 5))
      const played = await audioRef.current.play()
      if (played) setAudioUnlocked(true)
      if (options?.broadcast !== false) {
        channelRef.current?.publish(alert)
      }
    },
    [],
  )

  const unlockAudio = useCallback(async () => {
    const ok = await audioRef.current.unlock()
    if (ok) setAudioUnlocked(true)
    return ok
  }, [])

  const dismiss = useCallback((orderId: string) => {
    setAlerts((current) => current.filter((alert) => alert.orderId !== orderId))
  }, [])

  const seedSeen = useCallback(async () => {
    if (seededRef.current) return
    seededRef.current = true
    try {
      const result = await listOrders({ status: 'placed', page: 1, limit: 25 })
      for (const order of result.items) {
        seenRef.current.add(order.id)
      }
      persistSeenOrderIds(storage(), seenRef.current.snapshot())
    } catch {
      seededRef.current = false
    }
  }, [])

  const catchUp = useCallback(async () => {
    const disconnectedAt = disconnectedAtRef.current
    if (disconnectedAt == null) return
    try {
      const result = await listOrders({ status: 'placed', page: 1, limit: 15 })
      const missed = missedPlacedOrders({
        orders: result.items,
        seen: seenRef.current,
        disconnectedAt,
      })
      disconnectedAtRef.current = null
      for (const alert of missed) {
        await announce(alert, { broadcast: true })
      }
    } catch {
      // Query invalidation still refreshes tables; toast catch-up can retry on the next reconnect.
    }
  }, [announce])

  useEffect(() => {
    if (!enabled || import.meta.env.VITE_SCREENSHOT === '1') return

    const refreshOrders = () => invalidateAdminOrderQueries(queryClient)
    const refreshAfterReconnect = () => {
      invalidateAdminOrderQueries(queryClient)
      invalidateAdminCatalogQueries(queryClient)
      void catchUp()
    }

    void seedSeen()

    return startAdminOrderSocket({
      origin: adminSocketOrigin(),
      createSocket: (origin, options) => io(origin, options) as unknown as AdminOrderSocket,
      onOrdersChanged: refreshOrders,
      onReconnect: refreshAfterReconnect,
      onDisconnect: () => {
        disconnectedAtRef.current = Date.now()
      },
      onOrderPlaced: (payload) => {
        const alert = parseOrderPlacedPayload(payload)
        if (!alert) return
        void announce(alert)
      },
    })
  }, [announce, catchUp, enabled, queryClient, seedSeen])

  useEffect(() => {
    if (!enabled) return
    const channel = browserOrderAlertChannel()
    channelRef.current = channel
    const stop = channel?.listen((alert) => {
      void announce(alert, { broadcast: false })
    })
    return () => {
      stop?.()
      channel?.close()
      channelRef.current = null
    }
  }, [announce, enabled])

  useEffect(() => {
    if (!enabled || audioUnlocked) return
    const onGesture = () => {
      void unlockAudio()
    }
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }, [audioUnlocked, enabled, unlockAudio])

  if (!enabled) return null

  return (
    <OrderAlertStack
      alerts={alerts}
      audioUnlocked={audioUnlocked}
      onDismiss={dismiss}
      onUnlock={() => {
        void unlockAudio()
      }}
    />
  )
}

export function OrderAlertStack({
  alerts,
  audioUnlocked,
  onDismiss,
  onUnlock,
}: {
  alerts: OrderAlert[]
  audioUnlocked: boolean
  onDismiss: (orderId: string) => void
  onUnlock: () => void
}) {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:px-6">
        <div className="flex w-full max-w-xl flex-col gap-2">
          {alerts.map((alert) => (
            <div
              key={alert.eventId}
              role="status"
              aria-live="assertive"
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-danger-600 bg-white p-3 shadow-[0_18px_50px_rgba(16,23,19,0.18)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger-50 text-danger-700">
                <Bell aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink-950">New COD order</p>
                <p className="mt-0.5 truncate text-sm text-ink-700">
                  Order {alert.orderNumber}
                </p>
                <p className="truncate font-mono text-xs text-ink-500">{alert.orderId}</p>
                <Link
                  to={`/orders/${encodeURIComponent(alert.orderId)}`}
                  className="mt-2 inline-flex text-sm font-semibold text-brand-800 hover:underline"
                  onClick={() => onDismiss(alert.orderId)}
                >
                  Open order
                </Link>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Dismiss order ${alert.orderNumber}`}
                onClick={() => onDismiss(alert.orderId)}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {!audioUnlocked ? (
        <button
          type="button"
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-ink-950 px-4 py-2 text-sm font-semibold text-white shadow-lg"
          onClick={onUnlock}
        >
          <Volume2 aria-hidden="true" className="size-4" />
          Enable loud order alerts
        </button>
      ) : null}
    </>
  )
}
