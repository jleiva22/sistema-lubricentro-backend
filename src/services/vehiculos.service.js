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

export const create = async (body) => {
  if (body.patente) {
    const existe = await models.Vehiculo.findOne({
      where: { patente: body.patente.toUpperCase() }
    });
    if (existe) {
      throw new Error(`La patente ${body.patente.toUpperCase()} ya se encuentra registrada.`);
    }
  }

  const newVehiculo = await models.Vehiculo.create({
    ...body,
    patente: body.patente ? body.patente.toUpperCase() : body.patente
  });

  return { vehiculo: newVehiculo, message: 'Vehículo creado exitosamente' };
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
