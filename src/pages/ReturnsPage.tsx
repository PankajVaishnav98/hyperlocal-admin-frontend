import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Primitives'
import { formatPaise, listOrders } from '../features/ops/api'
import { DataTable, PageHeader, QueryGate } from '../features/ops/ui'

export function ReturnsPage() {
  const query = useQuery({
    queryKey: ['admin', 'returns'],
    queryFn: () => listOrders({ returnRequested: true, limit: 100 }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        description="Customer return requests from the 30-minute post-delivery window. Stock is not restored automatically."
      />
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(query.data?.length ?? 0) === 0}
        emptyTitle="No return requests"
        emptyDescription="When a customer requests a return after delivery, it will appear here."
      >
        <DataTable columns={['Order', 'Customer', 'Reason', 'Requested']}>
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
            </tr>
          ))}
        </DataTable>
      </QueryGate>
    </div>
  )
}
