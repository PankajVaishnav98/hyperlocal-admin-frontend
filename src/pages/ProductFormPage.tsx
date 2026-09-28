import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { ErrorState, LoadingState } from '../components/states/SystemStates'
import { Button, Card, Input, Textarea } from '../components/ui/Primitives'
import { ApiError } from '../api/errors'
import {
  createProduct,
  disableProduct,
  getProduct,
  listCategoryOptions,
  rupeesToPaise,
  updateProduct,
} from '../features/ops/api'
import { isStoredImageUrl } from '../features/ops/catalogMediaUrl'
import { ImageUploadField } from '../features/ops/ImageUpload'
import type { AdminProduct } from '../features/ops/types'
import { ConfirmDialog, PageHeader } from '../features/ops/ui'

const schema = z.object({
  categoryId: z.string().min(1, 'Choose a category'),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 'Uppercase SKU').min(3),
  nameEn: z.string().trim().min(1, 'Required'),
  nameHi: z.string().trim().min(1, 'Required'),
  description: z.string().trim().max(1000),
  unit: z.string().trim().min(1, 'Required'),
  priceRupees: z.string().min(1),
  mrpRupees: z.string().min(1),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  inStock: z.boolean(),
  isActive: z.boolean(),
  costRupees: z.string(),
  imageUrl: z
    .string()
    .refine((value) => value === '' || isStoredImageUrl(value), 'Upload an image first'),
})

function fieldsFrom(product?: AdminProduct) {
  return {
    categoryId: product?.categoryId ?? '',
    sku: product?.sku ?? '',
    nameEn: product?.nameEn ?? '',
    nameHi: product?.nameHi ?? '',
    description: product?.description ?? '',
    unit: product?.unit ?? '1 pc',
    priceRupees: product ? (product.pricePaise / 100).toFixed(2) : '',
    mrpRupees: product ? (product.mrpPaise / 100).toFixed(2) : '',
    stockQuantity: String(product?.stockQuantity ?? 0),
    lowStockThreshold: String(product?.lowStockThreshold ?? 5),
    inStock: product?.inStock ?? true,
    isActive: product?.isActive ?? true,
    costRupees: product?.costPaise != null ? (product.costPaise / 100).toFixed(2) : '',
    imageUrl: product?.imageUrl ?? '',
  }
}

function ProductForm({
  productId,
  initial,
}: {
  productId?: string
  initial?: AdminProduct
}) {
  const isNew = !productId
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const categories = useQuery({ queryKey: ['admin', 'categories', 'options'], queryFn: listCategoryOptions })
  const [values, setValues] = useState(() => fieldsFrom(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
      const pricePaise = rupeesToPaise(parsed.data.priceRupees)
      const mrpPaise = rupeesToPaise(parsed.data.mrpRupees)
      if (!Number.isFinite(pricePaise) || pricePaise < 1) {
        setErrors({ priceRupees: 'Enter a valid rupee amount' })
        throw new Error('validation')
      }
      if (!Number.isFinite(mrpPaise) || mrpPaise < 1) {
        setErrors({ mrpRupees: 'Enter a valid rupee amount' })
        throw new Error('validation')
      }
      let costPaise: number | null = null
      if (parsed.data.costRupees.trim()) {
        costPaise = rupeesToPaise(parsed.data.costRupees)
        if (!Number.isFinite(costPaise) || costPaise < 0) {
          setErrors({ costRupees: 'Enter a valid cost, or leave blank' })
          throw new Error('validation')
        }
      }
      setErrors({})
      const payload = {
        categoryId: parsed.data.categoryId,
        sku: parsed.data.sku,
        nameEn: parsed.data.nameEn,
        nameHi: parsed.data.nameHi,
        description: parsed.data.description,
        unit: parsed.data.unit,
        pricePaise,
        mrpPaise,
        stockQuantity: parsed.data.stockQuantity,
        lowStockThreshold: parsed.data.lowStockThreshold,
        inStock: parsed.data.inStock,
        isActive: parsed.data.isActive,
        costPaise,
      }
      if (isNew) {
        return createProduct({ ...payload, imageUrl: parsed.data.imageUrl || null })
      }
      return updateProduct(productId, {
        ...payload,
        ...(parsed.data.imageUrl ? { imageUrl: parsed.data.imageUrl } : {}),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      navigate('/products')
    },
  })

  const remove = useMutation({
    mutationFn: () => disableProduct(productId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      navigate('/products')
    },
  })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    try {
      await save.mutateAsync()
    } catch (error) {
      if (error instanceof Error && error.message === 'validation') return
      setFormError(error instanceof ApiError ? error.message : 'Could not save the product.')
    }
  }

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? 'New product' : 'Edit product'}
        description="Selling price and MRP are what the customer pays. Cost to platform / COGS is for analysis profit only and is never shown as a shop price."
      />
      <Card className="max-w-2xl p-6">
        <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
          <div className="space-y-2">
            <label htmlFor="categoryId" className="block text-sm font-semibold text-ink-800">
              Category
            </label>
            <select
              id="categoryId"
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm"
              value={values.categoryId}
              onChange={set('categoryId')}
            >
              <option value="">Select a category</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameEn}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-danger-600">{errors.categoryId}</p>}
          </div>
          <Input label="English name" value={values.nameEn} error={errors.nameEn} onChange={set('nameEn')} />
          <Input label="Hindi name" value={values.nameHi} error={errors.nameHi} onChange={set('nameHi')} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="SKU" value={values.sku} error={errors.sku} onChange={set('sku')} />
            <Input label="Unit" value={values.unit} error={errors.unit} helperText="For example 1 L or 500 g" onChange={set('unit')} />
          </div>
          <Textarea label="Details" value={values.description} error={errors.description} onChange={set('description')} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Selling price (₹)" value={values.priceRupees} error={errors.priceRupees} onChange={set('priceRupees')} />
            <Input label="MRP (₹)" value={values.mrpRupees} error={errors.mrpRupees} onChange={set('mrpRupees')} />
          </div>
          <Input
            label="Cost to platform / COGS (₹, optional)"
            value={values.costRupees}
            error={errors.costRupees}
            helperText="Cost to platform / COGS — used for profit, not customer price. Analysis profit is merchandise revenue minus this snapshot × quantity. Leave blank if unknown; profit is marked incomplete."
            onChange={set('costRupees')}
          />
          <ImageUploadField
            folder="products"
            value={values.imageUrl}
            error={errors.imageUrl}
            onChange={(imageUrl) => setValues((current) => ({ ...current, imageUrl }))}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Stock quantity" type="number" value={values.stockQuantity} error={errors.stockQuantity} onChange={set('stockQuantity')} />
            <Input label="Low-stock threshold" type="number" value={values.lowStockThreshold} error={errors.lowStockThreshold} onChange={set('lowStockThreshold')} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
            <input type="checkbox" checked={values.inStock} onChange={(event) => setValues((current) => ({ ...current, inStock: event.target.checked }))} />
            Available to sell
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
            <input type="checkbox" checked={values.isActive} onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))} />
            Active in the customer shop
          </label>
          {formError && <p role="alert" className="text-sm text-danger-600">{formError}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={save.isPending}>Save product</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/products')}>Cancel</Button>
            {!isNew && initial?.isActive ? (
              <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
      {confirmDelete ? (
        <ConfirmDialog
          title={`Delete ${values.nameEn || 'this product'}?`}
          description="Customers will no longer see it. You can reactivate it from this form."
          loading={remove.isPending}
          error={
            remove.error instanceof ApiError
              ? remove.error.message
              : remove.error
                ? 'Could not delete this product.'
                : null
          }
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => remove.mutate()}
        />
      ) : null}
    </div>
  )
}

export function ProductFormPage() {
  const { productId } = useParams()
  const existing = useQuery({
    queryKey: ['admin', 'products', productId],
    queryFn: () => getProduct(productId!),
    enabled: Boolean(productId),
  })

  if (productId && existing.isLoading) return <LoadingState label="Loading product" />
  if (productId && existing.error) {
    return <ErrorState title="Product not found" onRetry={() => void existing.refetch()} />
  }

  return <ProductForm key={productId ?? 'new'} productId={productId} initial={existing.data} />
}
