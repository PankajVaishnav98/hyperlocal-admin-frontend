import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark, Card } from '../components/ui/Primitives'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 py-12">
      <Card className="w-full max-w-lg p-7 text-center sm:p-10">
        <BrandMark className="mx-auto" />
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
          404 error
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          The page you requested does not exist or is not available.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Return to workspace
        </Link>
      </Card>
    </main>
  )
}
