import test from 'node:test'
import assert from 'node:assert/strict'
import { getTodayDate, updatePriceHistory, validatePriceHistory } from '../price-history.js'

const history = {
  dates: ['7/11', '8/11'],
  gasolina: [1.7, 1.71],
  diesel: [1.9, 1.91],
}

test('validates the existing historical data format', () => {
  assert.equal(validatePriceHistory(history), history)
})

test('rejects mismatched arrays and invalid historical prices', () => {
  assert.throws(() => validatePriceHistory({ ...history, diesel: [1.9] }), /Invalid historical data structure/)
  assert.throws(() => validatePriceHistory({ ...history, gasolina: [1.7, 0] }), /Invalid gasoline price/)
  assert.throws(() => validatePriceHistory({ ...history, dates: ['31/2'] }), /Invalid date/)
})

test('updates the current day and returns the previous values for Telegram', () => {
  const result = updatePriceHistory(history, '8/11', { gasoline: 1.72, diesel: 1.92 })
  assert.deepEqual(result.previous, { date: '8/11', gasolina: 1.71, diesel: 1.91 })
  assert.deepEqual(result.history.gasolina, [1.7, 1.72])
})

test('appends a new day and trims all arrays consistently', () => {
  const longHistory = {
    dates: Array.from({ length: 45 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 2, index + 1))
      return `${date.getUTCDate()}/${date.getUTCMonth() + 1}`
    }),
    gasolina: Array(45).fill(1.7),
    diesel: Array(45).fill(1.9),
  }
  const result = updatePriceHistory(longHistory, '15/4', { gasoline: 1.8, diesel: 2 })
  assert.equal(result.history.dates.length, 45)
  assert.equal(result.history.dates[0], '2/3')
  assert.equal(result.history.dates.at(-1), '15/4')
  assert.equal(result.previous, null)
})

test('formats the date in the configured timezone', () => {
  assert.equal(getTodayDate('Europe/Madrid', new Date('2026-11-08T23:30:00Z')), '9/11')
})
