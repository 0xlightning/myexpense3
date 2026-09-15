import { useEffect, useState, type FormEvent } from 'react'
import { Check, IdCard, Mail, Pencil, Shield, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { updateUserProfileName } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store'
import { authSlice } from '@/store/slices'

export function ProfilePage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep display name state in sync when user object updates
  useEffect(() => {
    if (!isEditing) {
      setDisplayName(user?.displayName ?? '')
    }
  }, [user?.displayName, isEditing])

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const originalName = user?.displayName ?? ''
  const isChanged = displayName.trim() !== originalName.trim()
  const isValid = displayName.trim().length > 0
  const canSave = isEditing && isChanged && isValid && !saving

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updatedUser = await updateUserProfileName(displayName)
      dispatch(authSlice.actions.signedIn(updatedUser))
      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setIsEditing(false)
    setDisplayName(originalName)
    setError(null)
  }

  return (
    <div className="mx-auto max-w-2xl grid gap-6">
      <Card className="p-6 rounded-2xl border-border/70 shadow-xs grid gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xl ring-2 ring-primary/30 shadow-xs">
              {initials || <User className="size-8" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight truncate text-foreground">{user?.displayName || 'User'}</h2>
              <p className="text-xs text-muted-foreground truncate font-medium">{user?.email}</p>
            </div>
          </div>

          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2 rounded-xl self-start sm:self-auto shadow-xs font-semibold cursor-pointer"
            >
              <Pencil className="size-3.5" />
              Edit Profile
            </Button>
          )}
        </div>

        <form onSubmit={handleSave} className="grid gap-4 pt-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-sm font-bold tracking-tight">Personal Information</CardTitle>
            {isEditing && (
              <span className="text-xs text-muted-foreground font-medium italic">Editing mode</span>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="displayName" className="text-xs font-semibold">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your full name"
              value={displayName}
              disabled={!isEditing || saving}
              onChange={(e) => setDisplayName(e.target.value)}
              className={cn('rounded-xl', !isEditing && 'bg-muted/40')}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
            <div className="relative">
              <Input id="email" type="email" value={user?.email ?? ''} disabled className="bg-muted/40 pl-9 rounded-xl text-xs font-medium" />
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">Email address cannot be changed directly.</p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="uid" className="text-xs font-semibold">User ID</Label>
            <div className="relative">
              <Input id="uid" type="text" value={user?.uid ?? ''} disabled className="bg-muted/40 pl-9 rounded-xl font-mono text-xs" />
              <IdCard className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            </div>
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          {saved && (
            <div className="flex items-center gap-2 text-xs text-success font-semibold">
              <Check className="size-4" />
              Profile updated successfully!
            </div>
          )}

          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancel} disabled={saving} className="rounded-xl">
                <X className="size-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!canSave}
                className={cn(
                  'rounded-xl transition-all font-semibold px-4',
                  canSave
                    ? 'bg-success hover:bg-success/90 text-primary-foreground shadow-xs cursor-pointer'
                    : 'bg-muted text-muted-foreground border opacity-70 cursor-not-allowed',
                )}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          )}
        </form>
      </Card>

      <Card className="p-5 rounded-2xl border-border/70 shadow-xs grid gap-2">
        <CardTitle className="text-foreground text-sm font-bold flex items-center gap-2">
          <Shield className="size-4 text-primary" /> Account Security
        </CardTitle>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your account is secured via Firebase Authentication with encrypted credentials.
        </p>
      </Card>
    </div>
  )
}

