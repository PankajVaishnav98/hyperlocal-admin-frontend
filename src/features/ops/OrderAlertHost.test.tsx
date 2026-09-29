import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { OrderAlertStack } from './OrderAlertHost'

describe('OrderAlertStack', () => {
  it('shows order number, order id, and an open link on every layout', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <OrderAlertStack
          alerts={[
            {
              eventId: 'evt_1',
              orderId: 'ord_9',
              orderNumber: 'HL-20260929-1',
              occurredAt: '2026-09-29T08:00:00.000Z',
            },
          ]}
          audioUnlocked
          onDismiss={onDismiss}
          onUnlock={() => undefined}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('COD order needs accept or reject')
    expect(screen.getByText('Order HL-20260929-1')).toBeInTheDocument()
    expect(screen.getByText('ord_9')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open order' })).toHaveAttribute('href', '/orders/ord_9')
    await user.click(screen.getByRole('button', { name: 'Hide order HL-20260929-1 until next alert' }))
    expect(onDismiss).toHaveBeenCalledWith('ord_9')
    expect(screen.queryByRole('button', { name: 'Enable loud order alerts' })).not.toBeInTheDocument()
  })

  it('asks for a first gesture until audio is unlocked', async () => {
    const onUnlock = vi.fn()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <OrderAlertStack alerts={[]} audioUnlocked={false} onDismiss={() => undefined} onUnlock={onUnlock} />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Enable loud order alerts' }))
    expect(onUnlock).toHaveBeenCalledTimes(1)
  })
})
