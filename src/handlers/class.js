// main message handler
import { msgs } from '../db/db.js';
import  { sendmessage, sendpoll } from '../methods.js';
import  { get_produtos } from '../db/data.js';
import  { getTimeOfDayInRioDeJaneiro, getdata, saudacao, verificar_numero } from '../utils.js';

import {AuthService, ContactService, GiftService, LogService, MessageService} from "../services/index.js"
import {CommandHandler, MessageParser, isValidMessage } from "./functions.js"
import dotenv from 'dotenv';


dotenv.config();

const apiurl = process.env.API_URL;
const globalkey = process.env.API_KEY;

export async function messagem2(data) {
    console.log(apiurl);
    
    try {
        const services = {
            authService: new AuthService(msgs),
            contactService: new ContactService(msgs),
            messageService: new MessageService(apiurl, globalkey),
            giftService: new GiftService(msgs),
            logService: new LogService(msgs)
        };

        const authData = await services.authService.validateInstance(data.instance);
        console.log(authData);
        
        if (!authData) return;

        const parsedMessage = MessageParser.parse(data);
        console.log(parsedMessage);
        
        if (!isValidMessage(parsedMessage)) return;

        const { instance, jid, numero_jid, pushName, isaudio, fromMe, budy } = parsedMessage;
        const { id: mainid, jwt: apikey, bonus } = authData;

        // Handle audio messages
        if (isaudio && !fromMe) {
            const msgaud = "🤖 Desculpe, mas eu sou um bot e não consigo processar áudios. Por favor, envie uma mensagem de texto para que eu possa ajudar você da melhor maneira possível. Obrigado! 📝!"
            await services.messageService.send(instance, jid, msgaud, apikey);
            return;
        }

        await saudacao(mainid, pushName, numero_jid, bonus, instance, jid, apikey, apiurl)


/* 
        // Check if user is blocked
        const isBlocked = await services.contactService.checkBlocked(numero_jid, mainid);
        if (isBlocked) {
            const blockedMessage = `Olá! ${pushName} 😊\n\n` +
                `Entendemos que nem sempre as situações são fáceis, e prezamos muito pelo respeito mútuo. Dito isso, decidimos bloquear seu acesso à nossa loja para evitar futuros desentendimentos. Agradecemos pelo tempo em que foi nosso cliente, mas acreditamos que agora é o momento de seguir caminhos diferentes. 🛤️\n\n` +
                `Desejamos tudo de bom na sua jornada! ✨`;
            await services.messageService.send(instance, jid, blockedMessage);
            return;
        }

        // Handle greeting message
        if (!['/pix', '/afiliado', '/resgatar'].some(cmd => budy.includes(cmd))) {
            await saudacao(mainid, pushName, numero_jid, bonus, instance, jid, apikey, data.apiurl);
        }

        // Handle commands
        if (budy && budy.startsWith('/')) {
            const commandHandler = new CommandHandler(services);
            const [command, ...args] = budy.substring(1).split(' ');
            await commandHandler.handleCommand(command, args.join(' '), {
                instance,
                jid,
                numero_jid,
                mainid,
                apikey,
                pushName
            });
        }

        // Handle polls if present
        if (data.data?.pollUpdates) {
            const pollHandler = new PollHandler(services);
            await pollHandler.handlePoll(data);
        } */

    } catch (err) {
        console.error('Error in message handler:', err);
        // You might want to add proper error handling/logging here
    }
}