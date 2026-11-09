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

async function sendMessage({ price, previousPrice, type, chatId, stationName, isIntraDay = false }) {
  if (!Number.isFinite(previousPrice)) {
    console.warn(`Skipping ${type} notification: no previous price is available`)
    return false
  }

  if (price === previousPrice) return false

  const difference = Math.round((price - previousPrice) * 1000) / 1000
  const formattedPrice = price.toLocaleString('es-ES', { minimumFractionDigits: 3 })
  const formattedDifference = Math.abs(difference).toLocaleString('es-ES', { minimumFractionDigits: 3 })
  const intraDaySuffix = isIntraDay ? ' _(nuevo precio del día)_' : ''
  const date = dataSaved.dates.at(-1)
  const station = stationName ? ` (*${stationName}*)` : ''
  const direction = difference > 0 ? 'subido' : 'bajado'
  const message = `*${date}/${new Date().getFullYear()}*${station}: El precio ${type} es ${formattedPrice}€, ha _${direction}_ *${formattedDifference}€*${intraDaySuffix}`

  console.log(message)
  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  return true
}

const dataSaved = validatePriceHistory(readFile(DATA_FILE), DATA_FILE)
const dataSaved2 = validatePriceHistory(readFile(DATA_FILE_2), DATA_FILE_2)
const previous1 = readPreviousPrices(DATA_FILE)
const previous2 = readPreviousPrices(DATA_FILE_2)

const previousGasoline1 = previous1?.date === dataSaved.dates.at(-1)
  ? previous1.gasolina
  : dataSaved.gasolina.at(-2)
const previousDiesel1 = previous1?.date === dataSaved.dates.at(-1)
  ? previous1.diesel
  : dataSaved.diesel.at(-2)
const previousGasoline2 = previous2?.date === dataSaved2.dates.at(-1)
  ? previous2.gasolina
  : dataSaved2.gasolina.at(-2)
const previousDiesel2 = previous2?.date === dataSaved2.dates.at(-1)
  ? previous2.diesel
  : dataSaved2.diesel.at(-2)

const gasolineChart = generateChart(dataSaved, 'gasolina', dataSaved2, STATION_NAME_1, STATION_NAME_2)
const dieselChart = generateChart(dataSaved, 'diesel', dataSaved2, STATION_NAME_1, STATION_NAME_2)

async function sendFuelNotifications({ type, previousPrices, chatId, chart }) {
  const [sent1, sent2] = await Promise.all([
    sendMessage({
      price: dataSaved[type].at(-1),
      previousPrice: previousPrices[0],
      type: type === 'gasolina' ? 'de la gasolina' : 'del diesel',
      chatId,
      stationName: STATION_NAME_1,
      isIntraDay: Boolean(previous1),
    }),
    sendMessage({
      price: dataSaved2[type].at(-1),
      previousPrice: previousPrices[1],
      type: type === 'gasolina' ? 'de la gasolina' : 'del diesel',
      chatId,
      stationName: STATION_NAME_2,
      isIntraDay: Boolean(previous2),
    }),
  ])

  if (sent1 || sent2) await bot.sendPhoto(chatId, chart)
}

async function main() {
  await Promise.all([
    sendFuelNotifications({
      type: 'gasolina',
      previousPrices: [previousGasoline1, previousGasoline2],
      chatId: GASOLINA_CHAT_ID,
      chart: gasolineChart,
    }),
    sendFuelNotifications({
      type: 'diesel',
      previousPrices: [previousDiesel1, previousDiesel2],
      chatId: DIESEL_CHAT_ID,
      chart: dieselChart,
    }),
  ])
}

main().catch(error => {
  console.error('Error sending Telegram notifications:', error)
  process.exitCode = 1
})
