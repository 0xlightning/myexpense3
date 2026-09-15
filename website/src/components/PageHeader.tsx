import type { ReactNode } from 'react'

interface PageHeaderProps {
  title?: string
  description?: string
  action?: ReactNode
}

/** Unified page header component — renders only the action slot; title and description are intentionally omitted. */
export function PageHeader({ action }: PageHeaderProps) {
  if (!action) return null

  return (
    <div className="flex justify-end border-b pb-4">
      {action}
    </div>
  )
}
