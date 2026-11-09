import test from 'node:test'
import assert from 'node:assert/strict'
import { createTelegramClient } from '../telegram.js'

test('sends messages through the official Telegram Bot API', async () => {
  const calls = []
  const bot = createTelegramClient({
    token: 'test-token',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return { ok: true, json: async () => ({ ok: true, result: { message_id: 42 } }) }
    },
  })

  const result = await bot.sendMessage('123', 'Price changed', { parse_mode: 'Markdown' })

  assert.deepEqual(result, { message_id: 42 })
  assert.equal(calls[0].url, 'https://api.telegram.org/bottest-token/sendMessage')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    chat_id: '123',
    text: 'Price changed',
    parse_mode: 'Markdown',
  })
})

test('sends chart URLs as Telegram photos', async () => {
  let payload
  const bot = createTelegramClient({
    token: 'test-token',
    fetchImpl: async (_url, options) => {
      payload = JSON.parse(options.body)
      return { ok: true, json: async () => ({ ok: true, result: {} }) }
    },
  })

  await bot.sendPhoto('123', 'https://quickchart.io/chart/example')
  assert.deepEqual(payload, {
    chat_id: '123',
    photo: 'https://quickchart.io/chart/example',
  })
})

test('surfaces Telegram API errors instead of reporting success', async () => {
  const bot = createTelegramClient({
    token: 'test-token',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ ok: false, description: 'chat not found' }),
    }),
  })

  await assert.rejects(bot.sendMessage('missing', 'Hello'), /Telegram sendMessage failed: chat not found/)
})

test('rejects missing bot tokens', () => {
  assert.throws(() => createTelegramClient({ token: '' }), /token is required/)
})
