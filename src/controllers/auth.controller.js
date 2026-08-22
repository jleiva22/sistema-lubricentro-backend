import * as authService from '../services/auth.service.js';

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
