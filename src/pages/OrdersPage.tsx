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
      return 'info'
    case 'accepted':
      return 'warning'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'neutral'
  }
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'placed':
      return 'Placed'
    case 'accepted':
      return 'Accepted'
    case 'completed':
      return 'Delivered'
    case 'cancelled':
      return 'Rejected'
  }
}

export function OrdersPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | OrderStatus>('all')
  const debouncedQ = useDebouncedValue(q)
  const hasFilters = Boolean(q.trim() || status !== 'all')
  const [page, setPage] = useResettingPage(`${debouncedQ}|${status}`)
  const query = useQuery({
    queryKey: ['admin', 'orders', page, debouncedQ, status],
    queryFn: () =>
      listOrders({
        page,
        limit: ADMIN_LIST_PAGE_SIZE,
        ...(debouncedQ.trim() ? { q: debouncedQ.trim() } : {}),
        ...(status === 'all' ? {} : { status }),
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
          <option value="accepted">Accepted</option>
          <option value="completed">Delivered</option>
          <option value="cancelled">Rejected</option>
        </select>
      </div>
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(meta?.total ?? 0) === 0}
        emptyTitle={hasFilters ? 'No matching orders' : 'No COD orders yet'}
        emptyDescription={
          hasFilters
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
                  <p className="text-xs text-ink-500">{order.items.length} items · COD</p>
                </td>
                <td className="px-4 py-3">{order.customerMobile}</td>
                <td className="px-4 py-3">{formatPaise(order.pricing.grandTotalPaise)}</td>
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
