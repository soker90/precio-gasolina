export function validatePriceData(data, filename = 'price data') {
  if (
    !data ||
    !Array.isArray(data.dates) ||
    !Array.isArray(data.gasolina) ||
    !Array.isArray(data.diesel) ||
    data.dates.length === 0 ||
    data.dates.length !== data.gasolina.length ||
    data.dates.length !== data.diesel.length
  ) {
    throw new Error(`El archivo ${filename} no contiene un histórico válido.`)
  }

  const validDate = value => {
    if (typeof value !== 'string') return false
    const match = /^(\d{1,2})\/(\d{1,2})$/.exec(value)
    if (!match) return false
    const day = Number(match[1])
    const month = Number(match[2])
    const date = new Date(Date.UTC(2000, month - 1, day))
    return date.getUTCDate() === day && date.getUTCMonth() === month - 1
  }

  if (!data.dates.every(validDate)) {
    throw new Error(`El archivo ${filename} contiene fechas inválidas.`)
  }

  for (const price of [...data.gasolina, ...data.diesel]) {
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      throw new Error(`El archivo ${filename} contiene precios inválidos.`)
    }
  }

  return data
}

export function getDateAge(dateLabel, now = new Date()) {
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(dateLabel ?? '')
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const madridDate = Object.fromEntries(
    new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(now).map(part => [part.type, Number(part.value)]),
  )
  const today = Date.UTC(madridDate.year, madridDate.month - 1, madridDate.day)

  // Search backwards so dates such as 29/2 remain valid across non-leap years.
  for (let year = madridDate.year; year >= madridDate.year - 4; year -= 1) {
    const candidate = new Date(Date.UTC(year, month - 1, day))
    if (
      candidate.getUTCDate() === day &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getTime() <= today
    ) {
      return Math.floor((today - candidate.getTime()) / 86_400_000)
    }
  }

  return null
}
