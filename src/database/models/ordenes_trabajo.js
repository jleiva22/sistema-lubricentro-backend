import { DataTypes, Model } from 'sequelize';
import { VEHICULO_TABLE } from './vehiculos.js';

const Orden_Table = 'ordenes_trabajo';

const OrdenSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: VEHICULO_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  fecha_ingreso: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  fecha_programada: {
    type: DataTypes.DATE,
  },
  fecha_finalizacion: {
    type: DataTypes.DATE,
  },
  kilometraje_ingreso: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  proximo_cambio_km: {
    type: DataTypes.INTEGER,
  },
  observaciones_fallas: {
    type: DataTypes.TEXT,
  },
  observaciones_reparacion: {
    type: DataTypes.TEXT,
  },
  estado: {
    type: DataTypes.ENUM('recepcionado', 'en_proceso', 'completado', 'pagado', 'cancelado'),
    defaultValue: 'recepcionado',
    allowNull: false,
  },
  pagado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  boleta_emitida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  iva: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
};

class Orden extends Model {
  static associate(models) {
    // 1. Relación con Vehículo
    this.belongsTo(models.Vehiculo, {
      foreignKey: 'vehiculo_id',
      as: 'vehiculo', // <-- AQUÍ: Debe decir exactamente 'vehiculo'
    });

    // 2. Relación con los detalles de la orden
    this.hasMany(models.DetalleOrden, {
      foreignKey: 'orden_id',
      as: 'detalles', // <-- AQUÍ: Debe decir exactamente 'detalles'
    });
  }


  static config(sequelize) {
    return {
      sequelize,
      modelName: 'Orden',
      tableName: Orden_Table,
      timestamps: true,
    };
  }
}

export { Orden_Table, Orden, OrdenSchema };
