import { models } from '../libs/sequelize.js';

// Obtener todos los clientes (con sus vehículos opcionalmente)
export const getAll = async () => {
  return await models.Cliente.findAll({
    include: [{ model: models.Vehiculo, as: 'vehiculos' }] // <-- models.Vehiculo
  });
};

// Buscar cliente por ID
export const getById = async (id) => {
  const cliente = await models.Cliente.findByPk(id, {
    include: [{ model: models.Vehiculo, as: 'vehiculos' }] // <-- models.Vehiculo
  });

  if (!cliente) {
    throw new Error('El cliente no existe');
  }
  return cliente;
};

// Crear cliente
export const create = async (body) => {
  if (body.rut) {
    const existe = await models.Cliente.findOne({ where: { rut: body.rut } });
    if (existe) {
      throw new Error(`El cliente con RUT ${body.rut} ya se encuentra registrado.`);
    }
  }

  const newCliente = await models.Cliente.create(body);
  return { cliente: newCliente, message: 'Cliente creado exitosamente' };
};

// Actualizar cliente
export const update = async (id, body) => {
  const cliente = await models.Cliente.findByPk(id);
  if (!cliente) {
    throw new Error('El cliente no existe');
  }

  const updatedCliente = await cliente.update(body);
  return updatedCliente;
};

// Eliminar cliente
export const remove = async (id) => {
  const cliente = await models.Cliente.findByPk(id);
  if (!cliente) {
    throw new Error('El cliente no existe');
  }

  await cliente.destroy();
  return { message: 'Cliente eliminado exitosamente' };
};