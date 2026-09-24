import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Primitives'
import { ApiError } from '../api/errors'
import { disableProduct, formatPaise, listCategories, listProducts } from '../features/ops/api'
import {
  ActiveBadge,
  ConfirmDialog,
  DataTable,
  PageHeader,
  PrimaryLink,
  QueryGate,
  RowActions,
} from '../features/ops/ui'
import { useConfirmTarget } from '../features/ops/confirm'
import type { AdminProduct } from '../features/ops/types'

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
  const confirm = useConfirmTarget<AdminProduct>()
  const disable = useMutation({
    mutationFn: disableProduct,
    onSuccess: async () => {
      confirm.close()
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
                  editTo={`/products/${product.id}`}
                  deleteDisabled={!product.isActive}
                  deleting={disable.isPending && confirm.target?.id === product.id}
                  onDelete={() => {
                    disable.reset()
                    confirm.open(product)
                  }}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      </QueryGate>
      {confirm.target ? (
        <ConfirmDialog
          title={`Delete ${confirm.target.nameEn}?`}
          description="Customers will no longer see this product. Inventory and past orders are kept."
          loading={disable.isPending}
          error={
            disable.error instanceof ApiError
              ? disable.error.message
              : disable.error
                ? 'Could not delete this product.'
                : null
          }
          onCancel={confirm.close}
          onConfirm={() => disable.mutate(confirm.target!.id)}
        />
      ) : null}
    </div>
  )
}
