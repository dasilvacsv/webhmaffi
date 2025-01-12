import { db } from './index.js';
import * as schema from './schema.js';

async function testConnection() {
  try {
    const result = await db.select().from(schema.messages).limit(1);
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();