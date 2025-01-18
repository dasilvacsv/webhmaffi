// service/AuthService.js// services/MessageService.js
import { sendmessage, sendpoll, sendimage, sendaudio, sendvideo } from '../methods.js';

export class AuthService {
    constructor(dbClient) {
        this.dbClient = dbClient;
    }

    async validateInstance(instance) {
        const [rows] = await this.dbClient('SELECT * FROM auth WHERE token = ?', [instance]);
        if (!rows || rows.expirado === '1') return null;
        return rows;
    }
}

// service/ContactService.js
export class ContactService {
    constructor(dbClient) {
        this.dbClient = dbClient;
    }

    async getContact(numero, mainid) {
        const [contact] = await this.dbClient('SELECT * FROM contatos WHERE numero = ? AND mainid = ?', [numero, mainid]);
        return contact;
    }

    async updateContact(data) {
        return await this.dbClient('UPDATE contatos SET ? WHERE numero = ? AND mainid = ?', [data, numero, mainid]);
    }

    async checkBlocked(numero, mainid) {
        const [contact] = await this.dbClient('SELECT * FROM contatos WHERE numero = ? AND mainid = ?', [numero, mainid]);
        return contact?.bloqueado === '1';
    }

    async updateSaldoAdd(numero, mainid, valor) {
        return await this.dbClient('UPDATE contatos SET saldoadd = ? WHERE numero = ? AND mainid = ?', 
            [valor, numero, mainid]);
    }
}

// services/GiftService.js
export class GiftService {
    constructor(dbClient) {
        this.dbClient = dbClient;
    }

    async getGift(mainid, code) {
        return await this.dbClient('SELECT * FROM gifts WHERE mainid = ? AND codigo = ? AND resgatado = ?', 
            [mainid, code, 0]);
    }

    async updateGift(giftId, numero) {
        return await this.dbClient('UPDATE gifts SET resgatado = ?, numero = ? WHERE id = ?', 
            [1, numero, giftId]);
    }
}

// services/LogService.js
export class LogService {
    constructor(dbClient) {
        this.dbClient = dbClient;
    }

    async getLogGroups(mainid) {
        const [regularLog] = await this.dbClient('SELECT * FROM grupos WHERE log = ? AND mainid = ?', ['1', mainid]);
        const [adminLog] = await this.dbClient('SELECT * FROM grupos WHERE log_adm = ? AND mainid = ?', ['1', mainid]);
        return { regularLog, adminLog };
    }
}


export class MessageService {
    constructor(apiurl, globalkey) {
        this.apiurl = apiurl;
        this.apikey = globalkey; // This will be overridden per request with jwt from auth
    }

    async send(instance, jid, message, apikey) {
        // Use the instance-specific apikey instead of global
        return await sendmessage(instance, jid, message, apikey, this.apiurl);
    }

    async sendPoll(instance, jid, text, options, apikey) {
        return await sendpoll(instance, jid, text, apikey, this.apiurl, options);
    }

    async sendImage(instance, jid, message, imageLink, apikey) {
        return await sendimage(instance, jid, message, apikey, imageLink, this.apiurl);
    }

    async sendAudio(instance, jid, audioLink, apikey) {
        return await sendaudio(instance, jid, apikey, audioLink, this.apiurl);
    }

    async sendVideo(instance, jid, message, videoLink, apikey) {
        return await sendvideo(instance, jid, message, apikey, videoLink, this.apiurl);
    }
}