import { models } from '../libs/sequelize.js';
import sequelize from '../libs/sequelize.js';

const buildIncludes = () => [
  {
    model: models.Orden,
    as: 'orden',
    include: [
      {
        model: models.Vehiculo,
        as: 'vehiculo',
        include: [{ model: models.Cliente, as: 'cliente' }],
      },
      {
        model: models.DetalleOrden,
        as: 'detalles',
        include: [{ model: models.Catalogo, as: 'servicio' }],
      },
    ],
  },
  {
    model: models.BoletaDetalle,
    as: 'detalles',
    include: [{ model: models.Catalogo, as: 'servicio' }],
  },
];

export const getAll = async (user = null) => {
  const where = {};

  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    // Busca el ID del cliente evaluando distintas propiedades de req.user
    const clienteId = user.cliente_id || user.clienteId || user.perfil_cliente?.id || user.id;

    if (clienteId) {
      where.cliente_id = clienteId;
    }
  }

  return await models.Boleta.findAll({
    where,
    include: buildIncludes(),
    order: [['fecha_emision', 'DESC']],
  });
};

export const getById = async (id, user = null) => {
  const boleta = await models.Boleta.findByPk(id, { include: buildIncludes() });
  if (!boleta) {
    throw new Error('La boleta no existe');
  }

  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.clienteId || user.perfil_cliente?.id || user.id;
    if (Number(boleta.cliente_id) !== Number(clienteId)) {
      const err = new Error('No autorizado para ver esta boleta');
      err.statusCode = 403;
      throw err;
    }
  }

  return boleta;
};

export const getByOrderId = async (ordenId, user = null) => {
  const boleta = await models.Boleta.findOne({
    where: { orden_id: ordenId },
    include: buildIncludes(),
  });

  if (!boleta) {
    throw new Error('La boleta no existe para esta orden');
  }

  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.clienteId || user.perfil_cliente?.id || user.id;
    if (Number(boleta.cliente_id) !== Number(clienteId)) {
      const err = new Error('No autorizado para ver esta boleta');
      err.statusCode = 403;
      throw err;
    }
  }

  return boleta;
};

export const createFromOrder = async (ordenId) => {
  const orden = await models.Orden.findByPk(ordenId, {
    include: [
      {
        model: models.Vehiculo,
        as: 'vehiculo',
        include: [{ model: models.Cliente, as: 'cliente' }],
      },
      {
        model: models.DetalleOrden,
        as: 'detalles',
        include: [{ model: models.Catalogo, as: 'servicio' }],
      },
    ],
  });

  if (!orden) {
    throw new Error('La orden de trabajo no existe');
  }

  const existente = await models.Boleta.findOne({ where: { orden_id: ordenId } });
  if (existente) {
    return await getById(existente.id);
  }

  // Obtener cliente_id desde vehículo o cliente directo
  const clienteId = orden.vehiculo?.cliente_id || orden.vehiculo?.cliente?.id || orden.cliente_id;

  const transaction = await sequelize.transaction();

  try {
    const numeroBoleta = `BL-${new Date().getFullYear()}-${String(orden.id).padStart(6, '0')}`;
    const boleta = await models.Boleta.create(
      {
        orden_id: orden.id,
        cliente_id: clienteId,
        numero_boleta: numeroBoleta,
        fecha_emision: new Date(),
        nombre_empresa: 'Lubricentro',
        rut_empresa: '76.000.000-0',
        direccion_empresa: 'Av. Principal 123, Santiago',
        email_empresa: 'contacto@lubricentro.cl',
        telefono_empresa: '+56 9 1234 5678',
        subtotal: orden.subtotal,
        iva: orden.iva,
        total: orden.total,
        estado: 'emitida',
      },
      { transaction }
    );

    if (orden.detalles && orden.detalles.length > 0) {
      for (const detalle of orden.detalles) {
        await models.BoletaDetalle.create(
          {
            boleta_id: boleta.id,
            servicio_id: detalle.servicio_id,
            nombre_servicio: detalle.servicio?.nombre || 'Servicio',
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario,
            subtotal: detalle.subtotal,
          },
          { transaction }
        );
      }
    }

    await models.Orden.update(
      { boleta_emitida: true },
      { where: { id: orden.id }, transaction }
    );

    await transaction.commit();
    return await getById(boleta.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const remove = async (id) => {
  const boleta = await models.Boleta.findByPk(id);
  if (!boleta) {
    throw new Error('La boleta no existe');
  }

  await boleta.destroy();
  return { message: 'Boleta eliminada correctamente' };
};