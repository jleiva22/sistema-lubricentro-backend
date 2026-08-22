'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('boletas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      orden_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'orden',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      numero_boleta: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      fecha_emision: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      nombre_empresa: {
        type: Sequelize.STRING(150),
        allowNull: false,
        defaultValue: 'Lubricentro',
      },
      rut_empresa: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: '76.000.000-0',
      },
      direccion_empresa: {
        type: Sequelize.STRING(200),
        defaultValue: 'Av. Principal 123, Santiago',
      },
      email_empresa: {
        type: Sequelize.STRING(120),
        defaultValue: 'contacto@lubricentro.cl',
      },
      telefono_empresa: {
        type: Sequelize.STRING(50),
        defaultValue: '+56 9 1234 5678',
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      iva: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      estado: {
        type: Sequelize.ENUM('emitida', 'anulada'),
        allowNull: false,
        defaultValue: 'emitida',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('boletas');
  },
};
