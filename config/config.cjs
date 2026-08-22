const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  development: {
    username: process.env.DB_USER || process.env.DB_USERNAME || 'lubricentro_admin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lubricentro_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USER || process.env.DB_USERNAME || 'lubricentro_admin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lubricentro_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
  },
};
