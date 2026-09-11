import { Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RecordForm } from '@/components/RecordForm'
import { EmptyState, ErrorState, LoadingLabel } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { deleteRecord } from '@/lib/db'
import { resolveCategoryName, sortByCreation } from '@/lib/derive'
import { formatCurrency, formatDate } from '@/lib/format'
import type { KindMeta } from '@/lib/kinds'
import type { RecordItem } from '@/lib/types'
import { useCategories, useRecords, useUid } from '@/store'

const newestFirst = (a: RecordItem, b: RecordItem) =>
  b.date.localeCompare(a.date) ||
  (b.createdAtMs ?? Number.MAX_SAFE_INTEGER) - (a.createdAtMs ?? Number.MAX_SAFE_INTEGER)

/** One page for every kind; everything kind-specific comes from the metadata row. */
export function RecordsPage({ kind }: { kind: KindMeta }) {
  const uid = useUid()
  const records = useRecords(kind)
  const categories = useCategories(kind)
  const [editing, setEditing] = useState<RecordItem | null>(null)
  const [deleting, setDeleting] = useState<RecordItem | null>(null)

  const sortedCategories = useMemo(() => sortByCreation(categories.items), [categories.items])
  const rows = useMemo(() => [...records.items].sort(newestFirst), [records.items])
  const label = kind.label.toLowerCase()
  const failed = [records, categories].find((s) => s.status === 'error')
  const ready = records.status === 'ready' && categories.status === 'ready'
  const describe = (r: RecordItem) =>
    `${formatCurrency(r.amount)} on ${r.date ? formatDate(r.date) : 'unknown date'} (${resolveCategoryName(r.categoryId, categories.items)})`

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{kind.label}</h1>

      <Card>
        <CardTitle>{editing ? `Edit ${label} record` : `Add ${label}`}</CardTitle>
        {categories.status === 'ready' ? (
          <RecordForm
            key={editing?.id ?? 'new'}
            kind={kind}
            categories={sortedCategories}
            editing={editing}
            onDone={() => setEditing(null)}
          />
        ) : categories.status === 'error' ? (
          <ErrorState what={kind.nounPlural} error={categories.error} />
        ) : (
          <Skeleton className="h-24" />
        )}
      </Card>

      <section aria-labelledby="records-heading" className="grid gap-3">
        <h2 id="records-heading" className="text-lg font-semibold">
          Records
        </h2>
        {failed ? (
          <ErrorState what={`${label} records`} error={failed.error} />
        ) : !ready ? (
          <div className="grid gap-2">
            <LoadingLabel what={`${label} records`} />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>No {label} records yet. Add your first one above.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Date</th>
                  <th scope="col" className="px-4 py-2 font-medium">{kind.noun}</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Amount</th>
                  <th scope="col" className="px-4 py-2 font-medium">Notes</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t" aria-current={editing?.id === r.id ? 'true' : undefined}>
                    <td className="px-4 py-2 whitespace-nowrap tabular-nums">{r.date ? formatDate(r.date) : '—'}</td>
                    <td className="px-4 py-2">{resolveCategoryName(r.categoryId, categories.items)}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap tabular-nums">{formatCurrency(r.amount)}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-muted-foreground" title={r.notes}>
                      {r.notes}
                    </td>
                    <td className="px-4 py-1 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${describe(r)}`}
                        onClick={() => {
                          setEditing(r)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                      >
                        <Pencil aria-hidden />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${describe(r)}`} onClick={() => setDeleting(r)}>
                        <Trash2 aria-hidden />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this record?"
        description={deleting ? `${describe(deleting)} will be removed. This can't be undone.` : ''}
        confirmLabel="Delete record"
        onConfirm={async () => {
          if (!uid || !deleting) return
          await deleteRecord(uid, kind, deleting.id)
          if (editing?.id === deleting.id) setEditing(null)
        }}
      />
    </div>
  )
}
