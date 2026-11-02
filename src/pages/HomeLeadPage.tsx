import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ErrorState, LoadingState } from '../components/states/SystemStates'
import { Button, Card, Input } from '../components/ui/Primitives'
import { ApiError } from '../api/errors'
import {
  deleteHomeLead,
  getHomeLead,
  listCategoryOptions,
  listProductOptions,
  saveHomeLead,
  type AdminHomeLead,
} from '../features/ops/api'
import { ImageUploadField } from '../features/ops/ImageUpload'
import { PageHeader } from '../features/ops/ui'

type LeadLinkType = AdminHomeLead['linkType']

function isSafeHttpsUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.toLowerCase().startsWith('https://')) return false
  if (/javascript:/i.test(trimmed) || /[\s<>]/.test(trimmed)) return false
  try {
    const url = new URL(trimmed)
    return url.protocol === 'https:' && !url.username && !url.password
  } catch {
    return false
  }
}

export function HomeLeadPage() {
  const query = useQuery({ queryKey: ['home-lead'], queryFn: getHomeLead })

  if (query.isLoading) return <LoadingState label="Loading home intro" />
  if (query.isError) {
    return (
      <ErrorState
        title="Home intro could not be loaded"
        description={query.error instanceof ApiError ? query.error.message : 'Try again.'}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const initial = query.data
  return (
    <HomeLeadForm
      initial={{
        mediaUrl:
          initial?.mediaUrl || (initial?.linkType === 'url' ? (initial.linkUrl ?? '') : ''),
        isActive: initial?.isActive ?? false,
        linkType: initial?.linkType ?? 'none',
        categoryId: initial?.categoryId ?? '',
        productId: initial?.productId ?? '',
        linkUrl: initial?.linkUrl ?? '',
      }}
    />
  )
}

function HomeLeadForm({
  initial,
}: {
  initial: {
    mediaUrl: string
    isActive: boolean
    linkType: LeadLinkType
    categoryId: string
    productId: string
    linkUrl: string
  }
}) {
  const queryClient = useQueryClient()
  const categories = useQuery({ queryKey: ['admin', 'categories', 'options'], queryFn: listCategoryOptions })
  const products = useQuery({ queryKey: ['admin', 'products', 'options'], queryFn: listProductOptions })
  const [mediaUrl, setMediaUrl] = useState(initial.mediaUrl)
  const [isActive, setIsActive] = useState(initial.isActive)
  const [linkType, setLinkType] = useState<LeadLinkType>(initial.linkType)
  const [categoryId, setCategoryId] = useState(initial.categoryId)
  const [productId, setProductId] = useState(initial.productId)
  const [linkUrl, setLinkUrl] = useState(initial.linkUrl)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const remove = useMutation({
    mutationFn: deleteHomeLead,
    onSuccess: async () => {
      setMediaUrl('')
      setIsActive(false)
      setLinkType('none')
      setCategoryId('')
      setProductId('')
      setLinkUrl('')
      setSaved(false)
      await queryClient.invalidateQueries({ queryKey: ['home-lead'] })
    },
  })

  const save = useMutation({
    mutationFn: saveHomeLead,
    onSuccess: async (lead) => {
      setMediaUrl(lead.mediaUrl)
      setIsActive(lead.isActive)
      setLinkType(lead.linkType ?? 'none')
      setCategoryId(lead.categoryId ?? '')
      setProductId(lead.productId ?? '')
      setLinkUrl(lead.linkUrl ?? '')
      setSaved(true)
      await queryClient.invalidateQueries({ queryKey: ['home-lead'] })
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSaved(false)
    const trimmed = mediaUrl.trim() || (linkType === 'url' && isSafeHttpsUrl(linkUrl) ? linkUrl.trim() : '')
    if (linkType === 'category' && !categoryId) {
      setFormError('Choose a category for this link.')
      return
    }
    if (linkType === 'product' && !productId) {
      setFormError('Choose a product for this link.')
      return
    }
    if (linkType === 'url' && !isSafeHttpsUrl(linkUrl)) {
      setFormError('Use a full https URL.')
      return
    }
    save.mutate(
      {
        mediaUrl: trimmed,
        isActive,
        linkType,
        ...(linkType === 'category' ? { categoryId } : {}),
        ...(linkType === 'product' ? { productId } : {}),
        ...(linkType === 'url' ? { linkUrl: linkUrl.trim() } : {}),
      },
      {
        onError: (error) => {
          setFormError(error instanceof ApiError ? error.message : 'The intro could not be saved.')
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Home intro"
        description="This animation sits above the home cards. Banner cards stay on the Home banners page."
      />
      <Card className="p-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <ImageUploadField
            folder="banners"
            label="Animation"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
            note="Optional file. JPEG, PNG, or WebP up to 4 MB. GIF up to 8 MB. MP4 up to 30 MB."
            value={mediaUrl}
            onChange={setMediaUrl}
          />
          <Input
            id="lead-media-url"
            label="Animation URL"
            value={mediaUrl}
            placeholder="https://example.com/intro.gif"
            onChange={(event) => setMediaUrl(event.target.value)}
          />
          <p className="text-sm text-ink-500">
            Paste an https GIF, WebP, or MP4 link here. A file upload is not required. Turn on “Show above the home cards”, then save.
          </p>
          <div className="space-y-2">
            <label htmlFor="lead-link-type" className="block text-sm font-semibold text-ink-800">
              Tap destination
            </label>
            <select
              id="lead-link-type"
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-950"
              value={linkType}
              onChange={(event) => setLinkType(event.target.value as LeadLinkType)}
            >
              <option value="none">No destination</option>
              <option value="category">Category</option>
              <option value="product">Product</option>
              <option value="url">Custom URL</option>
            </select>
          </div>
          {linkType === 'category' ? (
            <div className="space-y-2">
              <label htmlFor="lead-category" className="block text-sm font-semibold text-ink-800">
                Category
              </label>
              <select
                id="lead-category"
                className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-950"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">Choose a category</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameEn}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {linkType === 'product' ? (
            <div className="space-y-2">
              <label htmlFor="lead-product" className="block text-sm font-semibold text-ink-800">
                Product
              </label>
              <select
                id="lead-product"
                className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-950"
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
            </div>
          ) : null}
          {linkType === 'url' ? (
            <Input
              id="lead-link-url"
              label="URL"
              value={linkUrl}
              placeholder="https://example.com/offer"
              onChange={(event) => setLinkUrl(event.target.value)}
            />
          ) : null}
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Show above the home cards
          </label>
          {formError ? (
            <p role="alert" className="text-sm text-danger-600">
              {formError}
            </p>
          ) : null}
          {saved ? <p className="text-sm font-semibold text-ink-800">Saved.</p> : null}
          <div className="flex gap-3">
            <Button type="submit" loading={save.isPending}>
              Save intro
            </Button>
            {mediaUrl.trim() ? (
              <Button
                type="button"
                variant="danger"
                loading={remove.isPending}
                onClick={() => {
                  if (!window.confirm('Remove this intro from the customer home?')) return
                  setFormError(null)
                  remove.mutate(undefined, {
                    onError: (error) => {
                      setFormError(error instanceof ApiError ? error.message : 'The intro could not be removed.')
                    },
                  })
                }}
              >
                Delete intro
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  )
}
