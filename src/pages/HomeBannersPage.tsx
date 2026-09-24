import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { disableHomeBanner, listHomeBanners } from '../features/ops/api'
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
import type { AdminHomeBanner } from '../features/ops/types'

export function HomeBannersPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'home-banners'], queryFn: listHomeBanners })
  const confirm = useConfirmTarget<AdminHomeBanner>()
  const disable = useMutation({
    mutationFn: disableHomeBanner,
    onSuccess: async () => {
      confirm.close()
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
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={(query.data?.length ?? 0) === 0}
        emptyTitle="No home banners yet"
        emptyDescription="Add an image URL and optional title. Link it to a category, a product, or nothing."
        emptyAction={<PrimaryLink to="/home-banners/new">New banner</PrimaryLink>}
      >
        <DataTable columns={['Banner', 'Link', 'Order', 'Status', '']}>
          {query.data?.map((banner) => (
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
