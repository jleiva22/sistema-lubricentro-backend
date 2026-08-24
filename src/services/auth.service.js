import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { models } from '../libs/sequelize.js';
import { authConfig } from '../config/auth.js';

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toJSON ? user.toJSON() : { ...user };
  delete plain.password_hash;

  if (plain.perfil_cliente) {
    plain.cliente_id = plain.perfil_cliente.id;
  }

  return plain;
};

const createAccessToken = (usuario) => {
  return jwt.sign(
    {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    },
    authConfig.accessSecret,
    { expiresIn: authConfig.accessExpiresIn }
  );
};

const createRefreshToken = (usuario) => {
  return jwt.sign(
    {
      sub: usuario.id,
      type: 'refresh',
    },
    authConfig.refreshSecret,
    { expiresIn: authConfig.refreshExpiresIn }
  );
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  const accessCookieOptions = {
    ...authConfig.cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutos (corregido de 1 minuto)
  };

  const refreshCookieOptions = {
    ...authConfig.cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  };

  res.cookie('accessToken', accessToken, accessCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};

export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', authConfig.cookieOptions);
  res.clearCookie('refreshToken', authConfig.cookieOptions);
};

export const login = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Email y contraseña son obligatorios');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const usuario = await models.Usuario.findOne({
    where: { email: normalizedEmail },
    include: [{ model: models.Cliente, as: 'perfil_cliente' }],
  });

  if (!usuario || !usuario.activo) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  if (!usuario.perfil_cliente) {
    let posibleCliente = await models.Cliente.findOne({ where: { usuario_id: usuario.id } });
    if (!posibleCliente) {
      posibleCliente = await models.Cliente.findOne({ where: { email: usuario.email } });
    }
    if (!posibleCliente) {
      const clienteByPk = await models.Cliente.findByPk(usuario.id);
      if (clienteByPk) posibleCliente = clienteByPk;
    }

    if (posibleCliente) usuario.perfil_cliente = posibleCliente;
  }

  const passwordMatches = await bcrypt.compare(String(password), usuario.password_hash);

  if (!passwordMatches) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = createAccessToken(usuario);
  const refreshToken = createRefreshToken(usuario);

  const plainUsuario = usuario.toJSON ? usuario.toJSON() : { ...usuario };
  if (usuario.perfil_cliente) {
    plainUsuario.perfil_cliente = usuario.perfil_cliente.toJSON ? usuario.perfil_cliente.toJSON() : usuario.perfil_cliente;
  }

  return {
    usuario: sanitizeUser(plainUsuario),
    accessToken,
    refreshToken,
  };
};

import { models } from '../libs/sequelize.js'; // Importar modelos

export const register = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    const nuevoUsuario = await usuarioService.create({
      nombre,
      apellido: apellido || '',
      email,
      password,
      rol: 'cliente',
    });

    // ✅ Crear automáticamente la ficha de Cliente asociada
    await models.Cliente.create({
      nombre,
      apellido: apellido || '',
      email,
      usuario_id: nuevoUsuario.id,
    });

    const { usuario, accessToken, refreshToken } = await authService.login({ email, password });
    authService.setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      message: 'Registro exitoso e inicio de sesión automático',
      usuario,
    });
  } catch (error) {
    return next(error);
  }
};

export const refreshAccessToken = async (refreshTokenValue) => {
  if (!refreshTokenValue) {
    const error = new Error('Refresh token requerido');
    error.statusCode = 401;
    throw error;
  }

  try {
    const payload = jwt.verify(refreshTokenValue, authConfig.refreshSecret);
    const usuario = await models.Usuario.findByPk(payload.sub, {
      include: [{ model: models.Cliente, as: 'perfil_cliente' }],
    });

    if (usuario && !usuario.perfil_cliente) {
      let posibleCliente = await models.Cliente.findOne({ where: { usuario_id: usuario.id } });
      if (!posibleCliente) posibleCliente = await models.Cliente.findOne({ where: { email: usuario.email } });
      if (!posibleCliente) {
        const clienteByPk = await models.Cliente.findByPk(usuario.id);
        if (clienteByPk) posibleCliente = clienteByPk;
      }
      if (posibleCliente) usuario.perfil_cliente = posibleCliente;
    }

    if (!usuario || !usuario.activo) {
      const error = new Error('Sesión inválida');
      error.statusCode = 401;
      throw error;
    }

    const accessToken = createAccessToken(usuario);
    const nextRefreshToken = createRefreshToken(usuario);

    return {
      usuario: sanitizeUser(usuario.toJSON ? usuario.toJSON() : usuario),
      accessToken,
      refreshToken: nextRefreshToken,
    };
  } catch (error) {
    const authError = new Error('Refresh token inválido o expirado');
    authError.statusCode = 401;
    throw authError;
  }
};

export const getAuthenticatedUser = async (userId) => {
  const usuario = await models.Usuario.findByPk(userId, {
    include: [{ model: models.Cliente, as: 'perfil_cliente' }],
  });

  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (!usuario.perfil_cliente) {
    let posibleCliente = await models.Cliente.findOne({ where: { usuario_id: usuario.id } });
    if (!posibleCliente) posibleCliente = await models.Cliente.findOne({ where: { email: usuario.email } });
    if (!posibleCliente) {
      const clienteByPk = await models.Cliente.findByPk(usuario.id);
      if (clienteByPk) posibleCliente = clienteByPk;
    }

    const plainUsuario = usuario.toJSON ? usuario.toJSON() : { ...usuario };
    if (posibleCliente) plainUsuario.perfil_cliente = posibleCliente.toJSON ? posibleCliente.toJSON() : posibleCliente;

    return sanitizeUser(plainUsuario);
  }

  const plain = usuario.toJSON ? usuario.toJSON() : { ...usuario };
  return sanitizeUser(plain);
};