import { config as appConfig } from '../config/config.js';

const env = process.env.NODE_ENV || 'development';
const config = appConfig;

const USER = encodeURIComponent(config.dbUser || config.dbUsername || '');
const PASSWORD = encodeURIComponent(config.dbPassword || '');
const HOST = config.dbHost || 'db';
const PORT = Number(config.dbPort || 3306);
const DB_NAME = config.dbName || '';

const URI = `mysql://${USER}:${PASSWORD}@${HOST}:${PORT}/${DB_NAME}`;

export default {
  development: {
    username: USER,
    password: PASSWORD,
    database: DB_NAME,
    host: HOST,
    port: PORT,
    url: URI,
    dialect: 'mysql'
  },
  production: {
    username: USER,
    password: PASSWORD,
    database: DB_NAME,
    host: HOST,
    port: PORT,
    url: URI,
    dialect: 'mysql'
  }
}[env] || {
  username: USER,
  password: PASSWORD,
  database: DB_NAME,
  host: HOST,
  port: PORT,
  url: URI,
  dialect: 'mysql'
};