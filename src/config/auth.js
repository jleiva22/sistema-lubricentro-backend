import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const authConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'lubricentro_access_secret_dev',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'lubricentro_refresh_secret_dev',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  cookieOptions: {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
  },
};
