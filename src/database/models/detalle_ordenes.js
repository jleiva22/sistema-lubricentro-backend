import { DataTypes, Model } from 'sequelize';
import { Catalogo_Table } from './catalogo_servicios.js';
import { Orden_Table } from './ordenes_trabajo.js';

export const DetalleOrden_Table = 'detalle_ordenes';

export const DetalleOrdenesSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orden_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Orden_Table,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  servicio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Catalogo_Table,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
};

class DetalleOrden extends Model {
  static associate(models) {
    // Relación con Catálogo / Servicio
    this.belongsTo(models.Catalogo, {
      foreignKey: 'servicio_id',
      as: 'servicio', // <-- AQUÍ: Debe decir exactamente 'servicio'
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      modelName: 'DetalleOrden',
      tableName: DetalleOrden_Table,
      timestamps: true,
    };
  }
}
