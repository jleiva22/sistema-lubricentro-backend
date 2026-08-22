import jwt from 'jsonwebtoken';
import { models } from '../libs/sequelize.js';
import { authConfig } from '../config/auth.js';

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.replace('Bearer ', '').trim();
};

const getCookieToken = (req, cookieName) => {
  if (!req.cookies) return null;
  return req.cookies[cookieName] || null;
};

export const authMiddleware = async (req, res, next) => {
  try {
    const token = getBearerToken(req) || getCookieToken(req, 'accessToken');

    if (!token) {
      const error = new Error('No autenticado');
      error.statusCode = 401;
      return next(error);
    }

    const decoded = jwt.verify(token, authConfig.accessSecret);
    const usuario = await models.Usuario.findByPk(decoded.sub);

    if (!usuario || !usuario.activo) {
      const error = new Error('Usuario no válido');
      error.statusCode = 401;
      return next(error);
    }

    req.user = usuario;
    return next();
  } catch (error) {
    const authError = new Error('Token inválido o expirado');
    authError.statusCode = 401;
    return next(authError);
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('No autenticado');
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.rol)) {
      const error = new Error('No tienes permisos para esta acción');
      error.statusCode = 403;
      return next(error);
    }

    return next();
  };
};
