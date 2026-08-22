import jwt from 'jsonwebtoken';
import { models } from '../libs/sequelize.js';
import { authConfig } from '../config/auth.js';

const sanitizeUser = (usuario) => {
  if (!usuario) return null;
  const plain = usuario.toJSON ? usuario.toJSON() : { ...usuario };
  
  delete plain.password_hash;
  delete plain.updatedAt;
  delete plain.createdAt;

  // 👈 CORRECCIÓN CLAVE: Mapear el ID del cliente a req.user.cliente_id
  if (plain.perfil_cliente) {
    plain.cliente_id = plain.perfil_cliente.id;
  }

  return plain;
};

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
    let usuario = await models.Usuario.findByPk(decoded.sub, {
      include: [{ model: models.Cliente, as: 'perfil_cliente' }],
    });

    if (!usuario || !usuario.activo) {
      const error = new Error('Usuario no válido');
      error.statusCode = 401;
      return next(error);
    }

    // 👈 Búsqueda de respaldo si la relaciónPerfilCliente devolvió null
    if (!usuario.perfil_cliente && usuario.rol === 'cliente') {
      const posibleCliente = await models.Cliente.findOne({
        where: { email: usuario.email },
      });
      if (posibleCliente) {
        usuario = usuario.toJSON ? usuario.toJSON() : usuario;
        usuario.perfil_cliente = posibleCliente;
      }
    }

    req.user = sanitizeUser(usuario);
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