// index.js
import { config } from 'dotenv';
import { io } from "socket.io-client";
import { handleMessage } from './handlers/messageHandler';
import { handleContactUpdate } from './handlers/contactHandler';
import { handleConnection } from './handlers/connectionHandler';

config(); // Load environment variables

const userRoute = process.env.WEBSOCKET_URL || 'ws://localhost:8080';
const socket = io(userRoute, {
    transports: ["websocket"],
});

socket.on("connect", () => {
    console.log(`Connected to WebSocket route ${userRoute} successfully`);
});

socket.on("messages.upsert", async (data) => {
    console.log('Received message:', data);
    await handleMessage(data);
});

socket.on("messages.update", async (data) => {
    console.log('Message update:', data);
    // Handle message updates if needed
});

socket.on("contacts.update", async (data) => {
    console.log('Contact update:', data);
    await handleContactUpdate(data);
});

socket.on("connection.update", async (data) => {
    console.log('Connection update:', data);
    await handleConnection(data);
});

socket.on("disconnect", () => {
    console.log(`Disconnected from WebSocket route ${userRoute}`);
});

socket.on("connect_error", (error) => {
    console.log(`Connection error to route ${userRoute}:`, error.message);
});

process.on('SIGINT', async () => {
    socket.disconnect();
    process.exit(0);
});