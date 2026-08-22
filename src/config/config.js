import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'dev',
  port: process.env.PORT || 3000,
  dbUser: process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQLUSER || 'lubricentro_admin',
  dbUsername: process.env.DB_USERNAME || process.env.DB_USER || process.env.MYSQLUSER || 'lubricentro_admin',
  dbPassword: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  dbHost: process.env.DB_HOST || process.env.MYSQLHOST || 'db',
  dbName: process.env.DB_NAME || process.env.MYSQLDATABASE || 'lubricentro_db',
  dbPort: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
};