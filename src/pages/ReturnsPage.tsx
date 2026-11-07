import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { Badge, Button } from '../components/ui/Primitives'
import { ADMIN_LIST_PAGE_SIZE, formatPaise, listOrders, resolveReturn } from '../features/ops/api'
import type { AdminReturnAction, ReturnRequestStatus } from '../features/ops/types'
import { ConfirmDialog, DataTable, PageHeader, PaginationBar, QueryGate } from '../features/ops/ui'
import { useDebouncedValue } from '../utils/useDebouncedValue'
import { useResettingPage } from '../utils/useResettingPage'

export const returnActionCopy: Record<
  AdminReturnAction,
  { title: string; description: string; confirmLabel: string }
> = {
  accept: {
    title: 'Accept this return?',
    description:
      'Marks the return in progress. Repeating alerts stop. Stock is restored only when you complete it.',
    confirmLabel: 'Accept return',
  },
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

function returnBadge(status?: ReturnRequestStatus) {
  if (status === 'accepted') return { tone: 'info' as const, label: 'Return accepted' }
  return { tone: 'warning' as const, label: 'Return requested' }
}

export function ReturnsPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q)
  const hasFilters = Boolean(q.trim())
  const [page, setPage] = useResettingPage(debouncedQ)
  const [pending, setPending] = useState<{ orderId: string; action: AdminReturnAction } | null>(null)
  const query = useQuery({
    queryKey: ['admin', 'returns', page, debouncedQ],
    queryFn: () =>
      listOrders({
        returnRequested: true,
        page,
        limit: ADMIN_LIST_PAGE_SIZE,
        ...(debouncedQ.trim() ? { q: debouncedQ.trim() } : {}),
      }),
    placeholderData: keepPreviousData,
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
  const meta = query.data?.meta

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        description="Open customer returns. Accept acknowledges the request. Completing restocks. Rejecting leaves stock unchanged."
      />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search order number, mobile, or PIN"
        className="h-11 w-full max-w-md rounded-xl border border-ink-200 px-3.5 text-sm"
        aria-label="Search returns"
      />
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(meta?.total ?? 0) === 0}
        emptyTitle={hasFilters ? 'No matching returns' : 'No return requests'}
        emptyDescription={
          hasFilters
            ? 'Try a different search.'
            : 'When a customer requests a return after delivery, it will appear here.'
        }
      >
        <div className="space-y-4">
          <DataTable columns={['Order', 'Customer', 'Reason', 'Requested', 'Actions']}>
            {query.data?.items.map((order) => {
              const requested = order.returnRequest?.status === 'return_requested'
              const open =
                requested || order.returnRequest?.status === 'accepted'
              const badge = returnBadge(order.returnRequest?.status)
              return (
                <tr key={order.id} className="text-ink-800">
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-ink-950 hover:underline" to={`/orders/${order.id}`}>
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-ink-500">
                      {order.pricing ? `${formatPaise(order.pricing.grandTotalPaise)} · COD` : 'Not priced · COD'}
                    </p>
                  </td>
                  <td className="px-4 py-3">{order.customerMobile}</td>
                  <td className="px-4 py-3">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
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
                    {open ? (
                      <div className="flex flex-wrap gap-2">
                        {requested ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              resolve.reset()
                              setPending({ orderId: order.id, action: 'accept' })
                            }}
                          >
                            Accept
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant={requested ? 'secondary' : 'primary'}
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
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </DataTable>
          {meta ? (
            <PaginationBar
              page={meta.page}
              limit={meta.limit}
              total={meta.total}
              totalPages={meta.totalPages}
              hasNextPage={meta.hasNextPage}
              hasPreviousPage={meta.hasPreviousPage}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </QueryGate>
      {pending ? (
        <ConfirmDialog
          title={returnActionCopy[pending.action].title}
          description={returnActionCopy[pending.action].description}
          confirmLabel={returnActionCopy[pending.action].confirmLabel}
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
