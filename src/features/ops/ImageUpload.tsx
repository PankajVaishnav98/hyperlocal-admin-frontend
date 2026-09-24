import { useState } from 'react'

import { ApiError } from '../../api/errors'
import { uploadImage } from './api'
import type { ImageFolder } from './types'

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

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      onChange(await uploadImage(folder, file))
    } catch (caught) {
      setUploadError(caught instanceof ApiError ? caught.message : 'Could not upload this image.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="block text-sm font-semibold text-ink-800">Image</p>
      {value ? (
        <img
          src={value}
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
        onChange={(event) => void onFile(event.target.files?.[0])}
        className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800"
      />
      <p className="text-xs text-ink-500">
        JPEG, PNG, or WebP up to 4 MB. Uploads go to Cloudinary through the API.
      </p>
      {uploading ? <p className="text-xs text-ink-500">Uploading…</p> : null}
      {(uploadError || error) && (
        <p className="text-xs text-danger-600">{uploadError || error}</p>
      )}
    </div>
  )
}
