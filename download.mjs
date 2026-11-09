import { readFile, writeFile } from './fileUtils.js'
import fs from 'node:fs'
import path from 'node:path'

const FUEL_STATION_ID = process.env.FUEL_STATION_ID
const DATA_FILE = process.env.DATA_FILE || './data.json'
const GEOPORTAL_URL = `https://geoportalgasolineras.es/geoportal/rest/${FUEL_STATION_ID}/busquedaEstacionPrecio`

const MAX_ATTEMPTS = 3
const REQUEST_TIMEOUT_MS = 15_000

if (!FUEL_STATION_ID || !/^\d+$/.test(FUEL_STATION_ID)) {
  throw new Error('FUEL_STATION_ID is required and must be numeric')
}

const date = new Intl.DateTimeFormat('es-ES', {
  month: 'numeric',
  day: 'numeric',
  timeZone: 'Europe/Madrid',
}).format(new Date())

const dataFileDir = path.dirname(DATA_FILE)
const dataFileBase = path.basename(DATA_FILE)
const PREV_FILE = path.join(dataFileDir, `previous-${dataFileBase}`)

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function fetchStationData() {
  let lastError

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(GEOPORTAL_URL, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'precio-gasolina/1.0 (+https://github.com/soker90/precio-gasolina)',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      if (!response.ok) {
        throw new Error(`Geoportal returned HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || ''
      const body = await response.text()

      if (!contentType.toLowerCase().includes('json') || body.trimStart().startsWith('<')) {
        throw new Error(`Geoportal returned non-JSON response (content-type: ${contentType || 'missing'})`)
      }

      let stationData
      try {
        stationData = JSON.parse(body)
      } catch (error) {
        throw new Error('Geoportal returned malformed JSON', { cause: error })
      }

      const gasoline = Number(stationData.precioGasolina95E5)
      const diesel = Number(stationData.precioGasoleoA)

      if (!Number.isFinite(gasoline) || gasoline <= 0 || !Number.isFinite(diesel) || diesel <= 0) {
        throw new Error(`Geoportal response does not contain valid gasoline/diesel prices: ${body.slice(0, 300)}`)
      }

      return { gasoline, diesel }
    } catch (error) {
      lastError = error
      console.error(`Attempt ${attempt}/${MAX_ATTEMPTS} failed for station ${FUEL_STATION_ID}: ${error.message}`)
      if (attempt < MAX_ATTEMPTS) await sleep(attempt * 2_000)
    }
  }

  throw new Error(`Could not download prices for station ${FUEL_STATION_ID} after ${MAX_ATTEMPTS} attempts`, {
    cause: lastError,
  })
}

async function main() {
  const { gasoline, diesel } = await fetchStationData()
  const dataSaved = readFile(DATA_FILE)

  if (
    !dataSaved ||
    !Array.isArray(dataSaved.dates) ||
    !Array.isArray(dataSaved.gasolina) ||
    !Array.isArray(dataSaved.diesel) ||
    dataSaved.dates.length !== dataSaved.gasolina.length ||
    dataSaved.dates.length !== dataSaved.diesel.length
  ) {
    throw new Error(`Invalid historical data format in ${DATA_FILE}`)
  }

  if (dataSaved.dates.at(-1) === date) {
    const lastIndex = dataSaved.dates.length - 1
    fs.writeFileSync(PREV_FILE, JSON.stringify({
      date,
      gasolina: dataSaved.gasolina[lastIndex],
      diesel: dataSaved.diesel[lastIndex],
    }, null, 2))
    dataSaved.gasolina[lastIndex] = gasoline
    dataSaved.diesel[lastIndex] = diesel
  } else {
    if (fs.existsSync(PREV_FILE)) fs.unlinkSync(PREV_FILE)
    dataSaved.dates.push(date)
    dataSaved.gasolina.push(gasoline)
    dataSaved.diesel.push(diesel)
  }

  dataSaved.dates = dataSaved.dates.slice(-45)
  dataSaved.gasolina = dataSaved.gasolina.slice(-45)
  dataSaved.diesel = dataSaved.diesel.slice(-45)

  writeFile(dataSaved, DATA_FILE)
  console.log(`Saved ${date}: gasoline ${gasoline} €/L, diesel ${diesel} €/L (station ${FUEL_STATION_ID})`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
