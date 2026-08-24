import { models } from '../libs/sequelize.js';

export const getAll = async (user = null) => {
  const where = {};

  // ✅ Si el usuario tiene rol 'cliente', solo filtramos sus vehículos (Tarea 7)
  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.perfil_cliente?.id;
    if (!clienteId) return [];
    where.cliente_id = clienteId;
  }

  return await models.Vehiculo.findAll({
    where,
    include: [{ model: models.Cliente, as: 'cliente' }],
    order: [['createdAt', 'DESC']],
  });
};

export const getById = async (id, user = null) => {
  const vehiculo = await models.Vehiculo.findByPk(id, {
    include: [{ model: models.Cliente, as: 'cliente' }]
  });
  if (!vehiculo) throw new Error('El vehículo no existe');

  // Tarea 7: Si es cliente, verificar propiedad
  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.perfil_cliente?.id;
    if (Number(vehiculo.cliente_id) !== Number(clienteId)) {
      const err = new Error('No autorizado para ver este vehículo');
      err.statusCode = 403;
      throw err;
    }
  }

  return vehiculo;
};

export const getByPatente = async (patente) => {
  return await models.Vehiculo.findOne({
    where: { patente: patente.toUpperCase() },
    include: [{ model: models.Cliente, as: 'cliente' }]
  });
};

export const create = async (data, user = null) => {
  let {
    cliente_id,
    patente,
    marca,
    modelo,
    anio,
    tipo_motor,
    kilometraje_actual
  } = data;

  if (!patente) throw new Error('La patente es obligatoria');

  // ✅ Si el usuario es cliente, resolver dinámicamente su cliente_id
  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const userId = user.id || user.sub;
    let userClienteId = user.cliente_id || user.perfil_cliente?.id;

    // Si no viene en el token/req.user, lo buscamos o creamos en la BD
    if (!userClienteId && userId) {
      let cliente = await models.Cliente.findOne({ where: { usuario_id: userId } });

      if (!cliente) {
        // Buscar por email si aún no tiene usuario_id vinculado
        cliente = await models.Cliente.findOne({ where: { email: user.email } });
        if (cliente) {
          await cliente.update({ usuario_id: userId });
        } else {
          // Auto-crear perfil de cliente si no existía
          // Auto-crear perfil de cliente si no existía
        cliente = await models.Cliente.create({
          usuario_id: userId,
          nombre: user.nombre || 'Cliente',
          apellido: user.apellido || '',
          email: user.email,
          rut: user.rut || '11111111-1', // 👈 Incluir la propiedad rut
          });
        }
      }
      userClienteId = cliente.id;
    }

    if (!userClienteId) {
      throw new Error('Tu cuenta no tiene un perfil de cliente asociado. Contacta al administrador.');
    }

    // Forzar: ignorar cualquier cliente_id enviado por el front
    cliente_id = userClienteId;
  }

  // ✅ Validar cliente si es admin/mecánico
  if (cliente_id) {
    const clienteExiste = await models.Cliente.findByPk(cliente_id);
    if (!clienteExiste) {
      throw new Error(`El cliente con ID ${cliente_id} no existe`);
    }
  } else {
    cliente_id = 1;
  }

  const cleanPatente = patente.toUpperCase().trim();
  let vehiculo = await models.Vehiculo.findOne({ where: { patente: cleanPatente } });

  if (vehiculo) {
    if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
      if (Number(vehiculo.cliente_id) !== Number(cliente_id)) {
        throw new Error('Esta patente ya está registrada bajo otro cliente');
      }
    }

    await vehiculo.update({
      cliente_id: cliente_id || vehiculo.cliente_id,
      marca: marca || vehiculo.marca,
      modelo: modelo || vehiculo.modelo,
      anio: anio || vehiculo.anio,
      tipo_motor: tipo_motor || vehiculo.tipo_motor,
      kilometraje_actual: kilometraje_actual !== undefined && kilometraje_actual !== null && kilometraje_actual !== ''
        ? Number(kilometraje_actual)
        : vehiculo.kilometraje_actual,
    });
  } else {
    vehiculo = await models.Vehiculo.create({
      cliente_id,
      patente: cleanPatente,
      marca,
      modelo,
      anio,
      tipo_motor,
      kilometraje_actual: Number(kilometraje_actual) || 0,
    });
  }

  return vehiculo;
};

export const update = async (id, body, user = null) => {
  const vehiculo = await models.Vehiculo.findByPk(id);
  if (!vehiculo) throw new Error('El vehículo no existe');

  // Tarea 7: Si es cliente, verificar propiedad
  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
    const clienteId = user.cliente_id || user.perfil_cliente?.id;
    if (Number(vehiculo.cliente_id) !== Number(clienteId)) {
      throw new Error('No tienes permisos para editar este vehículo');
    }
  }

  return await vehiculo.update(body);
};

export const remove = async (id) => {
  const vehiculo = await models.Vehiculo.findByPk(id);
  if (!vehiculo) throw new Error('El vehículo no existe');
  await vehiculo.destroy();
  return { message: 'Vehículo eliminado exitosamente' };
};
