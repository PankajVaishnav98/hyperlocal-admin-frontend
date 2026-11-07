import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { getOrderPhoto } from './api'
import type { AdminOrderPhoto } from './types'

function PhotoFrame({
  orderId,
  photo,
  index,
  onOpen,
}: {
  orderId: string
  photo: AdminOrderPhoto
  index: number
  onOpen: (url: string) => void
}) {
  const query = useQuery({
    queryKey: ['admin', 'orders', orderId, 'photo', photo.imageId],
    queryFn: () => getOrderPhoto(orderId, photo.imageId),
  })
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!query.data) {
      setUrl(null)
      return undefined
    }
    const next = URL.createObjectURL(query.data)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [query.data])

  if (query.isLoading) {
    return (
      <p className="grid h-24 w-24 place-items-center rounded-xl bg-ink-50 text-xs text-ink-500">
        Loading photo
      </p>
    )
  }

  if (query.error || !url) {
    return (
      <p className="grid h-24 w-24 place-items-center rounded-xl bg-ink-50 px-2 text-center text-xs text-ink-600">
        Could not load this photo.
      </p>
    )
  }

  return (
    <button
      type="button"
      className="overflow-hidden rounded-xl border border-ink-100"
      aria-label={`View photo ${index + 1}`}
      onClick={() => onOpen(url)}
    >
      <img alt={`Photo ${index + 1}`} className="h-24 w-24 object-cover" src={url} />
    </button>
  )
}

export function OrderPhotoGallery({
  orderId,
  photos,
}: {
  orderId: string
  photos: AdminOrderPhoto[]
}) {
  const [fullSize, setFullSize] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-600">
        {photos.length === 1 ? '1 photo' : `${photos.length} photos`}
      </p>
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, index) => (
          <PhotoFrame
            key={photo.imageId}
            index={index}
            onOpen={setFullSize}
            orderId={orderId}
            photo={photo}
          />
        ))}
      </div>
      {fullSize ? (
        <div className="fixed inset-0 z-50 grid place-items-center px-4" role="dialog" aria-label="Full size photo">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/70"
            aria-label="Close photo"
            onClick={() => setFullSize(null)}
          />
          <img alt="Full size photo" className="relative max-h-[80vh] max-w-full rounded-xl" src={fullSize} />
        </div>
      ) : null}
    </div>
  )
}
