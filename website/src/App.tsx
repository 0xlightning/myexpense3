import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/AppLayout'
import { firebaseConfigured } from '@/lib/firebase'
import { KINDS } from '@/lib/kinds'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { RecordsPage } from '@/pages/RecordsPage'
import { store } from '@/store'
import { useFirebaseSync } from '@/store/useFirebaseSync'

function AppRoutes() {
  useFirebaseSync()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        {KINDS.map((k) => (
          <Route key={k.kind} path={k.path} element={<RecordsPage key={k.kind} kind={k} />} />
        ))}
        <Route path="/category" element={<CategoriesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function SetupNotice() {
  return (
    <main className="mx-auto grid min-h-screen max-w-lg content-center gap-3 px-4">
      <h1 className="text-xl font-semibold">Firebase isn't configured</h1>
      <p className="text-sm">
        Copy <code>website/.env.example</code> to <code>website/.env.local</code>, fill in the{' '}
        <code>VITE_FIREBASE_*</code> values from your Firebase web app, then restart <code>npm run dev</code>.
      </p>
    </main>
  )
}

export default function App() {
  if (!firebaseConfigured) return <SetupNotice />
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  )
}
