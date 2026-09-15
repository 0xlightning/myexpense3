import { useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { Navigate, useLocation, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { authErrorMessage, signUp } from '@/lib/firebase'
import { useAppSelector } from '@/store'

export function RegisterPage() {
  const status = useAppSelector((s) => s.auth.status)
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (status === 'signedIn') return <Navigate to={from} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await signUp(email.trim(), password, name.trim())
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 bg-background text-foreground">
      <Card className="w-full max-w-sm p-6 sm:p-8 rounded-3xl border border-border/80 shadow-2xl grid gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-1">
            <Wallet className="size-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Create Account</h1>
          <p className="text-xs text-muted-foreground font-medium">Start tracking your income, expenses & investments</p>
        </div>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="rounded-xl shadow-xs font-semibold h-10 mt-1 cursor-pointer"
            disabled={pending || !email || !password || status === 'loading'}
          >
            {pending ? 'Creating account…' : 'Register'}
          </Button>
        </form>
        <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border/60">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </Card>
    </main>
  )
}

