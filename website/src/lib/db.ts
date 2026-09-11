// All Firestore access. Every path is built here and scoped to users/{uid}/.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore'
import type { CollectionName, KindMeta } from './kinds.ts'
import type { CategoryItem, RecordItem } from './types.ts'

const userCollection = (uid: string, name: CollectionName) => collection(getFirestore(), 'users', uid, name)
const userDoc = (uid: string, name: CollectionName, id: string) => doc(getFirestore(), 'users', uid, name, id)

const millis = (value: unknown): number | null =>
  value && typeof (value as { toMillis?: unknown }).toMillis === 'function'
    ? (value as { toMillis: () => number }).toMillis()
    : null

// Rules don't validate shape, so read defensively.
function toRecord(id: string, d: DocumentData, fkField: KindMeta['fkField']): RecordItem {
  const fk = d[fkField]
  return {
    id,
    amount: typeof d.amount === 'number' && Number.isFinite(d.amount) ? d.amount : 0,
    date: typeof d.date === 'string' ? d.date : '',
    categoryId: typeof fk === 'string' ? fk : null,
    notes: typeof d.notes === 'string' ? d.notes : '',
    createdAtMs: millis(d.createdAt),
  }
}

function toCategory(id: string, d: DocumentData): CategoryItem {
  return { id, name: typeof d.name === 'string' ? d.name : '', createdAtMs: millis(d.createdAt) }
}

type OnError = (error: FirestoreError) => void

export function subscribeRecords(uid: string, kind: KindMeta, onData: (items: RecordItem[]) => void, onError: OnError) {
  return onSnapshot(
    userCollection(uid, kind.recordsCollection),
    (snap) => onData(snap.docs.map((d) => toRecord(d.id, d.data({ serverTimestamps: 'estimate' }), kind.fkField))),
    onError,
  )
}

export function subscribeCategories(uid: string, kind: KindMeta, onData: (items: CategoryItem[]) => void, onError: OnError) {
  return onSnapshot(
    userCollection(uid, kind.categoryCollection),
    (snap) => onData(snap.docs.map((d) => toCategory(d.id, d.data({ serverTimestamps: 'estimate' })))),
    onError,
  )
}

export interface RecordInput {
  amount: number
  date: string
  categoryId: string | null
  notes: string
}

const recordFields = (kind: KindMeta, r: RecordInput) => ({
  amount: r.amount,
  date: r.date,
  [kind.fkField]: r.categoryId,
  notes: r.notes,
})

export function addRecord(uid: string, kind: KindMeta, input: RecordInput) {
  return addDoc(userCollection(uid, kind.recordsCollection), {
    ...recordFields(kind, input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateRecord(uid: string, kind: KindMeta, id: string, input: RecordInput) {
  return updateDoc(userDoc(uid, kind.recordsCollection, id), {
    ...recordFields(kind, input),
    updatedAt: serverTimestamp(),
  })
}

export function deleteRecord(uid: string, kind: KindMeta, id: string) {
  return deleteDoc(userDoc(uid, kind.recordsCollection, id))
}

export function addCategory(uid: string, kind: KindMeta, name: string) {
  return addDoc(userCollection(uid, kind.categoryCollection), { name, createdAt: serverTimestamp() })
}

/** Records reference the doc id, so a rename relabels everything with no migration. */
export function renameCategory(uid: string, kind: KindMeta, id: string, name: string) {
  return updateDoc(userDoc(uid, kind.categoryCollection, id), { name })
}

/** Deletes only the category doc. Records are never touched; their FK resolves to Other. */
export function deleteCategory(uid: string, kind: KindMeta, id: string) {
  return deleteDoc(userDoc(uid, kind.categoryCollection, id))
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
