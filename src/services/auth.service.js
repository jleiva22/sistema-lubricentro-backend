import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { models } from '../libs/sequelize.js';
import { authConfig } from '../config/auth.js';

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toJSON ? user.toJSON() : { ...user };
  delete plain.password_hash;

  // Si viene incluido el perfil_cliente, exponer cliente_id para facilitar checks
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
  res.cookie('accessToken', accessToken, {
    // ...authConfig.cookieOptions, <-- Puedes mantener esto si quieres, pero agrega lo siguiente:
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    // ...authConfig.cookieOptions,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
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

  // Si no existe asociación directa con Cliente, intentar resolver por email o usuario_id
  if (!usuario.perfil_cliente) {
    let posibleCliente = await models.Cliente.findOne({ where: { usuario_id: usuario.id } });
    if (!posibleCliente) {
      posibleCliente = await models.Cliente.findOne({ where: { email: usuario.email } });
    }

    // Si sigue sin existir, intentar por PK (posible coincidencia de ids en datos seed)
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

  // Construir objeto plano para asegurar que perfil_cliente se incluya correctamente
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

    // Intentar resolver Cliente si no viene incluido
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

  if (usuario && !usuario.perfil_cliente) {
    let posibleCliente = await models.Cliente.findOne({ where: { usuario_id: usuario.id } });
    if (!posibleCliente) posibleCliente = await models.Cliente.findOne({ where: { email: usuario.email } });
    if (!posibleCliente) {
      const clienteByPk = await models.Cliente.findByPk(usuario.id);
      if (clienteByPk) posibleCliente = clienteByPk;
    }

    // Construir objeto plano y adjuntar posibleCliente
    const plainUsuario = usuario.toJSON ? usuario.toJSON() : { ...usuario };
    if (posibleCliente) plainUsuario.perfil_cliente = posibleCliente.toJSON ? posibleCliente.toJSON() : posibleCliente;

    if (!plainUsuario) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return sanitizeUser(plainUsuario);
  }

  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Caso donde usuario ya trae perfil (incluido por el include)
  const plain = usuario.toJSON ? usuario.toJSON() : { ...usuario };
  return sanitizeUser(plain);
};
