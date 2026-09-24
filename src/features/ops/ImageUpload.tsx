import { useEffect, useState } from 'react'

import { ApiError } from '../../api/errors'
import { uploadImage } from './api'
import type { ImageFolder } from './types'

function isPreviewableUrl(value: string): boolean {
  return value.startsWith('https://') || value.includes('/api/v1/media/')
}

export function ImageUploadField({
  folder,
  value,
  error,
  onChange,
}: {
  folder: ImageFolder
  value: string
  error?: string
  onChange: (imageUrl: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  async function onFile(file: File | undefined) {
    if (!file) return
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(URL.createObjectURL(file))
    setUploading(true)
    setUploadError(null)
    try {
      onChange(await uploadImage(folder, file))
      setLocalPreview((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
    } catch (caught) {
      setLocalPreview((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      setUploadError(caught instanceof ApiError ? caught.message : 'Could not upload this image.')
    } finally {
      setUploading(false)
    }
  }

  const preview = localPreview || (isPreviewableUrl(value) ? value : '')

  return (
    <div className="space-y-2">
      <p className="block text-sm font-semibold text-ink-800">Image</p>
      {preview ? (
        <img
          src={preview}
          alt=""
          className="h-28 w-28 rounded-2xl border border-ink-200 object-cover bg-ink-100"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-ink-200 text-xs text-ink-400">
          No image
        </div>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void onFile(file)
        }}
        className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800"
      />
      <p className="text-xs text-ink-500">
        JPEG, PNG, or WebP up to 4 MB. The API stores the file. Set IMAGE_PROVIDER=cloudinary for
        Cloudinary in staging and production.
      </p>
      {uploading ? <p className="text-xs text-ink-500">Uploading…</p> : null}
      {(uploadError || error) && (
        <p className="text-xs text-danger-600">{uploadError || error}</p>
      )}
    </div>
  )
}
