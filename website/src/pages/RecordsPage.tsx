import { Plus, Pencil, Trash2, X, Search, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronDown, Check } from 'lucide-react'
import { useMemo, useState, useEffect, useRef } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RecordForm } from '@/components/RecordForm'
import { EmptyState, ErrorState, LoadingLabel } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { deleteRecord } from '@/lib/db'
import { resolveCategoryName, sortByCreation, sumAmounts } from '@/lib/derive'
import { formatCurrency, formatDate, plural } from '@/lib/format'
import type { KindMeta } from '@/lib/kinds'
import { SLOT_COUNT, slotColor } from '@/lib/palette'
import type { RecordItem } from '@/lib/types'
import { useCategories, useRecords, useUid } from '@/store'

type SortField = 'date' | 'amount' | 'category'
type SortDir = 'asc' | 'desc'

/** One page for every kind; everything kind-specific comes from the metadata row. */
export function RecordsPage({ kind }: { kind: KindMeta }) {
  const uid = useUid()
  const scheme = useColorScheme()
  const records = useRecords(kind)
  const categories = useCategories(kind)
  const [editing, setEditing] = useState<RecordItem | null>(null)
  const [deleting, setDeleting] = useState<RecordItem | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  // Multi-select source filter: empty set = "all"
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [sourceDropOpen, setSourceDropOpen] = useState(false)
  const sourceDropRef = useRef<HTMLDivElement>(null)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Close source dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (sourceDropRef.current && !sourceDropRef.current.contains(e.target as Node)) {
        setSourceDropOpen(false)
      }
    }
    if (sourceDropOpen) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [sourceDropOpen])

  const isModalOpen = isAddOpen || editing !== null
  useLockBodyScroll(isModalOpen || deleting !== null)

  const sortedCategories = useMemo(() => sortByCreation(categories.items), [categories.items])
  const categorySlotMap = useMemo(() => {
    const map = new Map<string, number | null>()
    sortedCategories.forEach((cat, idx) => {
      map.set(cat.id, idx < SLOT_COUNT ? idx : null)
    })
    return map
  }, [sortedCategories])

  // Sort handler: clicking the same field toggles direction; clicking new field defaults to desc
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const allRows = useMemo(() => {
    const base = [...records.items]
    base.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') {
        cmp = b.date.localeCompare(a.date) ||
          (b.createdAtMs ?? Number.MAX_SAFE_INTEGER) - (a.createdAtMs ?? Number.MAX_SAFE_INTEGER)
      } else if (sortField === 'amount') {
        cmp = b.amount - a.amount
      } else if (sortField === 'category') {
        const aCat = resolveCategoryName(a.categoryId, categories.items)
        const bCat = resolveCategoryName(b.categoryId, categories.items)
        cmp = aCat.localeCompare(bCat)
      }
      return sortDir === 'desc' ? cmp : -cmp
    })
    return base
  }, [records.items, sortField, sortDir, categories.items])

  const rows = useMemo(() => {
    let filtered = allRows

    // Multi-source filter: empty set means "all"
    if (selectedSources.size > 0) {
      filtered = filtered.filter((r) => r.categoryId && selectedSources.has(r.categoryId))
    }

    // Text search
    if (search.trim()) {
      const query = search.toLowerCase().trim()
      filtered = filtered.filter((r) => {
        const catName = resolveCategoryName(r.categoryId, categories.items).toLowerCase()
        const notes = (r.notes || '').toLowerCase()
        const amt = String(r.amount)
        const dateStr = formatDate(r.date).toLowerCase()
        return catName.includes(query) || notes.includes(query) || amt.includes(query) || dateStr.includes(query)
      })
    }

    return filtered
  }, [allRows, search, selectedSources, categories.items])

  const totalAmount = useMemo(() => sumAmounts(rows), [rows])

  const label = kind.label.toLowerCase()
  const failed = [records, categories].find((s) => s.status === 'error')
  const ready = records.status === 'ready' && categories.status === 'ready'
  const describe = (r: RecordItem) =>
    `${formatCurrency(r.amount)} on ${r.date ? formatDate(r.date) : 'unknown date'} (${resolveCategoryName(r.categoryId, categories.items)})`

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isModalOpen) {
        setIsAddOpen(false)
        setEditing(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  // Sort icon helper
  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="size-3.5 opacity-40 ml-1 inline-block" />
    return sortDir === 'desc'
      ? <ArrowDown className="size-3.5 ml-1 inline-block text-primary" />
      : <ArrowUp className="size-3.5 ml-1 inline-block text-primary" />
  }

  function SortTh({ field, label, className }: { field: SortField; label: string; className?: string }) {
    return (
      <th
        scope="col"
        className={`px-4 py-3 font-semibold select-none cursor-pointer hover:text-foreground transition-colors ${className ?? ''}`}
        onClick={() => handleSort(field)}
        aria-sort={sortField === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        {label}
        <SortIcon field={field} />
      </th>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Popup Modal Dialog for Add / Edit Record */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddOpen(false)
              setEditing(null)
            }
          }}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border/80 bg-background p-5 sm:p-6 shadow-2xl relative grid gap-5 animate-in zoom-in-95"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 id="modal-title" className="text-lg font-bold tracking-tight text-foreground">
                {editing ? `Edit ${label} record` : `Add ${label} entry`}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => {
                  setIsAddOpen(false)
                  setEditing(null)
                }}
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </Button>
            </div>

            {categories.status === 'ready' ? (
              <RecordForm
                key={editing?.id ?? (isAddOpen ? 'new' : 'none')}
                kind={kind}
                categories={sortedCategories}
                editing={editing}
                onDone={() => {
                  setEditing(null)
                  setIsAddOpen(false)
                }}
              />
            ) : categories.status === 'error' ? (
              <ErrorState what={kind.nounPlural} error={categories.error} />
            ) : (
              <Skeleton className="h-40" />
            )}
          </div>
        </div>
      )}

      <section aria-labelledby="records-heading" className="grid gap-4">
        {/* Toolbar Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 id="records-heading" className="text-xl font-bold tracking-tight">
              {kind.label}
            </h2>
            {ready && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {plural(rows.length, 'record', 'records')}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ready && allRows.length > 0 && (
              <>
                {/* Multi-Select Source / Category Filter */}
                <div className="relative" ref={sourceDropRef}>
                  <button
                    type="button"
                    id="source-filter-btn"
                    onClick={() => setSourceDropOpen((o) => !o)}
                    className="inline-flex items-center gap-1.5 h-9 pl-2.5 pr-3 rounded-xl border border-input bg-background text-xs font-medium text-foreground hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer select-none"
                    aria-haspopup="listbox"
                    aria-expanded={sourceDropOpen}
                  >
                    <Filter className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {selectedSources.size === 0
                        ? `All ${kind.nounPlural}`
                        : selectedSources.size === 1
                          ? sortedCategories.find((c) => selectedSources.has(c.id))?.name ?? '1 selected'
                          : `${selectedSources.size} ${kind.nounPlural}`}
                    </span>
                    {selectedSources.size > 0 && (
                      <span className="inline-flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                        {selectedSources.size}
                      </span>
                    )}
                    <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-150 ${sourceDropOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Panel */}
                  {sourceDropOpen && (
                    <div
                      role="listbox"
                      aria-multiselectable="true"
                      aria-labelledby="source-filter-btn"
                      className="absolute left-0 top-full mt-1.5 z-30 w-56 rounded-2xl border border-border/80 bg-card shadow-xl animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden"
                    >
                      {/* Header with Select All / Clear */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {kind.noun}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            selectedSources.size === sortedCategories.length
                              ? setSelectedSources(new Set())
                              : setSelectedSources(new Set(sortedCategories.map((c) => c.id)))
                          }
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          {selectedSources.size === sortedCategories.length ? 'Clear all' : 'Select all'}
                        </button>
                      </div>

                      {/* Category Options */}
                      <ul className="max-h-56 overflow-y-auto py-1">
                        {sortedCategories.map((cat, idx) => {
                          const slot = idx < SLOT_COUNT ? idx : null
                          const checked = selectedSources.has(cat.id)
                          return (
                            <li key={cat.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={checked}
                                onClick={() => {
                                  setSelectedSources((prev) => {
                                    const next = new Set(prev)
                                    if (next.has(cat.id)) next.delete(cat.id)
                                    else next.add(cat.id)
                                    return next
                                  })
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-muted/50 transition-colors cursor-pointer"
                              >
                                {/* Color dot */}
                                <span
                                  className="size-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: slotColor(slot, scheme) }}
                                />
                                <span className="flex-1 truncate font-medium text-foreground">{cat.name}</span>
                                {/* Checkmark */}
                                <span
                                  className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    checked
                                      ? 'bg-primary border-primary'
                                      : 'border-border bg-background'
                                  }`}
                                >
                                  {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>

                      {/* Footer: clear button if any selected */}
                      {selectedSources.size > 0 && (
                        <div className="border-t border-border/60 px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSources(new Set())}
                            className="w-full text-[11px] font-semibold text-destructive hover:text-destructive/80 transition-colors text-center"
                          >
                            Clear filter
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Search Filter Bar */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-8 h-9 text-xs rounded-xl"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </>
            )}
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-xs rounded-xl cursor-pointer shrink-0">
              <Plus className="size-4" />
              Add {kind.label}
            </Button>
          </div>
        </div>

        {failed ? (
          <ErrorState what={`${label} records`} error={failed.error} />
        ) : !ready ? (
          <div className="grid gap-2">
            <LoadingLabel what={`${label} records`} />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : allRows.length === 0 ? (
          <EmptyState>No {label} records yet. Click "Add {kind.label}" above to create your first entry.</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>No records match your filters. Try adjusting your search or source filter.</EmptyState>
        ) : (
          <div className="grid gap-4">
            {/* Desktop Table View (Hidden on mobile < sm) */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <colgroup>
                    <col style={{ width: '160px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '140px' }} />
                    <col />
                    <col style={{ width: '96px' }} />
                  </colgroup>
                  <thead className="bg-muted/50 text-left text-muted-foreground border-b border-border/60">
                    <tr>
                      <SortTh field="date" label="Date" />
                      <SortTh field="category" label={`${kind.noun}`} />
                      <SortTh field="amount" label="Amount" className="text-right" />
                      <th scope="col" className="px-4 py-3 font-semibold">Notes</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rows.map((r) => {
                      const slot = r.categoryId ? categorySlotMap.get(r.categoryId) ?? null : null
                      const catName = resolveCategoryName(r.categoryId, categories.items)
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-muted/40 transition-colors"
                          aria-current={editing?.id === r.id ? 'true' : undefined}
                        >
                          <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground font-medium">
                            {r.date ? formatDate(r.date) : '—'}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="size-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: slotColor(slot, scheme) }}
                              />
                              {catName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums font-bold text-foreground">
                            {formatCurrency(r.amount)}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-muted-foreground text-xs" title={r.notes}>
                            {r.notes || '—'}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                                aria-label={`Edit ${describe(r)}`}
                                onClick={() => setEditing(r)}
                              >
                                <Pencil aria-hidden className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                aria-label={`Delete ${describe(r)}`}
                                onClick={() => setDeleting(r)}
                              >
                                <Trash2 aria-hidden className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border/60 text-xs font-medium text-muted-foreground">
                <span>Showing {rows.length} of {allRows.length} entries</span>
                <span className="font-semibold text-foreground">Total: {formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Mobile Card List View (Visible on < sm) */}
            <div className="sm:hidden grid gap-3">
              {rows.map((r) => {
                const slot = r.categoryId ? categorySlotMap.get(r.categoryId) ?? null : null
                const catName = resolveCategoryName(r.categoryId, categories.items)
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs grid gap-2.5 relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: slotColor(slot, scheme) }}
                        />
                        <span className="font-semibold text-sm truncate">{catName}</span>
                      </div>
                      <span className="font-bold text-base tabular-nums text-foreground shrink-0">
                        {formatCurrency(r.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        <span>{r.date ? formatDate(r.date) : '—'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                          aria-label={`Edit ${describe(r)}`}
                          onClick={() => setEditing(r)}
                        >
                          <Pencil aria-hidden className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          aria-label={`Delete ${describe(r)}`}
                          onClick={() => setDeleting(r)}
                        >
                          <Trash2 aria-hidden className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {r.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded-lg">
                        {r.notes}
                      </p>
                    )}
                  </div>
                )
              })}

              {/* Mobile Summary Card */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-xs font-semibold">
                <span className="text-muted-foreground">{rows.length} entries</span>
                <span className="text-foreground text-sm font-bold">Total: {formatCurrency(totalAmount)}</span>
              </div>
            </div>
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
