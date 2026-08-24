import { models } from '../libs/sequelize.js';
import sequelize from '../libs/sequelize.js';

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

// ─── Transiciones de estado permitidas (Tarea 3) ───
const ESTADO_TRANSITIONS = {
  agendada: ['recepcionado', 'cancelado'],
  solicitado: ['agendada', 'recepcionado', 'cancelado'],
  recepcionado: ['en_proceso', 'cancelado'],
  en_proceso: ['completado', 'cancelado'],
  completado: ['pagado'],
  pagado: [],
  cancelado: [],
};

const buildOrderIncludes = () => [
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
];

// 1. Obtener todas las órdenes de trabajo
export const getAll = async (user = null) => {
  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.perfil_cliente?.id;
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
    const clienteId = user.cliente_id || user.perfil_cliente?.id;
    const vehClienteId = orden.vehiculo?.cliente_id || orden.vehiculo?.cliente?.id;
    if (Number(vehClienteId) !== Number(clienteId)) {
      const err = new Error('No autorizado para ver esta orden');
      err.statusCode = 403;
      throw err;
    }
  }

  return orden;
};

// 3. Crear orden (admin / mecánico)
// 3. Crear orden (admin / mecánico)
export const create = async (body, user = null) => {
  const {
    vehiculo_id,
    kilometraje_ingreso,
    fecha_programada,
    observaciones_fallas,
    observaciones_reparacion,
    tiempo_estimado,
    detalles = [],
  } = body;

  if (!vehiculo_id) throw new Error('El vehículo es obligatorio');
  if (kilometraje_ingreso === undefined || kilometraje_ingreso === null) {
    throw new Error('El kilometraje de ingreso es obligatorio');
  }
  if (!Array.isArray(detalles) || detalles.length === 0) {
    throw new Error('Debes incluir al menos un servicio o revisión');
  }

  const vehiculo = await models.Vehiculo.findByPk(vehiculo_id, {
    include: [{ model: models.Cliente, as: 'cliente' }],
  });

  if (!vehiculo) {
    throw new Error(`El vehículo con ID ${vehiculo_id} no existe`);
  }

  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.perfil_cliente?.id;
    if (Number(vehiculo.cliente_id) !== Number(clienteId)) {
      throw new Error('No tienes permisos para crear una orden con ese vehículo');
    }
  }

  const transaction = await sequelize.transaction();
  let createdId = null;

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

    const estadoInicial = user && (user.rol === 'cliente' || user.role === 'cliente')
      ? 'solicitado'
      : 'recepcionado';

    const nuevaOrden = await models.Orden.create({
      vehiculo_id,
      fecha_programada: fecha_programada || null,
      kilometraje_ingreso: Number(kilometraje_ingreso),
      proximo_cambio_km: body.proximo_cambio_km || null,
      observaciones_fallas: observaciones_fallas || null,
      observaciones_reparacion: observaciones_reparacion || null,
      tiempo_estimado: tiempo_estimado || null,
      subtotal,
      iva,
      total,
      estado: estadoInicial,
      pagado: false,
      boleta_emitida: false,
    }, { transaction });

    createdId = nuevaOrden.id;

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
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }

  return await getById(createdId);
};

// 3b. Crear solicitud/orden desde cliente autenticado
export const createOrdenCliente = async (body, user) => {
  const clienteId = user.cliente_id || user.perfil_cliente?.id;
  if (!clienteId) {
    throw new Error('Tu cuenta no tiene un perfil de cliente asociado');
  }

  const {
    vehiculo_id,
    fecha_programada,
    observaciones_fallas,
    servicio_ids = [],
  } = body;

  if (!vehiculo_id) throw new Error('Debes seleccionar un vehículo');
  if (!Array.isArray(servicio_ids) || servicio_ids.length === 0) {
    throw new Error('Debes seleccionar al menos un servicio');
  }

  const vehiculo = await models.Vehiculo.findByPk(vehiculo_id, {
    include: [{ model: models.Cliente, as: 'cliente' }],
  });
  if (!vehiculo) throw new Error('El vehículo no existe');
  if (Number(vehiculo.cliente_id) !== Number(clienteId)) {
    throw new Error('No tienes permisos para crear una orden con ese vehículo');
  }

  const transaction = await sequelize.transaction();
  let createdId = null;

  try {
    let subtotal = 0;
    const detallesProcesados = [];

    for (const sId of servicio_ids) {
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

    const nuevaOrden = await models.Orden.create({
      vehiculo_id: vehiculo.id,
      fecha_programada: fecha_programada || new Date(),
      kilometraje_ingreso: Number(vehiculo.kilometraje_actual || 0),
      observaciones_fallas: observaciones_fallas || 'Solicitud desde panel de cliente',
      subtotal,
      iva,
      total,
      estado: 'solicitado',
      pagado: false,
      boleta_emitida: false,
    }, { transaction });

    createdId = nuevaOrden.id;

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
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }

  return await getById(createdId);
};

// 4. Reserva express (desde Landing Page / público)
export const createReservaExpress = async (body) => {
  const {
    vehiculo_id,
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

  if (!vehiculo_id && !patente) {
    throw new Error('Debes seleccionar un vehículo o ingresar una patente');
  }

  const transaction = await sequelize.transaction();
  let createdId = null;

  try {
    let vehiculo = null;

    if (vehiculo_id) {
      vehiculo = await models.Vehiculo.findByPk(vehiculo_id, { transaction });
      if (!vehiculo) throw new Error('El vehículo seleccionado no existe');
    } else {
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

    const nuevaOrden = await models.Orden.create({
      vehiculo_id: vehiculo.id,
      fecha_programada: fecha_programada || new Date(),
      kilometraje_ingreso: Number(vehiculo.kilometraje_actual || 0),
      observaciones_fallas,
      subtotal,
      iva,
      total,
      estado: 'agendada',
      pagado: false,
      boleta_emitida: false,
    }, { transaction });

    createdId = nuevaOrden.id;

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
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }

  return await getById(createdId);
};

// 5. Actualizar estado
export const updateEstado = async (id, nuevoEstado, user = null) => {
  const orden = await models.Orden.findByPk(id, {
    include: buildOrderIncludes(),
  });

  if (!orden) throw new Error('La orden de trabajo no existe');

  const estadoActual = orden.estado;
  const transicionesPermitidas = ESTADO_TRANSITIONS[estadoActual];

  if (!transicionesPermitidas || !transicionesPermitidas.includes(nuevoEstado)) {
    throw new Error(
      `No se puede cambiar de "${estadoActual}" a "${nuevoEstado}". ` +
      `Transiciones válidas: ${(transicionesPermitidas || []).join(', ') || 'ninguna'}`
    );
  }

  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    if (!['cancelado'].includes(nuevoEstado)) {
      throw new Error('Solo mecánico o administrador puede cambiar a este estado');
    }
  }

  const updateData = { estado: nuevoEstado };

  if (nuevoEstado === 'completado') {
    updateData.fecha_finalizacion = new Date();
  }

  await orden.update(updateData);
  return await getById(id);
};

// 6. Marcar como pagada
export const marcarComoPagada = async (id) => {
  const orden = await models.Orden.findByPk(id, {
    include: buildOrderIncludes(),
  });

  if (!orden) throw new Error('La orden de trabajo no existe');

  if (orden.estado !== 'completado' && orden.estado !== 'pagado') {
    throw new Error('Solo se pueden pagar órdenes con estado "completado"');
  }

  await orden.update({
    pagado: true,
    estado: 'pagado',
  });

  return await getById(id);
};

// 7. Obtener boleta de una orden
export const getBoletaById = async (id, user = null) => {
  const orden = await models.Orden.findByPk(id, {
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
    throw new Error('La orden no existe');
  }

  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.perfil_cliente?.id;
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
      fecha_finalizacion: orden.fecha_finalizacion,
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

// 8. Eliminar Orden
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