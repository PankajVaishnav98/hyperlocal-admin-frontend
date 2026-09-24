import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Primitives'
import { formatPaise, listOrders } from '../features/ops/api'
import type { OrderStatus } from '../features/ops/types'
import { DataTable, PageHeader, QueryGate } from '../features/ops/ui'

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
  const [status, setStatus] = useState<'all' | OrderStatus>('all')
  const query = useQuery({
    queryKey: ['admin', 'orders', status],
    queryFn: () => listOrders(status === 'all' ? { limit: 100 } : { status, limit: 100 }),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Cash-on-delivery tickets. Accept, reject, or mark delivered from the order page. Live rider GPS is not available."
      />
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as 'all' | OrderStatus)}
        className="h-11 w-full max-w-xs rounded-xl border border-ink-200 px-3.5 text-sm"
        aria-label="Filter orders by status"
      >
        <option value="all">All statuses</option>
        <option value="placed">Placed</option>
        <option value="accepted">Accepted</option>
        <option value="completed">Delivered</option>
        <option value="cancelled">Rejected</option>
      </select>
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(query.data?.length ?? 0) === 0}
        emptyTitle={status === 'all' ? 'No COD orders yet' : 'No orders with this status'}
        emptyDescription={
          status === 'all'
            ? 'When a customer places a cash-on-delivery order, it will appear here.'
            : 'Try another status filter.'
        }
      >
        <DataTable columns={['Order', 'Customer', 'Total', 'Status', 'Placed']}>
          {query.data?.map((order) => (
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
      </QueryGate>
    </div>
  )
}
