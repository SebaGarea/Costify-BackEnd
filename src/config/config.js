import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

export const generaHash=password=>bcrypt.hashSync(password, 10);
export const validaHash=(pass, hash)=>bcrypt.compareSync(pass, hash);

export const config = {
  PORT: process.env.PORT,
  MONGO_URL: process.env.MONGO_URL,
  DB_NAME: process.env.DB_NAME,
};