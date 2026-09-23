import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { disableHomeBanner, listHomeBanners } from '../features/ops/api'
import { ActiveBadge, DataTable, PageHeader, PrimaryLink, QueryGate, RowActions } from '../features/ops/ui'

export function HomeBannersPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'home-banners'], queryFn: listHomeBanners })
  const disable = useMutation({
    mutationFn: disableHomeBanner,
    onSuccess: async () => {
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
                  disabled={!banner.isActive}
                  disabling={disable.isPending && disable.variables === banner.id}
                  onDisable={() => {
                    if (window.confirm('Disable this home banner? It will leave the customer slider.')) {
                      disable.mutate(banner.id)
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
