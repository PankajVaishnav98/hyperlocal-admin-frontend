import { describe, expect, it, vi } from 'vitest'

import {
  claimRepeatPlay,
  createAlertAudio,
  createOrderAlertChannel,
  parseOrderEventPayload,
  reconcilePendingAlerts,
  removePendingAlert,
  upsertPendingAlert,
  type AlertAudioContext,
  type OrderAlert,
  type OrderAlertBroadcast,
} from './orderAlert'

const sample: OrderAlert = {
  eventId: 'evt_1',
  orderId: 'ord_9',
  orderNumber: 'HL-100',
  occurredAt: '2026-09-29T08:00:00.000Z',
}

describe('persistent placed-order alerts', () => {
  it('reads order id and number from the existing socket payload', () => {
    expect(
      parseOrderEventPayload({
        eventId: 'evt_1',
        orderId: 'ord_9',
        orderNumber: 'HL-100',
        status: 'placed',
        occurredAt: '2026-09-29T08:00:00.000Z',
      }),
    ).toEqual(sample)
  })

  it('rejects payloads without an order id', () => {
    expect(parseOrderEventPayload({})).toBeNull()
    expect(parseOrderEventPayload(null)).toBeNull()
  })

  it('keeps every placed order pending until it is removed on accept/cancel', () => {
    const withOne = upsertPendingAlert([], sample)
    const withTwo = upsertPendingAlert(withOne, {
      eventId: 'evt_2',
      orderId: 'ord_8',
      orderNumber: 'HL-101',
      occurredAt: '2026-09-29T08:01:00.000Z',
    })
    expect(withTwo.map((alert) => alert.orderId)).toEqual(['ord_8', 'ord_9'])
    expect(removePendingAlert(withTwo, 'ord_9').map((alert) => alert.orderId)).toEqual(['ord_8'])
  })

  it('hydrates all currently placed tickets, not only a 90s window', () => {
    expect(
      reconcilePendingAlerts([sample], [
        { id: 'ord_old', orderNumber: 'HL-1', placedAt: '2026-09-29T06:00:00.000Z' },
        { id: 'ord_9', orderNumber: 'HL-100', placedAt: '2026-09-29T08:00:00.000Z' },
      ]).map((alert) => alert.orderId),
    ).toEqual(['ord_old', 'ord_9'])
  })

  it('drops alerts that are no longer in the placed list after accept/cancel', () => {
    expect(
      reconcilePendingAlerts([sample], [{ id: 'ord_8', orderNumber: 'HL-101', placedAt: '2026-09-29T08:01:00.000Z' }]),
    ).toEqual([
      {
        eventId: 'placed:ord_8',
        orderId: 'ord_8',
        orderNumber: 'HL-101',
        occurredAt: '2026-09-29T08:01:00.000Z',
      },
    ])
  })

  it('spaces repeat chimes by the 5s interval across tabs', () => {
    const memory: Record<string, string> = {}
    const store = {
      getItem: (key: string) => memory[key] ?? null,
      setItem: (key: string, value: string) => {
        memory[key] = value
      },
    }
    expect(claimRepeatPlay(store, 1_000)).toBe(true)
    expect(claimRepeatPlay(store, 1_200)).toBe(false)
    expect(claimRepeatPlay(store, 6_000)).toBe(true)
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

  it('syncs upsert and remove across a BroadcastChannel-shaped bus', () => {
    const handlers: Array<(message: OrderAlertBroadcast) => void> = []
    const channel = createOrderAlertChannel({
      post: (message) => handlers.forEach((handler) => handler(message)),
      subscribe: (handler) => {
        handlers.push(handler)
        return () => undefined
      },
    })
    const received: string[] = []
    channel.listen((message) => {
      if (message.type === 'upsert') received.push(`up:${message.alert.orderId}`)
      if (message.type === 'remove') received.push(`rm:${message.orderId}`)
    })
    channel.publish({ type: 'upsert', alert: sample })
    channel.publish({ type: 'remove', orderId: 'ord_9' })
    expect(received).toEqual(['up:ord_9', 'rm:ord_9'])
  })
})
