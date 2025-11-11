export function errorHandler(err, req, res, next) {
  console.error(err); 
  res.status(err.status || 500).json({
    mensaje: err.message || "Error interno del servidor",
    detalles: err.stack 
  });
}