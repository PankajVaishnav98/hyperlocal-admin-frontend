import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { disableServiceArea, formatPaise, listServiceAreas } from '../features/ops/api'
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
import type { ServiceArea } from '../features/ops/types'

export function ServiceAreasPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'service-areas'], queryFn: listServiceAreas })
  const confirm = useConfirmTarget<ServiceArea>()
  const disable = useMutation({
    mutationFn: disableServiceArea,
    onSuccess: async () => {
      confirm.close()
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-areas'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service areas"
        description="Each PIN code you cover, with the per-kilometre cash-on-delivery charge used at checkout."
        action={<PrimaryLink to="/service-areas/new">New service area</PrimaryLink>}
      />
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(query.data?.length ?? 0) === 0}
        emptyTitle="No service areas yet"
        emptyDescription="Add a PIN code and per-kilometre charge before taking orders."
        emptyAction={<PrimaryLink to="/service-areas/new">New service area</PrimaryLink>}
      >
        <DataTable columns={['Area', 'PIN', 'Hub', 'Per km', 'Status', '']}>
          {query.data?.map((area) => (
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
