// handlers/connectionHandler.js
import { db } from '../db';
import { connections } from '../db/schema';

export async function handleConnection(data) {
  try {
    await db.insert(connections).values({
      instance: data.instance,
      status: data.connection,
      metadata: data
    });

    console.log('Connection status saved');
  } catch (error) {
    console.error('Error saving connection status:', error);
  }
}