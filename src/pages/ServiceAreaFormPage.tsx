import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { ErrorState, LoadingState } from '../components/states/SystemStates'
import { Button, Card, Input } from '../components/ui/Primitives'
import { ApiError } from '../api/errors'
import {
  createServiceArea,
  disableServiceArea,
  getServiceArea,
  rupeesToPaise,
  updateServiceArea,
} from '../features/ops/api'
import type { ServiceArea } from '../features/ops/types'
import { HubMapPicker } from '../features/ops/HubMapPicker'
import { ConfirmDialog, PageHeader } from '../features/ops/ui'
import { parseOptionalHub } from '../features/ops/serviceAreaHub'

const schema = z.object({
  name: z.string().trim().min(1, 'Required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit PIN code'),
  perKmRupees: z.string().min(1),
  hubLatitude: z.string(),
  hubLongitude: z.string(),
  isActive: z.boolean(),
})

function fieldsFrom(area?: ServiceArea) {
  return {
    name: area?.name ?? '',
    pincode: area?.pincode ?? '',
    perKmRupees: area ? (area.perKmFeePaise / 100).toFixed(2) : '20',
    hubLatitude: area?.centerLatitude !== undefined ? String(area.centerLatitude) : '',
    hubLongitude: area?.centerLongitude !== undefined ? String(area.centerLongitude) : '',
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
      const perKmFeePaise = rupeesToPaise(parsed.data.perKmRupees)
      if (!Number.isFinite(perKmFeePaise) || perKmFeePaise < 0) {
        setErrors({ perKmRupees: 'Enter a valid rupee amount' })
        throw new Error('validation')
      }
      setErrors({})
      const hub = parseOptionalHub(parsed.data.hubLatitude, parsed.data.hubLongitude)
      if (!hub.ok) {
        setErrors(hub.errors)
        throw new Error('validation')
      }
      const payload = {
        name: parsed.data.name,
        pincode: parsed.data.pincode,
        perKmFeePaise,
        isActive: parsed.data.isActive,
        ...(hub.hub
          ? hub.hub
          : !isNew
            ? { centerLatitude: null, centerLongitude: null }
            : {}),
      }
      return isNew ? createServiceArea(payload) : updateServiceArea(serviceAreaId, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-areas'] })
      navigate('/service-areas')
    },
  })

  const remove = useMutation({
    mutationFn: () => disableServiceArea(serviceAreaId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-areas'] })
      navigate('/service-areas')
    },
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
        description="PIN coverage decides who can order. The hub is the origin for the delivery fee: ceil(metres from this hub ÷ 100) slices × (₹/km ÷ 10). Leave the hub blank only if you want the 1 km (ten 100 m slices) PIN fallback. Coordinates are never invented."
      />
      <Card className="max-w-2xl p-6">
        <form className="grid gap-5" onSubmit={(event) => void onSubmit(event)}>
          <Input label="Name" value={values.name} error={errors.name} onChange={set('name')} />
          <Input
            label="PIN code"
            inputMode="numeric"
            maxLength={6}
            value={values.pincode}
            error={errors.pincode}
            helperText="Six-digit Indian PIN. Addresses outside this PIN cannot place COD orders here."
            onChange={set('pincode')}
          />
          <Input
            label="Charge per 100 m (from ₹/km)"
            value={values.perKmRupees}
            error={errors.perKmRupees}
            helperText="Enter rupees per kilometre. Checkout bills each 100 m slice at this rate ÷ 10 (₹20/km = ₹2 per 100 m). 1.0 km is 10 slices at this same rupee amount."
            onChange={set('perKmRupees')}
          />
          <HubMapPicker
            latitude={values.hubLatitude}
            longitude={values.hubLongitude}
            onPick={(hubLatitude, hubLongitude) =>
              setValues((current) => ({
                ...current,
                hubLatitude: String(hubLatitude),
                hubLongitude: String(hubLongitude),
              }))
            }
            onClear={() => setValues((current) => ({ ...current, hubLatitude: '', hubLongitude: '' }))}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Hub latitude"
              value={values.hubLatitude}
              error={errors.hubLatitude}
              helperText="Set from the map or type both values. Blank keeps PIN-only ten 100 m slices."
              onChange={set('hubLatitude')}
            />
            <Input
              label="Hub longitude"
              value={values.hubLongitude}
              error={errors.hubLongitude}
              onChange={set('hubLongitude')}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Active
          </label>
          {formError && (
            <p role="alert" className="text-sm text-danger-600">
              {formError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={save.isPending}>
              Save service area
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/service-areas')}>
              Cancel
            </Button>
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
          title={`Delete ${values.name || 'this service area'}?`}
          description="This PIN will stop quoting at checkout until you activate it again."
          loading={remove.isPending}
          error={
            remove.error instanceof ApiError
              ? remove.error.message
              : remove.error
                ? 'Could not delete this service area.'
                : null
          }
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => remove.mutate()}
        />
      ) : null}
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
