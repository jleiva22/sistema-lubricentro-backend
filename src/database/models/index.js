// import { Sequelize } from "sequelize";
import {Boleta, BoletaSchema} from './boletas.js'
import {BoletaDetalle, BoletaDetalleSchema} from './boletas_detalles.js'
import {Cliente, ClienteSchema} from './clientes.js'
import {Catalogo, CatalogoSchema} from './catalogo_servicios.js'
import {DetalleOrden, DetalleOrdenesSchema} from './detalle_ordenes.js'
import {Orden, OrdenSchema} from './ordenes_trabajo.js'
import {Usuario, UsuarioSchema} from './usuarios.js'
import {Vehiculos, VehiculoSchema} from './vehiculos.js'


export function setupModels(sequelize){

    Usuario.init(UsuarioSchema, Usuario.config(sequelize));
    Cliente.init(ClienteSchema, Cliente.config(sequelize));
    Vehiculos.init(VehiculoSchema, Vehiculos.config(sequelize));
    Catalogo.init(CatalogoSchema, Catalogo.config(sequelize));
    Orden.init(OrdenSchema, Orden.config(sequelize));
    DetalleOrden.init(DetalleOrdenesSchema, DetalleOrden.config(sequelize));
    Boleta.init(BoletaSchema, Boleta.config(sequelize));
    BoletaDetalle.init(BoletaDetalleSchema, BoletaDetalle.config(sequelize));
    // 2. Definición de Asociaciones

    // Usuarios <-> Clientes
    Usuario.hasOne(Cliente, { foreignKey: 'usuario_id', as: 'perfil_cliente' });
    Cliente.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

    // Clientes <-> Vehiculos (1 a N)
    Cliente.hasMany(Vehiculos, { foreignKey: 'cliente_id', as: 'vehiculos', onDelete: 'RESTRICT' });
    Vehiculos.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente', onDelete: 'RESTRICT' });

    // Vehiculos <-> Ordenes de Trabajo (1 a N)
    Vehiculos.hasMany(Orden, { foreignKey: 'vehiculo_id', as: 'ordenes' });
    Orden.belongsTo(Vehiculos, { foreignKey: 'vehiculo_id', as: 'vehiculo' });

    // Orden de Trabajo <-> DetalleOrden (1 a N, con eliminación en cascada)
    Orden.hasMany(DetalleOrden, { foreignKey: 'orden_id', as: 'detalles', onDelete: 'CASCADE' });
    DetalleOrden.belongsTo(Orden, { foreignKey: 'orden_id', as: 'orden' });

    // Catalogo (Servicios/Productos) <-> DetalleOrden (1 a N)
    Catalogo.hasMany(DetalleOrden, { foreignKey: 'servicio_id', as: 'detalles_orden' });
    DetalleOrden.belongsTo(Catalogo, { foreignKey: 'servicio_id', as: 'servicio' });

    // Orden -> Boleta (1 a 1)
    Orden.hasOne(Boleta, { foreignKey: 'orden_id', as: 'boleta' });
    Boleta.belongsTo(Orden, { foreignKey: 'orden_id', as: 'orden' });

    // Cliente -> Boletas (1 a N)
    Cliente.hasMany(Boleta, { foreignKey: 'cliente_id', as: 'boletas' });
    Boleta.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

    // Boleta -> Detalles (1 a N)
    Boleta.hasMany(BoletaDetalle, { foreignKey: 'boleta_id', as: 'detalles', onDelete: 'CASCADE' });
    BoletaDetalle.belongsTo(Boleta, { foreignKey: 'boleta_id', as: 'boleta' });

    // Catalogo -> Detalles de boleta
    Catalogo.hasMany(BoletaDetalle, { foreignKey: 'servicio_id', as: 'boletas_detalle' });
    BoletaDetalle.belongsTo(Catalogo, { foreignKey: 'servicio_id', as: 'servicio' });
}

