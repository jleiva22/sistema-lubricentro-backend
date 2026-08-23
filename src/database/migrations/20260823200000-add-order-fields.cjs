'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Agregar campo tipo_aceite
    await queryInterface.addColumn('ordenes_trabajo', 'tipo_aceite', {
      type: Sequelize.ENUM('mineral', 'semisintetico', 'sintetico'),
      allowNull: true,
      after: 'observaciones_reparacion',
    });

    // 2. Agregar campo marca_aceite
    await queryInterface.addColumn('ordenes_trabajo', 'marca_aceite', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'tipo_aceite',
    });

    // 3. Agregar campo tiempo_estimado (minutos)
    await queryInterface.addColumn('ordenes_trabajo', 'tiempo_estimado', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'marca_aceite',
    });

    // 4. Actualizar ENUM de estado para incluir 'solicitado'
    // MySQL requiere ALTER COLUMN para cambiar ENUM
    await queryInterface.changeColumn('ordenes_trabajo', 'estado', {
      type: Sequelize.ENUM('solicitado', 'agendada', 'recepcionado', 'en_proceso', 'completado', 'pagado', 'cancelado'),
      defaultValue: 'recepcionado',
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ordenes_trabajo', 'tipo_aceite');
    await queryInterface.removeColumn('ordenes_trabajo', 'marca_aceite');
    await queryInterface.removeColumn('ordenes_trabajo', 'tiempo_estimado');

    await queryInterface.changeColumn('ordenes_trabajo', 'estado', {
      type: Sequelize.ENUM('agendada', 'recepcionado', 'en_proceso', 'completado', 'pagado', 'cancelado'),
      defaultValue: 'recepcionado',
      allowNull: false,
    });
  },
};
