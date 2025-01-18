import { DateTime } from 'luxon';
import axios from 'axios';
import  { sendmessage, sendpoll, sendimage } from './methods.js';
import { msgs } from './db/db.js';
import { v4 as uuidv4 } from 'uuid';


export async function getdata() {
console.log("Getting data...");

}

export async function getTimeOfDayInRioDeJaneiro() {
    console.log("Getting time rio de janeiro");
    
    const now = DateTime.now();
    const rioDeJaneiroTimeZone = 'America/Sao_Paulo';
    const rioDeJaneiroTime = now.setZone(rioDeJaneiroTimeZone);
    const hours = rioDeJaneiroTime.hour;

    if (hours < 6) {
        return "Boa Madrugada";
    } else if (hours >= 6 && hours < 12) {
        return "Bom dia";
    } else if (hours >= 12 && hours < 18) {
        return "Boa tarde";
    } else {
        return "Boa noite";
    }
}

export async function verificar_numero(instance, numero, apiurl, apikey) {
    const url = `${apiurl}/chat/whatsappNumbers/${instance}`;

    const data = {
        "numbers": [
            `${numero}`
        ]
    }
    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Apikey': `${apikey}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Erro ao enviar a requisição:', error.message);
        throw error;
    }
}



export async function saudacao(mainid, nome, numero_jid, bonus, instance, jid, apikey, apiurl) {

    let [contatoSalvo] = await msgs('SELECT * FROM contatos WHERE numero = ? AND mainid = ?', [numero_jid, mainid]);
    // Inserir contato e enviar mensagem de bônus
    if (bonus !== 0 && !contatoSalvo) {

        await msgs('INSERT INTO contatos (mainid, numero, nome, foto, saldo) VALUES (?, ?, ?, ?, ?)', [mainid, numero_jid, nome, null, bonus]);

        // Mensagem de bônus
        const mensagemBonus = `Parabéns! Você acaba de ganhar um bônus 🥳\n\nValor: R$ ${bonus}\nSaldo atual: R$ ${bonus}`;
        const imagemBonus = 'https://bot.ultragestor.com/gift.jpeg';


        // Enviar imagem com mensagem de bônus
        await sendimage(instance, jid, mensagemBonus, apikey, imagemBonus, apiurl);

        const [gruposLog1] = await msgs('SELECT * FROM grupos WHERE log = ? AND mainid = ?', ['1', mainid]);
        console.log(gruposLog1);
        
        const [gruposLog2] = await msgs('SELECT * FROM grupos WHERE log_adm = ? AND mainid = ?', ['1', mainid])
        console.log(gruposLog2);
        

        if (gruposLog1) {
            const mensagemLog = `Usuário ${numero_jid} ganhou um bônus.\n\nValor: R$ ${bonus}`;
            sendmessage(instance, gruposLog1.jid, mensagemLog, apikey, apiurl);
        }

        if (gruposLog2) {
            const mensagemLog = `Usuário ${numero_jid} ganhou um bônus.\n\nValor: R$ ${bonus}\nSaldo atual: R$ ${bonus}`;
            sendmessage(instance, gruposLog2.jid, mensagemLog, apikey, apiurl);
        }

    }

    [contatoSalvo] = await msgs('SELECT * FROM contatos WHERE numero = ? AND mainid = ?', [numero_jid, mainid]);
    console.log(["contatosalvo",contatoSalvo]);
    
    if(!contatoSalvo){
        await msgs('INSERT INTO contatos (mainid, numero, nome, foto, saldo) VALUES (?, ?, ?, ?, ?)', [mainid, numero_jid, nome, null, bonus]);
    }
    // Variáveis para controle de estoque
    let estoqueCC = 0, estoqueGG = 0, telas = 0;

    // Obter categorias de cartões CC e GG
    const categorias = await msgs('SELECT * FROM categoria_cc WHERE mainid = ? AND ativo="1"', [mainid]);

    // Obter produtos e cartões CC e GG
    const produtos = await msgs('SELECT * FROM produtos WHERE disponivel = ? AND mainid = ?', [0, mainid]);
    const cc = await msgs('SELECT * FROM produtos WHERE mainid = ? AND disponivel="0" AND tipo = ?', [mainid, 'cc']);
    const gg = await msgs('SELECT * FROM produtos WHERE mainid = ? AND disponivel="0" AND tipo = ?', [mainid, 'gg']);

    // Contar itens nos estoques de CC e GG
    categorias.forEach(categoria => {
        estoqueCC += cc.filter(item => item.categoria === categoria.id).length;
        estoqueGG += gg.filter(item => item.categoria === categoria.id).length;
    });

    // Definir opções para a enquete baseada nos estoques e telas
    let opcoesEnquete = ['💸 *Fazer recarga*', '🛒 *Contas Premium*', '📢 *Informações*', '🗣️ *Suporte*', '👨🏻‍💻​ *Criador*'];

    // Contar produtos do tipo "telas"
    produtos.forEach(produto => {
        if (['tela'].includes(produto.tipo)) {
            telas++;
        }
    });

    if (telas > 0 || estoqueCC > 0 || estoqueGG > 0) {
        opcoesEnquete = [
            '💸 *Fazer recarga*',
            ...(estoqueCC > 0 ? ['💳 *CC*'] : []),
            ...(estoqueGG > 0 ? ['💵 *GG*'] : []),
            '🛒 *Contas Premium*',
            ...(telas > 0 ? ['🍿 *Telas Streaming*'] : []),
            '📢 *Informações*',
            '🗣️ *Suporte*',
            '👨🏻‍💻​ *Criador*'
        ];
    }
    [contatoSalvo] = await msgs('SELECT * FROM contatos WHERE numero = ? AND mainid = ?', [numero_jid, mainid]);
    if (!contatoSalvo) return

    const [textos] = await msgs('SELECT * FROM textos WHERE mainid = ?', [mainid]);

    const msg2 = textos.texto_titulo.replace(/{user}|{numero}|{saudacao}|{saldo}/g, match => {
        switch (match) {
            case '{user}': return nome;
            case '{numero}': return numero_jid;
            case '{saudacao}': return getTimeOfDayInRioDeJaneiro();
            case '{saldo}': return contatoSalvo.saldo;
            default: return match;
        }
    });
    // Enviar enquete com as opções configuradas
    await sendpoll(instance, jid, msg2, apikey, apiurl, opcoesEnquete);
}

//Mercado pago
export async function mercadopago(valor, token) {

    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 15);
    const formattedDate = dt.toISOString();

    const data = {
        transaction_amount: valor, // Certifique-se de que valor está definido
        description: 'bot_contas',
        payment_method_id: 'pix',
        payer: { email: 'exemplo@gmail.com' },
        binary_mode: true,
        external_reference: 'bot_contas',
        notification_url: 'https://vmstorepro.com.br/mercadopago.php',
        date_of_expiration: formattedDate,
    };

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': uuidv4(),
    };

    try {
        const response = await axios.post('https://api.mercadopago.com/v1/payments', data, { headers });
        return response

    } catch (error) {
        console.error('Erro ao enviar a solicitação:', error.message);
        throw error;
    }
}
