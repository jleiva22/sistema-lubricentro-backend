import { models } from '../libs/sequelize.js';

export const getAll = async () => {
  return await models.Vehiculo.findAll({
    include: [{ model: models.Cliente, as: 'cliente' }]
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

export const create = async (data) => {
  const {
    cliente_id = 1,
    patente,
    marca,
    modelo,
    anio,
    tipo_motor,
    kilometraje_actual
  } = data;

  if (!patente) throw new Error('La patente es obligatoria');

  const cleanPatente = patente.toUpperCase().trim();

  // Busca si el vehículo ya existe por patente
  let vehiculo = await models.Vehiculo.findOne({ where: { patente: cleanPatente } });

  if (vehiculo) {
    // Si ya existía (ej. creado como Multimarca en reserva express), actualizamos sus datos
    await vehiculo.update({
      cliente_id: cliente_id || vehiculo.cliente_id,
      marca: marca || vehiculo.marca,
      modelo: modelo || vehiculo.modelo,
      anio: anio || vehiculo.anio,
      tipo_motor: tipo_motor || vehiculo.tipo_motor,
      kilometraje_actual: kilometraje_actual || vehiculo.kilometraje_actual,
    });
  } else {
    // Si no existe, lo creamos
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
