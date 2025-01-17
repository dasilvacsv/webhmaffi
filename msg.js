// msg.js
import { msgs } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

const apiurl = process.env.API_URL;
const globalkey = process.env.API_KEY;
console.log("apiurl, globalkey", apiurl, globalkey);


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

    } catch (err) {
        console.log(err);
    }
}
