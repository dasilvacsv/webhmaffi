// handlers/MessageParser.js
export class MessageParser {
    static parse(data) {
        const isaudio = data.data?.message?.audioMessage ?? null;
        const instance = data.instance;
        const acessotoken = data?.instance ?? null;
        const jid = data.data?.key?.remoteJid ?? null;
        const text = data.data?.message?.conversation ?? null;
        const extendedTextMessage = data.data?.message?.extendedTextMessage?.text ?? null;
        const caption_img = data.data?.message?.imageMessage?.caption ?? null;
        const caption_video = data.data?.message?.videoMessage?.caption ?? null;
        const conversation = data.data?.message?.conversation ?? null;
        const pushName = (data.data?.update?.name) ? data.data?.update?.name : (data.data?.pushName || null);
        const fromMe = data.data?.key.fromMe ?? null;
        let budy = text || caption_img || caption_video || conversation || extendedTextMessage || null;
        budy = (budy !== null && !data.data.message.stickerMessage) ? budy.toLowerCase() : '';

        return {
            instance,
            isaudio,
            acessotoken,
            jid,
            text,
            extendedTextMessage,
            caption_img,
            conversation,
            pushName,
            fromMe,
            budy,
            numero_jid: jid ? jid.replace("@s.whatsapp.net", "") : null
        };
    }
}

export  class PollHandler {
    constructor(services) {
        this.services = services;
    }

    async handlePoll(data) {
        const pollData = await this.services.authService.validateInstance(data.instance);
        if (!pollData) return;

        const context = MessageParser.parse(data);
        const { instance, jid, numero_jid } = context;

        for (const vote of data.data?.pollUpdates || []) {
            if (vote.voters === jid) {
                await this.handleVote(vote.name, context, pollData);
            }
        }
    }

    async handleVote(voteName, context, pollData) {
        const voteHandlers = {
            '💸 *Fazer recarga*': this.handleRechargeVote,
            '✅ Confirmar Adicionar saldo': this.handleConfirmBalanceVote,
            // Add other vote handlers...
        };

        const handler = voteHandlers[voteName];
        if (handler) {
            await handler.call(this, context, pollData);
        }
    }
}

// handlers/CommandHandler.js
export class CommandHandler {
    constructor(services) {
        this.services = services;
    }

   async handlePixCommand(args, context) {
        const { instance, jid, numero_jid, mainid, apikey } = context;
        
        if (!args) {
            await this.services.messageService.send(
                instance, 
                jid,
                'Você precisa informar um valor para o pix. Exemplo: /pix 10',
                apikey
            );
            return;
        }

        if (args < 5 || isNaN(args)) {
            await this.services.messageService.send(
                instance,
                jid,
                'Valor minimo de recarga e R$5.00',
                apikey
            );
            return;
        }

        const valor = args.indexOf('.') === -1 ? `${args}.00` : `${args}`;
        const text = `Valor a ser adicionado: R$${valor}\nConfirmar?\n\n`;
        const options = ['✅ Confirmar Adicionar saldo', '❌ Não confirmar adicionar saldo'];
        
        await this.services.messageService.sendPoll(instance, jid, text, options, apikey);
        await this.services.contactService.updateSaldoAdd(numero_jid, mainid, valor);
    }

    async handleResgatarCommand(args, context) {
        const { instance, jid, numero_jid, mainid } = context;

        if (!args) {
            await this.services.messageService.send(
                instance,
                jid,
                'Digite o codigo do gift Exemplo: /resgatar PF1WVKIK84GQWK3H3UJX'
            );
            return;
        }

        const token = args.toUpperCase();
        const [gift] = await this.services.giftService.getGift(mainid, token);
        
        if (!gift) {
            await this.services.messageService.send(instance, jid, 'Nenhum gift cadastrado!');
            return;
        }

        const result = await this.processGiftRedemption(gift, numero_jid, mainid);
        if (result.success) {
            const msg = `*Parabéns !!!!Você acaba de resgatar um gift* 🥳\n\n💰- Valor: R$ ${result.data.giftValue}\n💲- Saldo atual: R$ ${result.data.newBalance}\n📆 - ${getdata().dataatual_invertida}`;
            const link = 'https://bot.ultragestor.com/gift.jpeg';
            
            await this.services.messageService.sendImage(instance, jid, msg, link);
            await this.sendGiftNotifications(result.data, instance, jid);
        }
    }

    // Helper method for processing gift redemption
    async processGiftRedemption(gift, numero_jid, mainid) {
        const giftUpdate = await this.services.giftService.updateGift(gift.id, numero_jid);
        if (giftUpdate.affectedRows === 0) {
            return { success: false };
        }

        const contact = await this.services.contactService.getContact(numero_jid, mainid);
        const currentBalance = parseFloat(contact.saldo);
        const giftValue = parseFloat(gift.valor);
        const newBalance = giftValue + currentBalance;

        const balanceUpdate = await this.services.contactService.updateContact({
            saldo: newBalance
        }, numero_jid, mainid);

        if (balanceUpdate.affectedRows === 0) {
            return { success: false };
        }

        return {
            success: true,
            data: {
                giftValue,
                newBalance,
                currentBalance
            }
        };
    }

    async sendGiftNotifications(giftData, instance, jid) {
        const { regularLog, adminLog } = await this.services.logService.getLogGroups();
        
        if (regularLog) {
            const logMsg = `Usuário ${jid.replace("@s.whatsapp.net", "")} Resgatou o Gift. 🥳\n\n` +
                          `💰- Valor: R$ ${giftData.giftValue}\n` +
                          `📆 - ${getdata().dataatual_invertida}`;
            await this.services.messageService.send(instance, regularLog.jid, logMsg);
        }

        if (adminLog) {
            const adminLogMsg = `Usuário ${jid.replace("@s.whatsapp.net", "")} Resgatou o Gift. 🥳\n\n` +
                              `💰- Valor: R$ ${giftData.giftValue}\n` +
                              `💲- Saldo atual: R$ ${giftData.newBalance}\n` +
                              `📆 - ${getdata().dataatual_invertida}`;
            await this.services.messageService.send(instance, adminLog.jid, adminLogMsg);
        }
    }
}

// Utility function to validate messages
export async function isValidMessage(parsedMessage) {
    const { jid, budy } = parsedMessage;
    
    if (jid?.includes('status@broadcast')) return false;
    if (jid?.includes('@g.us')) return false;
    if (budy == null || budy == '') return false;
    
    return true;
}