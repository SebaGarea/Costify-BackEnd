// Modo demo: la instancia pública con datos ficticios (DEMO_MODE=true).
// El asistente de IA no llama a Gemini (para no consumir cuota) y se bloquea
// lo que dejaría la demo inutilizable para el siguiente visitante.
export const DEMO_MODE = process.env.DEMO_MODE === "true";

export const bloquearEnDemo = (mensaje) => (req, res, next) => {
  if (!DEMO_MODE) return next();
  return res.status(403).json({ mensaje, error: mensaje });
};

export const RESPUESTA_IA_DEMO = `👋 ¡Hola! Soy el **asistente de IA de Costify**. En esta demo estoy **desactivado** para no consumir créditos de IA, pero esto es lo que hago en la versión real:

**📊 Respondo con los datos reales del negocio**
- "¿Qué entregas tengo esta semana?" · "¿Quién me debe plata?"
- "¿Cuál fue el producto más vendido del mes?" · "¿Qué materiales tienen poco stock?"
- "¿Cuánta plata hay en caja?" · "Compará las ventas de este mes con el anterior"

**⚡ Ejecuto acciones con lenguaje natural**
- "Anotá un gasto de 20.000 en combustible en efectivo"
- "Registrá un cobro de 50.000 de Laura" · "Marcá como despachada la venta de Diego"
- "Creá una tarea para mañana: llamar al corralón" · "Sumá 4 caños de 40x40 a la lista de compras"

**🔧 Cómo funciona**
Uso **Google Gemini** con *tool-calling*: el modelo elige entre 20 herramientas del backend (lectura y escritura), las ejecuta sobre la base de datos y responde en streaming. Antes de las acciones importantes pido confirmación, y después de cada acción la pantalla se actualiza sola.

Mientras tanto, probá el resto de la app: ventas, plantillas de costo, caja, calendario y tareas. 🙂`;
