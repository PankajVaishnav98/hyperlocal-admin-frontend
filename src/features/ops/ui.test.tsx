import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from './ui'

describe('ConfirmDialog', () => {
  it('closes on Escape when it is not loading', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        title="Delete milk?"
        description="Customers will no longer see this product."
        onCancel={onCancel}
        onConfirm={() => undefined}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Delete milk?' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not close on Escape while the action is loading', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        title="Delete milk?"
        description="Customers will no longer see this product."
        loading
        onCancel={onCancel}
        onConfirm={() => undefined}
      />,
    )

    await user.keyboard('{Escape}')
    expect(onCancel).not.toHaveBeenCalled()
  })
})
