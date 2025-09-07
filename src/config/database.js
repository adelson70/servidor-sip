require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
  host: process.env.NODE_ENV === 'production' ? process.env.DB_HOST_PROD : process.env.DB_HOST_DEV,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 5, // conexões simultâneas (bom para leitura)
  idleTimeoutMillis: 30000, // fecha conexões inativas
});

module.exports = { db };