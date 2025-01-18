// handlers/index.js

// Import handlers
import { messagem, conexao, contatos } from './msg.js';
import { pollmsg } from './poll.js';

// Re-export all handlers
export {
    conexao,
    contatos,
    messagem,
    pollmsg
};

// Optional: Export them as a group if you want to import them all at once
export const handlers = {
    conexao,
    contatos,
    messagem,
    pollmsg
};