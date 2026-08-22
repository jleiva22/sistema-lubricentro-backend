import { DataTypes, Model } from 'sequelize';

export const Usuario_Table = 'usuarios';

export const UsuarioSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('administrador', 'cliente', 'mecanico'),
    allowNull: false,
    defaultValue: 'cliente',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
};

export class Usuario extends Model {
  static associate(models) {
    this.hasOne(models.Cliente, {
      foreignKey: 'usuario_id',
      as: 'perfil_cliente',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      modelName: 'Usuario',
      tableName: Usuario_Table,
      timestamps: true,
    };
  }
}
