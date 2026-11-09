import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchStationPrices } from '../geoportal.js'

const jsonResponse = (payload, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers({ 'content-type': 'application/json; charset=utf-8' }),
  text: async () => JSON.stringify(payload),
})

test('returns validated fuel prices', async () => {
  const prices = await fetchStationPrices({
    stationId: '5205',
    fetchImpl: async () => jsonResponse({ precioGasolina95E5: '1.735', precioGasoleoA: 1.945 }),
  })
  assert.deepEqual(prices, { gasoline: 1.735, diesel: 1.945 })
})

test('retries transient failures and succeeds on the next attempt', async () => {
  let calls = 0
  const prices = await fetchStationPrices({
    stationId: '5205',
    attempts: 2,
    wait: async () => {},
    fetchImpl: async () => {
      calls += 1
      if (calls === 1) throw new Error('temporary network error')
      return jsonResponse({ precioGasolina95E5: 1.7, precioGasoleoA: 1.9 })
    },
  })
  assert.equal(calls, 2)
  assert.deepEqual(prices, { gasoline: 1.7, diesel: 1.9 })
})

test('fails on HTML responses and invalid prices', async () => {
  await assert.rejects(
    fetchStationPrices({
      stationId: '5205',
      attempts: 1,
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => '<html>maintenance</html>',
      }),
    }),
    error => error.cause?.message.includes('non-JSON response'),
  )

  await assert.rejects(
    fetchStationPrices({
      stationId: '5205',
      attempts: 1,
      fetchImpl: async () => jsonResponse({ precioGasolina95E5: 0, precioGasoleoA: 1.9 }),
    }),
    /invalid fuel prices/,
  )
})

test('does not retry permanent client errors', async () => {
  let calls = 0
  await assert.rejects(
    fetchStationPrices({
      stationId: '5205',
      attempts: 3,
      wait: async () => {},
      fetchImpl: async () => {
        calls += 1
        return jsonResponse({}, 404)
      },
    }),
    error => error.cause?.message.includes('HTTP 404'),
  )
  assert.equal(calls, 1)
})
