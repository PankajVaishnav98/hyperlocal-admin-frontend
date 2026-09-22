import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { ErrorState, LoadingState } from '../components/states/SystemStates'
import { Button, Card, Input } from '../components/ui/Primitives'
import { ApiError } from '../api/errors'
import {
  createServiceArea,
  getServiceArea,
  rupeesToPaise,
  updateServiceArea,
} from '../features/ops/api'
import type { ServiceArea } from '../features/ops/types'
import { PageHeader } from '../features/ops/ui'

const schema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case'),
  name: z.string().trim().min(1, 'Required'),
  centerLatitude: z.coerce.number().min(-90).max(90),
  centerLongitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100),
  baseDistanceKm: z.coerce.number().min(0.1).max(100),
  additionalDistanceKm: z.coerce.number().min(0.1).max(50),
  maxDistanceKm: z.coerce.number().min(0.1).max(100),
  baseFeeRupees: z.string().min(1),
  additionalFeeRupees: z.string().min(1),
  isActive: z.boolean(),
})

function fieldsFrom(area?: ServiceArea) {
  return {
    slug: area?.slug ?? '',
    name: area?.name ?? '',
    centerLatitude: String(area?.centerLatitude ?? '26.9124'),
    centerLongitude: String(area?.centerLongitude ?? '75.7873'),
    radiusKm: String(area?.radiusKm ?? '6'),
    baseDistanceKm: String(area?.baseDistanceKm ?? '2'),
    additionalDistanceKm: String(area?.additionalDistanceKm ?? '1'),
    maxDistanceKm: String(area?.maxDistanceKm ?? '8'),
    baseFeeRupees: area ? (area.baseFeePaise / 100).toFixed(2) : '20',
    additionalFeeRupees: area ? (area.additionalFeePaise / 100).toFixed(2) : '10',
    isActive: area?.isActive ?? true,
  }
}

function ServiceAreaForm({
  serviceAreaId,
  initial,
}: {
  serviceAreaId?: string
  initial?: ServiceArea
}) {
  const isNew = !serviceAreaId
  const navigate = useNavigate()
  const [values, setValues] = useState(() => fieldsFrom(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

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
      const baseFeePaise = rupeesToPaise(parsed.data.baseFeeRupees)
      const additionalFeePaise = rupeesToPaise(parsed.data.additionalFeeRupees)
      if (!Number.isFinite(baseFeePaise) || baseFeePaise < 0) {
        setErrors({ baseFeeRupees: 'Enter a valid rupee amount' })
        throw new Error('validation')
      }
      if (!Number.isFinite(additionalFeePaise) || additionalFeePaise < 0) {
        setErrors({ additionalFeeRupees: 'Enter a valid rupee amount' })
        throw new Error('validation')
      }
      setErrors({})
      const payload = {
        slug: parsed.data.slug,
        name: parsed.data.name,
        centerLatitude: parsed.data.centerLatitude,
        centerLongitude: parsed.data.centerLongitude,
        radiusKm: parsed.data.radiusKm,
        baseDistanceKm: parsed.data.baseDistanceKm,
        additionalDistanceKm: parsed.data.additionalDistanceKm,
        maxDistanceKm: parsed.data.maxDistanceKm,
        baseFeePaise,
        additionalFeePaise,
        isActive: parsed.data.isActive,
      }
      return isNew ? createServiceArea(payload) : updateServiceArea(serviceAreaId, payload)
    },
    onSuccess: () => navigate('/service-areas'),
  })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    try {
      await save.mutateAsync()
    } catch (error) {
      if (error instanceof Error && error.message === 'validation') return
      setFormError(error instanceof ApiError ? error.message : 'Could not save the service area.')
    }
  }

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? 'New service area' : 'Edit service area'}
        description="Radius is a coverage circle. Delivery fee uses the base distance, then the additional per-kilometer step, up to the maximum."
      />
      <Card className="max-w-2xl p-6">
        <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
          <Input label="Name" value={values.name} error={errors.name} onChange={set('name')} />
          <Input label="Slug" value={values.slug} error={errors.slug} onChange={set('slug')} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Center latitude" value={values.centerLatitude} error={errors.centerLatitude} onChange={set('centerLatitude')} />
            <Input label="Center longitude" value={values.centerLongitude} error={errors.centerLongitude} onChange={set('centerLongitude')} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Radius (km)" value={values.radiusKm} error={errors.radiusKm} onChange={set('radiusKm')} />
            <Input label="Maximum delivery (km)" value={values.maxDistanceKm} error={errors.maxDistanceKm} onChange={set('maxDistanceKm')} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Base distance (km)" value={values.baseDistanceKm} error={errors.baseDistanceKm} onChange={set('baseDistanceKm')} />
            <Input label="Base fee (₹)" value={values.baseFeeRupees} error={errors.baseFeeRupees} onChange={set('baseFeeRupees')} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Additional step (km)" value={values.additionalDistanceKm} error={errors.additionalDistanceKm} onChange={set('additionalDistanceKm')} />
            <Input label="Additional fee (₹)" value={values.additionalFeeRupees} error={errors.additionalFeeRupees} onChange={set('additionalFeeRupees')} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
            <input type="checkbox" checked={values.isActive} onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))} />
            Active
          </label>
          {formError && <p role="alert" className="text-sm text-danger-600">{formError}</p>}
          <div className="flex gap-3">
            <Button type="submit" loading={save.isPending}>Save service area</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/service-areas')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function ServiceAreaFormPage() {
  const { serviceAreaId } = useParams()
  const existing = useQuery({
    queryKey: ['admin', 'service-areas', serviceAreaId],
    queryFn: () => getServiceArea(serviceAreaId!),
    enabled: Boolean(serviceAreaId),
  })

  if (serviceAreaId && existing.isLoading) return <LoadingState label="Loading service area" />
  if (serviceAreaId && existing.error) {
    return <ErrorState title="Service area not found" onRetry={() => void existing.refetch()} />
  }

  return (
    <ServiceAreaForm
      key={serviceAreaId ?? 'new'}
      serviceAreaId={serviceAreaId}
      initial={existing.data}
    />
  )
}
