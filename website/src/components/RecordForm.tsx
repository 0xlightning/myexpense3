import { useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError, Input, Label, Textarea } from '@/components/ui/input'
import { useColorScheme } from '@/hooks/useColorScheme'
import { addRecord, errorMessage, updateRecord } from '@/lib/db'
import type { KindMeta } from '@/lib/kinds'
import { SLOT_COUNT, slotColor } from '@/lib/palette'
import type { CategoryItem, RecordItem } from '@/lib/types'
import { cn } from '@/lib/utils'
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
  const scheme = useColorScheme()
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
    <form onSubmit={submit} noValidate className="grid gap-5">
      {/* Line 1: Amount & Date */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`${id}-amount`} className="text-xs font-semibold">
            Amount ($)
          </Label>
          <Input
            ref={amountRef}
            id={`${id}-amount`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-xl"
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy('amount')}
          />
          <FieldError id={`${id}-amount-error`} message={errors.amount} />
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`${id}-date`} className="text-xs font-semibold">
            Date
          </Label>
          <Input
            id={`${id}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl"
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describedBy('date')}
          />
          <FieldError id={`${id}-date-error`} message={errors.date} />
        </div>
      </div>

      {/* Line 2: Sources / Categories Clickable Widgets */}
      {categories.length > 0 && (
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <Label className="text-xs font-semibold">Source / {kind.noun}</Label>
            <span className="text-[11px] text-muted-foreground">Select one or leave unselected for Other</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto pr-1" role="radiogroup" aria-label="Select source">
            {categories.map((c, index) => {
              const selected = categoryId === c.id
              const slot = index < SLOT_COUNT ? index : null
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(selected ? OTHER_VALUE : c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all text-left flex items-center gap-2 cursor-pointer',
                    selected
                      ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary font-semibold'
                      : 'border-border/80 bg-background text-foreground hover:bg-muted',
                  )}
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slotColor(slot, scheme) }}
                  />
                  <span>{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Line 3: Notes */}
      <div className="grid gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={`${id}-notes`} className="text-xs font-semibold">
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {notes.length > NOTES_MAX * 0.9 ? `${notes.length}/${NOTES_MAX}` : ''}
          </span>
        </div>
        <Textarea
          id={`${id}-notes`}
          rows={2}
          placeholder="Add optional notes or descriptions…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl text-xs"
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={describedBy('notes')}
        />
        <FieldError id={`${id}-notes-error`} message={errors.notes} />
      </div>

      {errors.form && (
        <p role="alert" className="text-sm text-destructive font-medium">
          {errors.form}
        </p>
      )}

      {/* Line 4: Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
        <Button type="button" variant="outline" className="rounded-xl" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-xl shadow-xs" disabled={pending}>
          {pending ? 'Saving…' : editing ? 'Save changes' : `Add ${kind.label.toLowerCase()}`}
        </Button>
      </div>
    </form>
  )
}

