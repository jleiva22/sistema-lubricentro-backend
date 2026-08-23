import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const authConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'secret_key_access',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'secret_key_refresh',
  accessExpiresIn: '15m',
  refreshExpiresIn: '7d',
  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  },
};