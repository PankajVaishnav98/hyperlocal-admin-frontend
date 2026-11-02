import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '../api/errors'
import { Button, Card } from '../components/ui/Primitives'
import {
  ADMIN_LIST_PAGE_SIZE,
  deleteProductReview,
  listProductReviews,
  updateProductReview,
  type AdminProductReview,
} from '../features/ops/api'
import { ConfirmDialog, DataTable, PageHeader, PaginationBar, QueryGate } from '../features/ops/ui'
import { useConfirmTarget } from '../features/ops/confirm'
import { paginateItems, textMatches } from '../utils/listQuery'
import { useDebouncedValue } from '../utils/useDebouncedValue'
import { useResettingPage } from '../utils/useResettingPage'

function formatWhen(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function ReviewsPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [rating, setRating] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')
  const debouncedQ = useDebouncedValue(q)
  const hasFilters = Boolean(q.trim() || rating !== 'all')
  const [page, setPage] = useResettingPage(`${debouncedQ}|${rating}`)
  const [editing, setEditing] = useState<AdminProductReview | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: listProductReviews,
    placeholderData: keepPreviousData,
  })
  const filtered = useMemo(() => {
    return (query.data ?? []).filter((review) => {
      if (rating !== 'all' && review.rating !== Number(rating)) return false
      return textMatches(debouncedQ, review.productName, review.authorName, review.comment, review.productId)
    })
  }, [debouncedQ, query.data, rating])
  const paged = paginateItems(filtered, page, ADMIN_LIST_PAGE_SIZE)
  const confirm = useConfirmTarget<AdminProductReview>()

  const update = useMutation({
    mutationFn: (review: AdminProductReview) =>
      updateProductReview(review.id, { rating: editRating, comment: editComment.trim() }),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
  })
  const remove = useMutation({
    mutationFn: deleteProductReview,
    onSuccess: async () => {
      confirm.close()
      if (paged.items.length <= 1 && page > 1) setPage(page - 1)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
  })

  function openEdit(review: AdminProductReview) {
    setEditError(null)
    update.reset()
    setEditRating(review.rating)
    setEditComment(review.comment)
    setEditing(review)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Customer reviews on products. You can correct a rating or comment, or remove a review from the shop."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search product, customer, or comment"
          className="h-11 rounded-xl border border-ink-200 px-3.5 text-sm"
          aria-label="Search reviews"
        />
        <select
          value={rating}
          onChange={(event) => setRating(event.target.value as typeof rating)}
          className="h-11 rounded-xl border border-ink-200 px-3.5 text-sm"
          aria-label="Filter reviews by rating"
        >
          <option value="all">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>
      <QueryGate
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={paged.meta.total === 0}
        emptyTitle={hasFilters ? 'No matching reviews' : 'No reviews yet'}
        emptyDescription={
          hasFilters
            ? 'Try a different search or rating.'
            : 'Reviews appear here after a customer reviews a product from a completed order.'
        }
      >
        <div className="space-y-4">
          <DataTable columns={['Product', 'Customer', 'Rating', 'Comment', 'When', '']}>
            {paged.items.map((review) => (
              <tr key={review.id} className="text-ink-800">
                <td className="px-4 py-3 font-semibold text-ink-950">{review.productName}</td>
                <td className="px-4 py-3">{review.authorName}</td>
                <td className="px-4 py-3">{review.rating} / 5</td>
                <td className="max-w-sm px-4 py-3 text-sm">{review.comment || '—'}</td>
                <td className="px-4 py-3 text-xs text-ink-500">{formatWhen(review.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(review)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        remove.reset()
                        confirm.open(review)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
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
      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/40"
            aria-label="Close editor"
            onClick={() => setEditing(null)}
          />
          <Card className="relative z-10 w-full max-w-md p-6">
            <h2 className="font-display text-lg font-semibold text-ink-950">Edit review</h2>
            <p className="mt-1 text-sm text-ink-600">
              {editing.productName} · {editing.authorName}
            </p>
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                setEditError(null)
                if (editComment.trim().length > 280) {
                  setEditError('Comment must be 280 characters or fewer.')
                  return
                }
                update.mutate(editing, {
                  onError: (error) => {
                    setEditError(error instanceof ApiError ? error.message : 'The review could not be updated.')
                  },
                })
              }}
            >
              <label className="block text-sm font-semibold text-ink-800" htmlFor="review-rating">
                Rating
              </label>
              <select
                id="review-rating"
                className="h-11 w-full rounded-xl border border-ink-200 px-3.5 text-sm"
                value={editRating}
                onChange={(event) => setEditRating(Number(event.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} star{value === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
              <label className="block text-sm font-semibold text-ink-800" htmlFor="review-comment">
                Comment
              </label>
              <textarea
                id="review-comment"
                className="min-h-28 w-full rounded-xl border border-ink-200 px-3.5 py-3 text-sm"
                maxLength={280}
                value={editComment}
                onChange={(event) => setEditComment(event.target.value)}
              />
              {editError ? (
                <p className="text-sm text-danger-600" role="alert">
                  {editError}
                </p>
              ) : null}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={update.isPending}>
                  Save review
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
      {confirm.target ? (
        <ConfirmDialog
          title="Delete this review?"
          description={`${confirm.target.authorName}'s review will be removed from ${confirm.target.productName}.`}
          loading={remove.isPending}
          error={
            remove.error instanceof ApiError
              ? remove.error.message
              : remove.error
                ? 'Could not delete this review.'
                : null
          }
          onCancel={confirm.close}
          onConfirm={() => remove.mutate(confirm.target!.id)}
        />
      ) : null}
    </div>
  )
}
