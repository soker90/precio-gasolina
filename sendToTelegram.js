import TelegramBot from 'node-telegram-bot-api'
import { readFile } from './fileUtils.js'
import { generateChart } from './generateChart.js'
import fs from 'fs'
import path from 'path'

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM
const bot = new TelegramBot(TOKEN_TELEGRAM)
const GASOLINA_CHAT_ID = process.env.GASOLINA_CHAT_ID;
const DIESEL_CHAT_ID = process.env.DIESEL_CHAT_ID;
const DATA_FILE = process.env.DATA_FILE || './data.json'
const DATA_FILE_2 = process.env.DATA_FILE_2 || './data-5143.json'
const STATION_NAME_1 = process.env.STATION_NAME_1 || ''
const STATION_NAME_2 = process.env.STATION_NAME_2 || ''

// Lee el archivo de precios previos (intra-día) si existe
const readPrevFile = (dataFile) => {
  const dir = path.dirname(dataFile)
  const base = path.basename(dataFile)
  const prevFile = path.join(dir, `previous-${base}`)
  if (fs.existsSync(prevFile)) {
    try { return JSON.parse(fs.readFileSync(prevFile, 'utf8')) } catch { return null }
  }
  return null
}

const sendMessage = async ({price, priceOld, type, chatId, stationName, isIntraDay = false}) => {
  if(price !== priceOld){
    const diff = Math.round((price - priceOld) * 1000 ) / 1000
    const fmtPrice = price.toLocaleString('es-ES', { minimumFractionDigits: 3 })
    const fmtDiff = Math.abs(diff).toLocaleString('es-ES', { minimumFractionDigits: 3 })
    const intraDaySuffix = isIntraDay ? ' _(actualización del día)_' : ''
    const msg = `*${date}/${new Date().getFullYear()}*${stationName ? ` (*${stationName}*)` : ''}: El precio ${type} es ${fmtPrice}€, ha _${diff > 0 ? 'subido' : 'bajado'}_ *${fmtDiff}€*${intraDaySuffix}`
    console.log(msg)
    await bot.sendMessage(chatId, msg, {parse_mode : 'Markdown'});
    return true
  }
  return false
}

const dataSaved = readFile(DATA_FILE)
const dataSaved2 = readFile(DATA_FILE_2)
const date = dataSaved.dates.at(-1)

// Precios previos intra-día (si existen, significa que es un upsert del mismo día)
const prev1 = readPrevFile(DATA_FILE)
const prev2 = readPrevFile(DATA_FILE_2)

// Para cada estación y tipo de combustible:
// - Si hay archivo previo (mismo día, upsert): comparar contra ese precio previo de hoy
// - Si no hay archivo previo (día nuevo): comparar contra el precio de ayer (.at(-2))
const gasolinaPrevStation1 = (prev1 && prev1.date === dataSaved.dates.at(-1)) ? prev1.gasolina : dataSaved.gasolina.at(-2)
const dieselPrevStation1   = (prev1 && prev1.date === dataSaved.dates.at(-1)) ? prev1.diesel   : dataSaved.diesel.at(-2)
const gasolinaPrevStation2 = (prev2 && prev2.date === dataSaved2.dates.at(-1)) ? prev2.gasolina : dataSaved2.gasolina.at(-2)
const dieselPrevStation2   = (prev2 && prev2.date === dataSaved2.dates.at(-1)) ? prev2.diesel   : dataSaved2.diesel.at(-2)

const gasolinaChart = generateChart(dataSaved, 'gasolina', dataSaved2, STATION_NAME_1, STATION_NAME_2)
const dieselChart = generateChart(dataSaved, 'diesel', dataSaved2, STATION_NAME_1, STATION_NAME_2)

const sendGasolina = async () => {
  const sent1 = await sendMessage({
    price: dataSaved.gasolina.at(-1),
    priceOld: gasolinaPrevStation1,
    type: 'de la gasolina',
    chatId: GASOLINA_CHAT_ID,
    stationName: STATION_NAME_1,
    isIntraDay: !!prev1,
  })
  const sent2 = await sendMessage({
    price: dataSaved2.gasolina.at(-1),
    priceOld: gasolinaPrevStation2,
    type: 'de la gasolina',
    chatId: GASOLINA_CHAT_ID,
    stationName: STATION_NAME_2,
    isIntraDay: !!prev2,
  })
  if (sent1 || sent2) {
    await bot.sendPhoto(GASOLINA_CHAT_ID, gasolinaChart)
  }
}

const sendDiesel = async () => {
  const sent1 = await sendMessage({
    price: dataSaved.diesel.at(-1),
    priceOld: dieselPrevStation1,
    type: 'del diesel',
    chatId: DIESEL_CHAT_ID,
    stationName: STATION_NAME_1,
    isIntraDay: !!prev1,
  })
  const sent2 = await sendMessage({
    price: dataSaved2.diesel.at(-1),
    priceOld: dieselPrevStation2,
    type: 'del diesel',
    chatId: DIESEL_CHAT_ID,
    stationName: STATION_NAME_2,
    isIntraDay: !!prev2,
  })
  if (sent1 || sent2) {
    await bot.sendPhoto(DIESEL_CHAT_ID, dieselChart)
  }
}

sendGasolina().catch(error => console.error('Error al enviar gasolina', error))
sendDiesel().catch(error => console.error('Error al enviar diesel', error))
