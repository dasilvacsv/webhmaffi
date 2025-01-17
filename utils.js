import { DateTime } from 'luxon';
import axios from 'axios';


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
console.log(mainid, nome, numero_jid, bonus, instance, jid, apikey, apiurl);

    
}