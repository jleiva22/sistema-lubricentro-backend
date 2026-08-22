'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('clientes');

    if (!table.usuario_id) {
      await queryInterface.addColumn('clientes', 'usuario_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('clientes');

    if (table.usuario_id) {
      await queryInterface.removeColumn('clientes', 'usuario_id');
    }
  },
};
