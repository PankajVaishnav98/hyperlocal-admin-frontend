import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { disableCategory, listCategories } from '../features/ops/api'
import { ActiveBadge, DataTable, PageHeader, PrimaryLink, QueryGate, RowActions } from '../features/ops/ui'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'categories'], queryFn: listCategories })
  const disable = useMutation({
    mutationFn: disableCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Aisles shown to customers. Disabling hides a category from the shop without deleting history."
        action={<PrimaryLink to="/categories/new">New category</PrimaryLink>}
      />
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(query.data?.length ?? 0) === 0}
        emptyTitle="No categories yet"
        emptyDescription="Create the first aisle, then add products to it."
        emptyAction={<PrimaryLink to="/categories/new">New category</PrimaryLink>}
      >
        <DataTable columns={['Name', 'Slug', 'Order', 'Status', '']}>
          {query.data?.map((category) => (
            <tr key={category.id} className="text-ink-800">
              <td className="px-4 py-3">
                <Link className="font-semibold text-ink-950 hover:underline" to={`/categories/${category.id}`}>
                  {category.nameEn}
                </Link>
                <p className="text-xs text-ink-500">{category.nameHi}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{category.slug}</td>
              <td className="px-4 py-3">{category.sortOrder}</td>
              <td className="px-4 py-3">
                <ActiveBadge active={category.isActive} />
              </td>
              <td className="px-4 py-3 text-right">
                <RowActions
                  disabled={!category.isActive}
                  disabling={disable.isPending && disable.variables === category.id}
                  onDisable={() => {
                    if (window.confirm(`Disable ${category.nameEn}? It will no longer appear in the shop.`)) {
                      disable.mutate(category.id)
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
