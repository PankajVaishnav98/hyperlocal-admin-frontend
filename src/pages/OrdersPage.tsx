import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Primitives'
import { formatPaise, listOrders } from '../features/ops/api'
import { DataTable, PageHeader, QueryGate } from '../features/ops/ui'

function statusTone(status: string) {
  return status === 'placed' ? 'info' : 'warning'
}

export function OrdersPage() {
  const query = useQuery({ queryKey: ['admin', 'orders'], queryFn: listOrders })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Cash-on-delivery orders placed by customers. Delivery assignment is not in this version."
      />
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(query.data?.length ?? 0) === 0}
        emptyTitle="No COD orders yet"
        emptyDescription="When a customer places a cash-on-delivery order, it will appear here."
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
                <Badge tone={statusTone(order.status)}>{order.status}</Badge>
              </td>
              <td className="px-4 py-3">{new Date(order.placedAt).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </DataTable>
      </QueryGate>
    </div>
  )
}
