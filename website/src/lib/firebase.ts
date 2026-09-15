// Firebase app + Auth. The only module that touches Auth.
import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'

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
  displayName: string | null
}

export function watchAuth(onChange: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(getAuth(), (u) =>
    onChange(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null),
  )
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getAuth(), email, password)
}

export async function signUp(email: string, password: string, name?: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(getAuth(), email, password)
  if (name && name.trim() && cred.user) {
    await updateProfile(cred.user, { displayName: name.trim() })
  }
}

export async function updateUserProfileName(name: string): Promise<AuthUser> {
  const user = getAuth().currentUser
  if (!user) throw new Error('Not authenticated')
  await updateProfile(user, { displayName: name.trim() })
  await user.reload()
  const updated = getAuth().currentUser!
  return {
    uid: updated.uid,
    email: updated.email,
    displayName: updated.displayName,
  }
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
    case 'auth/email-already-in-use':
      return 'This email is already registered.'
    case 'auth/weak-password':
      return 'Password is too weak.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    default:
      return 'Sign-in failed. Try again.'
  }
}
