import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { models } from '../libs/sequelize.js';
import { authConfig } from '../config/auth.js';

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toJSON ? user.toJSON() : { ...user };
  delete plain.password_hash;
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
    ...authConfig.cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...authConfig.cookieOptions,
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
  const usuario = await models.Usuario.findOne({ where: { email: normalizedEmail } });

  if (!usuario || !usuario.activo) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(String(password), usuario.password_hash);

  if (!passwordMatches) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = createAccessToken(usuario);
  const refreshToken = createRefreshToken(usuario);

  return {
    usuario: sanitizeUser(usuario),
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
    const usuario = await models.Usuario.findByPk(payload.sub);

    if (!usuario || !usuario.activo) {
      const error = new Error('Sesión inválida');
      error.statusCode = 401;
      throw error;
    }

    const accessToken = createAccessToken(usuario);
    const nextRefreshToken = createRefreshToken(usuario);

    return {
      usuario: sanitizeUser(usuario),
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
  const usuario = await models.Usuario.findByPk(userId);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(usuario);
};
