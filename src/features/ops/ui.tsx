import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '../../components/states/SystemStates'
import { Badge, Button, Card } from '../../components/ui/Primitives'
import { cn } from '../../utils/cn'

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
  children,
}: {
  isLoading: boolean
  error: unknown
  onRetry: () => void
  isEmpty: boolean
  emptyTitle: string
  emptyDescription: string
  emptyAction?: ReactNode
  children: ReactNode
}) {
  if (isLoading) return <LoadingState label="Loading records" rows={4} />
  if (error) {
    return (
      <ErrorState
        title="Could not load records"
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
                <th key={column} className="px-4 py-3">
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
  onDisable,
  disabling,
  disabled,
}: {
  onDisable: () => void
  disabling?: boolean
  disabled?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onDisable}
      loading={disabling}
      disabled={disabled}
    >
      Disable
    </Button>
  )
}
