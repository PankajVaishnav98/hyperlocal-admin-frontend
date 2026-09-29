export const ORDER_ALERT_CHANNEL = 'hyperlocal-admin-order-alerts'
export const ORDER_CATCHUP_WINDOW_MS = 90_000
export const ORDER_ALERT_SEEN_STORAGE_KEY = 'hyperlocal.admin.orderAlert.seen'

export type OrderAlert = {
  eventId: string
  orderId: string
  orderNumber: string
  occurredAt: string
}

export type OrderAlertBroadcast = {
  type: 'placed'
  alert: OrderAlert
}

type SeenStore = {
  add(id: string): boolean
  has(id: string): boolean
  snapshot(): string[]
}

export function parseOrderPlacedPayload(raw: unknown): OrderAlert | null {
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
      : `order:${orderId}`
  const occurredAt =
    typeof record.occurredAt === 'string' && record.occurredAt.trim()
      ? record.occurredAt.trim()
      : new Date().toISOString()
  return { eventId, orderId, orderNumber, occurredAt }
}

export function createSeenOrderStore(
  initial: string[] = [],
  limit = 200,
): SeenStore {
  const ids = [...initial]
  const index = new Set(initial)

  return {
    add(id: string) {
      if (!id || index.has(id)) return false
      index.add(id)
      ids.push(id)
      while (ids.length > limit) {
        const removed = ids.shift()
        if (removed) index.delete(removed)
      }
      return true
    },
    has(id: string) {
      return index.has(id)
    },
    snapshot() {
      return [...ids]
    },
  }
}

export function loadSeenOrderIds(storage: Pick<Storage, 'getItem'> | null): string[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(ORDER_ALERT_SEEN_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is string => typeof value === 'string' && value.length > 0)
  } catch {
    return []
  }
}

export function persistSeenOrderIds(
  storage: Pick<Storage, 'setItem'> | null,
  ids: string[],
) {
  if (!storage) return
  try {
    storage.setItem(ORDER_ALERT_SEEN_STORAGE_KEY, JSON.stringify(ids.slice(-200)))
  } catch {
    // Ignore quota / private-mode failures; in-memory dedupe still works.
  }
}

export function missedPlacedOrders(input: {
  orders: Array<{ id: string; orderNumber: string; placedAt: string }>
  seen: SeenStore
  disconnectedAt: number
  now?: number
  windowMs?: number
}): OrderAlert[] {
  const now = input.now ?? Date.now()
  const windowMs = input.windowMs ?? ORDER_CATCHUP_WINDOW_MS
  const since = Math.max(0, input.disconnectedAt - 1_000)
  const cutoff = now - windowMs

  const alerts: OrderAlert[] = []
  for (const order of input.orders) {
    const placedAt = Date.parse(order.placedAt)
    if (!Number.isFinite(placedAt)) continue
    if (placedAt < since || placedAt < cutoff) continue
    const eventId = `catchup:${order.id}:${order.placedAt}`
    if (input.seen.has(order.id) || input.seen.has(eventId)) continue
    alerts.push({
      eventId,
      orderId: order.id,
      orderNumber: order.orderNumber || order.id,
      occurredAt: order.placedAt,
    })
  }
  return alerts
}

export function rememberOrder(seen: SeenStore, alert: OrderAlert, storage?: Pick<Storage, 'setItem'> | null) {
  seen.add(alert.eventId)
  seen.add(alert.orderId)
  persistSeenOrderIds(storage ?? null, seen.snapshot())
}

export function shouldAnnounceAlert(seen: SeenStore, alert: OrderAlert): boolean {
  return !seen.has(alert.eventId) && !seen.has(alert.orderId)
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
    publish(alert: OrderAlert) {
      input.post({ type: 'placed', alert })
    },
    listen(handler: (alert: OrderAlert) => void) {
      return input.subscribe((message) => {
        if (message?.type !== 'placed' || !message.alert?.orderId) return
        handler(message.alert)
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
