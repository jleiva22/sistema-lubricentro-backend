'use strict';

const bcrypt = require('bcrypt');
const { QueryTypes } = require('sequelize');

const filterExisting = async (queryInterface, table, field, rows) => {
  const existingRows = await queryInterface.sequelize.query(
    `SELECT ${field} FROM ${table}`,
    { type: QueryTypes.SELECT }
  );

  const existingValues = new Set(existingRows.map((item) => String(item[field]).toLowerCase()));
  return rows.filter((row) => !existingValues.has(String(row[field]).toLowerCase()));
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const rows = [
      {
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@lubricentro.cl',
        password_hash: await bcrypt.hash('Admin123!', 10),
        rol: 'administrador',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nombre: 'Mecánico',
        apellido: 'Taller',
        email: 'mecanico@lubricentro.cl',
        password_hash: await bcrypt.hash('Mecanico123!', 10),
        rol: 'mecanico',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nombre: 'Cliente',
        apellido: 'Demo',
        email: 'cliente@lubricentro.cl',
        password_hash: await bcrypt.hash('Cliente123!', 10),
        rol: 'cliente',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const recordsToInsert = await filterExisting(queryInterface, 'usuarios', 'email', rows);
    if (recordsToInsert.length > 0) {
      await queryInterface.bulkInsert('usuarios', recordsToInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuarios', null, {});
  },
};
