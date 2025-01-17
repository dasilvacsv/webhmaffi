import axios from 'axios';


//Enviar msg de texto
export async function sendmessage(instance, jid, msg, apikey, apiurl) {
    const url = `${apiurl}/message/sendText/${instance}`;

    const data = {
        number: `${jid}`,
        options: {
            delay: 1200,
            presence: "composing",
            linkPreview: false
        },
        textMessage: {
            text: `${msg}`
        }
    }

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Apikey': `${apikey}`
            }
        });
        if (response.status == 201) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error)
        return false;
        throw error;
    }
}

//Enviar msg com imagem
export async function sendimage(instance, jid, msg, apikey, link, apiurl) {
    const url = `${apiurl}/message/sendMedia/${instance}`;

    const data = {
        number: `${jid}`,
        options: {
            delay: 1200,
            presence: "composing"
        },
        mediaMessage: {
            mediatype: "image",
            caption: `${msg}`,
            media: `${link}`
        }
    };
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

//Enviar audio
export async function sendaudio(instance, jid, apikey, link, apiurl) {
    const url = `${apiurl}/message/sendWhatsAppAudio/${instance}`;

    const data = {
        number: `${jid}`,
        options: {
            delay: 1200,
            presence: "recording",
            encoding: true
        },
        audioMessage: {
            audio: `${link}`
        }
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

//Enviar enquetes 
export async function sendpoll(acessotoken, jid, msg, apikey, apiurl, coluns) {
    const url = `${apiurl}/message/sendPoll/${acessotoken}`;
    const data = {
        number: `${jid}`,
        options: {
            delay: 1200,
            presence: "composing"
        },
        pollMessage: {
            name: `${msg}`,
            selectableCount: 1,
            values: coluns
        }
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
        console.error(error.response.data.response);
        return false;
    }
}

export async function sendvideo(acessotoken, jid, msg, apikey, apiurl, link) {
    const url = `${apiurl}/message/sendMedia/${acessotoken}`;
    const data = {
        number: `${jid}`,
        options: {
            delay: 1200,
            presence: "composing"
        },
        mediaMessage: {
            mediatype: "video",
            caption: `${msg}`,
            media: `${link}`
        }
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
        return false;
    }
}
