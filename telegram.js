const TELEGRAM_API = 'https://api.telegram.org'

export function createTelegramClient({ token, fetchImpl = fetch }) {
  if (!token) throw new Error('A Telegram bot token is required')
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function')

  async function request(method, payload) {
    const response = await fetchImpl(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    let result
    try {
      result = await response.json()
    } catch (error) {
      throw new Error(`Telegram ${method} returned an invalid response`, { cause: error })
    }

    if (!response.ok || !result.ok) {
      throw new Error(`Telegram ${method} failed: ${result.description || response.statusText || response.status}`)
    }

    return result.result
  }

  return {
    sendMessage(chatId, text, options = {}) {
      return request('sendMessage', {
        chat_id: chatId,
        text,
        ...options,
      })
    },
    sendPhoto(chatId, photo) {
      return request('sendPhoto', {
        chat_id: chatId,
        photo,
      })
    },
  }
}
