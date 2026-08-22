'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const boletasExistentes = await queryInterface.sequelize.query(
      'SELECT id FROM boletas',
      { type: QueryTypes.SELECT }
    );

    if (boletasExistentes.length > 0) {
      return;
    }

    const orden = await queryInterface.sequelize.query(
      `
        SELECT o.id, o.subtotal, o.iva, o.total, o.boleta_emitida,
               v.id as vehiculo_id, v.patente, v.marca, v.modelo,
               c.id as cliente_id, c.nombre, c.apellido, c.rut, c.telefono, c.email
        FROM ordenes_trabajo o
        LEFT JOIN vehiculos v ON v.id = o.vehiculo_id
        LEFT JOIN clientes c ON c.id = v.cliente_id
        ORDER BY o.id DESC
        LIMIT 1
      `,
      { type: QueryTypes.SELECT }
    );

    if (!orden.length) {
      return;
    }

    const ordenActual = orden[0];
    const detalles = await queryInterface.sequelize.query(
      `
        SELECT d.id, d.orden_id, d.servicio_id, d.cantidad, d.precio_unitario, d.subtotal,
               s.nombre as nombre_servicio
        FROM detalle_ordenes d
        LEFT JOIN catalogo_servicios s ON s.id = d.servicio_id
        WHERE d.orden_id = :ordenId
      `,
      {
        replacements: { ordenId: ordenActual.id },
        type: QueryTypes.SELECT,
      }
    );

    if (!detalles.length) {
      return;
    }

    const numeroBoleta = `BL-${new Date().getFullYear()}-${String(ordenActual.id).padStart(6, '0')}`;

    const [boletaInsertada] = await queryInterface.bulkInsert('boletas', [
      {
        orden_id: ordenActual.id,
        numero_boleta: numeroBoleta,
        fecha_emision: new Date(),
        nombre_empresa: 'Lubricentro',
        rut_empresa: '76.000.000-0',
        direccion_empresa: 'Av. Principal 123, Santiago',
        email_empresa: 'contacto@lubricentro.cl',
        telefono_empresa: '+56 9 1234 5678',
        subtotal: ordenActual.subtotal,
        iva: ordenActual.iva,
        total: ordenActual.total,
        estado: 'emitida',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { returning: true });

    const boletaId = boletaInsertada?.id || (await queryInterface.sequelize.query(
      `SELECT id FROM boletas WHERE orden_id = :ordenId LIMIT 1`,
      { replacements: { ordenId: ordenActual.id }, type: QueryTypes.SELECT }
    ))[0]?.id;

    const detallesBoleta = detalles.map((detalle) => ({
      boleta_id: boletaId,
      servicio_id: detalle.servicio_id,
      nombre_servicio: detalle.nombre_servicio || 'Servicio',
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      subtotal: detalle.subtotal,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (detallesBoleta.length > 0) {
      await queryInterface.bulkInsert('boletas_detalles', detallesBoleta, {});
    }

    await queryInterface.sequelize.query(
      'UPDATE ordenes_trabajo SET boleta_emitida = true, updatedAt = NOW() WHERE id = :ordenId',
      {
        replacements: { ordenId: ordenActual.id },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('boletas_detalles', null, {});
    await queryInterface.bulkDelete('boletas', null, {});
  },
};
