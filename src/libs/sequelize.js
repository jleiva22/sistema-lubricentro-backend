import { Sequelize } from 'sequelize';
import { config } from '../config/config.js';
import { setupModels } from '../database/models/index.js';

const sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPassword, {
  host: config.dbHost,
  port: config.dbPort,
  dialect: 'mysql',
  logging: true,
});

setupModels(sequelize);

export const models = sequelize.models;
export default sequelize;