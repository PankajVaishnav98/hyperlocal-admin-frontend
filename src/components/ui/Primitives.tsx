import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import { LoaderCircle } from 'lucide-react'

import { cn } from '../../utils/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        {
          'bg-ink-950 text-white hover:bg-ink-800': variant === 'primary',
          'border border-ink-200 bg-white text-ink-900 hover:bg-ink-50':
            variant === 'secondary',
          'text-ink-700 hover:bg-ink-100 hover:text-ink-950': variant === 'ghost',
          'bg-danger-600 text-white hover:bg-danger-700': variant === 'danger',
          'h-9 px-3 text-sm': size === 'sm',
          'h-11 px-4 text-sm': size === 'md',
          'h-12 px-5 text-base': size === 'lg',
        },
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(20,27,24,0.04),0_14px_40px_rgba(20,27,24,0.05)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 sm:p-6', className)}>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-950">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm leading-6 text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'info'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        {
          'bg-ink-100 text-ink-700': tone === 'neutral',
          'bg-success-50 text-success-700': tone === 'success',
          'bg-warning-50 text-warning-800': tone === 'warning',
          'bg-brand-50 text-brand-800': tone === 'info',
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  helperText?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, helperText, error, className, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const descriptionId = `${inputId}-description`

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-sm font-semibold text-ink-800">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-950',
            'placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100',
            'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500',
            error && 'border-danger-600 focus:border-danger-600 focus:ring-danger-50',
            className,
          )}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={helperText || error ? descriptionId : undefined}
          {...props}
        />
        {(error || helperText) && (
          <p
            id={descriptionId}
            className={cn('text-xs leading-5', error ? 'text-danger-600' : 'text-ink-500')}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  helperText?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, helperText, error, className, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const descriptionId = `${inputId}-description`

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-sm font-semibold text-ink-800">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'min-h-24 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm text-ink-950',
            'placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100',
            'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500',
            error && 'border-danger-600 focus:border-danger-600 focus:ring-danger-50',
            className,
          )}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={helperText || error ? descriptionId : undefined}
          {...props}
        />
        {(error || helperText) && (
          <p
            id={descriptionId}
            className={cn('text-xs leading-5', error ? 'text-danger-600' : 'text-ink-500')}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-ink-100', className)}
      {...props}
    />
  )
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      alt="Tokri"
      className={cn(
        'size-10 rounded-xl object-cover shadow-lg shadow-ink-950/15',
        className,
      )}
      height={40}
      src="/tokri-mark.svg"
      width={40}
    />
  )
}
