import { useEffect, useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '../../components/states/SystemStates'
import { Badge, Button, Card } from '../../components/ui/Primitives'
import { cn } from '../../utils/cn'
import { visiblePageNumbers } from '../../utils/visiblePageNumbers'

export function PrimaryLink({
  to,
  children,
  className,
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function SecondaryLink({
  to,
  children,
  className,
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-900 hover:bg-ink-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink-950">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? 'success' : 'warning'}>{active ? 'Active' : 'Disabled'}</Badge>
}

export function QueryGate({
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  loadingLabel = 'Loading records',
  errorTitle = 'Could not load records',
  children,
}: {
  isLoading: boolean
  error: unknown
  onRetry: () => void
  isEmpty: boolean
  emptyTitle: string
  emptyDescription: string
  emptyAction?: ReactNode
  loadingLabel?: string
  errorTitle?: string
  children: ReactNode
}) {
  if (isLoading) return <LoadingState label={loadingLabel} rows={4} />
  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        description={error instanceof Error ? error.message : 'Please try again.'}
        onRetry={onRetry}
      />
    )
  }
  if (isEmpty) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    )
  }
  return <>{children}</>
}

export function PaginationBar({
  page,
  limit,
  total,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
}: {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (page: number) => void
}) {
  if (total === 0) return null
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-600">
        Showing {from}–{to} of {total}
      </p>
      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {visiblePageNumbers(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="px-2 text-sm text-ink-400">
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === page ? 'primary' : 'ghost'}
              size="sm"
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </nav>
    </div>
  )
}

export function DataTable({
  columns,
  children,
}: {
  columns: string[]
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              {columns.map((column) => (
                <th key={column || 'actions'} className="px-4 py-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">{children}</tbody>
        </table>
      </div>
    </Card>
  )
}

export function RowActions({
  editTo,
  onDelete,
  deleting,
  deleteDisabled,
}: {
  editTo: string
  onDelete: () => void
  deleting?: boolean
  deleteDisabled?: boolean
}) {
  return (
    <div className="flex justify-end gap-2">
      <Link
        to={editTo}
        className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold text-ink-800 hover:bg-ink-100"
      >
        Edit
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        loading={deleting}
        disabled={deleteDisabled}
      >
        Delete
      </Button>
    </div>
  )
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const titleId = useId()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) {
        event.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [loading, onCancel])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <Card className="relative z-10 w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="font-display text-lg font-semibold text-ink-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p>
        {error ? (
          <p className="mt-3 text-sm text-danger-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}
