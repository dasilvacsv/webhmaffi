import { msgs } from '../db/db.js';
import  { sendmessage, sendpoll, sendimage } from '../methods.js';
import  { get_produtos, get_produtosCC_GG, get_produtosTelas } from '../db/data.js';
import  { getTimeOfDayInRioDeJaneiro, getdata, saudacao, verificar_numero, mercadopago } from '../utils.js';


import dotenv from 'dotenv';


dotenv.config();

const apiurl = process.env.API_URL;

export async function pollmsg(data) {
    console.log("Sending to poll handler", data);
    
    try {
        const instance = data.instance ?? null
        const [rows] = await msgs('SELECT * FROM auth WHERE token = ?', [instance]);
        if (!rows) return;
        const bot_modo = rows.bot;
        const apikey = rows.jwt;
        const mainid = rows.id;
        let numerobot = rows.numero;

        numerobot = (numerobot !== null) ? numerobot.replace("@s.whatsapp.net", "") : null;
        const jid = data.data?.remoteJid
        const fromMe = data.data?.fromMe
        const bodypoll = data.data?.pollUpdates ?? null
        const tokenmp = rows.tokenmp
        if (jid && jid.includes('status@broadcast')) return;
        if (jid && jid.includes('@g.us')) return;
        let numero_jid = (jid !== null) ? jid.replace("@s.whatsapp.net", "") : null;

        //Get contatos
        const [contatos] = await msgs('SELECT * FROM contatos WHERE numero = ? AND mainid = ?', [numero_jid, mainid]);
        if (!contatos) return;
        const saldo = contatos.saldo
        const nome = contatos.nome
        const [textos] = await msgs('SELECT * FROM textos WHERE mainid = ?', [mainid]);
        function substituirPlaceholders(texto, nome, numero_jid, saldo) {
            return texto.replace(/{user}|{numero}|{saudacao}|{saldo}/g, (match) => {
                switch (match) {
                    case '{user}':
                        return nome;
                    case '{numero}':
                        return numero_jid;
                    case '{saudacao}':
                        return getTimeOfDayInRioDeJaneiro();
                    case '{saldo}':
                        return saldo;
                    default:
                        return match;
                }
            });
        }

        // Aplicando a função em cada variável
        const titulo = substituirPlaceholders(textos.texto_titulo, nome, numero_jid, saldo);
        const texto_suporte = substituirPlaceholders(textos.texto_suporte, nome, numero_jid, saldo);
        const info = substituirPlaceholders(textos.texto_info, nome, numero_jid, saldo);
        const texto_contas = substituirPlaceholders(textos.texto_contas, nome, numero_jid, saldo);
        const texto_telas = substituirPlaceholders(textos.texto_telas, nome, numero_jid, saldo);

        if (bodypoll !== null) {

            //Pega votos padrão
            for (var votos of bodypoll) {
                if (votos.voters == jid) {
                    const votos_selected = votos.name
                    switch (votos_selected) {

                        case "💸 *Fazer recarga*":
                            const teste2 = await sendmessage(instance, jid, "Use o comando: /pix [VALOR]\n\nExemplo: /pix 10", apikey, apiurl);
                            break

                        case "✅ Confirmar Adicionar saldo":
                            const [contato] = await msgs('SELECT * FROM contatos WHERE numero = ? AND mainid = ?', [numero_jid, mainid])
                            const valor = contato.saldoadd
                            if (tokenmp == 0) {
                                await sendmessage(instance, jid, "Token do mercado pago não configurado", apikey, apiurl);
                                return;
                            }
                            //Gerar pagamento
                            const dados_pagamento = await mercadopago(parseFloat(valor), tokenmp)
                            if (dados_pagamento.status == 201) {
                                const idpagamento = dados_pagamento.data.id;
                                const qr = dados_pagamento.data.point_of_interaction.transaction_data.qr_code;
                                const qrcode = dados_pagamento.data.point_of_interaction.transaction_data.qr_code_base64;
                                const text_qr = "💠 *Pix gerado com sucesso*\n\n" +
                                    "```Copie e cole o codigo abaixo ou escaneie o QRCode acima no aplicativo do seu banco.\n" +
                                    "Você tem até 15 minutos para pagar.\n" +
                                    "Seu dinheiro sera adicionado na sua carteira de imediato.```\n\n" +
                                    `*Valor: R$ ${valor}*`
                                const send_qr = await sendimage(instance, jid, text_qr, apikey, qrcode, apiurl);
                                if (send_qr.status == 'PENDING') {
                                    await sendmessage(instance, jid, qr, apikey, apiurl);
                                    const [grupo_log_admin] = await msgs('SELECT * FROM grupos WHERE log_adm = ? AND mainid = ?', ['1', mainid]);
                                    console.log(grupo_log_admin);
                                    
                                    if (grupo_log_admin) {
                                        const msg2 = `Usuário ${numero_jid} Acabou de gerar um pagamento no valor: R$${valor}`;
                                        const jid_grupo = grupo_log_admin.jid;
                                        await sendmessage(instance, jid_grupo, msg2, apikey, apiurl);
                                    }
                                    const status = 'pendente'
                                    await msgs('INSERT INTO pagamentos (idpag, numero, valor, nome, status, mainid, data, tokenmp, instance, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                        [idpagamento, numero_jid, valor, nome, status, mainid, getdata().dataatual, tokenmp, instance, "ADD SALDO"]);
                                } else {
                                    await sendmessage(instance, jid, "Erro ao gerar pagamento", apikey, apiurl);
                                }

                            } else {
                                await sendmessage(instance, jid, "Erro ao gerar pagamento", apikey, apiurl);
                                return;
                            }

                            break

                        case "❌ Cancelar Compra":
                        case "❌ Não confirmar adicionar saldo":
                            saudacao(mainid, nome, numero_jid, saldo, instance, jid, apikey, apiurl)
                            break

                        case "🛒 *Contas Premium*":

                            const dados = await get_produtos(mainid, 1)
                            console.log("Dados from enquete", dados);
                            
                            if (!dados) {
                                await sendmessage(instance, jid, "Estamos sem estoque no momento!", apikey, apiurl);
                                return;
                            }
                            let tabela = 1
                            const tamanhoDaParte = 8;
                            const partes = [];
                            for (let i = 0; i < dados.dados.length; i += tamanhoDaParte) {
                                partes.push(dados.dados.slice(i, i + tamanhoDaParte));
                            }

                            const indiceParaDividir = 8;
                            const parte1 = dados.dados.slice(0, indiceParaDividir);
                            const novoProduto = [`Proximo {${tabela}}`];
                            const indiceParaAdicionar = 9;
                            parte1.splice(indiceParaAdicionar, 0, ...novoProduto);

                            const titulo_enquete = texto_contas + `\n\nPagina: 1 De ${dados.paginas}`
                            await sendpoll(instance, jid, titulo_enquete, apikey, apiurl, parte1)

                            break

                        case "📢 *Informações*":
                            const Informacoes = ['🫂 Afiliados', '📝 Historico de logins']
                            await sendpoll(instance, jid, info, apikey, apiurl, Informacoes)
                            break

                        case "🫂 Afiliados":
                            const msg_Afiliados = "👤 Sistema de Afiliados:\n" +
                                "Compartilhe seu link e ganhe bônus a cada pix inserido\n" +
                                `🔗 Link: https://wa.me/${numerobot}?text=%2Fafiliado%20${numero_jid}\n` +
                                "Usuários Afiliados:";
                            await sendmessage(instance, jid, msg_Afiliados, apikey, apiurl);
                            break

                        case "🗣️ *Suporte*":
                            await sendmessage(instance, jid, texto_suporte, apikey, apiurl);
                            break

                        case "👨🏻‍💻​ *Criador*":
                            const [gruposLog1] = await msgs('SELECT * FROM grupos WHERE log = ? AND mainid = ?', ['1', mainid]);
                            const mensagemLog = "Hello world from group1"
                            sendmessage(instance, gruposLog1.jid, mensagemLog, apikey, apiurl);
                            console.log("GruposLog1", gruposLog1);
                            const [gruposLog2] = await msgs('SELECT * FROM grupos WHERE log_adm = ? AND mainid = ?', ['1', mainid])
                            const mensagemLog2 = "Hello world from group1"
                            sendmessage(instance, gruposLog1.jid, mensagemLog2, apikey, apiurl);

                            console.log("GruposLog2", gruposLog2);

                            const criador = "hello world"

                            console.log("ok now sending message.");
                            

                            await sendmessage(instance, jid, criador, apikey, apiurl);
                            break


                        case "📝 Historico de logins":
                            let msg = "Registros de Compras:\n"
                            const registros = await msgs('SELECT * FROM store WHERE mainid = ? AND numero = ?', [mainid, numero_jid])
                            if (!registros) {
                                msg += "\nSem registros..."
                            } else {
                                registros.forEach(element => {

                                    msg += `\n${element.texto}\n━━━━━━━━━━━━━━━━━━━━━━━━━`
                                })
                            }
                            await sendmessage(instance, jid, msg, apikey, apiurl);
                            break

                        case "💳 *CC*":
                            const dadosCC = await get_produtosCC_GG(mainid, 1, 'cc')
                            if (!dadosCC) {
                                await sendmessage(instance, jid, "Estamos sem estoque no momento!", apikey, apiurl);
                                return;
                            }
                            let tabelacc = 1
                            const tamanhoDaPartecc = 8;
                            const partescc = [];
                            for (let i = 0; i < dadosCC.dados.length; i += tamanhoDaPartecc) {
                                partescc.push(dadosCC.dados.slice(i, i + tamanhoDaPartecc));
                            }

                            const indiceParaDividircc = 8;
                            const parte1cc = dadosCC.dados.slice(0, indiceParaDividircc);
                            const novoProdutocc = [`Mais_CC {${tabelacc}}`];
                            const indiceParaAdicionarcc = 9;
                            parte1cc.splice(indiceParaAdicionarcc, 0, ...novoProdutocc);

                            const titulo_enquetecc = titulo + `\n\nPagina: 1 De ${dadosCC.paginas}`
                            await sendpoll(instance, jid, titulo_enquetecc, apikey, apiurl, parte1cc)

                            break

                        case "🍿 *Telas Streaming*":
                            const dadostelas = await get_produtosTelas(mainid, 1)
                            if (!dadostelas) {
                                await sendmessage(instance, jid, "Estamos sem estoque no momento!", apikey, apiurl);
                                return;
                            }
                            let tabelatelas = 1
                            const tamanhoDaPartetelas = 8;
                            const partestelas = [];
                            for (let i = 0; i < dadostelas.dados.length; i += tamanhoDaPartetelas) {
                                partestelas.push(dadostelas.dados.slice(i, i + tamanhoDaPartetelas));
                            }

                            const indiceParaDividirtelas = 8;
                            const parte1telas = dadostelas.dados.slice(0, indiceParaDividirtelas);
                            const novoProdutotelas = [`MAIS_TELAS {${tabelatelas}}`];
                            const indiceParaAdicionartelas = 9;
                            parte1telas.splice(indiceParaAdicionartelas, 0, ...novoProdutotelas);

                            const titulo_enquetetelas = texto_telas + `\n\nPagina: 1 De ${dadostelas.paginas}`
                            await sendpoll(instance, jid, titulo_enquetetelas, apikey, apiurl, parte1telas)
                            break

                        case "💵 *GG*":
                            const dadosGG = await get_produtosCC_GG(mainid, 1, 'gg')
                            if (!dadosGG) {
                                await sendmessage(instance, jid, "Estamos sem estoque no momento!", apikey, apiurl);
                                return;
                            }
                            let tabelagg = 1
                            const tamanhoDaPartegg = 8;
                            const partesgg = [];
                            for (let i = 0; i < dadosGG.dados.length; i += tamanhoDaPartegg) {
                                partesgg.push(dadosGG.dados.slice(i, i + tamanhoDaPartegg));
                            }

                            const indiceParaDividirgg = 8;
                            const parte1gg = dadosGG.dados.slice(0, indiceParaDividirgg);
                            const novoProdutogg = [`Mais_GG {${tabelagg}}`];
                            const indiceParaAdicionargg = 9;
                            parte1gg.splice(indiceParaAdicionargg, 0, ...novoProdutogg);

                            const titulo_enquetegg = titulo + `\n\nPagina: 1 De ${dadosGG.paginas}`
                            await sendpoll(instance, jid, titulo_enquetegg, apikey, apiurl, parte1gg)
                            break

                        case "✅ *CANCELAR COMPRA*":
                            await msgs('UPDATE contatos SET comprando = 0 WHERE numero = ? AND mainid = ?', [numero_jid, mainid])
                            saudacao(mainid, nome, numero_jid, saldo, instance, jid, apikey, apiurl)
                            break
                        default:
                    }

                    //PROXIMO DE CONTAS PREMIUM
                    if (votos_selected.indexOf('Proximo') !== -1) {
                        const match = votos_selected.match(/\{(.+?)\}/);
                        if (match) {
                            let valor_table = parseInt(match[1]) + 1
                            const dados = await get_produtos(mainid, valor_table, 0)
                            if (!dados) {
                                await sendmessage(instance, jid, "Fim da pagina!", apikey, apiurl);
                                return;
                            }
                            let tabela = 1
                            const tamanhoDaParte = 8;
                            const partes = [];
                            for (let i = 0; i < dados.dados.length; i += tamanhoDaParte) {
                                partes.push(dados.dados.slice(i, i + tamanhoDaParte));
                            }

                            const indiceParaDividir = 8;
                            const parte1 = dados.dados.slice(0, indiceParaDividir);
                            const novoProduto = [`Proximo {${valor_table}}`];
                            const indiceParaAdicionar = 9;
                            parte1.splice(indiceParaAdicionar, 0, ...novoProduto);
                            const novoProduto2 = [`Voltar {${valor_table}}`];
                            const indiceParaAdicionar2 = 9;
                            parte1.splice(indiceParaAdicionar2, 0, ...novoProduto2);

                            const titulo_enquete = texto_contas + `\n\nPagina: ${valor_table} De ${dados.paginas}`
                            await sendpoll(instance, jid, titulo_enquete, apikey, apiurl, parte1)
                        }
                    }
                    //VOLTAR DE CONTAS PREMIUM
                    if (votos_selected.indexOf('Voltar') !== -1) {
                        const match = votos_selected.match(/\{(.+?)\}/);
                        if (match) {
                            let valor_table = parseInt(match[1])
                            if (valor_table == 1) {
                                saudacao(mainid, nome, numero_jid, saldo, instance, jid, apikey, apiurl)
                            } else {
                                valor_table = parseInt(match[1]) - 1
                            }
                            const dados = await get_produtos(mainid, valor_table, 0)
                            if (!dados) {
                                await sendmessage(instance, jid, "Fim da pagina!", apikey, apiurl);
                                return;
                            }
                            let tabela = 1
                            const tamanhoDaParte = 8;
                            const partes = [];
                            for (let i = 0; i < dados.dados.length; i += tamanhoDaParte) {
                                partes.push(dados.dados.slice(i, i + tamanhoDaParte));
                            }

                            const indiceParaDividir = 8;
                            const parte1 = dados.dados.slice(0, indiceParaDividir);
                            const novoProduto = [`Proximo {${valor_table}}`];
                            const indiceParaAdicionar = 9;
                            parte1.splice(indiceParaAdicionar, 0, ...novoProduto);

                            const novoProduto2 = [`Voltar {${valor_table}}`];
                            const indiceParaAdicionar2 = 9;
                            parte1.splice(indiceParaAdicionar2, 0, ...novoProduto2);

                            const titulo_enquete = texto_contas + `\n\nPagina: ${valor_table} De ${dados.paginas}`
                            const teste = await sendpoll(instance, jid, titulo_enquete, apikey, apiurl, parte1)
                        }
                    }

                    if (votos_selected.indexOf('✅ Comprar') !== -1) {
                        const verificarcomprapendente = await verificarcompra(numero_jid, mainid, jid, apikey, apiurl, instance)
                        if (verificarcomprapendente) return
                        await msgs('UPDATE contatos SET comprando = 1 WHERE numero = ? AND mainid = ?', [numero_jid, mainid])
                        const match = votos_selected.match(/\{(.+?)\}/);
                        if (match) {
                            let produto = await msgs('SELECT * FROM produtos WHERE disponivel = ? AND mainid = ? AND categoria = ?', ['0', mainid, match[1]]);
                            let categoria = await msgs('SELECT * FROM categoria WHERE status = ? AND mainid = ? AND id = ?', [1, mainid, match[1]])
                            if (categoria.length <= 0) {
                                categoria = await msgs('SELECT * FROM categoria_cc WHERE ativo = ? AND mainid = ? AND id = ?', [1, mainid, match[1]])
                            }
                            if (!produto || produto.length <= 0 || !categoria || categoria.length <= 0) {
                                await sendmessage(instance, jid, "Produto não disponivel tente outro!", apikey, apiurl);
                                return;
                            }
                            function getRandomIndex(array) {
                                return Math.floor(Math.random() * array.length);
                            }

                            const produtoAleatorio = produto[getRandomIndex(produto)];

                            const upd_produto = await msgs('UPDATE produtos SET dono = ?, disponivel = ? WHERE mainid = ? AND id = ?', [numero_jid, '1', mainid, produtoAleatorio.id]);
                            if (upd_produto.affectedRows > 0) {
                                const saldo_apos = parseFloat(saldo) - parseFloat(categoria[0].valor)
                                let dadosAcesso = `📅 DATA RENOVAÇÃO: ${getdata().data30dias2}\n` +
                                    `👤 Usuário: ${produtoAleatorio.email}\n` +
                                    `🔐 Senha: ${produtoAleatorio.senha}\n` +
                                    `💲 Valor: ${categoria[0].valor}\n`

                                if (produtoAleatorio.tipo === 'gg' || produtoAleatorio.tipo === 'cc') {
                                    const cartao = produtoAleatorio[produtoAleatorio.tipo].split('-');
                                    dadosAcesso = `💳 Número: ${cartao[0]}\n` +
                                        `🗓️ Validade: ${cartao[1]}/${cartao[2]}\n` +
                                        `🔐 CVV: ${cartao[3]}\n` +
                                        `💲 Valor: ${categoria[0].valor}\n` +
                                        "Cartão formatado:\n" +
                                        `*${cartao[0]}|${cartao[1]}|${cartao[2]}|${cartao[3]}*\n\n`;
                                }

                                const msg = `🛍️ Produto: ${categoria[0].nome}\n\n` +
                                    `${dadosAcesso}` +
                                    `${produtoAleatorio.produto}\n\n` +
                                    `💰 Saldo antes: ${saldo}\n` +
                                    `💰 Saldo Atual: ${saldo_apos.toFixed(2)}\n\nℹ️ Informações Adicional:\n${categoria[0].descricao}`
                                await msgs('INSERT INTO store (numero, mainid, texto, id_produto, data, valor, nome, notificado, vencido) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [numero_jid, mainid, msg, produtoAleatorio.id, getdata().data30dias, categoria[0].valor, nome, 0, 0]);

                                const [grupo_log] = await msgs('SELECT * FROM grupos WHERE log = ? AND mainid = ?', ['1', mainid]);
                                console.log("Grupo Log", grupo_log);
                                
                                const [grupo_log_admin] = await msgs('SELECT * FROM grupos WHERE log_adm = ? AND mainid = ?', ['1', mainid]);
                                console.log("Grupo Log adm", grupo_log_admin);

                                
                                let img = false
                                let link = false
                                if (categoria[0].img != '0') {
                                    img = true
                                    link = categoria[0].img
                                }
                                await msgs('UPDATE contatos SET saldo = ? WHERE numero = ? AND mainid = ?', [saldo_apos.toFixed(2), numero_jid, mainid])
                                if (img) {
                                    await sendimage(instance, jid, msg, apikey, link, apiurl)
                                    if (grupo_log) {
                                        const msg = `🛍️ +1 REF 🛍️ \n\n` +
                                            `👤 Usuário wa.me/${numero_jid}\n` +
                                            `🛍️ Produto: ${categoria[0].nome}\n` +
                                            `💰 Valor: ${categoria[0].valor}\n` +
                                            "📅 Validade: 30 Dias"

                                        const jid_grupo = grupo_log.jid;
                                        await sendmessage(instance, jid_grupo, msg, apikey, apiurl);
                                    }

                                    if (grupo_log_admin) {
                                        const msg = `🛍️ VENDA 🛍️\n\n` +
                                            `👤 Usuário wa.me/${numero_jid}\n` +
                                            `💰 Saldo antes: ${saldo}\n` +
                                            `💰 Saldo Atual: ${saldo_apos.toFixed(2)}\n\n` +
                                            `🛍️ Produto: ${categoria[0].nome}\n` +
                                            `📅 DATA RENOVAÇÃO: ${getdata().data30dias2}\n` +
                                            `👤 Usuário: ${produtoAleatorio.email}\n` +
                                            `🔐 Senha: ${produtoAleatorio.senha}\n`

                                        const jid_grupo = grupo_log_admin.jid;
                                        await sendmessage(instance, jid_grupo, msg, apikey, apiurl);
                                    }

                                } else {
                                    await sendmessage(instance, jid, msg, apikey, apiurl);
                                    if (grupo_log) {
                                        const msg = `🛍️ VENDA 🛍️\n\n` +
                                            `👤 Usuário wa.me/${numero_jid}\n` +
                                            `🛍️ Produto: ${categoria[0].nome}\n` +
                                            `💰 Valor: ${categoria[0].valor}\n` +
                                            "📅 Validade: 30 Dias"

                                        const jid_grupo = grupo_log.jid;
                                        await sendmessage(instance, jid_grupo, msg, apikey, apiurl);
                                    }

                                    if (grupo_log_admin) {
                                        const msg = `🛍️ VENDA 🛍️\n\n` +
                                            `👤 Usuário wa.me/${numero_jid}\n` +
                                            `💰 Saldo antes: ${saldo}\n` +
                                            `💰 Saldo Atual: ${saldo_apos.toFixed(2)}\n\n` +
                                            `🛍️ Produto: ${categoria[0].nome}\n` +
                                            `📅 DATA RENOVAÇÃO: ${getdata().data30dias2}\n` +
                                            `👤 Usuário: ${produtoAleatorio.email}\n` +
                                            `🔐 Senha: ${produtoAleatorio.senha}\n`

                                        const jid_grupo = grupo_log_admin.jid;
                                        await sendmessage(instance, jid_grupo, msg, apikey, apiurl);
                                    }
                                }
                                await msgs('UPDATE contatos SET comprando = 0 WHERE numero = ? AND mainid = ?', [numero_jid, mainid])

                            } else {
                                await sendmessage(instance, jid, "Erro ao atualiza produto!", apikey, apiurl);
                                return;
                            }


                        }

                    }

                    if (votos_selected.indexOf('Mais_CC') !== -1) {
                        const match = votos_selected.match(/\{(.+?)\}/);
                        if (match) {
                            let valor_table = parseInt(match[1]) + 1
                            const dados = await get_produtosCC_GG(mainid, valor_table, 'cc')
                            if (!dados) {
                                await sendmessage(instance, jid, "Fim da pagina!", apikey, apiurl);
                                return;
                            }
                            let tabela = 1
                            const tamanhoDaParte = 8;
                            const partes = [];
                            for (let i = 0; i < dados.dados.length; i += tamanhoDaParte) {
                                partes.push(dados.dados.slice(i, i + tamanhoDaParte));
                            }

                            const indiceParaDividir = 8;
                            const parte1 = dados.dados.slice(0, indiceParaDividir);
                            const novoProduto = [`Mais_CC {${valor_table}}`];
                            const indiceParaAdicionar = 9;
                            parte1.splice(indiceParaAdicionar, 0, ...novoProduto);
                            const novoProduto2 = [`Menos_CC {${valor_table}}`];
                            const indiceParaAdicionar2 = 9;
                            parte1.splice(indiceParaAdicionar2, 0, ...novoProduto2);

                            const titulo_enquete = titulo + `\n\nPagina: ${valor_table} De ${dados.paginas}`
                            const teste = await sendpoll(instance, jid, titulo_enquete, apikey, apiurl, parte1)
                        }
                    }
                    if (votos_selected.indexOf('Menos_CC') !== -1) {
                        const match = votos_selected.match(/\{(.+?)\}/);
                        if (match) {
                            let valor_table = parseInt(match[1])

                            if (valor_table == 1) {
                                saudacao(mainid, nome, numero_jid, saldo, instance, jid, apikey, apiurl)
                            } else {
                                valor_table = parseInt(match[1]) - 1
                            }
                            const dados = await get_produtosCC_GG(mainid, valor_table, 'cc')
                            if (!dados) {
                                await sendmessage(instance, jid, "Fim da pagina!", apikey, apiurl);
                                return;
                            }
                            let tabela = 1
                            const tamanhoDaParte = 8;
                            const partes = [];
                            for (let i = 0; i < dados.dados.length; i += tamanhoDaParte) {
                                partes.push(dados.dados.slice(i, i + tamanhoDaParte));
                            }

                            const indiceParaDividir = 8;
                            const parte1 = dados.dados.slice(0, indiceParaDividir);
                            const novoProduto = [`Mais_CC {${valor_table}}`];
                            const indiceParaAdicionar = 9;
                            parte1.splice(indiceParaAdicionar, 0, ...novoProduto);

                            const novoProduto2 = [`Menos_CC {${valor_table}}`];
                            const indiceParaAdicionar2 = 9;
                            parte1.splice(indiceParaAdicionar2, 0, ...novoProduto2);

                            const titulo_enquete = titulo + `\n\nPagina: ${valor_table} De ${dados.paginas}`
                            const teste = await sendpoll(instance, jid, titulo_enquete, apikey, apiurl, parte1)
                        }
                    }
                    if (votos_selected.indexOf('Mais_GG') !== -1) {
                        const match = votos_selected.match(/\{(.+?)\}/);
                        if (match) {
                            let valor_table = parseInt(match[1]) + 1
                            const dados = await get_produtosCC_GG(mainid, valor_table, 'gg')
                            if (!dados) {
                                await sendmessage(instance, jid, "Fim da pagina!", apikey, apiurl);
                                return;
                            }
                            let tabela = 1
                            const tamanhoDaParte = 8;
                            const partes = [];
                            for (let i = 0; i < dados.dados.length; i += tamanhoDaParte) {
                                partes.push(dados.dados.slice(i, i + tamanhoDaParte));
                            }

                            const indiceParaDividir = 8;
                            const parte1 = dados.dados.slice(0, indiceParaDividir);
                            const novoProduto = [`Mais_GG {${valor_table}}`];
                            const indiceParaAdicionar = 9;
                            parte1.splice(indiceParaAdicionar, 0, ...novoProduto);
                            const novoProduto2 = [`Menos_GG {${valor_table}}`];
                            const indiceParaAdicionar2 = 9;
                            parte1.splice(indiceParaAdicionar2, 0, ...novoProduto2);

                            const titulo_enquete = titulo + `\n\nPagina: ${valor_table} De ${dados.paginas}`
                            const teste = await sendpoll(instance, jid, titulo_enquete, apikey, apiurl, parte1)
                        }
                    }
                    if (votos_selected.indexOf('Menos_GG') !== -1) {
                        const match = votos_selected.match(/\{(.+?)\}/);
                        if (match) {
                            let valor_table = parseInt(match[1])

                            if (valor_table == 1) {
                                saudacao(mainid, nome, numero_jid, saldo, instance, jid, apikey, apiurl)
                            } else {
                                valor_table = parseInt(match[1]) - 1
                            }
                            const dados = await get_produtosCC_GG(mainid, valor_table, 'gg')
                            if (!dados) {
                                await sendmessage(instance, jid, "Fim da pagina!", apikey, apiurl);
                                return;
                            }
                            let tabela = 1
                            const tamanhoDaParte = 8;
                            const partes = [];
                            for (let i = 0; i < dados.dados.length; i += tamanhoDaParte) {
                                partes.push(dados.dados.slice(i, i + tamanhoDaParte));
                            }

                            const indiceParaDividir = 8;
                            const parte1 = dados.dados.slice(0, indiceParaDividir);
                            const novoProduto = [`Mais_GG {${valor_table}}`];
                            const indiceParaAdicionar = 9;
                            parte1.splice(indiceParaAdicionar, 0, ...novoProduto);

                            const novoProduto2 = [`Menos_GG {${valor_table}}`];
                            const indiceParaAdicionar2 = 9;
                            parte1.splice(indiceParaAdicionar2, 0, ...novoProduto2);

                            const titulo_enquete = titulo + `\n\nPagina: ${valor_table} De ${dados.paginas}`
                            const teste = await sendpoll(instance, jid, titulo_enquete, apikey, apiurl, parte1)
                        }
                    }
                    if (votos_selected.indexOf('MAIS_TELAS') !== -1) {
                        const match = votos_selected.match(/\{(.+?)\}/);
                        if (match) {
                            let valor_table = parseInt(match[1]) + 1
                            const dados = await get_produtosTelas(mainid, valor_table)
                            if (!dados) {
                                await sendmessage(instance, jid, "Fim da pagina!", apikey, apiurl);
                                return;
                            }
                            let tabela = 1
                            const tamanhoDaParte = 8;
                            const partes = [];
                            for (let i = 0; i < dados.dados.length; i += tamanhoDaParte) {
                                partes.push(dados.dados.slice(i, i + tamanhoDaParte));
                            }

                            const indiceParaDividir = 8;
                            const parte1 = dados.dados.slice(0, indiceParaDividir);
                            const novoProduto = [`MAIS_TELAS {${valor_table}}`];
                            const indiceParaAdicionar = 9;
                            parte1.splice(indiceParaAdicionar, 0, ...novoProduto);
                            const novoProduto2 = [`MENOS_TELAS {${valor_table}}`];
                            const indiceParaAdicionar2 = 9;
                            parte1.splice(indiceParaAdicionar2, 0, ...novoProduto2);

                            const titulo_enquete = titulo + `\n\nPagina: ${valor_table} De ${dados.paginas}`
                            const teste = await sendpoll(instance, jid, titulo_enquete, apikey, apiurl, parte1)
                        }
                    }
                    if (votos_selected.indexOf('MENOS_TELAS') !== -1) {
                        const match = votos_selected.match(/\{(.+?)\}/);
                        if (match) {
                            let valor_table = parseInt(match[1])

                            if (valor_table == 1) {
                                saudacao(mainid, nome, numero_jid, saldo, instance, jid, apikey, apiurl)
                            }
                        }
                    }

                    const produtosGET = await msgs('SELECT * FROM produtos WHERE disponivel = ? AND mainid = ?', [0, mainid]);
                    const categorias = await msgs('SELECT * FROM categoria WHERE mainid = ? AND status = ?', [mainid, 1]);
                    const categorias2 = await msgs('SELECT * FROM categoria_cc WHERE mainid = ? AND ativo="1"', [mainid]);

                    // Função para verificar saldo e enviar mensagem de confirmação
                    async function processarCompra(element, tipoProduto) {
                        const verificconta = produtosGET.find(dados => dados.categoria == element.id && (dados.tipo == tipoProduto || dados.tipo == null));
                        if (votos_selected.indexOf(`[${element.id}] ${element.nome}`) !== -1 && verificconta) {
                            if (parseFloat(saldo) < parseFloat(element.valor)) {
                                const texto = "⚠️ *Saldo Insuficiente*\n\n" +
                                    "Desculpe, mas o seu saldo não é suficiente para realizar a compra desse produto. 🛒💸\n\n" +
                                    "Por favor, utilize o comando `/pix [VALOR]` para adicionar fundos à sua conta.\n\n" +
                                    "Exemplo: `/pix 10`\n\n" +
                                    "Agradecemos a compreensão e estamos à disposição para qualquer dúvida ou assistência. 💼🤝";

                                await sendmessage(instance, jid, texto, apikey, apiurl);
                                return;
                            }

                            const saldo_apos = parseFloat(saldo) - parseFloat(element.valor);
                            const text = `🎉 *Confirmação de Compra* 🛍️\n\n` +
                                `Olá ${nome}! Agradecemos por escolher nosso serviço. Aqui estão os detalhes da sua compra:\n\n` +
                                `*Produto:* ${element.nome}\n` +
                                `*Valor:* R$ ${element.valor}\n` +
                                `*Seu saldo:* R$ ${saldo}\n` +
                                `*Saldo após:* R$ ${saldo_apos.toFixed(2)}\n\n` +
                                "Confirma compra?";

                            const coluns = [`✅ Comprar {${element.id}}`, '❌ Cancelar Compra'];
                            await sendpoll(instance, jid, text, apikey, apiurl, coluns);
                        }
                    }

                    // Processar categorias para os tipos '0' e 'null'
                    for (const element of categorias) {
                        await processarCompra(element, '0');
                    }

                    // Processar categorias para o tipo 'tela'
                    for (const element of categorias) {
                        await processarCompra(element, 'tela');
                    }

                    // Processar categorias_cc para os tipos 'cc' e 'gg'
                    for (const element of categorias2) {
                        await processarCompra(element, 'cc');
                        await processarCompra(element, 'gg');
                    }

                    //VERIFICAR SE O CLIENTE JA TEM UMA COMPRA PENDENTE
                    async function verificarcompra(numero_jid, mainid, jid, apikey, apiurl, instance) {
                        const contatos = await msgs('SELECT * FROM contatos WHERE numero = ? AND mainid = ? AND comprando = 1', [numero_jid, mainid]);
                        if (contatos.length > 0) {
                            await sendpoll(instance, jid, 'Você tem uma compra pendente. Por favor, cancele a compra anterior para continuar com uma nova.', apikey, apiurl, ['✅ *CANCELAR COMPRA*', '...']);
                            return true;
                        } else {
                            return false;
                        }
                    }


                }
            }
        }
    } catch (error) {
        console.log(error)
    }
}