import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { disableCategory, listCategories } from '../features/ops/api'
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
import type { AdminCategory } from '../features/ops/types'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'categories'], queryFn: listCategories })
  const confirm = useConfirmTarget<AdminCategory>()
  const disable = useMutation({
    mutationFn: disableCategory,
    onSuccess: async () => {
      confirm.close()
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Aisles shown to customers. Deleting hides a category from the shop without removing history."
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
                  editTo={`/categories/${category.id}`}
                  deleteDisabled={!category.isActive}
                  deleting={disable.isPending && confirm.target?.id === category.id}
                  onDelete={() => {
                    disable.reset()
                    confirm.open(category)
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
          description="Customers will no longer see this aisle. You can turn it back on later from the edit screen."
          loading={disable.isPending}
          error={
            disable.error instanceof ApiError
              ? disable.error.message
              : disable.error
                ? 'Could not delete this category.'
                : null
          }
          onCancel={confirm.close}
          onConfirm={() => disable.mutate(confirm.target!.id)}
        />
      ) : null}
    </div>
  )
}
