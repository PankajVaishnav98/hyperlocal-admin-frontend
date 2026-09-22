import { EmptyState } from '../components/states/SystemStates'
import { PageHeader } from '../features/ops/ui'

export function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Order placement, assignment, and COD collection are not implemented yet. This list is empty on purpose."
      />
      <EmptyState
        title="No orders to operate"
        description="Checkout and the order domain have not shipped. There are no mock tickets, fake KPIs, or placeholder customers here."
      />
    </div>
  )
}
