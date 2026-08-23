// import db from '../database/models/index.js';
// const {models} = require('../libs/sequelize');
import { models } from '../libs/sequelize.js';


// Obtener todo el catálogo
export const getAll = async () => {
  return await models.Catalogo.findAll({
    order: [['nombre', 'ASC']],
  });
};

// Obtener por ID
export const getById = async (id) => {
  const item = await models.Catalogo.findByPk(id);
  if (!item) {
    throw new Error('El ítem del catálogo no existe');
  }
  return item;
};

// Crear ítem
export const create = async (body) => {
  const payload = {
    codigo: body.codigo || `SERV-${Date.now()}`,
    nombre: body.nombre,
    descripcion: body.descripcion || '',
    tipo: body.tipo || 'servicio',
    categoria: body.categoria || 'Mantenimiento',
    marca: body.marca || null,
    precio_unitario: Number(body.precio_unitario || 0),
    stock_actual: Number(body.stock_actual || 0),
    tiempo_minutos: Number(body.tiempo_minutos || 30),
    kilometraje_recomendado: Number(body.kilometraje_recomendado || 0),
    activo: body.activo !== false,
  };

  if (!payload.nombre) {
    throw new Error('El nombre del servicio es obligatorio');
  }

  if (!['servicio', 'producto', 'revision'].includes(payload.tipo)) {
    throw new Error('El tipo debe ser servicio, producto o revision');
  }

  const newItem = await models.Catalogo.create(payload);
  return { item: newItem, message: 'Ítem agregado al catálogo con éxito' };
};

// Actualizar ítem
export const update = async (id, body) => {
  const item = await models.Catalogo.findByPk(id);
  if (!item) {
    throw new Error('El ítem del catálogo no existe');
  }

  if (body.tipo && !['servicio', 'producto', 'revision'].includes(body.tipo)) {
    throw new Error('El tipo debe ser servicio, producto o revision');
  }

  const updatedItem = await item.update({
    ...body,
    precio_unitario: body.precio_unitario !== undefined ? Number(body.precio_unitario) : item.precio_unitario,
    stock_actual: body.stock_actual !== undefined ? Number(body.stock_actual) : item.stock_actual,
    tiempo_minutos: body.tiempo_minutos !== undefined ? Number(body.tiempo_minutos) : item.tiempo_minutos,
    kilometraje_recomendado: body.kilometraje_recomendado !== undefined ? Number(body.kilometraje_recomendado) : item.kilometraje_recomendado,
  });

  return updatedItem;
};

// Eliminar ítem
export const remove = async (id) => {
  const item = await models.Catalogo.findByPk(id);
  if (!item) {
    throw new Error('El ítem del catálogo no existe');
  }

  await item.destroy();
  return { message: 'Ítem eliminado del catálogo con éxito' };
};