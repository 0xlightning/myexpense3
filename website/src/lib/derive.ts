// Pure derivations. Nothing here is ever stored in Firestore or Redux.
import { KINDS, type Kind } from './kinds.ts'
import { SLOT_COUNT } from './palette.ts'
import type { CategoryItem, RecordItem } from './types.ts'

export const OTHER_LABEL = 'Other'
export const OTHER_KEY = '__other__'

export function sumAmounts(records: readonly RecordItem[]): number {
  return records.reduce((sum, r) => sum + r.amount, 0)
}

/** Σ income − Σ expenditure − Σ investments, via each kind's sign. */
export function netWorth(totals: Record<Kind, number>): number {
  return KINDS.reduce((sum, k) => sum + k.sign * totals[k.kind], 0)
}

/** createdAt ascending — the order that fixes colour slots. Pending writes sort last. */
export function sortByCreation(categories: readonly CategoryItem[]): CategoryItem[] {
  return [...categories].sort(
    (a, b) =>
      (a.createdAtMs ?? Infinity) - (b.createdAtMs ?? Infinity) || a.id.localeCompare(b.id),
  )
}

/** Null or unresolvable IDs resolve to Other. */
export function resolveCategoryName(categoryId: string | null, categories: readonly CategoryItem[]): string {
  return categories.find((c) => c.id === categoryId)?.name ?? OTHER_LABEL
}

export interface CategoryStat {
  count: number
  total: number
}

/** Stats keyed by the raw stored ID (null included); no Other folding. */
export function statsByCategoryId(records: readonly RecordItem[]): Map<string | null, CategoryStat> {
  const stats = new Map<string | null, CategoryStat>()
  for (const r of records) {
    const s = stats.get(r.categoryId) ?? { count: 0, total: 0 }
    s.count += 1
    s.total += r.amount
    stats.set(r.categoryId, s)
  }
  return stats
}

export interface Slice {
  key: string
  name: string
  value: number
  /** 0-based palette slot; null renders as Other grey. */
  slot: number | null
}

export interface Split {
  total: number
  /** Chart slices: slots 1–8 plus one Other (null, orphaned, and slot 9+). */
  slices: Slice[]
  /** Table rows: every category with records individually, plus Other for null/orphaned. */
  rows: Slice[]
  /** Categories with no records; not drawn. */
  emptyCategoryCount: number
}

const byValueOtherLast = (a: Slice, b: Slice) =>
  Number(a.key === OTHER_KEY) - Number(b.key === OTHER_KEY) || b.value - a.value

export function buildSplit(records: readonly RecordItem[], categories: readonly CategoryItem[]): Split {
  const stats = statsByCategoryId(records)
  const sorted = sortByCreation(categories)
  const known = new Set(sorted.map((c) => c.id))
  const slices: Slice[] = []
  const rows: Slice[] = []
  let foldedIntoOther = 0
  let emptyCategoryCount = 0

  sorted.forEach((c, index) => {
    const value = stats.get(c.id)?.total ?? 0
    if (value === 0) {
      emptyCategoryCount += 1
      return
    }
    const slot = index < SLOT_COUNT ? index : null
    rows.push({ key: c.id, name: c.name, value, slot })
    if (slot === null) foldedIntoOther += value
    else slices.push({ key: c.id, name: c.name, value, slot })
  })

  let residual = 0
  for (const [id, s] of stats) if (id === null || !known.has(id)) residual += s.total
  if (residual > 0) rows.push({ key: OTHER_KEY, name: OTHER_LABEL, value: residual, slot: null })
  if (residual + foldedIntoOther > 0) {
    slices.push({ key: OTHER_KEY, name: OTHER_LABEL, value: residual + foldedIntoOther, slot: null })
  }

  return {
    total: sumAmounts(records),
    slices: slices.sort(byValueOtherLast),
    rows: rows.sort(byValueOtherLast),
    emptyCategoryCount,
  }
}

/** Palette slot for a category (null past slot 8 or when unknown). */
export function categorySlot(categoryId: string, categories: readonly CategoryItem[]): number | null {
  const index = sortByCreation(categories).findIndex((c) => c.id === categoryId)
  return index >= 0 && index < SLOT_COUNT ? index : null
}
