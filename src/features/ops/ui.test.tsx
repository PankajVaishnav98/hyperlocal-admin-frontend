import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog, PaginationBar } from './ui'
import { visiblePageNumbers } from '../../utils/visiblePageNumbers'

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

describe('PaginationBar', () => {
  it('lists a compact window of page numbers', () => {
    expect(visiblePageNumbers(1, 3)).toEqual([1, 2, 3])
    expect(visiblePageNumbers(5, 12)).toEqual([1, 'gap', 4, 5, 6, 'gap', 12])
  })

  it('disables Previous on the first page and Next on the last page', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <PaginationBar
        page={1}
        limit={25}
        total={137}
        totalPages={6}
        hasNextPage
        hasPreviousPage={false}
        onPageChange={onPageChange}
      />,
    )

    expect(screen.getByText('Showing 1–25 of 137')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
    await user.click(screen.getByRole('button', { name: '3' }))
    expect(onPageChange).toHaveBeenCalledWith(3)

    rerender(
      <PaginationBar
        page={6}
        limit={25}
        total={137}
        totalPages={6}
        hasNextPage={false}
        hasPreviousPage
        onPageChange={onPageChange}
      />,
    )
    expect(screen.getByText('Showing 126–137 of 137')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
  })
})
