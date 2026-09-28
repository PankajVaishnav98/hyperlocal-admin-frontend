import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { ADMIN_LIST_PAGE_SIZE, disableCategory, listCategories } from '../features/ops/api'
import {
  ActiveBadge,
  ConfirmDialog,
  DataTable,
  PageHeader,
  PaginationBar,
  PrimaryLink,
  QueryGate,
  SecondaryLink,
  RowActions,
} from '../features/ops/ui'
import { CatalogThumb } from '../features/ops/CatalogThumb'
import { useConfirmTarget } from '../features/ops/confirm'
import type { AdminCategory } from '../features/ops/types'
import { useDebouncedValue } from '../utils/useDebouncedValue'
import { useResettingPage } from '../utils/useResettingPage'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [active, setActive] = useState<'all' | 'true' | 'false'>('all')
  const debouncedQ = useDebouncedValue(q)
  const hasFilters = Boolean(q.trim() || active !== 'all')
  const [page, setPage] = useResettingPage(`${debouncedQ}|${active}`)
  const query = useQuery({
    queryKey: ['admin', 'categories', page, debouncedQ, active],
    queryFn: () =>
      listCategories({
        page,
        limit: ADMIN_LIST_PAGE_SIZE,
        ...(debouncedQ.trim() ? { q: debouncedQ.trim() } : {}),
        ...(active === 'all' ? {} : { active }),
      }),
    placeholderData: keepPreviousData,
  })
  const confirm = useConfirmTarget<AdminCategory>()
  const disable = useMutation({
    mutationFn: disableCategory,
    onSuccess: async () => {
      confirm.close()
      if ((query.data?.items.length ?? 0) <= 1 && page > 1) {
        setPage(page - 1)
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })
  const meta = query.data?.meta

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Aisles shown to customers. Deleting hides a category from the shop without removing history."
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink to="/catalog-import">Import spreadsheet</SecondaryLink>
            <PrimaryLink to="/categories/new">New category</PrimaryLink>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name or slug"
          className="h-11 rounded-xl border border-ink-200 px-3.5 text-sm"
        />
        <select
          value={active}
          onChange={(event) => setActive(event.target.value as 'all' | 'true' | 'false')}
          className="h-11 rounded-xl border border-ink-200 px-3.5 text-sm"
        >
          <option value="all">Active and inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(meta?.total ?? 0) === 0}
        emptyTitle={hasFilters ? 'No matching categories' : 'No categories yet'}
        emptyDescription={
          hasFilters
            ? 'Try a different search or active filter.'
            : 'Create the first aisle, then add products to it.'
        }
        emptyAction={hasFilters ? undefined : <PrimaryLink to="/categories/new">New category</PrimaryLink>}
      >
        <div className="space-y-4">
          <DataTable columns={['Name', 'Slug', 'Order', 'Status', '']}>
            {query.data?.items.map((category) => (
              <tr key={category.id} className="text-ink-800">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CatalogThumb imageUrl={category.imageUrl} />
                    <div>
                      <Link className="font-semibold text-ink-950 hover:underline" to={`/categories/${category.id}`}>
                        {category.nameEn}
                      </Link>
                      <p className="text-xs text-ink-500">{category.nameHi}</p>
                    </div>
                  </div>
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
          {meta ? (
            <PaginationBar
              page={meta.page}
              limit={meta.limit}
              total={meta.total}
              totalPages={meta.totalPages}
              hasNextPage={meta.hasNextPage}
              hasPreviousPage={meta.hasPreviousPage}
              onPageChange={setPage}
            />
          ) : null}
        </div>
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
