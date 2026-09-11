// UI-boundary validation. UX only; Firestore rules are the security boundary.

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export const NOTES_MAX = 2000
export const NAME_MAX = 40

const UTC_MIDNIGHT = /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/

export function parseAmount(input: string): Result<number> {
  const trimmed = input.trim()
  if (trimmed === '') return { ok: false, error: 'Enter an amount.' }
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return { ok: false, error: 'Amount must be a number.' }
  if (value <= 0) return { ok: false, error: 'Amount must be greater than zero.' }
  return { ok: true, value }
}

/** True for real calendar dates at UTC midnight, e.g. 2026-01-15T00:00:00.000Z. */
export function isUtcMidnightIso(value: string): boolean {
  if (!UTC_MIDNIGHT.test(value)) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value
}

/** `<input type="date">` value (YYYY-MM-DD) to the stored UTC-midnight ISO string. */
export function parseDateInput(input: string): Result<string> {
  const iso = `${input}T00:00:00.000Z`
  return isUtcMidnightIso(iso) ? { ok: true, value: iso } : { ok: false, error: 'Enter a valid date.' }
}

export function isoToDateInput(iso: string): string {
  return iso.slice(0, 10)
}

/** Today's calendar date in the user's timezone, as YYYY-MM-DD. */
export function todayDateInput(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function validateNotes(notes: string): Result<string> {
  return notes.length <= NOTES_MAX
    ? { ok: true, value: notes }
    : { ok: false, error: `Notes must be ${NOTES_MAX} characters or fewer.` }
}

/**
 * Trimmed, 1–40 chars, unique case-insensitively within `existing`
 * (one collection only). Pass `selfId` when renaming so a doc doesn't clash with itself.
 */
export function validateName(
  input: string,
  existing: readonly { id: string; name: string }[],
  selfId?: string,
): Result<string> {
  const name = input.trim()
  if (name === '') return { ok: false, error: 'Enter a name.' }
  if (name.length > NAME_MAX) return { ok: false, error: `Names must be ${NAME_MAX} characters or fewer.` }
  const key = name.toLowerCase()
  if (existing.some((c) => c.id !== selfId && c.name.trim().toLowerCase() === key)) {
    return { ok: false, error: `"${name}" already exists.` }
  }
  return { ok: true, value: name }
}
