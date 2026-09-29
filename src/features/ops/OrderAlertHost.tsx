import { Bell, Volume2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'

import { Button } from '../../components/ui/Primitives'
import { listOrders } from './api'
import {
  browserOrderAlertChannel,
  claimRepeatPlay,
  createAlertAudio,
  loadPendingAlerts,
  ORDER_ALERT_REPEAT_MS,
  parseOrderEventPayload,
  persistPendingAlerts,
  reconcilePendingAlerts,
  removePendingAlert,
  upsertPendingAlert,
  type OrderAlert,
  type OrderAlertBroadcast,
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
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function OrderAlertHost({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient()
  const [alerts, setAlerts] = useState<OrderAlert[]>(() => loadPendingAlerts(storage()))
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const pendingRef = useRef<OrderAlert[]>(alerts)
  const audioRef = useRef(createAlertAudio())
  const channelRef = useRef<ReturnType<typeof browserOrderAlertChannel>>(null)

  const commit = useCallback((next: OrderAlert[]) => {
    pendingRef.current = next
    persistPendingAlerts(storage(), next)
    setAlerts(next)
    setHiddenIds((current) => current.filter((id) => next.some((alert) => alert.orderId === id)))
  }, [])

  const playChime = useCallback(
    async (force: boolean) => {
      if (pendingRef.current.length === 0) return
      if (!force && !claimRepeatPlay(storage(), Date.now())) return
      if (force) claimRepeatPlay(storage(), Date.now())
      const played = await audioRef.current.play()
      if (played) setAudioUnlocked(true)
    },
    [],
  )

  const upsert = useCallback(
    async (alert: OrderAlert, options?: { broadcast?: boolean; play?: boolean }) => {
      const existed = pendingRef.current.some((item) => item.orderId === alert.orderId)
      const next = upsertPendingAlert(pendingRef.current, alert)
      commit(next)
      if (options?.play !== false && !existed) {
        await playChime(true)
      }
      if (options?.broadcast !== false) {
        channelRef.current?.publish({ type: 'upsert', alert })
      }
    },
    [commit, playChime],
  )

  const resolve = useCallback(
    (orderId: string, options?: { broadcast?: boolean }) => {
      const next = removePendingAlert(pendingRef.current, orderId)
      if (next.length === pendingRef.current.length) return
      commit(next)
      if (options?.broadcast !== false) {
        channelRef.current?.publish({ type: 'remove', orderId })
      }
    },
    [commit],
  )

  const unlockAudio = useCallback(async () => {
    const ok = await audioRef.current.unlock()
    if (ok) setAudioUnlocked(true)
    return ok
  }, [])

  const dismiss = useCallback((orderId: string) => {
    setHiddenIds((current) => (current.includes(orderId) ? current : [...current, orderId]))
  }, [])

  const hydratedRef = useRef(false)

  const hydratePlaced = useCallback(async () => {
    const result = await listOrders({ status: 'placed', page: 1, limit: 25 })
    const previous = pendingRef.current
    const next = reconcilePendingAlerts(previous, result.items)
    const grew = next.some((alert) => !previous.some((item) => item.orderId === alert.orderId))
    const changed =
      grew ||
      next.length !== previous.length ||
      next.some((alert) => !previous.some((item) => item.orderId === alert.orderId))
    const first = !hydratedRef.current
    hydratedRef.current = true
    if (!changed && !first) return
    commit(next)
    if ((first && next.length > 0) || grew) await playChime(true)
    if (changed) channelRef.current?.publish({ type: 'sync', alerts: next })
  }, [commit, playChime])

  useEffect(() => {
    if (!enabled || import.meta.env.VITE_SCREENSHOT === '1') return

    const refreshOrders = () => invalidateAdminOrderQueries(queryClient)
    const refreshAfterReconnect = () => {
      invalidateAdminOrderQueries(queryClient)
      invalidateAdminCatalogQueries(queryClient)
      void hydratePlaced()
    }

    void hydratePlaced()

    return startAdminOrderSocket({
      origin: adminSocketOrigin(),
      createSocket: (origin, options) => io(origin, options) as unknown as AdminOrderSocket,
      onOrdersChanged: refreshOrders,
      onReconnect: refreshAfterReconnect,
      onDisconnect: () => undefined,
      onOrderPlaced: (payload) => {
        const alert = parseOrderEventPayload(payload)
        if (!alert) return
        void upsert(alert)
      },
      onOrderResolved: (payload) => {
        const alert = parseOrderEventPayload(payload)
        if (!alert) return
        resolve(alert.orderId)
      },
    })
  }, [enabled, hydratePlaced, queryClient, resolve, upsert])

  useEffect(() => {
    if (!enabled) return
    const channel = browserOrderAlertChannel()
    channelRef.current = channel
    const stop = channel?.listen((message: OrderAlertBroadcast) => {
      if (message.type === 'upsert') {
        void upsert(message.alert, { broadcast: false, play: true })
      } else if (message.type === 'remove') {
        resolve(message.orderId, { broadcast: false })
      } else if (message.type === 'sync') {
        commit(message.alerts)
      }
    })
    return () => {
      stop?.()
      channel?.close()
      channelRef.current = null
    }
  }, [commit, enabled, resolve, upsert])

  useEffect(() => {
    if (!enabled) return
    const tick = window.setInterval(() => {
      if (pendingRef.current.length === 0) return
      setHiddenIds([])
      setAlerts([...pendingRef.current])
      void playChime(false)
    }, ORDER_ALERT_REPEAT_MS)
    return () => window.clearInterval(tick)
  }, [enabled, playChime])

  useEffect(() => {
    if (!enabled) return
    const sync = window.setInterval(() => {
      if (pendingRef.current.length === 0) return
      void hydratePlaced()
    }, ORDER_ALERT_REPEAT_MS * 3)
    return () => window.clearInterval(sync)
  }, [enabled, hydratePlaced])

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

  const visible = alerts.filter((alert) => !hiddenIds.includes(alert.orderId))

  return (
    <OrderAlertStack
      alerts={visible}
      pendingCount={alerts.length}
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
  pendingCount = alerts.length,
  audioUnlocked,
  onDismiss,
  onUnlock,
}: {
  alerts: OrderAlert[]
  pendingCount?: number
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
              key={alert.orderId}
              role="status"
              aria-live="assertive"
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-danger-600 bg-white p-3 shadow-[0_18px_50px_rgba(16,23,19,0.18)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger-50 text-danger-700">
                <Bell aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink-950">COD order needs accept or reject</p>
                <p className="mt-0.5 truncate text-sm text-ink-700">
                  Order {alert.orderNumber}
                </p>
                <p className="truncate font-mono text-xs text-ink-500">{alert.orderId}</p>
                <p className="mt-1 text-xs text-ink-500">
                  Alert repeats every 5s until this ticket is accepted or rejected
                  {pendingCount > 1 ? ` · ${pendingCount} waiting` : ''}.
                </p>
                <Link
                  to={`/orders/${encodeURIComponent(alert.orderId)}`}
                  className="mt-2 inline-flex text-sm font-semibold text-brand-800 hover:underline"
                >
                  Open order
                </Link>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Hide order ${alert.orderNumber} until next alert`}
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
