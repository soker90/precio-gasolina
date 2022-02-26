import TelegramBot from 'node-telegram-bot-api'
import { readFile } from './fileUtils.js'

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM
const bot = new TelegramBot(TOKEN_TELEGRAM)
const GASOLINA_CHAT_ID = process.env.GASOLINA_CHAT_ID;
const DIESEL_CHAT_ID = process.env.DIESEL_CHAT_ID;

const sendToTelegram = ({price, priceOld, type, chatId}) => {
  if(price !== priceOld){
    const msg = `El precio ${type} ha ${price > 0 ? subido : bajado} ${Math.abs(price - priceOld)}`
    console.log(msg)
    bot.sendMessage(chatId, msg);
  }

}

const dataSaved = readFile()

sendToTelegram({
  price: dataSaved.gasolina.pop(),
  priceOld: dataSaved.gasolina.pop(),
  type: 'de la gasolina',
  chatId: GASOLINA_CHAT_ID
})

sendToTelegram({
  price: dataSaved.diesel.pop(),
  priceOld: dataSaved.diesel.pop(),
  type: 'del diesel',
  chatId: DIESEL_CHAT_ID
})
  
