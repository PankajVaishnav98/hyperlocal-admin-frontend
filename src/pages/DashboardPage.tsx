import {
  LayoutDashboard,
  MapPinned,
  Package,
  Receipt,
  Tags,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '../components/states/SystemStates'
import { Badge, Card } from '../components/ui/Primitives'

const modules = [
  {
    to: '/categories',
    icon: Tags,
    title: 'Categories',
    description: 'Create and order the grocery aisle structure customers browse.',
  },
  {
    to: '/products',
    icon: Package,
    title: 'Products',
    description: 'Manage details, selling price, MRP, stock, and availability.',
  },
  {
    to: '/service-areas',
    icon: MapPinned,
    title: 'Service areas',
    description: 'Define coverage radius and the distance-based delivery fee.',
  },
  {
    to: '/orders',
    icon: Receipt,
    title: 'Orders',
    description: 'Fulfillment arrives after checkout. This queue is empty by design.',
  },
]

export function DashboardPage() {
  return (
    <div className="space-y-7">
      <section aria-labelledby="page-title">
        <Badge tone="info">
          <LayoutDashboard aria-hidden="true" className="size-3.5" />
          Operator workspace
        </Badge>
        <h1
          id="page-title"
          className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-ink-950 sm:text-4xl"
        >
          Catalog and coverage
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 sm:text-base">
          Hyperlocal runs a platform-managed catalog. There are no seller logins
          and no online payments in this version.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {modules.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <Card className="h-full p-5 transition-colors hover:border-ink-200 sm:p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                <Icon aria-hidden="true" className="size-4.5" />
              </div>
              <h2 className="mt-5 font-display text-base font-semibold text-ink-950">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p>
            </Card>
          </Link>
        ))}
      </section>

      <EmptyState
        title="No order metrics yet"
        description="Dashboard KPIs will appear when the order domain is implemented. This screen does not invent sales or volume numbers."
      />
    </div>
  )
}
