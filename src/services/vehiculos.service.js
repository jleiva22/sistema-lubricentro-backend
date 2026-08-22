import { models } from '../libs/sequelize.js';

// Obtener todos los vehículos (incluyendo su cliente asociado si existe la relación)
export const getAll = async () => {
  return await models.Vehiculo.findAll({
    include: [{ model: models.Cliente, as: 'cliente' }]
  });
};

// Buscar vehículo por ID
export const getById = async (id) => {
  const vehiculo = await models.Vehiculo.findByPk(id, {
    include: [{ model: models.Cliente, as: 'cliente' }]
  });

  if (!vehiculo) {
    throw new Error('El vehículo no existe');
  }
  return vehiculo;
};

// Buscar vehículo por patente (requerido por tu controlador)
export const getByPatente = async (patente) => {
  const vehiculo = await models.Vehiculo.findOne({
    where: { patente: patente.toUpperCase() },
    include: [{ model: models.Cliente, as: 'cliente' }]
  });
  return vehiculo;
};

// Crear vehículo
export const create = async (body) => {
  if (body.patente) {
    const existe = await models.Vehiculo.findOne({ 
      where: { patente: body.patente.toUpperCase() } 
    });
    if (existe) {
      throw new Error(`El vehículo con patente ${body.patente.toUpperCase()} ya está registrado.`);
    }
  }

  const newVehiculo = await models.Vehiculo.create({
    ...body,
    patente: body.patente ? body.patente.toUpperCase() : body.patente
  });
  
  return { vehiculo: newVehiculo, message: 'Vehículo creado exitosamente' };
};

// Actualizar vehículo
export const update = async (id, body) => {
  const vehiculo = await models.Vehiculo.findByPk(id);
  if (!vehiculo) {
    throw new Error('El vehículo no existe');
  }

  const updatedVehiculo = await vehiculo.update(body);
  return updatedVehiculo;
};

// Eliminar vehículo
export const remove = async (id) => {
  const vehiculo = await models.Vehiculo.findByPk(id);
  if (!vehiculo) {
    throw new Error('El vehículo no existe');
  }

  await vehiculo.destroy();
  return { message: 'Vehículo eliminado exitosamente' };
};
