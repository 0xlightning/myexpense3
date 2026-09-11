import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  OTHER_KEY,
  buildSplit,
  categorySlot,
  netWorth,
  resolveCategoryName,
  sortByCreation,
  statsByCategoryId,
  sumAmounts,
} from './derive.ts'
import type { CategoryItem, RecordItem } from './types.ts'

const rec = (id: string, amount: number, categoryId: string | null): RecordItem => ({
  id,
  amount,
  categoryId,
  date: '2026-01-15T00:00:00.000Z',
  notes: '',
  createdAtMs: 1,
})
const cat = (id: string, name: string, createdAtMs: number | null): CategoryItem => ({ id, name, createdAtMs })

describe('totals and net worth', () => {
  test('sums amounts', () => {
    assert.equal(sumAmounts([rec('a', 10, null), rec('b', 2.5, 'x')]), 12.5)
    assert.equal(sumAmounts([]), 0)
  })

  test('net worth = income − expenditure − investments', () => {
    assert.equal(netWorth({ income: 1000, expenditure: 300, investment: 200 }), 500)
    assert.equal(netWorth({ income: 100, expenditure: 150, investment: 50 }), -100)
    assert.equal(netWorth({ income: 0, expenditure: 0, investment: 0 }), 0)
  })
})

describe('Other resolution', () => {
  const cats = [cat('g', 'Groceries', 1)]

  test('null and orphaned IDs resolve to Other', () => {
    assert.equal(resolveCategoryName('g', cats), 'Groceries')
    assert.equal(resolveCategoryName(null, cats), 'Other')
    assert.equal(resolveCategoryName('deleted', cats), 'Other')
  })

  test('deleting a category moves its value to Other without touching records', () => {
    const records = [rec('1', 40, 'g'), rec('2', 10, null)]
    const snapshot = structuredClone(records)
    const after = buildSplit(records, []) // category doc deleted
    assert.deepEqual(records, snapshot)
    assert.deepEqual(after.slices, [{ key: OTHER_KEY, name: 'Other', value: 50, slot: null }])
    assert.equal(statsByCategoryId(records).get('g')?.count, 1) // FK still stored as-is
  })
})

describe('colour slots', () => {
  test('slots follow createdAt, not value or input order', () => {
    const cats = [cat('late', 'Late', 30), cat('early', 'Early', 10), cat('mid', 'Mid', 20)]
    const split = buildSplit([rec('1', 5, 'early'), rec('2', 500, 'late'), rec('3', 50, 'mid')], cats)
    assert.deepEqual(
      split.slices.map((s) => [s.key, s.slot]),
      [['late', 2], ['mid', 1], ['early', 0]],
    )
  })

  test('slots stay stable when a category has no records or values change', () => {
    const cats = [cat('a', 'A', 1), cat('b', 'B', 2), cat('c', 'C', 3)]
    const before = buildSplit([rec('1', 1, 'c')], cats)
    const after = buildSplit([rec('1', 999, 'c'), rec('2', 1, 'a')], cats)
    assert.equal(before.slices.find((s) => s.key === 'c')?.slot, 2)
    assert.equal(after.slices.find((s) => s.key === 'c')?.slot, 2)
    assert.equal(before.emptyCategoryCount, 2)
  })

  test('pending categories (no server timestamp yet) sort last', () => {
    const sorted = sortByCreation([cat('p', 'Pending', null), cat('x', 'X', 5)])
    assert.deepEqual(sorted.map((c) => c.id), ['x', 'p'])
  })

  test('9th category folds into Other on the chart but keeps its own table row', () => {
    const cats = Array.from({ length: 9 }, (_, i) => cat(`c${i}`, `C${i}`, i))
    const records = cats.map((c, i) => rec(`r${i}`, 10, c.id))
    const split = buildSplit([...records, rec('n', 5, null)], cats)
    assert.equal(split.slices.length, 9) // 8 slots + Other
    assert.deepEqual(split.slices.at(-1), { key: OTHER_KEY, name: 'Other', value: 15, slot: null })
    assert.equal(split.rows.length, 10) // 9 categories + Other(null)
    assert.equal(split.rows.find((r) => r.key === 'c8')?.slot, null)
    assert.equal(categorySlot('c7', cats), 7)
    assert.equal(categorySlot('c8', cats), null)
    assert.equal(split.total, 95)
  })
})
