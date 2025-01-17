// msg.js
import { msgs } from './db.js';
import  { sendmessage, sendpoll } from './methods.js';
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

        if (budy && budy.startsWith('/')) {
            const command = budy.split(' ')[0].toLowerCase().substring(1);
            const args = budy.split(' ').slice(1).join(' ');

            switch (command) {
                case 'pix':
                    if (!args) {
                        const msg = 'Você precisa informar um valor para o pix. Exemplo: /pix 10';
                        await sendmessage(instance, jid, msg, apikey, apiurl);
                        return;
                    }
                    if (args < 5 || isNaN(args)) {
                        const msg = 'Valor minimo de recarga e R$5.00';
                        await sendmessage(instance, jid, msg, apikey, apiurl);
                        return;
                    }

                    let valor = 5
                    if (args.indexOf('.') === -1) {
                        valor = `${args}.00`
                    } else {
                        valor = `${args}`
                    }

                    const text = `Valor a ser adicionado: R$${valor}\nConfirmar?\n\n`;
                    const coluns = ['✅ Confirmar Adicionar saldo', '❌ Não confirmar adicionar saldo'];
                    await sendpoll(instance, jid, text, apikey, apiurl, coluns)
                    await msgs('UPDATE contatos SET saldoadd = ? WHERE numero = ? AND mainid = ?', [valor, numero_jid, mainid])
                    break;

                case 'afiliado':
                    if (!args) {
                        const msg = 'Digite o numero da pessoa que te indicou Exemplo: /afiliado 5521xxxxxxxx';
                        await sendmessage(instance, jid, msg, apikey, apiurl);
                        return;
                    }
                    if (args == numero_jid) {
                        await sendmessage(instance, jid, 'Voce não pode ser afiliado de você mesmo!', apikey, apiurl);
                        return;
                    }
                    //Verifica se numero existe no whatsapp
                    const numero_existe = await verificar_numero(instance, args, apiurl, apikey)
                    if (numero_existe[0].exists == true) {
                        const contatos = await msgs('SELECT * FROM afiliados WHERE numero = ? AND mainid = ?', [numero_jid, mainid]);
                        if (contatos.length > 0) {
                            await sendmessage(instance, jid, 'Você ja e afiliado a um usuario', apikey, apiurl);
                            return;
                        } else {
                            const insert = await msgs('INSERT INTO afiliados (mainid, numero, afiliado) VALUES (?, ?, ?)', [mainid, numero_jid, args]);
                            if (insert) {
                                const numero_send = `${args}@s.whatsapp.net`
                                await sendmessage(instance, numero_send, `Usuario ${numero_jid} se afiliou a você!`, apikey, apiurl);
                                await sendmessage(instance, jid, `Você foi afiliado com sucesso ao usuário ${args}`, apikey, apiurl);
                            } else {
                                await sendmessage(instance, jid, `Erro ao se afiliar`, apikey, apiurl);
                            }

                        }
                    } else {
                        await sendmessage(instance, jid, 'Numero de afiliado não existe!', apikey, apiurl);
                        return;
                    }

                    //insertafiliado(numero_jid, args, mainid)
                    break;

                case "resgatar":
                    if (!args) {
                        const msg = 'Digite o codigo do gift Exemplo: /resgatar PF1WVKIK84GQWK3H3UJX';
                        await sendmessage(instance, jid, msg, apikey, apiurl);
                        return;
                    }
                    const token = args.toUpperCase()
                    const [gifts] = await msgs('SELECT * FROM gifts WHERE mainid = ? AND codigo = ? AND resgatado = ?', [mainid, token, 0]);
                    if (gifts) {
                        const up_gift = await msgs('UPDATE gifts SET resgatado = ?, numero = ? WHERE id = ?', [1, numero_jid, gifts.id]);
                        if (up_gift.affectedRows > 0) {
                            const [contatos] = await msgs('SELECT * FROM contatos WHERE numero = ? AND mainid = ?', [numero_jid, mainid])
                            const saldo_atual = parseFloat(contatos.saldo)
                            const gift_add = parseFloat(gifts.valor)
                            const novo_saldo = gift_add + saldo_atual

                            const up_saldo = await msgs('UPDATE contatos SET saldo = ? WHERE numero = ? AND mainid = ?', [parseFloat(novo_saldo), numero_jid, mainid]);
                            if (up_saldo.affectedRows > 0) {
                                const msg = `*Parabéns !!!!Você acaba de resgatar um gift* 🥳\n\n💰- Valor: R$ ${gift_add}\n💲- Saldo atual: R$ ${parseFloat(novo_saldo)}\n📆 - ${getdata().dataatual_invertida}`;
                                const link = 'https://bot.ultragestor.com/gift.jpeg';
                                await sendimage(instance, jid, msg, apikey, link, apiurl);

                                //LOG DE GRUPO
                                const [grupo_log] = await msgs('SELECT * FROM grupos WHERE log = ? AND mainid = ?', ['1', mainid]);
                                if (grupo_log) {
                                    const msg = `Usuário ${numero_jid} Resgatou o Gift. 🥳\n\n💰- Valor: R$ ${gift_add}\n📆 - ${getdata().dataatual_invertida}`;
                                    await sendmessage(instance, grupo_log.jid, msg, apikey, apiurl);
                                }

                                //LOG DE GRUPO ADMIN
                                const [grupo_log_admin] = await msgs('SELECT * FROM grupos WHERE log_adm = ? AND mainid = ?', ['1', mainid]);
                                if (grupo_log_admin) {
                                    const msg = `Usuário ${numero_jid} Resgatou o Gift. 🥳\n\n💰- Valor: R$ ${gift_add}\n💲- Saldo atual: R$ ${parseFloat(novo_saldo)}\n📆 - ${getdata().dataatual_invertida}`;
                                    await sendmessage(instance, grupo_log_admin.jid, msg, apikey, apiurl);
                                }

                            }
                        }

                    } else {
                        const msg = 'Nenhum gift cadastrado!';
                        await sendmessage(instance, jid, msg, apikey, apiurl);
                    }
                    break
                default:
                    // Lógica para comandos desconhecidos
                    break;
            }
        }
 
    } catch (err) {
        console.log(err)
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

