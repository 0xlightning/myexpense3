import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  isUtcMidnightIso,
  parseAmount,
  parseDateInput,
  todayDateInput,
  validateName,
  validateNotes,
} from './validation.ts'

describe('amount', () => {
  test('accepts positive finite numbers', () => {
    assert.deepEqual(parseAmount(' 12.50 '), { ok: true, value: 12.5 })
  })
  test('rejects zero, negatives, non-finite and blanks', () => {
    for (const bad of ['0', '-1', '', '   ', 'abc', 'Infinity', 'NaN', '1e400']) {
      assert.equal(parseAmount(bad).ok, false, bad)
    }
  })
})

describe('UTC dates', () => {
  test('date input becomes UTC midnight ISO', () => {
    assert.deepEqual(parseDateInput('2026-01-15'), { ok: true, value: '2026-01-15T00:00:00.000Z' })
  })
  test('rejects impossible dates and non-midnight times', () => {
    assert.equal(parseDateInput('2026-02-30').ok, false)
    assert.equal(parseDateInput('').ok, false)
    assert.equal(isUtcMidnightIso('2026-01-15T05:30:00.000Z'), false)
    assert.equal(isUtcMidnightIso('2026-01-15'), false)
  })
  test('today uses the local calendar day', () => {
    assert.equal(todayDateInput(new Date(2026, 0, 5, 23, 59)), '2026-01-05')
  })
})

describe('notes', () => {
  test('max 2000 chars', () => {
    assert.equal(validateNotes('x'.repeat(2000)).ok, true)
    assert.equal(validateNotes('x'.repeat(2001)).ok, false)
  })
})

describe('names', () => {
  const existing = [{ id: '1', name: 'Groceries' }]

  test('trims and enforces 1–40 chars', () => {
    assert.deepEqual(validateName('  Rent  ', existing), { ok: true, value: 'Rent' })
    assert.equal(validateName('   ', existing).ok, false)
    assert.equal(validateName('x'.repeat(41), existing).ok, false)
    assert.equal(validateName('x'.repeat(40), existing).ok, true)
  })
  test('unique case-insensitively within the collection', () => {
    assert.equal(validateName('groceries', existing).ok, false)
    assert.equal(validateName(' GROCERIES ', existing).ok, false)
  })
  test('renaming a doc to its own name (any case) is allowed', () => {
    assert.equal(validateName('GROCERIES', existing, '1').ok, true)
  })
})
