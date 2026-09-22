import type { ReactNode } from 'react'
import { CircleAlert, Inbox, RefreshCw } from 'lucide-react'

import { Button, Card, Skeleton } from '../ui/Primitives'

export function LoadingState({
  label = 'Loading content',
  rows = 3,
}: {
  label?: string
  rows?: number
}) {
  return (
    <Card className="p-5 sm:p-6" role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <Skeleton className="h-5 w-40" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton
            key={index}
            className={index === rows - 1 ? 'h-12 w-3/4' : 'h-12 w-full'}
          />
        ))}
      </div>
    </Card>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'The content could not be loaded. Please try again.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <Card className="p-6 text-center" role="alert">
      <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-danger-50 text-danger-600">
        <CircleAlert aria-hidden="true" className="size-5" />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold text-ink-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-600">
        {description}
      </p>
      {onRetry && (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          <RefreshCw aria-hidden="true" className="size-4" />
          Try again
        </Button>
      )}
    </Card>
  )
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
}: {
  title?: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="p-6 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
        <Inbox aria-hidden="true" className="size-5" />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold text-ink-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-600">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}
