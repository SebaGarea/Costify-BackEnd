import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

export const generaHash=password=>bcrypt.hashSync(password, 12);
export const validaHash=(pass, hash)=>{
  try {
    return bcrypt.compareSync(pass, hash);
  } catch {
    return false;
  }
};

export const config = {
  PORT: process.env.PORT,
  MONGO_URL: process.env.MONGO_URL,
  DB_NAME: process.env.DB_NAME,
};