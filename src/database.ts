import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

export const db = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 5, // conexões simultâneas (bom para leitura)
  idleTimeoutMillis: 30000, // fecha conexões inativas
});
