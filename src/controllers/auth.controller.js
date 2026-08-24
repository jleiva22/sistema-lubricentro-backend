import * as authService from '../services/auth.service.js';
import * as usuarioService from '../services/usuarios.service.js';

export const login = async (req, res, next) => {
  try {
    const { usuario, accessToken, refreshToken } = await authService.login(req.body);
    authService.setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      message: 'Login exitoso',
      usuario,
    });
  } catch (error) {
    return next(error);
  }
};

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
export const refresh = async (req, res, next) => {
  try {
    const refreshTokenValue = req.cookies?.refreshToken || null;
    const { usuario, accessToken, refreshToken } = await authService.refreshAccessToken(refreshTokenValue);

    authService.setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      message: 'Token renovado',
      usuario,
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res) => {
  authService.clearAuthCookies(res);
  return res.status(200).json({ message: 'Sesión cerrada' });
};

export const me = async (req, res, next) => {
  try {
    const usuario = await authService.getAuthenticatedUser(req.user.id);
    return res.status(200).json({ usuario });
  } catch (error) {
    return next(error);
  }
};

