import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { ErrorState, LoadingState } from '../components/states/SystemStates'
import { Button, Card, Input } from '../components/ui/Primitives'
import { ApiError } from '../api/errors'
import {
  createHomeBanner,
  getHomeBanner,
  listCategories,
  listProducts,
  updateHomeBanner,
} from '../features/ops/api'
import { ImageUploadField } from '../features/ops/ImageUpload'
import type { AdminHomeBanner, HomeBannerLinkType } from '../features/ops/types'
import { PageHeader } from '../features/ops/ui'

const schema = z
  .object({
    imageUrl: z
      .string()
      .trim()
      .url('Use a full https URL')
      .refine((value) => value.startsWith('https://') || value.includes('/api/v1/media/'), 'Upload an image first'),
    title: z.string().trim().max(80),
    subtitle: z.string().trim().max(160),
    linkType: z.enum(['none', 'category', 'product']),
    categoryId: z.string(),
    productId: z.string(),
    sortOrder: z.coerce.number().int().min(0).max(10_000),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.linkType === 'category' && !value.categoryId) {
      context.addIssue({ code: 'custom', path: ['categoryId'], message: 'Choose a category' })
    }
    if (value.linkType === 'product' && !value.productId) {
      context.addIssue({ code: 'custom', path: ['productId'], message: 'Choose a product' })
    }
  })

function fieldsFrom(banner?: AdminHomeBanner) {
  return {
    imageUrl: banner?.imageUrl ?? '',
    title: banner?.title ?? '',
    subtitle: banner?.subtitle ?? '',
    linkType: (banner?.linkType ?? 'none') as HomeBannerLinkType,
    categoryId: banner?.categoryId ?? '',
    productId: banner?.productId ?? '',
    sortOrder: String(banner?.sortOrder ?? 10),
    isActive: banner?.isActive ?? true,
  }
}

function HomeBannerForm({
  bannerId,
  initial,
}: {
  bannerId?: string
  initial?: AdminHomeBanner
}) {
  const isNew = !bannerId
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [values, setValues] = useState(() => fieldsFrom(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => listCategories() })
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => listProducts() })
  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(values)
      if (!parsed.success) {
        const next: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
          next[String(issue.path[0])] = issue.message
        }
        setErrors(next)
        throw new Error('validation')
      }
      setErrors({})
      const payload = {
        imageUrl: parsed.data.imageUrl,
        title: parsed.data.title,
        subtitle: parsed.data.subtitle,
        linkType: parsed.data.linkType,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
        ...(parsed.data.linkType === 'category' ? { categoryId: parsed.data.categoryId } : {}),
        ...(parsed.data.linkType === 'product' ? { productId: parsed.data.productId } : {}),
      }
      return isNew ? createHomeBanner(payload) : updateHomeBanner(bannerId, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'home-banners'] })
      navigate('/home-banners')
    },
  })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    try {
      await save.mutateAsync()
    } catch (error) {
      if (error instanceof Error && error.message === 'validation') return
      setFormError(error instanceof ApiError ? error.message : 'Could not save the banner.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? 'New home banner' : 'Edit home banner'}
        description="Shown on the customer Home slider. Leave title and subtitle blank to show only the image."
      />
      <Card className="max-w-2xl p-6">
        <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
          <ImageUploadField
            folder="banners"
            value={values.imageUrl}
            error={errors.imageUrl}
            onChange={(imageUrl) => setValues((current) => ({ ...current, imageUrl }))}
          />
          <Input
            label="Title (optional)"
            value={values.title}
            error={errors.title}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          />
          <Input
            label="Subtitle (optional)"
            value={values.subtitle}
            error={errors.subtitle}
            onChange={(event) => setValues((current) => ({ ...current, subtitle: event.target.value }))}
          />
          <div className="space-y-2">
            <label htmlFor="banner-link-type" className="block text-sm font-semibold text-ink-800">
              Link
            </label>
            <select
              id="banner-link-type"
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-950 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100"
              value={values.linkType}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  linkType: event.target.value as HomeBannerLinkType,
                }))
              }
            >
              <option value="none">No destination</option>
              <option value="category">Category</option>
              <option value="product">Product</option>
            </select>
          </div>
          {values.linkType === 'category' ? (
            <div className="space-y-2">
              <label htmlFor="banner-category" className="block text-sm font-semibold text-ink-800">
                Category
              </label>
              <select
                id="banner-category"
                className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-950 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100"
                value={values.categoryId}
                onChange={(event) =>
                  setValues((current) => ({ ...current, categoryId: event.target.value }))
                }
              >
                <option value="">Choose a category</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameEn}
                  </option>
                ))}
              </select>
              {errors.categoryId ? <p className="text-xs text-danger-600">{errors.categoryId}</p> : null}
            </div>
          ) : null}
          {values.linkType === 'product' ? (
            <div className="space-y-2">
              <label htmlFor="banner-product" className="block text-sm font-semibold text-ink-800">
                Product
              </label>
              <select
                id="banner-product"
                className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-950 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100"
                value={values.productId}
                onChange={(event) =>
                  setValues((current) => ({ ...current, productId: event.target.value }))
                }
              >
                <option value="">Choose a product</option>
                {(products.data ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nameEn}
                  </option>
                ))}
              </select>
              {errors.productId ? <p className="text-xs text-danger-600">{errors.productId}</p> : null}
            </div>
          ) : null}
          <Input
            label="Sort order"
            type="number"
            value={values.sortOrder}
            error={errors.sortOrder}
            onChange={(event) => setValues((current) => ({ ...current, sortOrder: event.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Active on customer Home
          </label>
          {formError && (
            <p role="alert" className="text-sm text-danger-600">
              {formError}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" loading={save.isPending}>
              Save banner
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/home-banners')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function HomeBannerFormPage() {
  const { bannerId } = useParams()
  const existing = useQuery({
    queryKey: ['admin', 'home-banners', bannerId],
    queryFn: () => getHomeBanner(bannerId!),
    enabled: Boolean(bannerId),
  })

  if (bannerId && existing.isLoading) return <LoadingState label="Loading banner" />
  if (bannerId && existing.error) {
    return (
      <ErrorState
        title="Banner not found"
        description={existing.error instanceof Error ? existing.error.message : 'Try again.'}
        onRetry={() => void existing.refetch()}
      />
    )
  }

  return <HomeBannerForm key={bannerId ?? 'new'} bannerId={bannerId} initial={existing.data} />
}
