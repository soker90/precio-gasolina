const MAX_HISTORY_DAYS = 45

function isValidDateLabel(value) {
  if (typeof value !== 'string') return false
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(value)
  if (!match) return false

  const day = Number(match[1])
  const month = Number(match[2])
  const date = new Date(Date.UTC(2000, month - 1, day))

  return date.getUTCDate() === day && date.getUTCMonth() === month - 1
}

export function validatePriceHistory(history, source = 'price history') {
  if (
    !history ||
    !Array.isArray(history.dates) ||
    !Array.isArray(history.gasolina) ||
    !Array.isArray(history.diesel) ||
    history.dates.length === 0 ||
    history.dates.length !== history.gasolina.length ||
    history.dates.length !== history.diesel.length
  ) {
    throw new Error(`Invalid historical data structure in ${source}`)
  }

  if (!history.dates.every(isValidDateLabel)) {
    throw new Error(`Invalid date found in ${source}`)
  }

  for (const [index, price] of history.gasolina.entries()) {
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      throw new Error(`Invalid gasoline price at index ${index} in ${source}`)
    }
  }

  for (const [index, price] of history.diesel.entries()) {
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      throw new Error(`Invalid diesel price at index ${index} in ${source}`)
    }
  }

  return history
}

export function updatePriceHistory(history, date, prices, limit = MAX_HISTORY_DAYS) {
  validatePriceHistory(history)

  if (!isValidDateLabel(date)) {
    throw new Error(`Invalid update date: ${date}`)
  }

  const { gasoline, diesel } = prices ?? {}
  if (![gasoline, diesel].every(price => typeof price === 'number' && Number.isFinite(price) && price > 0)) {
    throw new Error('Both fuel prices must be positive finite numbers')
  }

  const updated = {
    dates: [...history.dates],
    gasolina: [...history.gasolina],
    diesel: [...history.diesel],
  }

  let previous = null
  if (updated.dates.at(-1) === date) {
    const lastIndex = updated.dates.length - 1
    previous = {
      date,
      gasolina: updated.gasolina[lastIndex],
      diesel: updated.diesel[lastIndex],
    }
    updated.gasolina[lastIndex] = gasoline
    updated.diesel[lastIndex] = diesel
  } else {
    updated.dates.push(date)
    updated.gasolina.push(gasoline)
    updated.diesel.push(diesel)
  }

  updated.dates = updated.dates.slice(-limit)
  updated.gasolina = updated.gasolina.slice(-limit)
  updated.diesel = updated.diesel.slice(-limit)

  return { history: updated, previous }
}

export function getTodayDate(timeZone = 'Europe/Madrid', now = new Date()) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'numeric',
    timeZone,
  }).format(now)
}
