import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ErrorState({ what, error }: { what: string; error: string | null }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">
      <p className="font-medium text-destructive">Couldn't load {what}.</p>
      {error && <p className="mt-1 text-muted-foreground">{error}</p>}
    </div>
  )
}

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground', className)}>
      {children}
    </div>
  )
}

/** Screen-reader announcement paired with visual skeletons. */
export function LoadingLabel({ what }: { what: string }) {
  return (
    <span role="status" className="sr-only">
      Loading {what}…
    </span>
  )
}
