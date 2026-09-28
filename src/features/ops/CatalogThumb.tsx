import { useState } from 'react'

import { catalogMediaUrl } from './catalogMediaUrl'

export function CatalogThumb({
  imageUrl,
  alt = '',
  className = 'h-10 w-10 rounded-lg object-cover bg-ink-100',
}: {
  imageUrl: string | null | undefined
  alt?: string
  className?: string
}) {
  const src = catalogMediaUrl(imageUrl)
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <span className="inline-block h-10 w-10 rounded-lg bg-ink-100" />
  }

  return (
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  )
}
