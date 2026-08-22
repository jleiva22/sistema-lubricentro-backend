import { models } from '../libs/sequelize.js';

export const getAll = async (user = null) => {
  const where = {};

  // ✅ Si el usuario tiene rol 'cliente', solo filtramos sus vehículos
  if (user && (user.rol === 'cliente' || user.role === 'cliente')) {
  const clienteId = user.cliente_id || user.perfil_cliente?.id;
    where.cliente_id = clienteId;
  }

  return await models.Vehiculo.findAll({
    where,
    include: [{ model: models.Cliente, as: 'cliente' }],
    order: [['createdAt', 'DESC']],
  });
};

export const getById = async (id) => {
  const vehiculo = await models.Vehiculo.findByPk(id, {
    include: [{ model: models.Cliente, as: 'cliente' }]
  });
  if (!vehiculo) throw new Error('El vehículo no existe');
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

  // ✅ Si no se especifica cliente_id y quien crea es un cliente, usamos su ID
  if (!cliente_id && user && (user.rol === 'cliente' || user.role === 'cliente')) {
    cliente_id = user.cliente_id || user.clienteId || user.id;
  }

  cliente_id = cliente_id || 1; // Valor por defecto si no viene especificado

  const cleanPatente = patente.toUpperCase().trim();

  let vehiculo = await models.Vehiculo.findOne({ where: { patente: cleanPatente } });

  if (vehiculo) {
    await vehiculo.update({
      cliente_id: cliente_id || vehiculo.cliente_id,
      marca: marca || vehiculo.marca,
      modelo: modelo || vehiculo.modelo,
      anio: anio || vehiculo.anio,
      tipo_motor: tipo_motor || vehiculo.tipo_motor,
      kilometraje_actual: kilometraje_actual || vehiculo.kilometraje_actual,
    });
  } else {
    vehiculo = await models.Vehiculo.create({
      cliente_id,
      patente: cleanPatente,
      marca,
      modelo,
      anio,
      tipo_motor,
      kilometraje_actual,
    });
  }

  return vehiculo;
};

export const update = async (id, body) => {
  const vehiculo = await models.Vehiculo.findByPk(id);
  if (!vehiculo) throw new Error('El vehículo no existe');
  return await vehiculo.update(body);
};

export const remove = async (id) => {
  const vehiculo = await models.Vehiculo.findByPk(id);
  if (!vehiculo) throw new Error('El vehículo no existe');
  await vehiculo.destroy();
  return { message: 'Vehículo eliminado exitosamente' };
};
