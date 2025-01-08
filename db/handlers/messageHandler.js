

// handlers/messageHandler.js
import { db } from '../db';
import { messages, contacts } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function handleMessage(data) {
  try {
    // Save message
    await db.insert(messages).values({
      remoteJid: data.key.remoteJid,
      messageId: data.key.id,
      fromMe: data.key.fromMe,
      pushName: data.pushName,
      message: data.message,
      messageType: data.messageType,
      messageTimestamp: new Date(data.messageTimestamp * 1000),
      owner: data.owner,
      source: data.source
    });

    // Update or create contact
    await db.insert(contacts)
      .values({
        jid: data.key.remoteJid,
        pushName: data.pushName,
        lastMessageAt: new Date(),
        metadata: { lastMessageType: data.messageType }
      })
      .onConflictDoUpdate({
        target: contacts.jid,
        set: {
          pushName: data.pushName,
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      });

    console.log('Message saved successfully');
  } catch (error) {
    console.error('Error saving message:', error);
  }
}
