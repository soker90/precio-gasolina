import TelegramBot from 'node-telegram-bot-api';
import { sendToTelegram } from '../sendToTelegram.js';
import { readFile } from '../fileUtils.js'
import { generateChart } from '../generateChart.js'

// import pkg from 'dotenv';
// const { dotenv } = pkg;
// pkg.config();

const TOKEN_TELEGRAM = process.env.TOKEN_TELEGRAM;
const bot = new TelegramBot(TOKEN_TELEGRAM, { polling: true });
const GASOLINA_CHAT_ID = process.env.GASOLINA_CHAT_ID;
const DIESEL_CHAT_ID = process.env.DIESEL_CHAT_ID;

bot.on('message', async (msg) => {
    var start = "/start";
    if (msg.text.toString().toLowerCase() === start) {
        console.log(msg.text)
        bot.sendMessage(msg.chat.id, "Te envío los precios de hoy.");
        bot.sendMessage(msg.chat.id, "Cuando se produzca un cambio en los precios, recibirás una actualización.");
        bot.sendMessage(msg.chat.id, "El bot revisa todos los precios todos los días a las 00:30h");

        const dataSaved = readFile()
        const date = dataSaved.dates.at(-1)

        sendToTelegram({
            price: dataSaved.gasolina.at(-1),
            priceOld: dataSaved.gasolina.at(-2),
            type: 'de la gasolina',
            chatId: GASOLINA_CHAT_ID,
            date,
            image: generateChart(dataSaved, 'gasolina')
        }).catch(error => console.error('Error al enviar el precio de la gasolina', error))

        sendToTelegram({
            price: dataSaved.diesel.at(-1),
            priceOld: dataSaved.diesel.at(-2),
            type: 'del diesel',
            chatId: DIESEL_CHAT_ID,
            date,
            image: generateChart(dataSaved, 'diesel')
        }).catch(error => console.error('Error al enviar el precio del gasoil', error))

    }

});