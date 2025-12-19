import logger from '../config/logger.js';

export function errorHandler(err, req, res, _next) {
  logger.error('Error capturado', { message: err.message, stack: err.stack, url: req.originalUrl });
  res.status(err.status || 500).json({
    mensaje: err.message || "Error interno del servidor",
    detalles: err.stack 
  });
}