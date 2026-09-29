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
  ORDER_ALERT_PENDING_STORAGE_KEY,
  ORDER_ALERT_REPEAT_MS,
  parseOrderEventPayload,
  persistPendingAlerts,
  reconcilePendingAlerts,
  removePendingAlert,
  RETURN_ALERT_PENDING_STORAGE_KEY,
  upsertPendingAlert,
  type OpsAlertKind,
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

function storageKey(kind: OpsAlertKind) {
  return kind === 'return' ? RETURN_ALERT_PENDING_STORAGE_KEY : ORDER_ALERT_PENDING_STORAGE_KEY
}

function hideKey(alert: Pick<OrderAlert, 'kind' | 'orderId'>) {
  return `${alert.kind}:${alert.orderId}`
}

export function OrderAlertHost({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient()
  const [orderAlerts, setOrderAlerts] = useState<OrderAlert[]>(() =>
    loadPendingAlerts(storage(), ORDER_ALERT_PENDING_STORAGE_KEY, 'order'),
  )
  const [returnAlerts, setReturnAlerts] = useState<OrderAlert[]>(() =>
    loadPendingAlerts(storage(), RETURN_ALERT_PENDING_STORAGE_KEY, 'return'),
  )
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const pendingOrdersRef = useRef<OrderAlert[]>(orderAlerts)
  const pendingReturnsRef = useRef<OrderAlert[]>(returnAlerts)
  const audioRef = useRef(createAlertAudio())
  const channelRef = useRef<ReturnType<typeof browserOrderAlertChannel>>(null)
  const hydratedOrdersRef = useRef(false)
  const hydratedReturnsRef = useRef(false)

  const pendingCount = () => pendingOrdersRef.current.length + pendingReturnsRef.current.length

  const commit = useCallback((kind: OpsAlertKind, next: OrderAlert[]) => {
    persistPendingAlerts(storage(), next, storageKey(kind))
    if (kind === 'return') {
      pendingReturnsRef.current = next
      setReturnAlerts(next)
    } else {
      pendingOrdersRef.current = next
      setOrderAlerts(next)
    }
    setHiddenIds((current) =>
      current.filter((id) => {
        const [alertKind, orderId] = id.split(':')
        if (alertKind !== kind) return true
        return next.some((alert) => alert.orderId === orderId)
      }),
    )
  }, [])

  const queueFor = (kind: OpsAlertKind) =>
    kind === 'return' ? pendingReturnsRef.current : pendingOrdersRef.current

  const playChime = useCallback(async (force: boolean) => {
    if (pendingCount() === 0) return
    if (!force && !claimRepeatPlay(storage(), Date.now())) return
    if (force) claimRepeatPlay(storage(), Date.now())
    const played = await audioRef.current.play()
    if (played) setAudioUnlocked(true)
  }, [])

  const upsert = useCallback(
    async (alert: OrderAlert, options?: { broadcast?: boolean; play?: boolean }) => {
      const existed = queueFor(alert.kind).some((item) => item.orderId === alert.orderId)
      commit(alert.kind, upsertPendingAlert(queueFor(alert.kind), alert))
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
    (kind: OpsAlertKind, orderId: string, options?: { broadcast?: boolean }) => {
      const next = removePendingAlert(queueFor(kind), orderId)
      if (next.length === queueFor(kind).length) return
      commit(kind, next)
      if (options?.broadcast !== false) {
        channelRef.current?.publish({ type: 'remove', kind, orderId })
      }
    },
    [commit],
  )

  const unlockAudio = useCallback(async () => {
    const ok = await audioRef.current.unlock()
    if (ok) setAudioUnlocked(true)
    return ok
  }, [])

  const dismiss = useCallback((alert: OrderAlert) => {
    const id = hideKey(alert)
    setHiddenIds((current) => (current.includes(id) ? current : [...current, id]))
  }, [])

  const hydrateKind = useCallback(
    async (
      kind: OpsAlertKind,
      fetchItems: () => Promise<Array<{ id: string; orderNumber: string; placedAt: string }>>,
      hydratedRef: { current: boolean },
    ) => {
      const result = await fetchItems()
      const previous = queueFor(kind)
      const next = reconcilePendingAlerts(previous, result, kind)
      const grew = next.some((alert) => !previous.some((item) => item.orderId === alert.orderId))
      const changed = grew || next.length !== previous.length
      const first = !hydratedRef.current
      hydratedRef.current = true
      if (!changed && !first) return
      commit(kind, next)
      if ((first && next.length > 0) || grew) await playChime(true)
      if (changed) channelRef.current?.publish({ type: 'sync', kind, alerts: next })
    },
    [commit, playChime],
  )

  const hydratePlaced = useCallback(
    () =>
      hydrateKind(
        'order',
        async () => {
          const result = await listOrders({ status: 'placed', page: 1, limit: 25 })
          return result.items.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            placedAt: order.placedAt,
          }))
        },
        hydratedOrdersRef,
      ),
    [hydrateKind],
  )

  const hydrateReturns = useCallback(
    () =>
      hydrateKind(
        'return',
        async () => {
          const result = await listOrders({ returnRequested: true, page: 1, limit: 25 })
          return result.items.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            placedAt: order.returnRequest?.requestedAt ?? order.placedAt,
          }))
        },
        hydratedReturnsRef,
      ),
    [hydrateKind],
  )

  useEffect(() => {
    if (!enabled || import.meta.env.VITE_SCREENSHOT === '1') return

    const refreshOrders = () => invalidateAdminOrderQueries(queryClient)
    const refreshAfterReconnect = () => {
      invalidateAdminOrderQueries(queryClient)
      invalidateAdminCatalogQueries(queryClient)
      void hydratePlaced()
      void hydrateReturns()
    }

    void hydratePlaced()
    void hydrateReturns()

    return startAdminOrderSocket({
      origin: adminSocketOrigin(),
      createSocket: (origin, options) => io(origin, options) as unknown as AdminOrderSocket,
      onOrdersChanged: refreshOrders,
      onReconnect: refreshAfterReconnect,
      onDisconnect: () => undefined,
      onOrderPlaced: (payload) => {
        const alert = parseOrderEventPayload(payload, 'order')
        if (!alert) return
        void upsert(alert)
      },
      onOrderResolved: (payload) => {
        const alert = parseOrderEventPayload(payload, 'order')
        if (!alert) return
        resolve('order', alert.orderId)
      },
      onReturnRequested: (payload) => {
        const alert = parseOrderEventPayload(payload, 'return')
        if (!alert) return
        void upsert(alert)
      },
      onReturnResolved: (payload) => {
        const alert = parseOrderEventPayload(payload, 'return')
        if (!alert) return
        resolve('return', alert.orderId)
      },
    })
  }, [enabled, hydratePlaced, hydrateReturns, queryClient, resolve, upsert])

  useEffect(() => {
    if (!enabled) return
    const channel = browserOrderAlertChannel()
    channelRef.current = channel
    const stop = channel?.listen((message: OrderAlertBroadcast) => {
      if (message.type === 'upsert') {
        void upsert(message.alert, { broadcast: false, play: true })
      } else if (message.type === 'remove') {
        resolve(message.kind, message.orderId, { broadcast: false })
      } else if (message.type === 'sync') {
        commit(message.kind, message.alerts)
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
      if (pendingCount() === 0) return
      setHiddenIds([])
      setOrderAlerts([...pendingOrdersRef.current])
      setReturnAlerts([...pendingReturnsRef.current])
      void playChime(false)
    }, ORDER_ALERT_REPEAT_MS)
    return () => window.clearInterval(tick)
  }, [enabled, playChime])

  useEffect(() => {
    if (!enabled) return
    const sync = window.setInterval(() => {
      if (pendingOrdersRef.current.length > 0) void hydratePlaced()
      if (pendingReturnsRef.current.length > 0) void hydrateReturns()
    }, ORDER_ALERT_REPEAT_MS * 3)
    return () => window.clearInterval(sync)
  }, [enabled, hydratePlaced, hydrateReturns])

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

  const alerts = [...returnAlerts, ...orderAlerts]
  const visible = alerts.filter((alert) => !hiddenIds.includes(hideKey(alert)))

  return (
    <OrderAlertStack
      alerts={visible}
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
  onDismiss: (alert: OrderAlert) => void
  onUnlock: () => void
}) {
  const pendingOrders = alerts.filter((alert) => alert.kind !== 'return').length
  const pendingReturns = alerts.filter((alert) => alert.kind === 'return').length

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:px-6">
        <div className="flex w-full max-w-xl flex-col gap-2">
          {alerts.map((alert) => {
            const isReturn = alert.kind === 'return'
            return (
              <div
                key={hideKey(alert)}
                role="status"
                aria-live="assertive"
                className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-danger-600 bg-white p-3 shadow-[0_18px_50px_rgba(16,23,19,0.18)]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger-50 text-danger-700">
                  <Bell aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink-950">
                    {isReturn
                      ? 'Return request needs accept or reject'
                      : 'COD order needs accept or reject'}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-ink-700">
                    {isReturn ? 'Return for order' : 'Order'} {alert.orderNumber}
                  </p>
                  <p className="truncate font-mono text-xs text-ink-500">{alert.orderId}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {isReturn
                      ? 'Alert repeats every 5s until this return request is accepted or rejected'
                      : 'Alert repeats every 5s until this ticket is accepted or rejected'}
                    {isReturn && pendingReturns > 1 ? ` · ${pendingReturns} waiting` : ''}
                    {!isReturn && pendingOrders > 1 ? ` · ${pendingOrders} waiting` : ''}.
                  </p>
                  <Link
                    to={`/orders/${encodeURIComponent(alert.orderId)}`}
                    className="mt-2 inline-flex text-sm font-semibold text-brand-800 hover:underline"
                  >
                    {isReturn ? 'Open return' : 'Open order'}
                  </Link>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={
                    isReturn
                      ? `Hide return ${alert.orderNumber} until next alert`
                      : `Hide order ${alert.orderNumber} until next alert`
                  }
                  onClick={() => onDismiss(alert)}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </div>
            )
          })}
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
