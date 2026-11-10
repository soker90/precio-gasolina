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

  if (
    data.updatedAt !== undefined &&
    (typeof data.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt))
  ) {
    throw new Error(`El archivo ${filename} contiene una fecha de actualización inválida.`)
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

/**
 * Calculates the age of a successful price refresh using Madrid calendar days.
 * A date without a year is deliberately treated as unknown rather than guessed.
 */
export function getDateAge(updatedAt, now = new Date()) {
  if (typeof updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) return null

  const [year, month, day] = updatedAt.split('-').map(Number)
  const refreshed = new Date(Date.UTC(year, month - 1, day))
  if (
    refreshed.getUTCFullYear() !== year ||
    refreshed.getUTCMonth() !== month - 1 ||
    refreshed.getUTCDate() !== day
  ) return null

  const madridDate = Object.fromEntries(
    new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(now).map(part => [part.type, Number(part.value)]),
  )
  const today = Date.UTC(madridDate.year, madridDate.month - 1, madridDate.day)
  if (refreshed.getTime() > today) return null

  return Math.floor((today - refreshed.getTime()) / 86_400_000)
}
