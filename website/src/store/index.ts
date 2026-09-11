import { configureStore, type Reducer } from '@reduxjs/toolkit'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { KINDS, type CategoryCollection, type KindMeta, type RecordCollection } from '@/lib/kinds'
import type { CategoryItem, RecordItem } from '@/lib/types'
import { authSlice, categorySlices, recordSlices, type CollectionState } from './slices'

type Reducers = { auth: typeof authSlice.reducer } & {
  [K in RecordCollection]: Reducer<CollectionState<RecordItem>>
} & { [K in CategoryCollection]: Reducer<CollectionState<CategoryItem>> }

const mapReducers = (slices: Record<string, { reducer: Reducer }>) =>
  Object.fromEntries(Object.entries(slices).map(([key, slice]) => [key, slice.reducer]))

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ...mapReducers(recordSlices),
    ...mapReducers(categorySlices),
  } as Reducers,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()

export const useUid = () => useAppSelector((s) => s.auth.user?.uid ?? null)
export const useRecords = (kind: KindMeta) => useAppSelector((s) => s[kind.recordsCollection])
export const useCategories = (kind: KindMeta) => useAppSelector((s) => s[kind.categoryCollection])
export const useAllRecords = () => useAppSelector((s) => KINDS.map((k) => s[k.recordsCollection]), shallowEqual)
