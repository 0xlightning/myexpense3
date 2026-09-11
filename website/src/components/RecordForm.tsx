import { useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError, Input, Label, NativeSelect, Textarea } from '@/components/ui/input'
import { addRecord, errorMessage, updateRecord } from '@/lib/db'
import { OTHER_LABEL } from '@/lib/derive'
import type { KindMeta } from '@/lib/kinds'
import type { CategoryItem, RecordItem } from '@/lib/types'
import {
  NOTES_MAX,
  isoToDateInput,
  parseAmount,
  parseDateInput,
  todayDateInput,
  validateNotes,
} from '@/lib/validation'
import { useUid } from '@/store'

const OTHER_VALUE = '' // select value that writes null

interface RecordFormProps {
  kind: KindMeta
  /** createdAt-ascending, so the select matches the category page order. */
  categories: CategoryItem[]
  /** Remount with a new `key` to switch between add and edit. */
  editing: RecordItem | null
  onDone: () => void
}

type Errors = Partial<Record<'amount' | 'date' | 'notes' | 'form', string>>

export function RecordForm({ kind, categories, editing, onDone }: RecordFormProps) {
  const uid = useUid()
  const id = useId()
  const amountRef = useRef<HTMLInputElement>(null)
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [date, setDate] = useState(editing ? isoToDateInput(editing.date) : todayDateInput())
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? OTHER_VALUE)
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)

  const known = categories.some((c) => c.id === categoryId)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!uid) return
    const parsedAmount = parseAmount(amount)
    const parsedDate = parseDateInput(date)
    const parsedNotes = validateNotes(notes)
    if (!parsedAmount.ok || !parsedDate.ok || !parsedNotes.ok) {
      setErrors({
        amount: parsedAmount.ok ? undefined : parsedAmount.error,
        date: parsedDate.ok ? undefined : parsedDate.error,
        notes: parsedNotes.ok ? undefined : parsedNotes.error,
      })
      return
    }

    const input = {
      amount: parsedAmount.value,
      date: parsedDate.value,
      categoryId: known ? categoryId : null,
      notes: parsedNotes.value,
    }
    setErrors({})
    setPending(true)
    try {
      if (editing) {
        await updateRecord(uid, kind, editing.id, input)
        onDone()
      } else {
        await addRecord(uid, kind, input)
        setAmount('')
        setNotes('')
        amountRef.current?.focus()
      }
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setPending(false)
    }
  }

  const describedBy = (field: keyof Errors) => (errors[field] ? `${id}-${field}-error` : undefined)

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`${id}-amount`}>Amount</Label>
          <Input
            ref={amountRef}
            id={`${id}-amount`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy('amount')}
          />
          <FieldError id={`${id}-amount-error`} message={errors.amount} />
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`${id}-date`}>Date</Label>
          <Input
            id={`${id}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describedBy('date')}
          />
          <FieldError id={`${id}-date-error`} message={errors.date} />
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`${id}-category`}>{kind.noun}</Label>
          <NativeSelect
            id={`${id}-category`}
            value={known ? categoryId : OTHER_VALUE}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={OTHER_VALUE}>{OTHER_LABEL}</option>
          </NativeSelect>
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground">No {kind.nounPlural} yet — add them on the Categories page.</p>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={`${id}-notes`}>
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {notes.length > NOTES_MAX * 0.9 ? `${notes.length}/${NOTES_MAX}` : ''}
          </span>
        </div>
        <Textarea
          id={`${id}-notes`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={describedBy('notes')}
        />
        <FieldError id={`${id}-notes-error`} message={errors.notes} />
      </div>

      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {errors.form}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : editing ? 'Save changes' : `Add ${kind.label.toLowerCase()}`}
        </Button>
        {editing && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
