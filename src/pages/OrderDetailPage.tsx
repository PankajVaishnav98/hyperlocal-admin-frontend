import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '../components/ui/Primitives'
import { ErrorState } from '../components/states/SystemStates'
import { formatPaise, getOrder } from '../features/ops/api'
import { PageHeader, QueryGate } from '../features/ops/ui'

export function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const query = useQuery({
    queryKey: ['admin', 'orders', orderId],
    queryFn: () => getOrder(orderId),
    enabled: Boolean(orderId),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={query.data?.orderNumber ?? 'Order'}
        description="Platform-fulfilled cash on delivery. There is no shop-owner inbox and no online payment."
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
        {query.data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-ink-100 bg-white p-5">
              <h2 className="font-semibold text-ink-950">Payment and status</h2>
              <p className="mt-2 text-sm text-ink-600">
                {formatPaise(query.data.pricing.grandTotalPaise)} cash on delivery
              </p>
              <div className="mt-3 flex gap-2">
                <Badge tone={query.data.status === 'placed' ? 'info' : 'warning'}>
                  {query.data.status}
                </Badge>
                <Badge tone="neutral">{query.data.payment.method.toUpperCase()}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-600">{query.data.customerMobile}</p>
              <p className="text-xs text-ink-500">
                {query.data.service.serviceAreaName} · {query.data.service.distanceKm} km
              </p>
            </section>
            <section className="rounded-2xl border border-ink-100 bg-white p-5">
              <h2 className="font-semibold text-ink-950">Delivery address</h2>
              <p className="mt-2 text-sm text-ink-800">{query.data.address.recipientName}</p>
              <p className="text-sm text-ink-600">
                {query.data.address.line1}, {query.data.address.city}, {query.data.address.state}{' '}
                {query.data.address.pincode}
              </p>
            </section>
            <section className="rounded-2xl border border-ink-100 bg-white p-5 lg:col-span-2">
              <h2 className="font-semibold text-ink-950">Items</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-700">
                {query.data.items.map((item) => (
                  <li key={item.productId} className="flex justify-between">
                    <span>
                      {item.nameEn} × {item.quantity}
                    </span>
                    <span>{formatPaise(item.lineTotalPaise)}</span>
                  </li>
                ))}
                <li className="flex justify-between">
                  <span>Delivery</span>
                  <span>{formatPaise(query.data.pricing.deliveryFeePaise)}</span>
                </li>
              </ul>
            </section>
          </div>
        ) : (
          <ErrorState title="Order not found" description="This order is not in the inbox." />
        )}
      </QueryGate>
    </div>
  )
}
