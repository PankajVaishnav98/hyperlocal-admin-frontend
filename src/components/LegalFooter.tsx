import { Link } from 'react-router-dom'

import { LEGAL_LINKS } from '../legal/policies'
import { cn } from '../utils/cn'

export function LegalFooter({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Legal"
      className={cn('flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-500', className)}
    >
      {LEGAL_LINKS.map((item) => (
        <Link
          key={item.slug}
          className="underline-offset-2 hover:text-ink-800 hover:underline"
          to={item.path}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
