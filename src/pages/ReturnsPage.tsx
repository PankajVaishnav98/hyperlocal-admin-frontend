import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { Badge, Button } from '../components/ui/Primitives'
import { formatPaise, listOrders, resolveReturn } from '../features/ops/api'
import type { AdminReturnAction } from '../features/ops/types'
import { ConfirmDialog, DataTable, PageHeader, QueryGate } from '../features/ops/ui'

const actionCopy: Record<
  AdminReturnAction,
  { title: string; description: string; confirmLabel: string }
> = {
  complete: {
    title: 'Complete this return?',
    description:
      'Stock for the returned lines is put back. Cash on delivery is not refunded. Reverse pickup is not in this version.',
    confirmLabel: 'Complete return',
  },
  reject: {
    title: 'Reject this return?',
    description: 'The customer will see that the return was declined. Stock is not restored.',
    confirmLabel: 'Reject return',
  },
}

export function ReturnsPage() {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<{ orderId: string; action: AdminReturnAction } | null>(null)
  const query = useQuery({
    queryKey: ['admin', 'returns'],
    queryFn: () => listOrders({ returnRequested: true, limit: 100 }),
  })
  const resolve = useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: AdminReturnAction }) =>
      resolveReturn(orderId, action),
    onSuccess: async () => {
      setPending(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'returns'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        description="Open customer return requests. Completing a return restocks the items. Rejecting leaves stock unchanged."
      />
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(query.data?.length ?? 0) === 0}
        emptyTitle="No return requests"
        emptyDescription="When a customer requests a return after delivery, it will appear here."
      >
        <DataTable columns={['Order', 'Customer', 'Reason', 'Requested', 'Actions']}>
          {query.data?.map((order) => (
            <tr key={order.id} className="text-ink-800">
              <td className="px-4 py-3">
                <Link className="font-semibold text-ink-950 hover:underline" to={`/orders/${order.id}`}>
                  {order.orderNumber}
                </Link>
                <p className="text-xs text-ink-500">
                  {formatPaise(order.pricing.grandTotalPaise)} · COD
                </p>
              </td>
              <td className="px-4 py-3">{order.customerMobile}</td>
              <td className="px-4 py-3">
                <Badge tone="warning">Return requested</Badge>
                {order.returnRequest?.reason ? (
                  <p className="mt-1 text-xs text-ink-500">{order.returnRequest.reason}</p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                {order.returnRequest?.requestedAt
                  ? new Date(order.returnRequest.requestedAt).toLocaleString('en-IN')
                  : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      resolve.reset()
                      setPending({ orderId: order.id, action: 'complete' })
                    }}
                  >
                    Complete
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      resolve.reset()
                      setPending({ orderId: order.id, action: 'reject' })
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </QueryGate>
      {pending ? (
        <ConfirmDialog
          title={actionCopy[pending.action].title}
          description={actionCopy[pending.action].description}
          confirmLabel={actionCopy[pending.action].confirmLabel}
          loading={resolve.isPending}
          error={
            resolve.error instanceof ApiError
              ? resolve.error.message
              : resolve.error
                ? 'Could not update this return.'
                : null
          }
          onCancel={() => setPending(null)}
          onConfirm={() => resolve.mutate(pending)}
        />
      ) : null}
    </div>
  )
}
