// Firebase app + Auth. The only module that touches Auth.
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Object.values(config).every(Boolean)

// Default app; getAuth()/getFirestore() elsewhere resolve to it.
if (firebaseConfigured) initializeApp(config)

export interface AuthUser {
  uid: string
  email: string | null
}

export function watchAuth(onChange: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(getAuth(), (u) => onChange(u ? { uid: u.uid, email: u.email } : null))
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getAuth(), email, password)
}

export function signOutUser(): Promise<void> {
  return signOut(getAuth())
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    default:
      return 'Sign-in failed. Try again.'
  }
}
