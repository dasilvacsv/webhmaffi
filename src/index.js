// server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { config } from 'dotenv';
import { handlers } from "./handlers/index.js";


config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Your existing socket client
const userRoute = process.env.WEBSOCKET_URL || 'ws://46.202.150.164:8080';
const clientSocket = ioClient(userRoute, {
    transports: ["websocket"]
});

// Forward events from your client to connected clients
clientSocket.on("messages.upsert", (data) => {
    handlers.messagem(data)
    io.emit("messages.upsert", data);
});

clientSocket.on("messages.update", (data) => {
    handlers.pollmsg(data)
    io.emit("messages.update", data);
});

clientSocket.on("contacts.update", (data) => {
    handlers.contatos(data)
    io.emit("contacts.update", data);
});

clientSocket.on("connection.update", (data) => {
    handlers.conexao(data)
    io.emit("connection.update", data);
});

// Handle connections to your server
io.on("connection", (socket) => {
    console.log("Client connected");
    
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Make checkPag function