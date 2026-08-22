import dotenv from 'dotenv';

dotenv.config();

export const authConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'lubricentro_access_secret_dev',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'lubricentro_refresh_secret_dev',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'none', // <-- ¡EL CAMBIO CLAVE! Permite cross-origin
    secure: true,     // <-- Ponlo en true directamente. Railway usa HTTPS y sameSite 'none' OBLIGA a que secure sea true.
    path: '/',
    // expires: ... (puedes dejarlo o quitarlo, ya lo estás manejando en auth.services.js con maxAge)
  },
};
