import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'dev',
  port: process.env.PORT || 3000,
  dbUser: process.env.DB_USER || process.env.DB_USERNAME || 'lubricentro_admin',
  dbUsername: process.env.DB_USERNAME || process.env.DB_USER || 'lubricentro_admin',
  dbPassword: process.env.DB_PASSWORD || '',
  dbHost: process.env.DB_HOST || 'db',
  dbName: process.env.DB_NAME || 'lubricentro_db',
  dbPort: Number(process.env.DB_PORT || 3306),
};