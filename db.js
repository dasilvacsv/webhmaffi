// db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT,
  queueLimit: 0
});


export async function msgs(query, params) { 
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(query, params);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}