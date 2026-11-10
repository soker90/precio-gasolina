import { createTelegramClient } from './telegram.js'
import { readFile } from './fileUtils.js'
import { generateChart } from './generateChart.js'
import { validatePriceHistory } from './price-history.js'
import fs from 'node:fs'
import path from 'node:path'

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM
const GASOLINA_CHAT_ID = process.env.GASOLINA_CHAT_ID
const DIESEL_CHAT_ID = process.env.DIESEL_CHAT_ID
const DATA_FILE = process.env.DATA_FILE || './data.json'
const DATA_FILE_2 = process.env.DATA_FILE_2 || './data-5143.json'
const STATION_NAME_1 = process.env.STATION_NAME_1 || ''
const STATION_NAME_2 = process.env.STATION_NAME_2 || ''
const NOTIFY_STATION_5205 = process.env.NOTIFY_STATION_5205 !== 'false'
const NOTIFY_STATION_5143 = process.env.NOTIFY_STATION_5143 !== 'false'

if (!TOKEN_TELEGRAM || !GASOLINA_CHAT_ID || !DIESEL_CHAT_ID) {
  throw new Error('TOKEN_TELEGRAM, GASOLINA_CHAT_ID and DIESEL_CHAT_ID are required')
}

const bot = createTelegramClient({ token: TOKEN_TELEGRAM })

function readPreviousPrices(dataFile) {
  const directory = path.dirname(dataFile)
  const basename = path.basename(dataFile)
  const previousFile = path.join(directory, `previous-${basename}`)

  if (!fs.existsSync(previousFile)) return null

  try {
    return JSON.parse(fs.readFileSync(previousFile, 'utf8'))
  } catch (error) {
    throw new Error(`Could not read previous prices from ${previousFile}`, { cause: error })
  }
}

function getYear(history) {
  return history.updatedAt?.slice(0, 4) ??
    new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
    }).format(new Date())
}

function loadStation({ enabled, dataFile, name }) {
  if (!enabled) return null

  try {
    const data = validatePriceHistory(readFile(dataFile), dataFile)
    const previous = readPreviousPrices(dataFile)
    const currentDate = data.dates.at(-1)
    const intraDay = previous?.date === currentDate

    return {
      data,
      name,
      date: currentDate,
      year: getYear(data),
      isIntraDay: intraDay,
      previousPrices: {
        gasolina: intraDay ? previous.gasolina : data.gasolina.at(-2),
        diesel: intraDay ? previous.diesel : data.diesel.at(-2),
      },
    }
  } catch (error) {
    console.error(`Skipping ${name} notifications because its history could not be loaded:`, error)
    return null
  }
}

const stations = [
  loadStation({ enabled: NOTIFY_STATION_5205, dataFile: DATA_FILE, name: STATION_NAME_1 || 'Barataria' }),
  loadStation({ enabled: NOTIFY_STATION_5143, dataFile: DATA_FILE_2, name: STATION_NAME_2 || 'Plaza de Toros' }),
].filter(Boolean)

if (stations.length === 0) {
  throw new Error('No valid station history is available for Telegram notifications')
}

async function sendMessage({ station, fuelType, chatId }) {
  const price = station.data[fuelType].at(-1)
  const previousPrice = station.previousPrices[fuelType]

  if (!Number.isFinite(previousPrice)) {
    console.warn(`Skipping ${station.name} ${fuelType} notification: no previous price is available`)
    return false
  }

  if (price === previousPrice) return false

  const difference = Math.round((price - previousPrice) * 1000) / 1000
  const formattedPrice = price.toLocaleString('es-ES', { minimumFractionDigits: 3 })
  const formattedDifference = Math.abs(difference).toLocaleString('es-ES', { minimumFractionDigits: 3 })
  const intraDaySuffix = station.isIntraDay ? ' _(nuevo precio del día)_' : ''
  const direction = difference > 0 ? 'subido' : 'bajado'
  const message = `*${station.date}/${station.year}* (*${station.name}*): El precio ${fuelType === 'gasolina' ? 'de la gasolina' : 'del diesel'} es ${formattedPrice}€, ha _${direction}_ *${formattedDifference}€*${intraDaySuffix}`

  console.log(message)
  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  return true
}

async function sendFuelNotifications({ fuelType, chatId }) {
  const results = await Promise.allSettled(
    stations.map(station => sendMessage({ station, fuelType, chatId })),
  )
  const failures = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason)
  const sent = results.some(result => result.status === 'fulfilled' && result.value)

  if (sent) {
    try {
      const chart = generateChart(
        stations[0].data,
        fuelType,
        stations[1]?.data ?? null,
        stations[0].name,
        stations[1]?.name ?? null,
      )
      await bot.sendPhoto(chatId, chart)
    } catch (error) {
      failures.push(error)
    }
  }
  if (failures.length > 0) {
    throw new AggregateError(
      failures,
      `Some ${fuelType} Telegram notifications failed`,
    )
  }
}

async function main() {
  const results = await Promise.allSettled([
    sendFuelNotifications({ fuelType: 'gasolina', chatId: GASOLINA_CHAT_ID }),
    sendFuelNotifications({ fuelType: 'diesel', chatId: DIESEL_CHAT_ID }),
  ])

  const failures = results.filter(result => result.status === 'rejected')
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map(result => result.reason),
      'One or more Telegram notification groups failed',
    )
  }
}

main().catch(error => {
  console.error('Error sending Telegram notifications:', error)
  process.exitCode = 1
})
