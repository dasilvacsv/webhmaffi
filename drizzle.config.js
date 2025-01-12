export default {
  out: "./drizzle",
  schema: "./db/schema.js",
  driver: "pg",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "whatsapp"
  }
};