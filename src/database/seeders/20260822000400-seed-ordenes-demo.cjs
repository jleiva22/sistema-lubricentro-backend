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
    }

    const vehiculo = vehiculos[0];
    const servicioAceite = servicios.find((item) => String(item.codigo).includes('ACE-003')) || servicios[0];
    const servicioFiltro = servicios.find((item) => String(item.codigo).includes('FILT')) || servicios[1] || servicios[0];

    const subtotal = Number(servicioAceite.precio_unitario) + Number(servicioFiltro.precio_unitario);
    const iva = Number((subtotal * 0.19).toFixed(2));
    const total = Number((subtotal + iva).toFixed(2));

    const [ordenCreada] = await queryInterface.bulkInsert('orden', [
      {
        vehiculo_id: vehiculo.id,
        fecha_ingreso: new Date(),
        fecha_programada: new Date(Date.now() + 86400000),
        kilometraje_ingreso: vehiculo.kilometraje_actual || 15000,
        proximo_cambio_km: 10000,
        observaciones_fallas: 'Falta potencia y ruido al arrancar',
        observaciones_reparacion: 'Cambio de aceite sintético y filtro de aceite',
        estado: 'recepcionado',
        pagado: false,
        boleta_emitida: false,
        subtotal,
        iva,
        total,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { returning: true });

    await queryInterface.bulkInsert('detalle_ordenes', [
      {
        orden_id: ordenCreada?.id || 1,
        servicio_id: servicioAceite.id,
        cantidad: 1,
        precio_unitario: servicioAceite.precio_unitario,
        subtotal: servicioAceite.precio_unitario,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orden_id: ordenCreada?.id || 1,
        servicio_id: servicioFiltro.id,
        cantidad: 1,
        precio_unitario: servicioFiltro.precio_unitario,
        subtotal: servicioFiltro.precio_unitario,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('detalle_ordenes', null, {});
    await queryInterface.bulkDelete('orden', null, {});
  },
};
