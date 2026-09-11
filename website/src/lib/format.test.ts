import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatCurrency, formatDate, formatSignedCurrency } from './format.ts'

test('no decimals at or above 1000, grouped thousands', () => {
  assert.equal(formatCurrency(1234.56), '₹1,235')
  assert.equal(formatCurrency(999.5), '₹999.50')
  assert.equal(formatCurrency(0), '₹0')
})

test('net worth always carries a sign when non-zero', () => {
  assert.equal(formatSignedCurrency(1500), '+₹1,500')
  assert.equal(formatSignedCurrency(-1500), '−₹1,500')
  assert.equal(formatSignedCurrency(0.1 + 0.2 - 0.3), '₹0')
})

test('dates keep their UTC calendar day', () => {
  assert.equal(formatDate('2026-01-15T00:00:00.000Z'), 'Jan 15, 2026')
})
