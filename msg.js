// msg.js
import axios from 'axios';
import { msgs } from './db.js';
import  { sendmessage } from './handlers.js';
import dotenv from 'dotenv';


dotenv.config();

const apiurl = process.env.API_URL;
const globalkey = process.env.API_KEY;


/* UTILS FUNCTIONS */

function getdata() {
console.log("Getting data...");

}

function getTimeOfDayInRioDeJaneiro() {
  console.log("Getting time rio de jaineiro")
}

async function verificar_numero(instance, numero, apiurl, apikey) {
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

/* DB  */

async function get_produtosTelas(mainid, pagina) {
    try {
        const categorias = await msgs('SELECT * FROM categoria WHERE mainid = ? AND status = ?', [mainid, 1])

        if (categorias && categorias.length > 0) {
            let dados = [];
    
            const produtos = await msgs('SELECT * FROM produtos WHERE disponivel = ? AND mainid = ?', [0, mainid])
            const produtosPorCategoria = new Map();
            produtos.forEach(element => {
                const categoriaCorrespondente = categorias.find(categoria => categoria.status === 1 && categoria.id === element.categoria && (element.tipo == 'tela'));
                if (categoriaCorrespondente) {
                    if (!produtosPorCategoria.has(categoriaCorrespondente.id)) {
                        produtosPorCategoria.set(categoriaCorrespondente.id, []);
                    }
                    produtosPorCategoria.get(categoriaCorrespondente.id).push(element);
                }
            });
    
            produtosPorCategoria.forEach((produtosDaCategoria, id) => {
                const categoria = categorias.find(categoria => categoria.id === id);
                const nome = categoria.nome;
                const valor = categoria.valor;
                const estoque = produtosDaCategoria.length;
    
                dados.push(`[${categoria.id}] ${nome}\n - 💰Valor: ${valor}\n - Estoque: ${estoque}`);
            });
    
            const dadosPorPagina = 8;
            const totalPaginas = Math.ceil(dados.length / dadosPorPagina);
            const startIndex = (pagina - 1) * dadosPorPagina;
            const endIndex = startIndex + dadosPorPagina;
            if (startIndex >= dados.length || pagina < 1) {
                return false;
            }
    
            // Retornar a parte do array correspondente à página solicitada
            return { "dados": dados.slice(startIndex, endIndex), "paginas": totalPaginas };
        } else {
            return false;
        }
    } catch (error) {
        console.log(error)
    }

}

async function get_produtosCC_GG(mainid, pagina, tipo) {
    try {
        const categorias = await msgs('SELECT * FROM categoria_cc WHERE mainid = ? AND ativo="1"', [mainid])
        if (categorias && categorias.length > 0) {
            let dados = [];

            const produtos = await msgs('SELECT * FROM produtos WHERE disponivel = ? AND mainid = ?', [0, mainid])
            const produtosPorCategoria = new Map();
            produtos.forEach(element => {
                const categoriaCorrespondente = categorias.find(categoria => categoria.ativo === 1 && categoria.id === element.categoria && element.tipo == tipo);
                if (categoriaCorrespondente) {
                    if (!produtosPorCategoria.has(categoriaCorrespondente.id)) {
                        produtosPorCategoria.set(categoriaCorrespondente.id, []);
                    }
                    produtosPorCategoria.get(categoriaCorrespondente.id).push(element);
                }
            });

            produtosPorCategoria.forEach((produtosDaCategoria, id) => {
                const categoria = categorias.find(categoria => categoria.id === id);
                const nome = categoria.nome;
                const valor = categoria.valor;
                const estoque = produtosDaCategoria.length;

                dados.push(`[${categoria.id}] ${nome}\n - 💰Valor: ${valor}\n - Estoque: ${estoque}`);
            });

            const dadosPorPagina = 8;
            const totalPaginas = Math.ceil(dados.length / dadosPorPagina);
            const startIndex = (pagina - 1) * dadosPorPagina;
            const endIndex = startIndex + dadosPorPagina;
            if (startIndex >= dados.length || pagina < 1) {
                return false;
            }

            // Retornar a parte do array correspondente à página solicitada
            return { "dados": dados.slice(startIndex, endIndex), "paginas": totalPaginas };
        } else {
            return false;
        }
    } catch (error) {
        console.log(error)
    }

}

async function get_produtos(mainid, pagina) {
    try {
        const categorias = await msgs('SELECT * FROM categoria WHERE mainid = ? AND status = ?', [mainid, 1])

        if (categorias && categorias.length > 0) {
            let dados = [];

            const produtos = await msgs('SELECT * FROM produtos WHERE disponivel = ? AND mainid = ?', [0, mainid])
            const produtosPorCategoria = new Map();
            produtos.forEach(element => {
                const categoriaCorrespondente = categorias.find(categoria => categoria.status === 1 && categoria.id === element.categoria && element.tipo == '0');
                if (categoriaCorrespondente) {
                    if (!produtosPorCategoria.has(categoriaCorrespondente.id)) {
                        produtosPorCategoria.set(categoriaCorrespondente.id, []);
                    }
                    produtosPorCategoria.get(categoriaCorrespondente.id).push(element);
                }
            });

            produtosPorCategoria.forEach((produtosDaCategoria, id) => {
                const categoria = categorias.find(categoria => categoria.id === id);
                const nome = categoria.nome;
                const valor = categoria.valor;
                const estoque = produtosDaCategoria.length;

                dados.push(`[${categoria.id}] ${nome}\n - 💰Valor: ${valor}\n - Estoque: ${estoque}`);
            });

            const dadosPorPagina = 8;
            const totalPaginas = Math.ceil(dados.length / dadosPorPagina);
            const startIndex = (pagina - 1) * dadosPorPagina;
            const endIndex = startIndex + dadosPorPagina;
            if (startIndex >= dados.length || pagina < 1) {
                return false;
            }

            // Retornar a parte do array correspondente à página solicitada
            return { "dados": dados.slice(startIndex, endIndex), "paginas": totalPaginas };
        } else {
            return false;
        }
    } catch (error) {
        console.log(error)
    }

}



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

        const dados = await get_produtos(mainid, 1)
        console.log(dados);

        await sendmessage(instance, jid, dados, apikey, apiurl);

        


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

