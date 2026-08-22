'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('ordenes_trabajo', 'estado', {
      type: Sequelize.ENUM('agendada', 'recepcionado', 'en_proceso', 'completado', 'pagado', 'cancelado'),
      defaultValue: 'recepcionado',
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('ordenes_trabajo', 'estado', {
      type: Sequelize.ENUM('recepcionado', 'en_proceso', 'completado', 'pagado', 'cancelado'),
      defaultValue: 'recepcionado',
      allowNull: false,
    });
  }
};
