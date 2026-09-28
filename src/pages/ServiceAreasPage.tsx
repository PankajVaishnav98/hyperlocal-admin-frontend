import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { ADMIN_LIST_PAGE_SIZE, disableServiceArea, formatPaise, listServiceAreas } from '../features/ops/api'
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
import type { ServiceArea } from '../features/ops/types'
import { paginateItems, textMatches } from '../utils/listQuery'
import { useDebouncedValue } from '../utils/useDebouncedValue'
import { useResettingPage } from '../utils/useResettingPage'

export function ServiceAreasPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [active, setActive] = useState<'all' | 'true' | 'false'>('all')
  const debouncedQ = useDebouncedValue(q)
  const hasFilters = Boolean(q.trim() || active !== 'all')
  const [page, setPage] = useResettingPage(`${debouncedQ}|${active}`)
  const query = useQuery({
    queryKey: ['admin', 'service-areas'],
    queryFn: listServiceAreas,
    placeholderData: keepPreviousData,
  })
  const filtered = useMemo(() => {
    return (query.data ?? []).filter((area) => {
      if (active === 'true' && !area.isActive) return false
      if (active === 'false' && area.isActive) return false
      return textMatches(debouncedQ, area.name, area.pincode, area.slug)
    })
  }, [active, debouncedQ, query.data])
  const paged = paginateItems(filtered, page, ADMIN_LIST_PAGE_SIZE)
  const confirm = useConfirmTarget<ServiceArea>()
  const disable = useMutation({
    mutationFn: disableServiceArea,
    onSuccess: async () => {
      confirm.close()
      if (paged.items.length <= 1 && page > 1) {
        setPage(page - 1)
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-areas'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service areas"
        description="PIN coverage first. When a hub is saved, checkout charges metres × ₹ per 100 m (linear, paise rounding)."
        action={<PrimaryLink to="/service-areas/new">New service area</PrimaryLink>}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name or PIN"
          className="h-11 rounded-xl border border-ink-200 px-3.5 text-sm"
          aria-label="Search service areas"
        />
        <select
          value={active}
          onChange={(event) => setActive(event.target.value as 'all' | 'true' | 'false')}
          className="h-11 rounded-xl border border-ink-200 px-3.5 text-sm"
          aria-label="Filter service areas by status"
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
        emptyTitle={hasFilters ? 'No matching service areas' : 'No service areas yet'}
        emptyDescription={
          hasFilters
            ? 'Try a different search or active filter.'
            : 'Add a PIN code, hub, and ₹ per 100 m charge before taking orders.'
        }
        emptyAction={hasFilters ? undefined : <PrimaryLink to="/service-areas/new">New service area</PrimaryLink>}
      >
        <div className="space-y-4">
          <DataTable columns={['Area', 'PIN', 'Hub', '₹ / 100 m', 'Status', '']}>
            {paged.items.map((area) => (
              <tr key={area.id} className="text-ink-800">
                <td className="px-4 py-3">
                  <Link className="font-semibold text-ink-950 hover:underline" to={`/service-areas/${area.id}`}>
                    {area.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-sm">{area.pincode}</td>
                <td className="px-4 py-3 text-sm">
                  {typeof area.centerLatitude === 'number' && typeof area.centerLongitude === 'number'
                    ? `${area.centerLatitude.toFixed(4)}, ${area.centerLongitude.toFixed(4)}`
                    : 'PIN only'}
                </td>
                <td className="px-4 py-3">{formatPaise(area.perKmFeePaise)}</td>
                <td className="px-4 py-3">
                  <ActiveBadge active={area.isActive} />
                </td>
                <td className="px-4 py-3 text-right">
                  <RowActions
                    editTo={`/service-areas/${area.id}`}
                    deleteDisabled={!area.isActive}
                    deleting={disable.isPending && confirm.target?.id === area.id}
                    onDelete={() => {
                      disable.reset()
                      confirm.open(area)
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
          title={`Delete ${confirm.target.name}?`}
          description="Checkout will stop quoting this PIN code until you activate it again."
          loading={disable.isPending}
          error={
            disable.error instanceof ApiError
              ? disable.error.message
              : disable.error
                ? 'Could not delete this service area.'
                : null
          }
          onCancel={confirm.close}
          onConfirm={() => disable.mutate(confirm.target!.id)}
        />
      ) : null}
    </div>
  )
}
