import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Primitives'
import { disableProduct, formatPaise, listCategories, listProducts } from '../features/ops/api'
import { ActiveBadge, DataTable, PageHeader, PrimaryLink, QueryGate, RowActions } from '../features/ops/ui'

const inventoryTone = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'warning',
  DISABLED: 'neutral',
} as const

export function ProductsPage() {
  const queryClient = useQueryClient()
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: listCategories })
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => listProducts() })
  const disable = useMutation({
    mutationFn: disableProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
  const categoryName = new Map((categories.data ?? []).map((category) => [category.id, category.nameEn]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Platform catalog with server-authoritative prices, stock, and availability."
        action={<PrimaryLink to="/products/new">New product</PrimaryLink>}
      />
      <QueryGate
        isLoading={products.isLoading}
        error={products.error}
        onRetry={() => void products.refetch()}
        isEmpty={(products.data?.length ?? 0) === 0}
        emptyTitle="No products yet"
        emptyDescription="Add grocery items after at least one category exists."
        emptyAction={<PrimaryLink to="/products/new">New product</PrimaryLink>}
      >
        <DataTable columns={['Product', 'Category', 'Price', 'Stock', 'Status', '']}>
          {products.data?.map((product) => (
            <tr key={product.id} className="text-ink-800">
              <td className="px-4 py-3">
                <Link className="font-semibold text-ink-950 hover:underline" to={`/products/${product.id}`}>
                  {product.nameEn}
                </Link>
                <p className="text-xs text-ink-500">
                  {product.nameHi} · {product.unit} · {product.sku}
                </p>
              </td>
              <td className="px-4 py-3">{categoryName.get(product.categoryId) ?? product.categoryId}</td>
              <td className="px-4 py-3">
                {formatPaise(product.pricePaise)}
                <p className="text-xs text-ink-500">MRP {formatPaise(product.mrpPaise)}</p>
              </td>
              <td className="px-4 py-3">{product.stockQuantity}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <ActiveBadge active={product.isActive} />
                  <Badge tone={inventoryTone[product.inventoryStatus]}>
                    {product.inventoryStatus.replaceAll('_', ' ').toLowerCase()}
                  </Badge>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <RowActions
                  disabled={!product.isActive}
                  disabling={disable.isPending && disable.variables === product.id}
                  onDisable={() => {
                    if (window.confirm(`Disable ${product.nameEn}? Customers will no longer see it.`)) {
                      disable.mutate(product.id)
                    }
                  }}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      </QueryGate>
    </div>
  )
}
