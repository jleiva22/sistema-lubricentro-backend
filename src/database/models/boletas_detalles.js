import { DataTypes, Model } from 'sequelize';

export const BoletaDetalle_Table = 'boletas_detalles';

const BoletaDetalleSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  boleta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'boletas',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  servicio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'catalogo_servicios',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  },
  nombre_servicio: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
};

export class BoletaDetalle extends Model {
  static associate(models) {
    this.belongsTo(models.Boleta, {
      foreignKey: 'boleta_id',
      as: 'boleta',
    });

    this.belongsTo(models.Catalogo, {
      foreignKey: 'servicio_id',
      as: 'servicio',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      modelName: 'BoletaDetalle',
      tableName: BoletaDetalle_Table,
      timestamps: true,
    };
  }
}

export { BoletaDetalleSchema };
