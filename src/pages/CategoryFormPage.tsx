import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { ErrorState, LoadingState } from '../components/states/SystemStates'
import { Button, Card, Input, Textarea } from '../components/ui/Primitives'
import { ApiError } from '../api/errors'
import { createCategory, disableCategory, getCategory, updateCategory } from '../features/ops/api'
import { ImageUploadField } from '../features/ops/ImageUpload'
import type { AdminCategory } from '../features/ops/types'
import { ConfirmDialog, PageHeader } from '../features/ops/ui'

const schema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case'),
  nameEn: z.string().trim().min(1, 'Required'),
  nameHi: z.string().trim().min(1, 'Required'),
  description: z.string().trim().max(240),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color like #D7E8DC'),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  isActive: z.boolean(),
  imageUrl: z
    .string()
    .refine((value) => value === '' || value.startsWith('https://') || value.includes('/api/v1/media/'), 'Upload an image first'),
})

function fieldsFrom(category?: AdminCategory) {
  return {
    slug: category?.slug ?? '',
    nameEn: category?.nameEn ?? '',
    nameHi: category?.nameHi ?? '',
    description: category?.description ?? '',
    accent: category?.accent ?? '#D7E8DC',
    sortOrder: String(category?.sortOrder ?? 10),
    isActive: category?.isActive ?? true,
    imageUrl: category?.imageUrl ?? '',
  }
}

function CategoryForm({
  categoryId,
  initial,
}: {
  categoryId?: string
  initial?: AdminCategory
}) {
  const isNew = !categoryId
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
      setErrors({})
      const payload = {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl || null,
      }
      return isNew ? createCategory(payload) : updateCategory(categoryId, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      navigate('/categories')
    },
  })
  const remove = useMutation({
    mutationFn: () => disableCategory(categoryId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      navigate('/categories')
    },
  })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    try {
      await save.mutateAsync()
    } catch (error) {
      if (error instanceof Error && error.message === 'validation') return
      setFormError(error instanceof ApiError ? error.message : 'Could not save the category.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? 'New category' : 'Edit category'}
        description="Names appear in the customer shop. Slugs must stay unique."
      />
      <Card className="max-w-2xl p-6">
        <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
          <Input label="English name" value={values.nameEn} error={errors.nameEn} onChange={(event) => setValues((current) => ({ ...current, nameEn: event.target.value }))} />
          <Input label="Hindi name" value={values.nameHi} error={errors.nameHi} onChange={(event) => setValues((current) => ({ ...current, nameHi: event.target.value }))} />
          <Input label="Slug" value={values.slug} error={errors.slug} helperText="Lowercase kebab-case, for example dairy" onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))} />
          <Textarea label="Description" value={values.description} error={errors.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} />
          <ImageUploadField
            folder="categories"
            value={values.imageUrl}
            error={errors.imageUrl}
            onChange={(imageUrl) => setValues((current) => ({ ...current, imageUrl }))}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Accent color" value={values.accent} error={errors.accent} onChange={(event) => setValues((current) => ({ ...current, accent: event.target.value }))} />
            <Input label="Sort order" type="number" value={values.sortOrder} error={errors.sortOrder} onChange={(event) => setValues((current) => ({ ...current, sortOrder: event.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Active in the customer shop
          </label>
          {formError && <p role="alert" className="text-sm text-danger-600">{formError}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={save.isPending}>Save category</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/categories')}>Cancel</Button>
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
          title={`Delete ${values.nameEn || 'this category'}?`}
          description="It will no longer appear in the shop. You can reactivate it from this form."
          loading={remove.isPending}
          error={
            remove.error instanceof ApiError
              ? remove.error.message
              : remove.error
                ? 'Could not delete this category.'
                : null
          }
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => remove.mutate()}
        />
      ) : null}
    </div>
  )
}

export function CategoryFormPage() {
  const { categoryId } = useParams()
  const existing = useQuery({
    queryKey: ['admin', 'categories', categoryId],
    queryFn: () => getCategory(categoryId!),
    enabled: Boolean(categoryId),
  })

  if (categoryId && existing.isLoading) return <LoadingState label="Loading category" />
  if (categoryId && existing.error) {
    return (
      <ErrorState
        title="Category not found"
        description={existing.error instanceof Error ? existing.error.message : 'Try again.'}
        onRetry={() => void existing.refetch()}
      />
    )
  }

  return <CategoryForm key={categoryId ?? 'new'} categoryId={categoryId} initial={existing.data} />
}
