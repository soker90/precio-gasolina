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
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const currentYearDate = new Date(Date.UTC(now.getFullYear(), month - 1, day))

  if (
    currentYearDate.getUTCDate() !== day ||
    currentYearDate.getUTCMonth() !== month - 1
  ) {
    return null
  }

  let timestamp = currentYearDate.getTime()
  if (timestamp > today) {
    const previousYearDate = new Date(Date.UTC(now.getFullYear() - 1, month - 1, day))
    if (previousYearDate.getUTCDate() !== day || previousYearDate.getUTCMonth() !== month - 1) return null
    timestamp = previousYearDate.getTime()
  }

  return Math.floor((today - timestamp) / 86_400_000)
}
