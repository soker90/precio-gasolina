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

const sendToTelegram = async ({price, priceOld, type, chatId, image, stationName}) => {
  if(price !== priceOld){
    const diff = Math.round((price - priceOld) * 1000 ) / 1000
    const msg = `*${date}/${new Date().getFullYear()}*${stationName ? ` \\(${stationName}\\)` : ''}: El precio ${type} es ${price}€, ha _${diff > 0 ? 'subido' : 'bajado'}_ *${Math.abs(diff)}€*`
    console.log(msg)
    await bot.sendMessage(chatId, msg, {parse_mode : 'Markdown'});
    await bot.sendPhoto(chatId, image)
  }

}

const dataSaved = readFile(DATA_FILE)
const dataSaved2 = readFile(DATA_FILE_2)
const date = dataSaved.dates.at(-1)

const gasolinaChart = generateChart(dataSaved, 'gasolina', dataSaved2, STATION_NAME_1, STATION_NAME_2)
const dieselChart = generateChart(dataSaved, 'diesel', dataSaved2, STATION_NAME_1, STATION_NAME_2)

sendToTelegram({
  price: dataSaved.gasolina.at(-1),
  priceOld: dataSaved.gasolina.at(-2),
  type: 'de la gasolina',
  chatId: GASOLINA_CHAT_ID,
  stationName: STATION_NAME_1,
  image: gasolinaChart
}).catch(error => console.error('Error al enviar el precio de la gasolina (estacion 1)', error))

sendToTelegram({
  price: dataSaved2.gasolina.at(-1),
  priceOld: dataSaved2.gasolina.at(-2),
  type: 'de la gasolina',
  chatId: GASOLINA_CHAT_ID,
  stationName: STATION_NAME_2,
  image: gasolinaChart
}).catch(error => console.error('Error al enviar el precio de la gasolina (estacion 2)', error))

sendToTelegram({
  price: dataSaved.diesel.at(-1),
  priceOld: dataSaved.diesel.at(-2),
  type: 'del diesel',
  chatId: DIESEL_CHAT_ID,
  stationName: STATION_NAME_1,
  image: dieselChart
}).catch(error => console.error('Error al enviar el precio del diesel (estacion 1)', error))

sendToTelegram({
  price: dataSaved2.diesel.at(-1),
  priceOld: dataSaved2.diesel.at(-2),
  type: 'del diesel',
  chatId: DIESEL_CHAT_ID,
  stationName: STATION_NAME_2,
  image: dieselChart
}).catch(error => console.error('Error al enviar el precio del diesel (estacion 2)', error))
