// handlers/contactHandler.js
import { db } from '../db';
import { contacts } from '../db/schema';

export async function handleContactUpdate(data) {
  try {
    await db.insert(contacts)
      .values({
        jid: data.id,
        pushName: data.pushName,
        metadata: data,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: contacts.jid,
        set: {
          pushName: data.pushName,
          metadata: data,
          updatedAt: new Date()
        }
      });

    console.log('Contact updated successfully');
  } catch (error) {
    console.error('Error updating contact:', error);
  }
}