import { DataTypes, Model } from 'sequelize';
import { Usuario_Table } from './usuarios.js';

const Cliente_Table = 'clientes';

const ClienteSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuario_Table,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
  },
  rut: {
    type: DataTypes.STRING(12),
    unique: true,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING(20),
  },
  email: {
    type: DataTypes.STRING(100),
    validate: {
      isEmail: true,
    },
  },
};

class Cliente extends Model {
  static associate(models) {
    // Relación 1 a N: Un cliente tiene muchos vehículos
    this.hasMany(models.Vehiculo, {
      foreignKey: 'cliente_id',
      as: 'vehiculos',
    });

    this.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      modelName: 'Cliente',
      tableName: Cliente_Table,
      timestamps: true,
    };
  }
}

export { Cliente_Table, ClienteSchema, Cliente };
