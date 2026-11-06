import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { disableOffer, formatPaise, listOffers } from '../features/ops/api'
import { useConfirmTarget } from '../features/ops/confirm'
import type { AdminOffer } from '../features/ops/types'
import {
  ActiveBadge,
  ConfirmDialog,
  DataTable,
  PageHeader,
  PrimaryLink,
  QueryGate,
  RowActions,
} from '../features/ops/ui'
import { textMatches } from '../utils/listQuery'

function offerValue(offer: AdminOffer): string {
  if (offer.kind === 'percent' && offer.percent) return `${offer.percent}% off`
  if (offer.kind === 'flat' && offer.flatPaise) return `${formatPaise(offer.flatPaise)} off`
  return 'Offer'
}

function offerTarget(offer: AdminOffer): string {
  if (offer.scope === 'all') return 'All products'
  return offer.productName ?? offer.productId ?? 'One product'
}

export function OffersPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const query = useQuery({
    queryKey: ['admin', 'offers'],
    queryFn: listOffers,
    placeholderData: keepPreviousData,
  })
  const filtered = useMemo(
    () =>
      (query.data ?? []).filter((offer) =>
        textMatches(q, offer.title, offer.productName, offer.scope, offer.kind),
      ),
    [q, query.data],
  )
  const confirm = useConfirmTarget<AdminOffer>()
  const disable = useMutation({
    mutationFn: disableOffer,
    onSuccess: async () => {
      confirm.close()
      await queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers"
        description="Add a percentage or a flat rupee amount on one product, or on every product. Customers see the saving in the cart, at checkout, and on their profile."
        action={<PrimaryLink to="/offers/new">New offer</PrimaryLink>}
      />
      <label className="block max-w-sm text-sm font-semibold text-ink-700">
        Search
        <input
          className="mt-1 h-11 w-full rounded-xl border border-ink-200 px-3"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
      </label>
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!query.isLoading && !query.error && filtered.length === 0}
        emptyTitle={q.trim() ? 'No matching offers' : 'No offers yet'}
        emptyDescription={
          q.trim()
            ? 'Try a different search.'
            : 'Create a percentage or flat offer for one product or the whole shop.'
        }
        emptyAction={q.trim() ? undefined : <PrimaryLink to="/offers/new">New offer</PrimaryLink>}
      >
        <DataTable columns={['Offer', 'Saving', 'Applies to', 'Status', '']}>
          {filtered.map((offer) => (
            <tr key={offer.id} className="text-ink-800">
              <td className="px-4 py-3">
                <Link className="font-semibold text-ink-950 hover:underline" to={`/offers/${offer.id}`}>
                  {offer.title}
                </Link>
              </td>
              <td className="px-4 py-3">{offerValue(offer)}</td>
              <td className="px-4 py-3">{offerTarget(offer)}</td>
              <td className="px-4 py-3">
                <ActiveBadge active={offer.isActive} />
              </td>
              <td className="px-4 py-3 text-right">
                <RowActions
                  editTo={`/offers/${offer.id}`}
                  deleteDisabled={!offer.isActive}
                  deleting={disable.isPending && confirm.target?.id === offer.id}
                  onDelete={() => {
                    disable.reset()
                    confirm.open(offer)
                  }}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      </QueryGate>
      {confirm.target ? (
        <ConfirmDialog
          title="Turn this offer off?"
          description={`${confirm.target.title} will stop reducing cart totals.`}
          confirmLabel="Turn off"
          loading={disable.isPending}
          error={
            disable.error instanceof ApiError
              ? disable.error.message
              : disable.error
                ? 'Could not turn this offer off.'
                : null
          }
          onCancel={confirm.close}
          onConfirm={() => disable.mutate(confirm.target!.id)}
        />
      ) : null}
    </div>
  )
}
