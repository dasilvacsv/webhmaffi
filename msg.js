// msg.js
import { msgs } from './db.js';
import  { sendmessage } from './methods.js';
import  { get_produtos } from './data.js';
import  { getTimeOfDayInRioDeJaneiro, getdata, saudacao, verificar_numero } from './utils.js';

import dotenv from 'dotenv';


dotenv.config();

const apiurl = process.env.API_URL;
const globalkey = process.env.API_KEY;

/* HANDLERS */

export async function messagem(data) {
    try {
        const instance = data.instance;
        console.log("instance", instance);
        
        const [rows] = await msgs('SELECT * FROM auth WHERE token = ?', [instance]);
        console.log("db", [rows]);
        
        if (!rows) return;
        if (rows.expirado == '1') return;
        const apikey = rows.jwt;
        console.log("apikey", apikey);
        
        const mainid = rows.id;
        console.log("mainid", mainid);
        
        const bonus = rows.bonus;
        console.log("bonus", bonus);
        
        let isaudio = data.data?.message?.audioMessage ?? null;
        console.log("isaudio", isaudio);
        
        let acessotoken = data?.instance ?? null;
        console.log("accesotoken", acessotoken);
        
        let jid = data.data?.key?.remoteJid ?? null;
        console.log("jid", jid);
        getdata()
        getTimeOfDayInRioDeJaneiro()
        
        let text = data.data?.message?.conversation ?? null;
        let extendedTextMessage = data.data?.message?.extendedTextMessage?.text ?? null;
        let caption_img = data.data?.message?.imageMessage?.caption ?? null;
        let caption_video = data.data?.message?.videoMessage?.caption ?? null;
        let conversation = data.data?.message?.conversation ?? null;
        let pushName = (data.data?.update?.name) ? data.data?.update?.name : (data.data?.pushName || null);
        let budy = text || caption_img || caption_video || conversation || extendedTextMessage || null;
        let fromMe = data.data?.key.fromMe ?? null;
        let remover = "@s.whatsapp.net";
        let numero_jid = (jid !== null) ? jid.replace(remover, "") : null;
        if (jid?.includes('status@broadcast')) return;
        if (jid?.includes('@g.us')) return;        

        budy = (budy !== null && !data.data.message.stickerMessage) ? budy.toLowerCase() : '';
        if (isaudio && !fromMe) {
            await sendmessage(instance, jid, "🤖 Desculpe, mas eu sou um bot e não consigo processar áudios. Por favor, envie uma mensagem de texto para que eu possa ajudar você da melhor maneira possível. Obrigado! 📝!", apikey, apiurl);
        }
        if (budy == null || budy == '') return;
        let [contatoSalvo] = await msgs('SELECT * FROM contatos WHERE numero = ? AND mainid = ?', [numero_jid, mainid]);
        if (contatoSalvo && contatoSalvo.bloqueado == '1') {
            const msg = `Olá! ${pushName} 😊\n\n` +
                `Entendemos que nem sempre as situações são fáceis, e prezamos muito pelo respeito mútuo. Dito isso, decidimos bloquear seu acesso à nossa loja para evitar futuros desentendimentos. Agradecemos pelo tempo em que foi nosso cliente, mas acreditamos que agora é o momento de seguir caminhos diferentes. 🛤️\n\n` +
                `Desejamos tudo de bom na sua jornada! ✨`
            await sendmessage(instance, jid, msg, apikey, apiurl);
            return;
        }
        //MENSAGEM DE SAUDAÇÃO
        if (!['/pix', '/afiliado', '/resgatar'].some(cmd => budy.includes(cmd))) {
            await saudacao(mainid, pushName, numero_jid, bonus, instance, jid, apikey, apiurl)
        }

        


    } catch (err) {
        console.log(err);
    }



}


async function conexao(dados) {
    try {
        const instace = dados.data.instance ?? null
        const status = dados.data.state ?? null
        const numerobot = dados.sender ?? null
        const jwt = dados.apikey ?? null
        await msgs('UPDATE auth SET status = ?, numero = ? WHERE token = ?', [status, numerobot, instace])
    } catch (err) {
        console.log(err)
    }


}

