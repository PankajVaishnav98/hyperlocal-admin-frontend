import {
  BarChart3,
  FileSpreadsheet,
  ImagePlus,
  LayoutDashboard,
  MapPinned,
  Package,
  Receipt,
  Shield,
  Tags,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { EmptyState, ErrorState, LoadingState } from '../components/states/SystemStates'
import { Badge, Card } from '../components/ui/Primitives'
import { countOrders, listCategories, listOrders, listProducts, listServiceAreas } from '../features/ops/api'

const modules = [
  {
    to: '/analysis',
    icon: BarChart3,
    title: 'Analysis',
    description: 'Merchandise revenue, delivery fees, profit from product cost, and order charts.',
  },
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
    description: 'Selling price, MRP, stock, and optional platform COGS for profit.',
  },
  {
    to: '/catalog-import',
    icon: FileSpreadsheet,
    title: 'Catalog import',
    description: 'Create or update categories by slug and products by SKU from an Excel workbook.',
  },
  {
    to: '/home-banners',
    icon: ImagePlus,
    title: 'Home banners',
    description: 'Images, optional copy, and links shown on the customer Home slider.',
  },
  {
    to: '/service-areas',
    icon: MapPinned,
    title: 'Service areas',
    description: 'PIN coverage plus hub location and ₹/km billed per 100 m for delivery.',
  },
  {
    to: '/orders',
    icon: Receipt,
    title: 'Orders',
    description: 'Accept, reject, or mark cash-on-delivery orders delivered.',
  },
  {
    to: '/sessions',
    icon: Shield,
    title: 'Devices',
    description: 'See and revoke active operator sessions without exposing tokens.',
  },
]

export function DashboardPage() {
  const orders = useQuery({
    queryKey: ['admin', 'orders', 'overview'],
    queryFn: () => listOrders({ page: 1, limit: 1 }),
  })
  const waitingCount = useQuery({
    queryKey: ['admin', 'orders', 'count', 'placed'],
    queryFn: () => countOrders('placed'),
  })
  const inProgressCount = useQuery({
    queryKey: ['admin', 'orders', 'count', 'accepted'],
    queryFn: () => countOrders('accepted'),
  })
  const products = useQuery({
    queryKey: ['admin', 'products', 'summary'],
    queryFn: () => listProducts({ page: 1, limit: 1 }),
  })
  const categories = useQuery({
    queryKey: ['admin', 'categories', 'summary'],
    queryFn: () => listCategories({ page: 1, limit: 1 }),
  })
  const areas = useQuery({ queryKey: ['admin', 'service-areas'], queryFn: listServiceAreas })

  const placed = waitingCount.data ?? 0
  const accepted = inProgressCount.data ?? 0
  const overviewError =
    waitingCount.error ?? inProgressCount.error ?? products.error ?? categories.error ?? areas.error

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
          Operations
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 sm:text-base">
          Manage catalog, coverage, and cash-on-delivery fulfillment. There are no
          seller logins and no online payments in this version.
        </p>
      </section>

      {waitingCount.isLoading || inProgressCount.isLoading || products.isLoading ? (
        <LoadingState label="Loading operations summary" rows={2} />
      ) : overviewError ? (
        <ErrorState
          title="Could not load the overview"
          description={
            overviewError instanceof Error ? overviewError.message : 'Please try again.'
          }
          onRetry={() => {
            void waitingCount.refetch()
            void inProgressCount.refetch()
            void orders.refetch()
            void products.refetch()
            void categories.refetch()
            void areas.refetch()
          }}
        />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Waiting</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink-950">{placed}</p>
            <p className="mt-1 text-sm text-ink-600">Placed, not yet accepted</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">In progress</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink-950">{accepted}</p>
            <p className="mt-1 text-sm text-ink-600">Accepted, not delivered</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Catalog</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink-950">
              {products.data?.meta.total ?? 0}
            </p>
            <p className="mt-1 text-sm text-ink-600">{categories.data?.meta.total ?? 0} categories</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Coverage</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink-950">
              {(areas.data ?? []).filter((area) => area.isActive).length}
            </p>
            <p className="mt-1 text-sm text-ink-600">Active PIN codes</p>
          </Card>
        </section>
      )}

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

      {(orders.data?.meta.total ?? 0) === 0 && !orders.isLoading && !orders.error ? (
        <EmptyState
          title="No COD tickets yet"
          description="This overview only counts real orders. Open Orders after a customer places cash on delivery."
        />
      ) : null}
    </div>
  )
}
