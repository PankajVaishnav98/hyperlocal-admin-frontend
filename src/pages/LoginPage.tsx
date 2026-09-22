import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { LoadingState } from '../components/states/SystemStates'
import {
  Badge,
  BrandMark,
  Button,
  Card,
  Input,
} from '../components/ui/Primitives'
import { useAuth } from '../features/auth/authContext'

export function LoginPage() {
  const auth = useAuth()

  if (auth.status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas px-5">
        <div className="w-full max-w-md">
          <LoadingState label="Preparing secure sign-in" rows={2} />
        </div>
      </main>
    )
  }

  if (auth.status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-canvas lg:grid-cols-[1.05fr_0.95fr]">
      <div className="pointer-events-none absolute -left-32 top-1/3 size-96 rounded-full bg-brand-100/60 blur-3xl" />
      <section className="relative hidden min-h-screen flex-col justify-between border-r border-ink-100 bg-ink-950 p-10 text-white lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <BrandMark className="bg-white text-ink-950 shadow-none" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Hyperlocal
          </span>
        </div>
        <div className="max-w-xl">
          <Badge className="bg-white/10 text-white" tone="neutral">
            Operations workspace
          </Badge>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-[-0.035em] xl:text-5xl">
            A clear foundation for dependable local operations.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-ink-300">
            Built for focused workflows, accessible controls, and secure
            server-authoritative administration.
          </p>
        </div>
        <p className="text-sm text-ink-400">Hyperlocal administration</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="font-display text-lg font-semibold text-ink-950">
              Hyperlocal
            </span>
          </div>
          <Card className="p-6 sm:p-8">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ink-950">
              Admin sign in
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Secure admin authentication will be enabled when the backend
              identity flow is delivered.
            </p>

            <div className="mt-7 space-y-5" aria-label="Sign-in preview">
              <Input
                label="Email address"
                type="email"
                autoComplete="username"
                placeholder="Backend authentication required"
                disabled
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Not available in Phase 1"
                disabled
              />
              <Button className="w-full" size="lg" disabled>
                <LockKeyhole aria-hidden="true" className="size-4" />
                Sign-in unavailable
              </Button>
            </div>

            <div className="mt-6 rounded-xl border border-warning-200 bg-warning-50 p-4">
              <p className="text-sm font-semibold text-warning-900">
                Backend identity required
              </p>
              <p className="mt-1 text-xs leading-5 text-warning-800">
                No demo credentials or client-only authentication are provided.
                Admin login, refresh, and logout arrive with the server-enforced
                identity implementation.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </main>
  )
}
