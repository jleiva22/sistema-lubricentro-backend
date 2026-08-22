'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('boletas');

    if (!table.cliente_id) {
      await queryInterface.addColumn('boletas', 'cliente_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clientes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE boletas b
      LEFT JOIN orden o ON o.id = b.orden_id
      LEFT JOIN vehiculos v ON v.id = o.vehiculo_id
      SET b.cliente_id = v.cliente_id
      WHERE b.cliente_id IS NULL
    `);

    await queryInterface.changeColumn('boletas', 'cliente_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('boletas');

    if (table.cliente_id) {
      await queryInterface.removeColumn('boletas', 'cliente_id');
    }
  },
};
