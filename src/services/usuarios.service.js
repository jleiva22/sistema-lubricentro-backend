import bcrypt from 'bcrypt';
import { models } from '../libs/sequelize.js';

const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(String(password), saltRounds);
};

const sanitizeUser = (user) => {
  const plainUser = user.toJSON ? user.toJSON() : { ...user };
  delete plainUser.password_hash;
  return plainUser;
};

export const getAll = async () => {
  const usuarios = await models.Usuario.findAll({
    include: [{ model: models.Cliente, as: 'perfil_cliente' }],
    order: [['id', 'ASC']],
  });

  return usuarios.map(sanitizeUser);
};

export const getById = async (id) => {
  const usuario = await models.Usuario.findByPk(id, {
    include: [{ model: models.Cliente, as: 'perfil_cliente' }],
  });

  if (!usuario) {
    throw new Error('El usuario no existe');
  }

  return sanitizeUser(usuario);
};

export const getByEmail = async (email) => {
  const usuario = await models.Usuario.findOne({
    where: { email: String(email).trim().toLowerCase() },
    include: [{ model: models.Cliente, as: 'perfil_cliente' }],
  });

  return usuario ? sanitizeUser(usuario) : null;
};

export const create = async (body) => {
  const email = String(body.email || '').trim().toLowerCase();
  const rol = String(body.rol || 'cliente');

  if (!body.nombre) {
    throw new Error('El nombre es obligatorio');
  }

  if (!email) {
    throw new Error('El email es obligatorio');
  }

  if (!body.password) {
    throw new Error('La contraseña es obligatoria');
  }

  if (!['administrador', 'cliente', 'mecanico'].includes(rol)) {
    throw new Error('El rol debe ser administrador, cliente o mecanico');
  }

  const usuarioExistente = await models.Usuario.findOne({ where: { email } });
  if (usuarioExistente) {
    throw new Error(`El email ${email} ya está registrado`);
  }

  const nuevoUsuario = await models.Usuario.create({
    nombre: body.nombre,
    apellido: body.apellido || null,
    email,
    password_hash: await hashPassword(body.password),
    rol,
    activo: body.activo ?? true,
  });

  return {
    usuario: sanitizeUser(nuevoUsuario),
    message: 'Usuario creado exitosamente',
  };
};

export const update = async (id, body) => {
  const usuario = await models.Usuario.findByPk(id);
  if (!usuario) {
    throw new Error('El usuario no existe');
  }

  if (body.email) {
    body.email = String(body.email).trim().toLowerCase();
  }

  if (body.password) {
    body.password_hash = await hashPassword(body.password);
    delete body.password;
  }

  if (body.rol && !['administrador', 'cliente', 'mecanico'].includes(body.rol)) {
    throw new Error('El rol debe ser administrador, cliente o mecanico');
  }

  if (body.email) {
    const existe = await models.Usuario.findOne({
      where: { email: body.email },
    });

    if (existe && Number(existe.id) !== Number(id)) {
      throw new Error(`El email ${body.email} ya está registrado`);
    }
  }

  const actualizado = await usuario.update(body);
  return sanitizeUser(actualizado);
};

export const remove = async (id) => {
  const usuario = await models.Usuario.findByPk(id);
  if (!usuario) {
    throw new Error('El usuario no existe');
  }

  await usuario.destroy();
  return { message: 'Usuario eliminado exitosamente' };
};
