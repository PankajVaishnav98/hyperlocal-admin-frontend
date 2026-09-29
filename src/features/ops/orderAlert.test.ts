import { describe, expect, it, vi } from 'vitest'

import {
  createAlertAudio,
  createOrderAlertChannel,
  createSeenOrderStore,
  missedPlacedOrders,
  parseOrderPlacedPayload,
  shouldAnnounceAlert,
  type AlertAudioContext,
  type OrderAlertBroadcast,
} from './orderAlert'

describe('order placed alert contract', () => {
  it('reads order id and number from the existing socket payload', () => {
    expect(
      parseOrderPlacedPayload({
        eventId: 'evt_1',
        orderId: 'ord_9',
        orderNumber: 'HL-100',
        status: 'placed',
        occurredAt: '2026-09-29T08:00:00.000Z',
      }),
    ).toEqual({
      eventId: 'evt_1',
      orderId: 'ord_9',
      orderNumber: 'HL-100',
      occurredAt: '2026-09-29T08:00:00.000Z',
    })
  })

  it('rejects payloads without an order id', () => {
    expect(parseOrderPlacedPayload({})).toBeNull()
    expect(parseOrderPlacedPayload(null)).toBeNull()
  })

  it('dedupes by event id or order id', () => {
    const seen = createSeenOrderStore()
    const alert = {
      eventId: 'evt_1',
      orderId: 'ord_9',
      orderNumber: 'HL-100',
      occurredAt: '2026-09-29T08:00:00.000Z',
    }
    expect(shouldAnnounceAlert(seen, alert)).toBe(true)
    seen.add(alert.eventId)
    seen.add(alert.orderId)
    expect(shouldAnnounceAlert(seen, { ...alert, eventId: 'evt_2' })).toBe(false)
  })

  it('catch-up only returns recent placed orders after a disconnect', () => {
    const seen = createSeenOrderStore(['ord_old'])
    const now = Date.parse('2026-09-29T08:02:00.000Z')
    const alerts = missedPlacedOrders({
      seen,
      disconnectedAt: Date.parse('2026-09-29T08:01:00.000Z'),
      now,
      orders: [
        {
          id: 'ord_old',
          orderNumber: 'HL-1',
          placedAt: '2026-09-29T07:00:00.000Z',
        },
        {
          id: 'ord_new',
          orderNumber: 'HL-2',
          placedAt: '2026-09-29T08:01:20.000Z',
        },
        {
          id: 'ord_stale',
          orderNumber: 'HL-0',
          placedAt: '2026-09-29T06:00:00.000Z',
        },
      ],
    })
    expect(alerts).toEqual([
      {
        eventId: 'catchup:ord_new:2026-09-29T08:01:20.000Z',
        orderId: 'ord_new',
        orderNumber: 'HL-2',
        occurredAt: '2026-09-29T08:01:20.000Z',
      },
    ])
  })

  it('plays a sharp square-wave burst after the audio context is running', async () => {
    const oscillators: Array<{ type: string; start: number; stop: number; frequency: number }> = []
    let state: AudioContextState = 'suspended'
    const context: AlertAudioContext = {
      get state() {
        return state
      },
      currentTime: 1,
      destination: {},
      resume: async () => {
        state = 'running'
      },
      createOscillator: () => {
        const node = {
          type: 'sine' as OscillatorType,
          frequency: {
            setValueAtTime: (value: number) => {
              node.frequencyValue = value
            },
          },
          frequencyValue: 0,
          connect: vi.fn(),
          start: (time: number) => {
            node.startAt = time
          },
          stop: (time: number) => {
            oscillators.push({
              type: node.type,
              start: node.startAt,
              stop: time,
              frequency: node.frequencyValue,
            })
          },
          startAt: 0,
        }
        return node
      },
      createGain: () => ({
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }),
    }

    const audio = createAlertAudio(() => context)
    expect(await audio.play()).toBe(true)
    expect(audio.unlocked).toBe(true)
    expect(oscillators.length).toBe(3)
    expect(oscillators.every((burst) => burst.type === 'square')).toBe(true)
    expect(oscillators.map((burst) => burst.frequency)).toEqual([1760, 2349, 3136])
  })

  it('does not play while the browser keeps the audio context suspended', async () => {
    const context: AlertAudioContext = {
      state: 'suspended',
      currentTime: 0,
      destination: {},
      resume: async () => undefined,
      createOscillator: () => {
        throw new Error('autoplay blocked')
      },
      createGain: () => {
        throw new Error('autoplay blocked')
      },
    }
    const audio = createAlertAudio(() => context)
    expect(await audio.play()).toBe(false)
    expect(audio.unlocked).toBe(false)
  })

  it('forwards placed alerts across a BroadcastChannel-shaped bus', () => {
    const handlers: Array<(message: OrderAlertBroadcast) => void> = []
    const channel = createOrderAlertChannel({
      post: (message) => handlers.forEach((handler) => handler(message)),
      subscribe: (handler) => {
        handlers.push(handler)
        return () => undefined
      },
    })
    const received: string[] = []
    channel.listen((alert) => received.push(alert.orderId))
    channel.publish({
      eventId: 'evt_1',
      orderId: 'ord_9',
      orderNumber: 'HL-100',
      occurredAt: '2026-09-29T08:00:00.000Z',
    })
    expect(received).toEqual(['ord_9'])
  })
})
