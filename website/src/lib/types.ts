// Normalized shapes held in Redux. Timestamps are epoch millis so state stays serializable.

export interface RecordItem {
  id: string
  amount: number
  date: string
  /** Normalized from `sourceId` or `categoryId`; null means Other. */
  categoryId: string | null
  notes: string
  createdAtMs: number | null
}

export interface CategoryItem {
  id: string
  name: string
  createdAtMs: number | null
}

export type LoadStatus = 'loading' | 'ready' | 'error'
