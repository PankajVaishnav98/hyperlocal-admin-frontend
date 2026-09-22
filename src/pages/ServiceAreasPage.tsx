import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { disableServiceArea, formatPaise, listServiceAreas } from '../features/ops/api'
import { ActiveBadge, DataTable, PageHeader, PrimaryLink, QueryGate, RowActions } from '../features/ops/ui'

export function ServiceAreasPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'service-areas'], queryFn: listServiceAreas })
  const disable = useMutation({
    mutationFn: disableServiceArea,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-areas'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service areas"
        description="Coverage radius and the centralized distance-based delivery fee. Checkout will use these rules later."
        action={<PrimaryLink to="/service-areas/new">New service area</PrimaryLink>}
      />
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(query.data?.length ?? 0) === 0}
        emptyTitle="No service areas yet"
        emptyDescription="Define at least one coverage circle and fee schedule before taking orders."
        emptyAction={<PrimaryLink to="/service-areas/new">New service area</PrimaryLink>}
      >
        <DataTable columns={['Area', 'Radius', 'Fee', 'Status', '']}>
          {query.data?.map((area) => (
            <tr key={area.id} className="text-ink-800">
              <td className="px-4 py-3">
                <Link className="font-semibold text-ink-950 hover:underline" to={`/service-areas/${area.id}`}>
                  {area.name}
                </Link>
                <p className="text-xs text-ink-500">
                  {area.centerLatitude.toFixed(4)}, {area.centerLongitude.toFixed(4)}
                </p>
              </td>
              <td className="px-4 py-3">{area.radiusKm} km</td>
              <td className="px-4 py-3">
                {formatPaise(area.baseFeePaise)} / {area.baseDistanceKm} km
                <p className="text-xs text-ink-500">
                  then {formatPaise(area.additionalFeePaise)} / {area.additionalDistanceKm} km
                </p>
              </td>
              <td className="px-4 py-3">
                <ActiveBadge active={area.isActive} />
              </td>
              <td className="px-4 py-3 text-right">
                <RowActions
                  disabled={!area.isActive}
                  disabling={disable.isPending && disable.variables === area.id}
                  onDisable={() => {
                    if (window.confirm(`Disable ${area.name}?`)) disable.mutate(area.id)
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
