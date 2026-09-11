import { useEffect } from 'react'
import { subscribeCategories, subscribeRecords } from '@/lib/db'
import { watchAuth } from '@/lib/firebase'
import { KINDS } from '@/lib/kinds'
import { useAppDispatch, useUid } from '.'
import { authSlice, categorySlices, recordSlices } from './slices'

/** Auth listener, plus the six collection listeners while a user is signed in. */
export function useFirebaseSync() {
  const dispatch = useAppDispatch()
  const uid = useUid()

  useEffect(
    () =>
      watchAuth((user) =>
        dispatch(user ? authSlice.actions.signedIn(user) : authSlice.actions.signedOut()),
      ),
    [dispatch],
  )

  useEffect(() => {
    if (!uid) return
    const unsubscribes = KINDS.flatMap((kind) => {
      const records = recordSlices[kind.recordsCollection].actions
      const categories = categorySlices[kind.categoryCollection].actions
      return [
        subscribeRecords(
          uid,
          kind,
          (items) => dispatch(records.received(items)),
          (error) => dispatch(records.failed(error.message)),
        ),
        subscribeCategories(
          uid,
          kind,
          (items) => dispatch(categories.received(items)),
          (error) => dispatch(categories.failed(error.message)),
        ),
      ]
    })
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
      KINDS.forEach((kind) => {
        dispatch(recordSlices[kind.recordsCollection].actions.reset())
        dispatch(categorySlices[kind.categoryCollection].actions.reset())
      })
    }
  }, [uid, dispatch])
}
