// Single source of truth for entry kinds. Drives routes, record pages,
// category panels, dashboard cards and donuts. A new kind is one row here.
export const KINDS = [
  {
    kind: 'income',
    label: 'Income',
    path: '/income',
    recordsCollection: 'income_records',
    categoryCollection: 'income_sources',
    fkField: 'sourceId',
    noun: 'Source',
    nounPlural: 'sources',
    sign: 1,
  },
  {
    kind: 'expenditure',
    label: 'Expenditure',
    path: '/expenditure',
    recordsCollection: 'expenditure_records',
    categoryCollection: 'expense_categories',
    fkField: 'categoryId',
    noun: 'Category',
    nounPlural: 'categories',
    sign: -1,
  },
  {
    kind: 'investment',
    label: 'Investments',
    path: '/investments',
    recordsCollection: 'investments',
    categoryCollection: 'investment_categories',
    fkField: 'categoryId',
    noun: 'Category',
    nounPlural: 'categories',
    sign: -1,
  },
] as const

export type KindMeta = (typeof KINDS)[number]
export type Kind = KindMeta['kind']
export type RecordCollection = KindMeta['recordsCollection']
export type CategoryCollection = KindMeta['categoryCollection']
export type CollectionName = RecordCollection | CategoryCollection

export const COLLECTIONS: CollectionName[] = KINDS.flatMap((k) => [k.recordsCollection, k.categoryCollection])

export function kindMeta(kind: Kind): KindMeta {
  const meta = KINDS.find((k) => k.kind === kind)
  if (!meta) throw new Error(`Unknown kind: ${kind}`)
  return meta
}
