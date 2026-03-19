import TelegramBot from 'node-telegram-bot-api'
import { readFile } from './fileUtils.js'
import { generateChart } from './generateChart.js'

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM
const bot = new TelegramBot(TOKEN_TELEGRAM)
const GASOLINA_CHAT_ID = process.env.GASOLINA_CHAT_ID;
const DIESEL_CHAT_ID = process.env.DIESEL_CHAT_ID;
const DATA_FILE = process.env.DATA_FILE || './data.json'
const DATA_FILE_2 = process.env.DATA_FILE_2 || './data-5143.json'
const STATION_NAME_1 = process.env.STATION_NAME_1 || ''
const STATION_NAME_2 = process.env.STATION_NAME_2 || ''

const sendMessage = async ({price, priceOld, type, chatId, stationName}) => {
  if(price !== priceOld){
    const diff = Math.round((price - priceOld) * 1000 ) / 1000
    const fmtPrice = price.toLocaleString('es-ES', { minimumFractionDigits: 3 })
    const fmtDiff = Math.abs(diff).toLocaleString('es-ES', { minimumFractionDigits: 3 })
    const msg = `*${date}/${new Date().getFullYear()}*${stationName ? ` (*${stationName}*)` : ''}: El precio ${type} es ${fmtPrice}€, ha _${diff > 0 ? 'subido' : 'bajado'}_ *${fmtDiff}€*`
    console.log(msg)
    await bot.sendMessage(chatId, msg, {parse_mode : 'Markdown'});
    return true
  }
  return false
}

const dataSaved = readFile(DATA_FILE)
const dataSaved2 = readFile(DATA_FILE_2)
const date = dataSaved.dates.at(-1)

const gasolinaChart = generateChart(dataSaved, 'gasolina', dataSaved2, STATION_NAME_1, STATION_NAME_2)
const dieselChart = generateChart(dataSaved, 'diesel', dataSaved2, STATION_NAME_1, STATION_NAME_2)

const sendGasolina = async () => {
  const sent1 = await sendMessage({
    price: dataSaved.gasolina.at(-1),
    priceOld: dataSaved.gasolina.at(-2),
    type: 'de la gasolina',
    chatId: GASOLINA_CHAT_ID,
    stationName: STATION_NAME_1,
  })
  const sent2 = await sendMessage({
    price: dataSaved2.gasolina.at(-1),
    priceOld: dataSaved2.gasolina.at(-2),
    type: 'de la gasolina',
    chatId: GASOLINA_CHAT_ID,
    stationName: STATION_NAME_2,
  })
  if (sent1 || sent2) {
    await bot.sendPhoto(GASOLINA_CHAT_ID, gasolinaChart)
  }
}

const sendDiesel = async () => {
  const sent1 = await sendMessage({
    price: dataSaved.diesel.at(-1),
    priceOld: dataSaved.diesel.at(-2),
    type: 'del diesel',
    chatId: DIESEL_CHAT_ID,
    stationName: STATION_NAME_1,
  })
  const sent2 = await sendMessage({
    price: dataSaved2.diesel.at(-1),
    priceOld: dataSaved2.diesel.at(-2),
    type: 'del diesel',
    chatId: DIESEL_CHAT_ID,
    stationName: STATION_NAME_2,
  })
  if (sent1 || sent2) {
    await bot.sendPhoto(DIESEL_CHAT_ID, dieselChart)
  }
}

sendGasolina().catch(error => console.error('Error al enviar gasolina', error))
sendDiesel().catch(error => console.error('Error al enviar diesel', error))
