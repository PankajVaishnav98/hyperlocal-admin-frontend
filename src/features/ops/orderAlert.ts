export const ORDER_ALERT_CHANNEL = 'hyperlocal-admin-order-alerts'
export const ORDER_ALERT_REPEAT_MS = 5_000
export const ORDER_ALERT_PENDING_STORAGE_KEY = 'hyperlocal.admin.orderAlert.pending'
export const RETURN_ALERT_PENDING_STORAGE_KEY = 'hyperlocal.admin.returnAlert.pending'
export const ORDER_ALERT_LAST_PLAY_STORAGE_KEY = 'hyperlocal.admin.orderAlert.lastPlay'
export const ORDER_ALERT_RESOLVED_EVENTS = [
  'order:accepted',
  'order:cancelled',
  'order:rejected',
  'order:completed',
] as const

export type OpsAlertKind = 'order' | 'return'

export type OrderAlert = {
  kind: OpsAlertKind
  eventId: string
  orderId: string
  orderNumber: string
  occurredAt: string
}

export type OrderAlertBroadcast =
  | { type: 'upsert'; alert: OrderAlert }
  | { type: 'remove'; kind: OpsAlertKind; orderId: string }
  | { type: 'sync'; kind: OpsAlertKind; alerts: OrderAlert[] }

export function parseOrderEventPayload(
  raw: unknown,
  kind: OpsAlertKind = 'order',
): OrderAlert | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const orderId = typeof record.orderId === 'string' ? record.orderId.trim() : ''
  if (!orderId) return null
  const orderNumber =
    typeof record.orderNumber === 'string' && record.orderNumber.trim()
      ? record.orderNumber.trim()
      : orderId
  const eventId =
    typeof record.eventId === 'string' && record.eventId.trim()
      ? record.eventId.trim()
      : `${kind}:${orderId}`
  const occurredAt =
    typeof record.occurredAt === 'string' && record.occurredAt.trim()
      ? record.occurredAt.trim()
      : new Date().toISOString()
  const storedKind = record.kind === 'return' || record.kind === 'order' ? record.kind : kind
  return { kind: storedKind, eventId, orderId, orderNumber, occurredAt }
}

export const parseOrderPlacedPayload = parseOrderEventPayload

export function isResolvedOrderEvent(event: string): boolean {
  return (ORDER_ALERT_RESOLVED_EVENTS as readonly string[]).includes(event)
}

export function upsertPendingAlert(pending: OrderAlert[], alert: OrderAlert): OrderAlert[] {
  if (!alert.orderId) return pending
  return [alert, ...pending.filter((item) => item.orderId !== alert.orderId)].slice(0, 25)
}

export function removePendingAlert(pending: OrderAlert[], orderId: string): OrderAlert[] {
  if (!orderId) return pending
  return pending.filter((item) => item.orderId !== orderId)
}

export function reconcilePendingAlerts(
  pending: OrderAlert[],
  placed: Array<{ id: string; orderNumber: string; placedAt: string }>,
  kind: OpsAlertKind = 'order',
): OrderAlert[] {
  const existing = new Map(pending.map((alert) => [alert.orderId, alert]))
  const next: OrderAlert[] = []
  for (const order of placed) {
    if (!order.id) continue
    const current = existing.get(order.id)
    next.push(
      current ?? {
        kind,
        eventId: `${kind}:${order.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber || order.id,
        occurredAt: order.placedAt,
      },
    )
  }
  return next
}

export function loadPendingAlerts(
  storage: Pick<Storage, 'getItem'> | null,
  key = ORDER_ALERT_PENDING_STORAGE_KEY,
  kind: OpsAlertKind = 'order',
): OrderAlert[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const alerts: OrderAlert[] = []
    for (const item of parsed) {
      const alert = parseOrderEventPayload(item, kind)
      if (alert) alerts.push({ ...alert, kind })
    }
    return alerts
  } catch {
    return []
  }
}

export function persistPendingAlerts(
  storage: Pick<Storage, 'setItem' | 'removeItem'> | null,
  alerts: OrderAlert[],
  key = ORDER_ALERT_PENDING_STORAGE_KEY,
) {
  if (!storage) return
  try {
    if (alerts.length === 0) {
      storage.removeItem(key)
      return
    }
    storage.setItem(key, JSON.stringify(alerts.slice(0, 25)))
  } catch {
    // Ignore quota / private-mode failures; in-memory pending still works.
  }
}

export function claimRepeatPlay(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  now: number,
  intervalMs = ORDER_ALERT_REPEAT_MS,
): boolean {
  if (!storage) return true
  try {
    const raw = storage.getItem(ORDER_ALERT_LAST_PLAY_STORAGE_KEY)
    if (!raw) {
      storage.setItem(ORDER_ALERT_LAST_PLAY_STORAGE_KEY, String(now))
      return true
    }
    const last = Number(raw)
    if (Number.isFinite(last) && now - last < intervalMs - 250) return false
    storage.setItem(ORDER_ALERT_LAST_PLAY_STORAGE_KEY, String(now))
    return true
  } catch {
    return true
  }
}

type OscillatorLike = {
  type: OscillatorType
  frequency: { setValueAtTime: (value: number, time: number) => void }
  connect: (node: unknown) => void
  start: (time: number) => void
  stop: (time: number) => void
}

type GainLike = {
  gain: {
    setValueAtTime: (value: number, time: number) => void
    linearRampToValueAtTime: (value: number, time: number) => void
  }
  connect: (node: unknown) => void
}

export type AlertAudioContext = {
  state: AudioContextState
  currentTime: number
  destination: unknown
  resume: () => Promise<void>
  createOscillator: () => OscillatorLike
  createGain: () => GainLike
}

export type AlertAudio = {
  unlocked: boolean
  unlock: () => Promise<boolean>
  play: () => Promise<boolean>
}

export function createAlertAudio(factory?: () => AlertAudioContext): AlertAudio {
  let context: AlertAudioContext | null = null
  let unlocked = false

  const getContext = () => {
    if (context) return context
    if (factory) {
      context = factory()
      return context
    }
    const Ctor =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined
    if (!Ctor) return null
    context = new Ctor() as unknown as AlertAudioContext
    return context
  }

  const unlock = async () => {
    const audio = getContext()
    if (!audio) return false
    try {
      if (audio.state === 'suspended') {
        await audio.resume()
      }
      unlocked = audio.state === 'running'
      return unlocked
    } catch {
      return false
    }
  }

  const play = async () => {
    const audio = getContext()
    if (!audio) return false
    try {
      if (audio.state === 'suspended') {
        await audio.resume()
      }
    } catch {
      return false
    }
    if (audio.state === 'suspended') return false

    const now = audio.currentTime
    const bursts = [
      { start: now, frequency: 1760, duration: 0.16 },
      { start: now + 0.2, frequency: 2349, duration: 0.22 },
      { start: now + 0.46, frequency: 3136, duration: 0.18 },
    ]

    for (const burst of bursts) {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(burst.frequency, burst.start)
      gain.gain.setValueAtTime(0.0001, burst.start)
      gain.gain.linearRampToValueAtTime(0.95, burst.start + 0.012)
      gain.gain.linearRampToValueAtTime(0.0001, burst.start + burst.duration)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start(burst.start)
      oscillator.stop(burst.start + burst.duration + 0.02)
    }

    unlocked = true
    return true
  }

  return {
    get unlocked() {
      return unlocked
    },
    unlock,
    play,
  }
}

export function createOrderAlertChannel(input: {
  post: (message: OrderAlertBroadcast) => void
  subscribe: (handler: (message: OrderAlertBroadcast) => void) => () => void
}) {
  return {
    publish(message: OrderAlertBroadcast) {
      input.post(message)
    },
    listen(handler: (message: OrderAlertBroadcast) => void) {
      return input.subscribe((message) => {
        if (!message || typeof message !== 'object') return
        handler(message)
      })
    },
  }
}

export function browserOrderAlertChannel():
  | (ReturnType<typeof createOrderAlertChannel> & { close: () => void })
  | null {
  if (typeof BroadcastChannel === 'undefined') return null
  const channel = new BroadcastChannel(ORDER_ALERT_CHANNEL)
  return {
    ...createOrderAlertChannel({
      post: (message) => channel.postMessage(message),
      subscribe: (handler) => {
        const listener = (event: MessageEvent<OrderAlertBroadcast>) => handler(event.data)
        channel.addEventListener('message', listener)
        return () => channel.removeEventListener('message', listener)
      },
    }),
    close: () => channel.close(),
  }
}
