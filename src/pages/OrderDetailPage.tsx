import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { Badge, Button } from '../components/ui/Primitives'
import { ErrorState } from '../components/states/SystemStates'
import { ApiError } from '../api/errors'
import { formatPaise, getOrder, resolveReturn, transitionOrder } from '../features/ops/api'
import type { AdminOrderAction, AdminReturnAction, OrderStatus } from '../features/ops/types'
import { ConfirmDialog, PageHeader, QueryGate } from '../features/ops/ui'

function statusTone(status: OrderStatus) {
  switch (status) {
    case 'placed':
      return 'info'
    case 'accepted':
      return 'warning'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'neutral'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'placed':
      return 'Placed'
    case 'accepted':
      return 'Accepted'
    case 'completed':
      return 'Delivered'
    case 'cancelled':
      return 'Rejected'
    default:
      return status.replaceAll('_', ' ')
  }
}

const actionCopy: Record<
  AdminOrderAction,
  { title: string; description: string; confirmLabel: string }
> = {
  accept: {
    title: 'Accept this order?',
    description: 'The customer timeline will show Accepted. Delivery assignment is not in this version.',
    confirmLabel: 'Accept order',
  },
  reject: {
    title: 'Reject this order?',
    description: 'The order will be recorded as cancelled. Stock is restored. The customer sees a cancelled order.',
    confirmLabel: 'Reject order',
  },
  deliver: {
    title: 'Mark this order delivered?',
    description: 'The customer timeline will show Completed. Live GPS is not recorded.',
    confirmLabel: 'Mark delivered',
  },
}

const returnCopy: Record<
  AdminReturnAction,
  { title: string; description: string; confirmLabel: string }
> = {
  complete: {
    title: 'Complete this return?',
    description:
      'Stock for the returned lines is put back. Cash on delivery is not refunded.',
    confirmLabel: 'Complete return',
  },
  reject: {
    title: 'Reject this return?',
    description: 'The customer will see that the return was declined. Stock is not restored.',
    confirmLabel: 'Reject return',
  },
}

export function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<AdminOrderAction | null>(null)
  const [pendingReturn, setPendingReturn] = useState<AdminReturnAction | null>(null)
  const query = useQuery({
    queryKey: ['admin', 'orders', orderId],
    queryFn: () => getOrder(orderId),
    enabled: Boolean(orderId),
  })
  const transition = useMutation({
    mutationFn: (action: AdminOrderAction) => transitionOrder(orderId, action),
    onSuccess: async () => {
      setPendingAction(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'returns'] })
    },
  })
  const returnMutation = useMutation({
    mutationFn: (action: AdminReturnAction) => resolveReturn(orderId, action),
    onSuccess: async () => {
      setPendingReturn(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'returns'] })
    },
  })

  const order = query.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={order?.orderNumber ?? 'Order'}
        description="Platform-fulfilled cash on delivery. Status changes are stored with a history the customer timeline can read."
        action={
          <Link className="text-sm font-semibold text-ink-700 hover:underline" to="/orders">
            Back to orders
          </Link>
        }
      />
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={false}
        emptyTitle="Order not found"
        emptyDescription="This order is not in the inbox."
      >
        {order ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-ink-100 bg-white p-5">
              <h2 className="font-semibold text-ink-950">Payment and status</h2>
              <p className="mt-2 text-sm text-ink-600">
                {formatPaise(order.pricing.grandTotalPaise)} cash on delivery
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
                <Badge tone="neutral">{order.payment.method.toUpperCase()}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-600">{order.customerMobile}</p>
              <p className="text-xs text-ink-500">
                {order.service.serviceAreaName} · {order.service.distanceKm} km billed
              </p>
              <ol className="mt-4 space-y-2 text-sm text-ink-700">
                {order.statusHistory.map((event, index) => (
                  <li key={`${event.status}-${event.at}-${index}`} className="flex justify-between gap-3">
                    <span>{statusLabel(event.status)}</span>
                    <span className="text-xs text-ink-500">
                      {new Date(event.at).toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
              </ol>
              {order.returnRequest ? (
                <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50 p-3">
                  <p className="text-sm font-semibold text-ink-950">
                    {order.returnRequest.status === 'completed'
                      ? 'Return completed'
                      : order.returnRequest.status === 'rejected'
                        ? 'Return declined'
                        : 'Return requested'}
                  </p>
                  <p className="mt-1 text-sm text-ink-600">
                    {order.returnRequest.status === 'completed'
                      ? 'Stock for these lines was restored. Cash on delivery is not refunded.'
                      : order.returnRequest.status === 'rejected'
                        ? 'This return request was declined.'
                        : `The customer asked to return this order${order.returnRequest.reason ? `: ${order.returnRequest.reason}` : '.'}`}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    {new Date(order.returnRequest.requestedAt).toLocaleString('en-IN')}
                  </p>
                  {order.returnRequest.status === 'return_requested' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          returnMutation.reset()
                          setPendingReturn('complete')
                        }}
                      >
                        Complete return
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          returnMutation.reset()
                          setPendingReturn('reject')
                        }}
                      >
                        Reject return
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                {order.status === 'placed' ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => {
                        transition.reset()
                        setPendingAction('accept')
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        transition.reset()
                        setPendingAction('reject')
                      }}
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
                {order.status === 'accepted' ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => {
                        transition.reset()
                        setPendingAction('deliver')
                      }}
                    >
                      Mark delivered
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        transition.reset()
                        setPendingAction('reject')
                      }}
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            </section>
            <section className="rounded-2xl border border-ink-100 bg-white p-5">
              <h2 className="font-semibold text-ink-950">Delivery address</h2>
              <p className="mt-2 text-sm text-ink-800">{order.address.recipientName}</p>
              <p className="text-sm text-ink-600">
                {order.address.line1}, {order.address.city}, {order.address.state}{' '}
                {order.address.pincode}
              </p>
            </section>
            <section className="rounded-2xl border border-ink-100 bg-white p-5 lg:col-span-2">
              <h2 className="font-semibold text-ink-950">Items</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-700">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex justify-between">
                    <span>
                      {item.nameEn} × {item.quantity}
                    </span>
                    <span>{formatPaise(item.lineTotalPaise)}</span>
                  </li>
                ))}
                <li className="flex justify-between">
                  <span>Delivery</span>
                  <span>{formatPaise(order.pricing.deliveryFeePaise)}</span>
                </li>
              </ul>
            </section>
          </div>
        ) : (
          <ErrorState title="Order not found" description="This order is not in the inbox." />
        )}
      </QueryGate>
      {pendingAction ? (
        <ConfirmDialog
          title={actionCopy[pendingAction].title}
          description={actionCopy[pendingAction].description}
          confirmLabel={actionCopy[pendingAction].confirmLabel}
          loading={transition.isPending}
          error={
            transition.error instanceof ApiError
              ? transition.error.message
              : transition.error
                ? 'Could not update this order.'
                : null
          }
          onCancel={() => setPendingAction(null)}
          onConfirm={() => transition.mutate(pendingAction)}
        />
      ) : null}
      {pendingReturn ? (
        <ConfirmDialog
          title={returnCopy[pendingReturn].title}
          description={returnCopy[pendingReturn].description}
          confirmLabel={returnCopy[pendingReturn].confirmLabel}
          loading={returnMutation.isPending}
          error={
            returnMutation.error instanceof ApiError
              ? returnMutation.error.message
              : returnMutation.error
                ? 'Could not update this return.'
                : null
          }
          onCancel={() => setPendingReturn(null)}
          onConfirm={() => returnMutation.mutate(pendingReturn)}
        />
      ) : null}
    </div>
  )
}
