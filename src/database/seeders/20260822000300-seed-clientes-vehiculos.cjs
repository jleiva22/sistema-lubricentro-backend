'use strict';

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
    const clientes = [
      {
        nombre: 'María',
        apellido: 'Castro',
        rut: '12.345.678-9',
        telefono: '+56 9 1111 2222',
        email: 'maria.castro@example.com',
        usuario_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nombre: 'Pedro',
        apellido: 'Sánchez',
        rut: '18.765.432-1',
        telefono: '+56 9 3333 4444',
        email: 'pedro.sanchez@example.com',
        usuario_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nombre: 'Luis',
        apellido: 'Ramírez',
        rut: '19.876.543-2',
        telefono: '+56 9 5555 6666',
        email: 'luis.ramirez@example.com',
        usuario_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const clientesSinDuplicar = await filterExisting(queryInterface, 'clientes', 'email', clientes);
    if (clientesSinDuplicar.length > 0) {
      await queryInterface.bulkInsert('clientes', clientesSinDuplicar, {});
    }

    const insertedClientes = await queryInterface.sequelize.query(
      "SELECT id, email FROM clientes ORDER BY id ASC",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const clienteMapa = new Map();
    insertedClientes.forEach((cliente) => {
      clienteMapa.set(String(cliente.email).toLowerCase(), cliente.id);
    });

    const vehiculos = [
      {
        cliente_id: clienteMapa.get('maria.castro@example.com'),
        patente: 'ABCD12',
        marca: 'Toyota',
        modelo: 'Corolla',
        anio: 2020,
        kilometraje_actual: 15000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        cliente_id: clienteMapa.get('pedro.sanchez@example.com'),
        patente: 'DFGH34',
        marca: 'Ford',
        modelo: 'Focus',
        anio: 2022,
        kilometraje_actual: 18000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        cliente_id: clienteMapa.get('luis.ramirez@example.com'),
        patente: 'JKLZ56',
        marca: 'Honda',
        modelo: 'Civic',
        anio: 2019,
        kilometraje_actual: 22000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        cliente_id: clienteMapa.get('maria.castro@example.com'),
        patente: 'QWER78',
        marca: 'Chevrolet',
        modelo: 'Spark',
        anio: 2018,
        kilometraje_actual: 26000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ].filter((vehiculo) => vehiculo.cliente_id != null);

    const patentesExistentes = await queryInterface.sequelize.query(
      'SELECT patente FROM vehiculos',
      { type: QueryTypes.SELECT }
    );
    const patentesSet = new Set(patentesExistentes.map((item) => String(item.patente).toLowerCase()));

    const vehiculosSinDuplicar = vehiculos.filter((vehiculo) => !patentesSet.has(String(vehiculo.patente).toLowerCase()));

    if (vehiculosSinDuplicar.length > 0) {
      await queryInterface.bulkInsert('vehiculos', vehiculosSinDuplicar, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('vehiculos', null, {});
    await queryInterface.bulkDelete('clientes', null, {});
  },
};
