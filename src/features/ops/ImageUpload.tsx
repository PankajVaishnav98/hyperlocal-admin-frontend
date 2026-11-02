import { useEffect, useState } from 'react'

import { ApiError } from '../../api/errors'
import { catalogMediaUrl } from './catalogMediaUrl'
import { uploadImage } from './api'
import type { ImageFolder } from './types'

export function ImageUploadField({
  folder,
  value,
  error,
  onChange,
  accept = 'image/jpeg,image/png,image/webp',
  note = 'JPEG, PNG, or WebP up to 4 MB. The API stores the file on Cloudinary in staging and production. Local development can use the memory image store.',
  label = 'Image',
}: {
  folder: ImageFolder
  value: string
  error?: string
  onChange: (imageUrl: string) => void
  accept?: string
  note?: string
  label?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [videoPreview, setVideoPreview] = useState(false)

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  useEffect(() => {
    setFailed(false)
  }, [value, localPreview])

  async function onFile(file: File | undefined) {
    if (!file) return
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(URL.createObjectURL(file))
    setVideoPreview(file.type === 'video/mp4')
    setUploading(true)
    setUploadError(null)
    try {
      const imageUrl = await uploadImage(folder, file)
      if (imageUrl.startsWith('blob:')) {
        throw new Error('Upload did not return a stored image URL')
      }
      onChange(imageUrl)
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

  const preview = localPreview || catalogMediaUrl(value) || ''
  const showVideo =
    videoPreview || /\.mp4(?:$|\?)/i.test(value) || value.includes('/video/upload/')

  return (
    <div className="space-y-2">
      <p className="block text-sm font-semibold text-ink-800">{label}</p>
      {preview && !failed ? (
        showVideo ? (
          <video
            src={preview}
            muted
            loop
            autoPlay
            playsInline
            className="h-28 w-full rounded-2xl border border-ink-200 bg-ink-100 object-cover"
          />
        ) : (
          <img
            src={preview}
            alt=""
            className="h-28 w-28 rounded-2xl border border-ink-200 object-cover bg-ink-100"
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-ink-200 text-xs text-ink-400">
          No image
        </div>
      )}
      <input
        type="file"
        accept={accept}
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void onFile(file)
        }}
        className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800"
      />
      <p className="text-xs text-ink-500">{note}</p>
      {uploading ? <p className="text-xs text-ink-500">Uploading…</p> : null}
      {(uploadError || error) && (
        <p className="text-xs text-danger-600">{uploadError || error}</p>
      )}
    </div>
  )
}
