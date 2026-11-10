const GEO_PORTAL_BASE_URL = 'https://geoportalgasolineras.es/geoportal/rest'
const USER_AGENT = 'precio-gasolina/1.0 (+https://github.com/soker90/precio-gasolina)'

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

function parsePrices(payload) {
  const gasolineValue = payload?.precioGasolina95E5
  const dieselValue = payload?.precioGasoleoA

  if (
    !['number', 'string'].includes(typeof gasolineValue) ||
    !['number', 'string'].includes(typeof dieselValue) ||
    String(gasolineValue).trim() === '' ||
    String(dieselValue).trim() === ''
  ) {
    throw new Error('Geoportal response is missing gasoline or diesel prices')
  }

  const gasoline = Number(gasolineValue)
  const diesel = Number(dieselValue)

  if (![gasoline, diesel].every(price => Number.isFinite(price) && price > 0)) {
    throw new Error('Geoportal response contains invalid fuel prices')
  }

  return { gasoline, diesel }
}

export async function fetchStationPrices({
  stationId,
  fetchImpl = globalThis.fetch,
  attempts = 3,
  timeoutMs = 15_000,
  wait = sleep,
}) {
  if (!/^\d+$/.test(String(stationId ?? ''))) {
    throw new Error('A numeric stationId is required')
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('A Fetch API implementation is required')
  }

  const url = `${GEO_PORTAL_BASE_URL}/${stationId}/busquedaEstacionPrecio`
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (!response.ok) {
        const error = new Error(`Geoportal returned HTTP ${response.status}`)
        if (response.status < 500 && response.status !== 429) throw Object.assign(error, { retryable: false })
        throw error
      }

      const contentType = response.headers.get('content-type') || ''
      const body = await response.text()

      if (!contentType.toLowerCase().includes('json') || body.trimStart().startsWith('<')) {
        throw new Error(`Geoportal returned a non-JSON response (content-type: ${contentType || 'missing'})`)
      }

      let payload
      try {
        payload = JSON.parse(body)
      } catch (error) {
        throw new Error('Geoportal returned malformed JSON', { cause: error })
      }

      return parsePrices(payload)
    } catch (error) {
      lastError = error
      console.error(`Station ${stationId}, attempt ${attempt}/${attempts}: ${error.message}`)

      if (error.retryable === false || attempt === attempts) break
      await wait(attempt * 2_000)
    }
  }

  throw new Error(`Could not download prices for station ${stationId} after ${attempts} attempt(s)`, {
    cause: lastError,
  })
}
