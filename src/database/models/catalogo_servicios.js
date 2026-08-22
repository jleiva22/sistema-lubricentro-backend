import { DataTypes, Model } from 'sequelize';

export const Catalogo_Table = 'catalogo_servicios';

const CatalogoSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING(30),
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  tipo: {
    type: DataTypes.ENUM('servicio', 'producto', 'revision'),
    allowNull: false,
    defaultValue: 'servicio',
  },
  categoria: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'motor',
  },
  marca: {
    type: DataTypes.STRING(80),
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  stock_actual: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tiempo_minutos: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  kilometraje_recomendado: {
    type: DataTypes.INTEGER,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
};

export class Catalogo extends Model {
  static associate(models) {
    // Un servicio/producto puede aparecer en muchos detalles de órdenes
    this.hasMany(models.DetalleOrden, {
      foreignKey: 'servicio_id',
      as: 'detalles_orden',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      modelName: 'Catalogo',
      tableName: Catalogo_Table,
      timestamps: true,
    };
  }
}

export { CatalogoSchema };