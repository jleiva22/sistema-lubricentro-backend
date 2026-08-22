import { DataTypes, Model } from 'sequelize';
import { Cliente_Table } from './clientes.js';

const VEHICULO_TABLE = 'vehiculos';

const VehiculoSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Cliente_Table,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  },
  patente: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  marca: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  modelo: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  kilometraje_actual: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
};

class Vehiculos extends Model {
  static associate(models) {
    // Pertenece a un Cliente
    this.belongsTo(models.Cliente, {
      foreignKey: 'cliente_id',
      as: 'cliente',
    });

    // Tiene muchas Ordenes de trabajo
    this.hasMany(models.Orden, {
      foreignKey: 'vehiculo_id',
      as: 'ordenes',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: VEHICULO_TABLE,
      modelName: 'Vehiculo',
      timestamps: true,
    };
  }
}

export { VEHICULO_TABLE, VehiculoSchema, Vehiculos };
