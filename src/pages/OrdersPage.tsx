import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Primitives'
import { ADMIN_LIST_PAGE_SIZE, formatPaise, listOrders } from '../features/ops/api'
import type { OrderStatus } from '../features/ops/types'
import { DataTable, PageHeader, PaginationBar, QueryGate } from '../features/ops/ui'
import { useDebouncedValue } from '../utils/useDebouncedValue'
import { useResettingPage } from '../utils/useResettingPage'

function statusTone(status: OrderStatus) {
  switch (status) {
    case 'placed':
    case 'under_review':
      return 'info'
    case 'accepted':
      return 'warning'
    case 'completed':
      return 'success'
    case 'cancelled':
    case 'rejected':
      return 'neutral'
  }
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'placed':
      return 'Placed'
    case 'under_review':
      return 'Under Review'
    case 'accepted':
      return 'Accepted'
    case 'completed':
      return 'Delivered'
    case 'cancelled':
    case 'rejected':
      return 'Rejected'
  }
}

export function OrdersPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | OrderStatus>('all')
  const [kind, setKind] = useState<'all' | 'photo'>('all')
  const debouncedQ = useDebouncedValue(q)
  const hasFilters = Boolean(q.trim() || status !== 'all' || kind === 'photo')
  const [page, setPage] = useResettingPage(`${debouncedQ}|${status}|${kind}`)
  const query = useQuery({
    queryKey: ['admin', 'orders', page, debouncedQ, status, kind],
    queryFn: () =>
      listOrders({
        page,
        limit: ADMIN_LIST_PAGE_SIZE,
        ...(debouncedQ.trim() ? { q: debouncedQ.trim() } : {}),
        ...(status === 'all' ? {} : { status }),
        ...(kind === 'photo' ? { orderType: 'PHOTO' as const } : {}),
      }),
    placeholderData: keepPreviousData,
  })
  const meta = query.data?.meta

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Cash-on-delivery tickets. Accept, reject, or mark delivered from the order page. Live rider GPS is not available."
      />
      <div className="flex gap-2" role="tablist" aria-label="Order type">
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'all'}
          className="h-10 rounded-xl border border-ink-200 px-4 text-sm font-semibold"
          onClick={() => setKind('all')}
        >
          All orders
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'photo'}
          className="h-10 rounded-xl border border-ink-200 px-4 text-sm font-semibold"
          onClick={() => setKind('photo')}
        >
          Photo Orders
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search order number, mobile, or PIN"
          className="h-11 rounded-xl border border-ink-200 px-3.5 text-sm"
          aria-label="Search orders"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'all' | OrderStatus)}
          className="h-11 w-full rounded-xl border border-ink-200 px-3.5 text-sm"
          aria-label="Filter orders by status"
        >
          <option value="all">All statuses</option>
          <option value="placed">Placed</option>
          <option value="under_review">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="completed">Delivered</option>
          <option value="cancelled">Rejected</option>
          <option value="rejected">Photo rejected</option>
        </select>
      </div>
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(meta?.total ?? 0) === 0}
        emptyTitle={
          kind === 'photo' ? 'No photo orders' : hasFilters ? 'No matching orders' : 'No COD orders yet'
        }
        emptyDescription={
          kind === 'photo'
            ? 'Photo Se Order tickets appear here after a customer sends photos.'
            : hasFilters
              ? 'Try a different search or status filter.'
              : 'When a customer places a cash-on-delivery order, it will appear here.'
        }
      >
        <div className="space-y-4">
          <DataTable columns={['Order', 'Customer', 'Total', 'Status', 'Placed']}>
            {query.data?.items.map((order) => (
              <tr key={order.id} className="text-ink-800">
                <td className="px-4 py-3">
                  <Link className="font-semibold text-ink-950 hover:underline" to={`/orders/${order.id}`}>
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {order.orderType === 'PHOTO'
                      ? `Photo Se Order · ${(order.photos?.length ?? 0) === 1 ? '1 photo' : `${order.photos?.length ?? 0} photos`}`
                      : `${order.items.length} items · COD`}
                  </p>
                </td>
                <td className="px-4 py-3">{order.customerMobile}</td>
                <td className="px-4 py-3">
                  {order.orderType === 'PHOTO' || !order.pricing
                    ? 'Not priced'
                    : formatPaise(order.pricing.grandTotalPaise)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
                </td>
                <td className="px-4 py-3">{new Date(order.placedAt).toLocaleString('en-IN')}</td>
              </tr>
            ))}
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
    </div>
  )
}
