import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { ADMIN_LIST_PAGE_SIZE, disableHomeBanner, listHomeBanners } from '../features/ops/api'
import {
  ActiveBadge,
  ConfirmDialog,
  DataTable,
  PageHeader,
  PaginationBar,
  PrimaryLink,
  QueryGate,
  RowActions,
} from '../features/ops/ui'
import { useConfirmTarget } from '../features/ops/confirm'
import type { AdminHomeBanner } from '../features/ops/types'
import { paginateItems, textMatches } from '../utils/listQuery'
import { useDebouncedValue } from '../utils/useDebouncedValue'
import { useResettingPage } from '../utils/useResettingPage'

export function HomeBannersPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [active, setActive] = useState<'all' | 'true' | 'false'>('all')
  const debouncedQ = useDebouncedValue(q)
  const hasFilters = Boolean(q.trim() || active !== 'all')
  const [page, setPage] = useResettingPage(`${debouncedQ}|${active}`)
  const query = useQuery({
    queryKey: ['admin', 'home-banners'],
    queryFn: listHomeBanners,
    placeholderData: keepPreviousData,
  })
  const filtered = useMemo(() => {
    return (query.data ?? []).filter((banner) => {
      if (active === 'true' && !banner.isActive) return false
      if (active === 'false' && banner.isActive) return false
      return textMatches(debouncedQ, banner.title, banner.subtitle, banner.linkType, banner.categoryId, banner.productId)
    })
  }, [active, debouncedQ, query.data])
  const paged = paginateItems(filtered, page, ADMIN_LIST_PAGE_SIZE)
  const confirm = useConfirmTarget<AdminHomeBanner>()
  const disable = useMutation({
    mutationFn: disableHomeBanner,
    onSuccess: async () => {
      confirm.close()
      if (paged.items.length <= 1 && page > 1) {
        setPage(page - 1)
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'home-banners'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Home banners"
        description="Customer Home slider. Inactive banners are hidden. There is no catalog-generated fallback."
        action={<PrimaryLink to="/home-banners/new">New banner</PrimaryLink>}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search title or link"
          className="h-11 rounded-xl border border-ink-200 px-3.5 text-sm"
          aria-label="Search home banners"
        />
        <select
          value={active}
          onChange={(event) => setActive(event.target.value as 'all' | 'true' | 'false')}
          className="h-11 rounded-xl border border-ink-200 px-3.5 text-sm"
          aria-label="Filter banners by status"
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
        isEmpty={paged.meta.total === 0}
        emptyTitle={hasFilters ? 'No matching banners' : 'No home banners yet'}
        emptyDescription={
          hasFilters
            ? 'Try a different search or active filter.'
            : 'Add an image URL and optional title. Link it to a category, a product, or nothing.'
        }
        emptyAction={hasFilters ? undefined : <PrimaryLink to="/home-banners/new">New banner</PrimaryLink>}
      >
        <div className="space-y-4">
          <DataTable columns={['Banner', 'Link', 'Order', 'Status', '']}>
            {paged.items.map((banner) => (
              <tr key={banner.id} className="text-ink-800">
                <td className="px-4 py-3">
                  <Link className="font-semibold text-ink-950 hover:underline" to={`/home-banners/${banner.id}`}>
                    {banner.title || 'Untitled banner'}
                  </Link>
                  <p className="max-w-md truncate text-xs text-ink-500">{banner.subtitle || banner.imageUrl}</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {banner.linkType === 'category'
                    ? `Category ${banner.categoryId}`
                    : banner.linkType === 'product'
                      ? `Product ${banner.productId}`
                      : 'No link'}
                </td>
                <td className="px-4 py-3">{banner.sortOrder}</td>
                <td className="px-4 py-3">
                  <ActiveBadge active={banner.isActive} />
                </td>
                <td className="px-4 py-3 text-right">
                  <RowActions
                    editTo={`/home-banners/${banner.id}`}
                    deleteDisabled={!banner.isActive}
                    deleting={disable.isPending && confirm.target?.id === banner.id}
                    onDelete={() => {
                      disable.reset()
                      confirm.open(banner)
                    }}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
          <PaginationBar
            page={paged.meta.page}
            limit={paged.meta.limit}
            total={paged.meta.total}
            totalPages={paged.meta.totalPages}
            hasNextPage={paged.meta.hasNextPage}
            hasPreviousPage={paged.meta.hasPreviousPage}
            onPageChange={setPage}
          />
        </div>
      </QueryGate>
      {confirm.target ? (
        <ConfirmDialog
          title="Delete this home banner?"
          description="It will leave the customer slider. You can reactivate it from the edit screen."
          loading={disable.isPending}
          error={
            disable.error instanceof ApiError
              ? disable.error.message
              : disable.error
                ? 'Could not delete this banner.'
                : null
          }
          onCancel={confirm.close}
          onConfirm={() => disable.mutate(confirm.target!.id)}
        />
      ) : null}
    </div>
  )
}
