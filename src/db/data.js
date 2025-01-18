import { msgs } from './db.js';


export async function get_produtosTelas(mainid, pagina) {
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

export async function get_produtosCC_GG(mainid, pagina, tipo) {
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

export async function get_produtos(mainid, pagina) {
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

