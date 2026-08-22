import { models } from '../libs/sequelize.js';
import sequelize from '../libs/sequelize.js';

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const buildOrderIncludes = () => [
  {
    model: models.Vehiculo, // ✅ Corregido
    as: 'vehiculo',
    include: [{ model: models.Cliente, as: 'cliente' }],
  },
  {
    model: models.DetalleOrden,
    as: 'detalles',
    include: [{ model: models.Catalogo, as: 'servicio' }],
  },
];

// 1. Obtener todas las órdenes de trabajo
export const getAll = async (user = null) => {
  const where = {};
  // Si el usuario es cliente, filtrar sólo sus órdenes a través del cliente asociado al vehículo
  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.clienteId || user.id;
    // Hacemos join vía vehiculo.cliente_id añadiendo condición en include mediante where en asociación
    return await models.Orden.findAll({
      include: buildOrderIncludes().map((inc) => {
        if (inc.as === 'vehiculo') {
          return { ...inc, where: { cliente_id: clienteId } };
        }
        return inc;
      }),
      order: [['fecha_ingreso', 'DESC']],
    });
  }

  return await models.Orden.findAll({
    include: buildOrderIncludes(),
    order: [['fecha_ingreso', 'DESC']],
  });
};

// 2. Obtener orden por ID
export const getById = async (id, user = null) => {
  const orden = await models.Orden.findByPk(id, {
    include: buildOrderIncludes(),
  });

  if (!orden) {
    throw new Error('La orden de trabajo no existe');
  }

  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.clienteId || user.id;
    const vehClienteId = orden.vehiculo?.cliente_id || orden.vehiculo?.cliente?.id;
    if (Number(vehClienteId) !== Number(clienteId)) {
      const err = new Error('No autorizado para ver esta orden');
      err.statusCode = 403;
      throw err;
    }
  }

  return orden;
};

export const create = async (body) => {
  const {
    vehiculo_id,
    kilometraje_ingreso,
    fecha_programada,
    observaciones_fallas,
    observaciones_reparacion,
    detalles = [],
  } = body;

  if (!vehiculo_id) throw new Error('El vehículo es obligatorio');
  if (kilometraje_ingreso === undefined || kilometraje_ingreso === null) {
    throw new Error('El kilometraje de ingreso es obligatorio');
  }
  if (!Array.isArray(detalles) || detalles.length === 0) {
    throw new Error('Debes incluir al menos un servicio o revisión');
  }

  const vehiculo = await models.Vehiculo.findByPk(vehiculo_id, { // ✅ Corregido
    include: [{ model: models.Cliente, as: 'cliente' }],
  });

  if (!vehiculo) {
    throw new Error(`El vehículo con ID ${vehiculo_id} no existe`);
  }

  const transaction = await sequelize.transaction();

  try {
    let subtotal = 0;
    const detallesProcesados = [];

    for (const item of detalles) {
      const servicio = await models.Catalogo.findByPk(item.servicio_id, { transaction });
      if (!servicio) {
        throw new Error(`El servicio con ID ${item.servicio_id} no existe`);
      }

      const cantidad = Number(item.cantidad || 1);
      const precioUnitario = Number(item.precio_unitario ?? servicio.precio_unitario ?? 0);
      const subtotalItem = roundMoney(precioUnitario * cantidad);

      subtotal = roundMoney(subtotal + subtotalItem);

      detallesProcesados.push({
        servicio_id: servicio.id,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal: subtotalItem,
      });
    }

    const iva = roundMoney(subtotal * 0.19);
    const total = roundMoney(subtotal + iva);

    const nuevaOrden = await models.Orden.create({
      vehiculo_id,
      fecha_programada: fecha_programada || null,
      kilometraje_ingreso: Number(kilometraje_ingreso),
      proximo_cambio_km: body.proximo_cambio_km || null,
      observaciones_fallas: observaciones_fallas || null,
      observaciones_reparacion: observaciones_reparacion || null,
      subtotal,
      iva,
      total,
      estado: 'recepcionado',
      pagado: false,
      boleta_emitida: false,
    }, { transaction });

    for (const detalle of detallesProcesados) {
      await models.DetalleOrden.create({
        orden_id: nuevaOrden.id,
        servicio_id: detalle.servicio_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal,
      }, { transaction });
    }

    await vehiculo.update(
      {
        kilometraje_actual: Math.max(Number(vehiculo.kilometraje_actual || 0), Number(kilometraje_ingreso)),
      },
      { transaction }
    );

    await transaction.commit();
    return await getById(nuevaOrden.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const createReservaExpress = async (body) => {
  const {
    cliente_id, // 👈 Se agrega para usuarios logueados
    vehiculo_id, // 👈 Se agrega para usuarios logueados
    nombre,
    apellido = '',
    email,
    telefono,
    patente,
    marca = 'Vehículo',
    modelo = 'Estándar',
    fecha_programada,
    servicio_ids = [],
    observaciones_fallas = 'Reserva desde sitio web',
  } = body;

  // Validación rápida
  if (!vehiculo_id && !patente) {
    throw new Error('Debes seleccionar un vehículo o ingresar una patente');
  }

  const transaction = await sequelize.transaction();

  try {
    let vehiculo = null;

    // 1. Si el usuario está logueado y envió un vehiculo_id
    if (vehiculo_id) {
      vehiculo = await models.Vehiculo.findByPk(vehiculo_id, { transaction });
      if (!vehiculo) throw new Error('El vehículo seleccionado no existe');
    } else {
      // 2. Si es un invitado, buscar o crear cliente y vehículo
      let cliente = null;
      if (body.rut) {
        cliente = await models.Cliente.findOne({ where: { rut: body.rut }, transaction });
      }
      if (!cliente && email) {
        cliente = await models.Cliente.findOne({ where: { email }, transaction });
      }
      if (!cliente && telefono) {
        cliente = await models.Cliente.findOne({ where: { telefono }, transaction });
      }

      if (!cliente) {
        cliente = await models.Cliente.create({
          nombre: nombre || 'Cliente Express',
          apellido: apellido || 'General',
          rut: body.rut || `RES-${Date.now().toString().slice(-6)}`,
          email: email || `invitado_${Date.now()}@lubricentro.cl`,
          telefono: telefono || '+56900000000',
          activo: true,
        }, { transaction });
      }

      const cleanPatente = patente.toUpperCase().trim();
      vehiculo = await models.Vehiculo.findOne({
        where: { patente: cleanPatente },
        transaction,
      });

      if (!vehiculo) {
        vehiculo = await models.Vehiculo.create({
          cliente_id: cliente.id,
          patente: cleanPatente,
          marca: marca || 'Multimarca',
          modelo: modelo || 'Estándar',
          anio: new Date().getFullYear(),
          tipo_motor: 'Gasolina',
          kilometraje_actual: 0,
        }, { transaction });
      }
    }

    // 3. Procesar Servicios
    let subtotal = 0;
    const detallesProcesados = [];
    const idsParaProcesar = Array.isArray(servicio_ids) && servicio_ids.length > 0 ? servicio_ids : [1];

    for (const sId of idsParaProcesar) {
      const servicio = await models.Catalogo.findByPk(sId, { transaction });
      if (servicio) {
        const precioUnitario = Number(servicio.precio_unitario || 0);
        subtotal = roundMoney(subtotal + precioUnitario);
        detallesProcesados.push({
          servicio_id: servicio.id,
          cantidad: 1,
          precio_unitario: precioUnitario,
          subtotal: precioUnitario,
        });
      }
    }

    const iva = roundMoney(subtotal * 0.19);
    const total = roundMoney(subtotal + iva);

    // 4. Crear la Orden con estado 'agendada'
    const nuevaOrden = await models.Orden.create({
      vehiculo_id: vehiculo.id,
      fecha_programada: fecha_programada || new Date(),
      kilometraje_ingreso: Number(vehiculo.kilometraje_actual || 0),
      observaciones_fallas,
      subtotal,
      iva,
      total,
      estado: 'agendada', // 👈 CAMBIO: Se define como agendada
      pagado: false,
      boleta_emitida: false,
    }, { transaction });

    for (const detalle of detallesProcesados) {
      await models.DetalleOrden.create({
        orden_id: nuevaOrden.id,
        servicio_id: detalle.servicio_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        subtotal: detalle.subtotal,
      }, { transaction });
    }

    await transaction.commit();
    return await getById(nuevaOrden.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getBoletaById = async (id, user = null) => {
  const orden = await models.Orden.findByPk(id, {
    include: [
      {
        model: models.Vehiculo, // ✅ Corregido
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
    throw new Error('La orden no existe');
  }

  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.clienteId || user.id;
    const vehClienteId = orden.vehiculo?.cliente_id || orden.vehiculo?.cliente?.id;
    if (Number(vehClienteId) !== Number(clienteId)) {
      const err = new Error('No autorizado para ver esta boleta');
      err.statusCode = 403;
      throw err;
    }
  }

  return {
    empresa: {
      nombre: 'LubriExpress Chile',
      rut: '76.456.901-2',
      direccion: 'Av. Alemania 1020, Temuco, Chile',
      email: 'contacto@lubriexpress.cl',
      telefono: '+56 45 221 4455',
    },
    cliente: orden.vehiculo?.cliente || null,
    vehiculo: orderVehicleData(orden.vehiculo),
    orden: {
      id: orden.id,
      fecha_ingreso: orden.fecha_ingreso,
      fecha_programada: orden.fecha_programada,
      estado: orden.estado,
      pagado: orden.pagado,
      subtotal: Number(orden.subtotal),
      iva: Number(orden.iva),
      total: Number(orden.total),
      observaciones_fallas: orden.observaciones_fallas,
    },
    servicios: orden.detalles.map((detalle) => ({
      id: detalle.id,
      nombre: detalle.servicio?.nombre || 'Servicio',
      tipo: detalle.servicio?.tipo || 'servicio',
      cantidad: detalle.cantidad,
      precio_unitario: Number(detalle.precio_unitario),
      subtotal: Number(detalle.subtotal),
    })),
  };
};

const orderVehicleData = (vehiculo) => {
  if (!vehiculo) return null;

  return {
    id: vehiculo.id,
    patente: vehiculo.patente,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    anio: vehiculo.anio,
    kilometraje_actual: vehiculo.kilometraje_actual,
  };
};

// 6. Eliminar Orden
export const remove = async (id) => {
  const orden = await models.Orden.findByPk(id, {
    include: [{ model: models.DetalleOrden, as: 'detalles' }],
  });

  if (!orden) {
    throw new Error('La orden de trabajo no existe');
  }

  await orden.destroy();
  return { message: 'Orden de trabajo eliminada correctamente' };
};
