import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

export const generaHash=password=>bcrypt.hashSync(password, 10);
export const validaHash=(pass, hash)=>bcrypt.compareSync(pass, hash);

export const config = {
  PORT: process.env.PORT,
  MONGO_URL: process.env.MONGO_URL,
  DB_NAME: process.env.DB_NAME,
};