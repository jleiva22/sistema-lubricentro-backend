export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && err.details ? { details: err.details } : {}),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
};
