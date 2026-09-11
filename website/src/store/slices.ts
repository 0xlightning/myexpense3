import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/lib/firebase'
import { KINDS, type CategoryCollection, type CollectionName, type RecordCollection } from '@/lib/kinds'
import type { CategoryItem, LoadStatus, RecordItem } from '@/lib/types'

interface AuthState {
  status: 'loading' | 'signedIn' | 'signedOut'
  user: AuthUser | null
}

export const authSlice = createSlice({
  name: 'auth',
  initialState: { status: 'loading', user: null } as AuthState,
  reducers: {
    signedIn: (_state, action: PayloadAction<AuthUser>): AuthState => ({ status: 'signedIn', user: action.payload }),
    signedOut: (): AuthState => ({ status: 'signedOut', user: null }),
  },
})

export interface CollectionState<T> {
  status: LoadStatus
  items: T[]
  error: string | null
}

// One slice per Firestore collection; each mirrors its onSnapshot listener.
function collectionSlice<T>(name: CollectionName) {
  const initialState: CollectionState<T> = { status: 'loading', items: [], error: null }
  return createSlice({
    name,
    initialState,
    reducers: {
      received: (_state, action: PayloadAction<T[]>): CollectionState<T> => ({
        status: 'ready',
        items: action.payload,
        error: null,
      }),
      failed: (state, action: PayloadAction<string>) => {
        state.status = 'error'
        state.error = action.payload
      },
      reset: () => initialState,
    },
  })
}

type RecordSlice = ReturnType<typeof collectionSlice<RecordItem>>
type CategorySlice = ReturnType<typeof collectionSlice<CategoryItem>>

export const recordSlices = Object.fromEntries(
  KINDS.map((k) => [k.recordsCollection, collectionSlice<RecordItem>(k.recordsCollection)]),
) as Record<RecordCollection, RecordSlice>

export const categorySlices = Object.fromEntries(
  KINDS.map((k) => [k.categoryCollection, collectionSlice<CategoryItem>(k.categoryCollection)]),
) as Record<CategoryCollection, CategorySlice>
