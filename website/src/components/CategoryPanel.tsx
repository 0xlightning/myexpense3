import { Pencil, Trash2, Plus } from 'lucide-react'
import { useId, useMemo, useState, type FormEvent } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingLabel } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldError, Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { addCategory, deleteCategory, errorMessage, renameCategory } from '@/lib/db'
import { sortByCreation, statsByCategoryId, type CategoryStat } from '@/lib/derive'
import { formatCurrency, plural } from '@/lib/format'
import type { KindMeta } from '@/lib/kinds'
import { SLOT_COUNT, slotColor } from '@/lib/palette'
import type { CategoryItem } from '@/lib/types'
import { validateName } from '@/lib/validation'
import { useCategories, useRecords, useUid } from '@/store'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface RowProps {
  kind: KindMeta
  category: CategoryItem
  slot: number | null
  stat: CategoryStat
  siblings: CategoryItem[]
  onDelete: () => void
}

function CategoryRow({ kind, category, slot, stat, siblings, onDelete }: RowProps) {
  const uid = useUid()
  const scheme = useColorScheme()
  const id = useId()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(category.name)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function cancel() {
    setEditing(false)
    setDraft(category.name)
    setError(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!uid) return
    const result = validateName(draft, siblings, category.id)
    if (!result.ok) return setError(result.error)
    if (result.value === category.name) return cancel()
    setPending(true)
    try {
      await renameCategory(uid, kind, category.id, result.value)
      setEditing(false)
      setError(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  if (editing) {
    return (
      <li className="py-2.5">
        <form onSubmit={save} className="grid gap-2" onKeyDown={(e) => e.key === 'Escape' && cancel()}>
          <Input
            autoFocus
            aria-label={`Rename ${category.name}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="rounded-xl h-9 text-xs"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          <FieldError id={`${id}-error`} message={error} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="rounded-lg h-7 text-xs px-3" disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" size="sm" variant="outline" className="rounded-lg h-7 text-xs px-3" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        aria-hidden
        className="size-3 shrink-0 rounded-full shadow-xs"
        style={{ backgroundColor: slotColor(slot, scheme) }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-sm text-foreground">{category.name}</p>
        <p className="text-xs text-muted-foreground">
          {plural(stat.count, 'record', 'records')} · {formatCurrency(stat.total)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
        aria-label={`Rename ${category.name}`}
        onClick={() => setEditing(true)}
      >
        <Pencil aria-hidden className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg text-destructive/80 hover:text-destructive hover:bg-destructive/10"
        aria-label={`Delete ${category.name}`}
        onClick={onDelete}
      >
        <Trash2 aria-hidden className="size-3.5" />
      </Button>
    </li>
  )
}

const EMPTY_STAT: CategoryStat = { count: 0, total: 0 }

export function CategoryPanel({ kind }: { kind: KindMeta }) {
  const uid = useUid()
  const id = useId()
  const records = useRecords(kind)
  const categories = useCategories(kind)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<CategoryItem | null>(null)

  useLockBodyScroll(deleting !== null)

  const sorted = useMemo(() => sortByCreation(categories.items), [categories.items])
  const stats = useMemo(() => statsByCategoryId(records.items), [records.items])
  const failed = [categories, records].find((s) => s.status === 'error')
  const ready = categories.status === 'ready' && records.status === 'ready'
  const noun = kind.noun.toLowerCase()
  const deletingCount = deleting ? (stats.get(deleting.id)?.count ?? 0) : 0

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!uid) return
    const result = validateName(name, categories.items)
    if (!result.ok) return setError(result.error)
    setError(null)
    setAdding(true)
    try {
      await addCategory(uid, kind, result.value)
      setName('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  return (
    <Card aria-labelledby={`${id}-title`} className="p-5 rounded-2xl border-border/70 shadow-xs">
      <div className="flex items-baseline justify-between gap-2 pb-1 border-b border-border/50">
        <h2 id={`${id}-title`} className="font-bold text-base tracking-tight">
          {kind.label} <span className="font-normal text-muted-foreground text-sm">· {capitalize(kind.nounPlural)}</span>
        </h2>
        {ready && (
          <span
            className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
            aria-label={plural(sorted.length, noun, kind.nounPlural)}
          >
            {sorted.length}
          </span>
        )}
      </div>

      <form onSubmit={add} noValidate className="grid gap-1.5 pt-2">
        <div className="flex gap-2">
          <Input
            aria-label={`New ${noun} name`}
            placeholder={`Add new ${noun}…`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl h-9 text-xs"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-add-error` : undefined}
            disabled={!ready}
          />
          <Button type="submit" className="rounded-xl h-9 px-3.5 text-xs font-semibold shadow-xs" disabled={!ready || adding}>
            <Plus className="size-3.5 mr-1" />
            {adding ? 'Adding…' : 'Add'}
          </Button>
        </div>
        <FieldError id={`${id}-add-error`} message={error} />
      </form>

      {failed ? (
        <ErrorState what={kind.nounPlural} error={failed.error} />
      ) : !ready ? (
        <div className="grid gap-2 pt-2">
          <LoadingLabel what={kind.nounPlural} />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState>
          No {kind.nounPlural} yet. Add one to see the split on your dashboard.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border/50 pt-1">
          {sorted.map((c, index) => (
            <CategoryRow
              key={c.id}
              kind={kind}
              category={c}
              slot={index < SLOT_COUNT ? index : null}
              stat={stats.get(c.id) ?? EMPTY_STAT}
              siblings={categories.items}
              onDelete={() => setDeleting(c)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete "${deleting.name}"?` : ''}
        description={
          deletingCount > 0
            ? `${plural(deletingCount, 'record moves', 'records move')} to Other. Amounts and dates are unchanged.`
            : `No records use this ${noun}.`
        }
        confirmLabel={`Delete ${noun}`}
        onConfirm={async () => {
          if (uid && deleting) await deleteCategory(uid, kind, deleting.id)
        }}
      />
    </Card>
  )
}

