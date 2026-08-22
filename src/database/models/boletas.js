import { DataTypes, Model } from 'sequelize';
import { Orden_Table } from './ordenes_trabajo.js';

export const Boleta_Table = 'boletas';

const BoletaSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orden_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: Orden_Table,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  numero_boleta: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  fecha_emision: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  nombre_empresa: {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: 'Lubricentro',
  },
  rut_empresa: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: '76.000.000-0',
  },
  direccion_empresa: {
    type: DataTypes.STRING(200),
    defaultValue: 'Av. Principal 123, Santiago',
  },
  email_empresa: {
    type: DataTypes.STRING(120),
    defaultValue: 'contacto@lubricentro.cl',
  },
  telefono_empresa: {
    type: DataTypes.STRING(50),
    defaultValue: '+56 9 1234 5678',
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
  estado: {
    type: DataTypes.ENUM('emitida', 'anulada'),
    allowNull: false,
    defaultValue: 'emitida',
  },
};

export class Boleta extends Model {
  static associate(models) {
    this.belongsTo(models.Orden, {
      foreignKey: 'orden_id',
      as: 'orden',
    });

    this.hasMany(models.BoletaDetalle, {
      foreignKey: 'boleta_id',
      as: 'detalles',
      onDelete: 'CASCADE',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      modelName: 'Boleta',
      tableName: Boleta_Table,
      timestamps: true,
    };
  }
}

export { BoletaSchema };
