import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '../api/errors'
import { ErrorState, LoadingState } from '../components/states/SystemStates'
import { Button, Card, Input } from '../components/ui/Primitives'
import {
  createOffer,
  getOffer,
  listProductOptions,
  rupeesToPaise,
  updateOffer,
} from '../features/ops/api'
import type { OfferPayload } from '../features/ops/types'
import { PageHeader } from '../features/ops/ui'

function toLocalInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIso(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function OfferFormPage() {
  const { offerId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const editing = Boolean(offerId)
  const offerQuery = useQuery({
    queryKey: ['admin', 'offers', offerId],
    queryFn: () => getOffer(offerId ?? ''),
    enabled: editing,
  })
  const products = useQuery({
    queryKey: ['admin', 'product-options'],
    queryFn: listProductOptions,
  })
  const [title, setTitle] = useState('')
  const [scope, setScope] = useState<'all' | 'product'>('product')
  const [productId, setProductId] = useState('')
  const [kind, setKind] = useState<'percent' | 'flat'>('percent')
  const [percent, setPercent] = useState('10')
  const [rupees, setRupees] = useState('10')
  const [isActive, setIsActive] = useState(true)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (offerQuery.data && !hydrated) {
    const offer = offerQuery.data
    setTitle(offer.title)
    setScope(offer.scope)
    setProductId(offer.productId ?? '')
    setKind(offer.kind)
    setPercent(offer.percent ? String(offer.percent) : '10')
    setRupees(offer.flatPaise ? String(offer.flatPaise / 100) : '10')
    setIsActive(offer.isActive)
    setStartsAt(toLocalInput(offer.startsAt))
    setEndsAt(toLocalInput(offer.endsAt))
    setHydrated(true)
  }

  const save = useMutation({
    mutationFn: (payload: OfferPayload) =>
      editing && offerId ? updateOffer(offerId, payload) : createOffer(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] })
      navigate('/offers')
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    const percentValue = Number.parseInt(percent, 10)
    const flatPaise = rupeesToPaise(rupees)
    if (title.trim().length < 3) {
      setFormError('Enter an offer name of at least 3 characters.')
      return
    }
    if (scope === 'product' && !productId) {
      setFormError('Choose the product this offer applies to.')
      return
    }
    if (kind === 'percent' && (!Number.isInteger(percentValue) || percentValue < 1 || percentValue > 90)) {
      setFormError('Enter a percentage from 1 to 90.')
      return
    }
    if (kind === 'flat' && (!Number.isInteger(flatPaise) || flatPaise < 100)) {
      setFormError('Enter a flat amount of at least ₹1.')
      return
    }
    const start = toIso(startsAt)
    const end = toIso(endsAt)
    if (start && end && end <= start) {
      setFormError('The end time must be after the start time.')
      return
    }
    void save.mutate({
      title: title.trim(),
      scope,
      productId: scope === 'product' ? productId : null,
      kind,
      percent: kind === 'percent' ? percentValue : null,
      flatPaise: kind === 'flat' ? flatPaise : null,
      isActive,
      startsAt: start,
      endsAt: end,
    })
  }

  if (editing && offerQuery.isLoading) return <LoadingState label="Loading offer" />
  if (editing && offerQuery.error) {
    return (
      <ErrorState
        title="Offer could not be loaded"
        description={offerQuery.error instanceof Error ? offerQuery.error.message : 'Please try again.'}
        onRetry={() => void offerQuery.refetch()}
      />
    )
  }

  const errorMessage =
    formError ??
    (save.error instanceof ApiError ? save.error.message : save.error ? 'The offer could not be saved.' : null)

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <PageHeader
        title={editing ? 'Edit offer' : 'New offer'}
        description="Percentage and flat offers reduce the item price. A product offer is used instead of an all-products offer when it saves more."
      />
      <Card className="space-y-4 p-5">
        <Input label="Offer name" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <label className="block text-sm font-semibold text-ink-700">
          Applies to
          <select
            className="mt-1 h-11 w-full rounded-xl border border-ink-200 px-3"
            value={scope}
            onChange={(event) => setScope(event.target.value === 'all' ? 'all' : 'product')}
          >
            <option value="product">One product</option>
            <option value="all">All products</option>
          </select>
        </label>
        {scope === 'product' ? (
          <label className="block text-sm font-semibold text-ink-700">
            Product
            <select
              className="mt-1 h-11 w-full rounded-xl border border-ink-200 px-3"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="">Choose a product</option>
              {(products.data ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nameEn}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block text-sm font-semibold text-ink-700">
          Offer type
          <select
            className="mt-1 h-11 w-full rounded-xl border border-ink-200 px-3"
            value={kind}
            onChange={(event) => setKind(event.target.value === 'flat' ? 'flat' : 'percent')}
          >
            <option value="percent">Percentage</option>
            <option value="flat">Flat amount</option>
          </select>
        </label>
        {kind === 'percent' ? (
          <Input label="Percent off" inputMode="numeric" value={percent} onChange={(event) => setPercent(event.target.value)} />
        ) : (
          <Input label="Rupees off each unit" inputMode="decimal" value={rupees} onChange={(event) => setRupees(event.target.value)} />
        )}
        <Input label="Starts" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
        <Input label="Ends" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          Active
        </label>
        {errorMessage ? (
          <p className="text-sm text-danger-600" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex gap-3">
          <Button type="submit" loading={save.isPending}>
            Save offer
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/offers')}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  )
}
