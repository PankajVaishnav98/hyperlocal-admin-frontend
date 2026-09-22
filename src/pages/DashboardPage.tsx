import { Braces, Check, Layers3, Shield, Sparkles } from 'lucide-react'

import { EmptyState } from '../components/states/SystemStates'
import { Badge, Card, CardHeader } from '../components/ui/Primitives'

const foundationItems = [
  {
    icon: Shield,
    title: 'Protected navigation',
    description:
      'Routes wait for session hydration and return anonymous visitors to secure sign in.',
  },
  {
    icon: Braces,
    title: 'Resilient API boundary',
    description:
      'Cookie-ready requests, timeouts, normalized errors, and an unauthorized-session seam.',
  },
  {
    icon: Layers3,
    title: 'Consistent interface system',
    description:
      'Responsive layout, accessible controls, and reusable content states are in place.',
  },
]

export function DashboardPage() {
  return (
    <div className="space-y-7">
      <section aria-labelledby="page-title">
        <Badge tone="info">
          <Sparkles aria-hidden="true" className="size-3.5" />
          Phase 1 foundation
        </Badge>
        <h1
          id="page-title"
          className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-ink-950 sm:text-4xl"
        >
          Operations workspace
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 sm:text-base">
          The administration shell is ready for authenticated, server-backed
          workflows as they are delivered in later phases.
        </p>
      </section>

      <section aria-labelledby="foundation-title">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2
            id="foundation-title"
            className="font-display text-lg font-semibold text-ink-950"
          >
            Foundation status
          </h2>
          <Badge tone="success">
            <Check aria-hidden="true" className="size-3.5" />
            Frontend ready
          </Badge>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {foundationItems.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="p-5 sm:p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                <Icon aria-hidden="true" className="size-4.5" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-ink-950">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Operational modules">
        <Card>
          <CardHeader
            title="Operational modules"
            description="Business workflows will appear only after their backend contracts and authorization are implemented."
          />
          <div className="border-t border-ink-100 p-5 sm:p-6">
            <EmptyState
              title="No business modules enabled"
              description="This foundation intentionally contains no fabricated metrics, mock operational records, or controls for unavailable capabilities."
            />
          </div>
        </Card>
      </section>
    </div>
  )
}
