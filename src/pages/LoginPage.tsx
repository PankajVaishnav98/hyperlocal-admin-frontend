import { useState, type FormEvent } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'

import { LoadingState } from '../components/states/SystemStates'
import {
  Badge,
  BrandMark,
  Button,
  Card,
  Input,
} from '../components/ui/Primitives'
import { ApiError } from '../api/errors'
import { LegalFooter } from '../components/LegalFooter'
import { SHOP_NAME } from '../brand'
import { useAuth } from '../features/auth/authContext'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export function LoginPage() {
  const auth = useAuth()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
    return <Navigate to={from} replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const next: { email?: string; password?: string } = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'email' || key === 'password') next[key] = issue.message
      }
      setFieldErrors(next)
      return
    }
    setFieldErrors({})
    setSubmitting(true)
    try {
      await auth.login(parsed.data.email, parsed.data.password)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Sign-in failed. Check your connection and try again.'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-canvas lg:grid-cols-[1.05fr_0.95fr]">
      <div className="pointer-events-none absolute -left-32 top-1/3 size-96 rounded-full bg-brand-100/60 blur-3xl" />
      <section className="relative hidden min-h-screen flex-col justify-between border-r border-ink-100 bg-ink-950 p-10 text-white lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <BrandMark className="bg-white text-ink-950 shadow-none" />
          <span className="font-display text-lg font-semibold tracking-tight">
            {SHOP_NAME}
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
            Catalog, inventory, pricing, coverage, and COD orders are managed here
            with server-enforced administrator access.
          </p>
        </div>
        <p className="text-sm text-ink-400">{SHOP_NAME} administration</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="font-display text-lg font-semibold text-ink-950">
              {SHOP_NAME}
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
              Use your provisioned operator email and password. Sessions are stored
              in HttpOnly cookies.
            </p>

            <form className="mt-7 space-y-5" onSubmit={(event) => void onSubmit(event)}>
              <Input
                label="Email address"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={fieldErrors.email}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={fieldErrors.password}
              />
              {formError && (
                <p className="rounded-xl border border-danger-50 bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">
                  {formError}
                </p>
              )}
              <Button className="w-full" size="lg" type="submit" loading={submitting}>
                <LockKeyhole aria-hidden="true" className="size-4" />
                Sign in
              </Button>
            </form>
          </Card>
          <LegalFooter className="mt-6 justify-center" />
        </div>
      </section>
    </main>
  )
}
