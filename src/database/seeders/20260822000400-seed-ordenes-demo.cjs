'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const clientes = await queryInterface.sequelize.query(
      'SELECT id, nombre, email FROM clientes ORDER BY id ASC',
      { type: QueryTypes.SELECT }
    );

    if (!clientes.length) {
      return;
    }

    const vehiculos = await queryInterface.sequelize.query(
      'SELECT id, cliente_id, patente, marca, modelo FROM vehiculos ORDER BY id ASC',
      { type: QueryTypes.SELECT }
    );

    if (!vehiculos.length) {
      return;
    }

    const servicios = await queryInterface.sequelize.query(
      'SELECT id, codigo, nombre, precio_unitario FROM catalogo_servicios ORDER BY id ASC',
      { type: QueryTypes.SELECT }
    );

    if (!servicios.length) {
      return;
    }

    const ordenesActuales = await queryInterface.sequelize.query(
      'SELECT id FROM orden',
      { type: QueryTypes.SELECT }
    );

    if (ordenesActuales.length > 0) {
      return;
    const servicioAceite = servicios.find((item) => String(item.codigo).includes('ACE-003')) || servicios[0];
    const servicioFiltro = servicios.find((item) => String(item.codigo).includes('FILT')) || servicios[1] || servicios[0];

    const ordenesActuales = await queryInterface.sequelize.query(
      'SELECT id FROM ordenes_trabajo',
      { type: QueryTypes.SELECT }
    );

    if (ordenesActuales.length > 0) {
      return;
    }

    const [vehiculo] = await queryInterface.sequelize.query(
      'SELECT id FROM vehiculos LIMIT 1',
      { type: QueryTypes.SELECT }
    );

    const [ordenCreada] = await queryInterface.bulkInsert('ordenes_trabajo', [
      {
        vehiculo_id: vehiculo?.id || 1,
        fecha_ingreso: new Date(),
        kilometraje_ingreso: 45000,
        proximo_cambio_km: 55000,
        observaciones_fallas: 'Cambio de aceite sintético 5W-30 y filtro de aceite',
        observaciones_reparacion: 'Servicio realizado sin inconvenientes',
        estado: 'en_proceso',
        pagado: false,
        boleta_emitida: false,
        subtotal: 35000.0,
        iva: 6650.0,
        total: 41650.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { returning: true });

    await queryInterface.bulkInsert('detalle_ordenes', [
      {
        orden_id: ordenCreada?.id || 1,
        servicio_id: 1,
        cantidad: 1,
        precio_unitario: 25000.0,
        subtotal: 25000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orden_id: ordenCreada?.id || 1,
        servicio_id: 2,
        cantidad: 1,
        precio_unitario: 10000.0,
        subtotal: 10000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('detalle_ordenes', null, {});
    await queryInterface.bulkDelete('ordenes_trabajo', null, {});
  },
};
