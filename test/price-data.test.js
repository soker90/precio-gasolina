import test from 'node:test'
import assert from 'node:assert/strict'
import { getDateAge, validatePriceData } from '../price-data.js'

test('validates all dates and prices used by the dashboard', () => {
  const data = { dates: ['8/11'], gasolina: [1.7], diesel: [1.9] }
  assert.equal(validatePriceData(data), data)
  assert.throws(() => validatePriceData({ ...data, updatedAt: '2026-02-30' }), /fecha de actualización inválida/)
  assert.throws(() => validatePriceData({ ...data, diesel: [0] }), /precios inválidos/)
  assert.throws(() => validatePriceData({ ...data, dates: ['31/2'] }), /fechas inválidas/)
  assert.throws(() => validatePriceData({ ...data, dates: [true] }), /fechas inválidas/)
})

test('calculates refresh age from the full date in Madrid calendar days', () => {
  assert.equal(getDateAge('2026-11-09', new Date('2026-11-09T22:30:00Z')), 0)
  assert.equal(getDateAge('2026-11-08', new Date('2026-11-09T22:30:00Z')), 1)
  assert.equal(getDateAge('2026-03-28', new Date('2026-03-30T10:00:00Z')), 2)
  assert.equal(getDateAge('2026-03-29', new Date('2026-03-30T10:00:00Z')), 1)
  assert.equal(getDateAge('8/11', new Date('2026-11-09T12:00:00')), null)
  assert.equal(getDateAge('2026-02-30', new Date('2026-11-09T12:00:00')), null)
  assert.equal(getDateAge('2026-11-10', new Date('2026-11-09T12:00:00')), null)
})
