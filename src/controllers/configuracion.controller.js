import { configuracionService } from "../services/configuracion.service.js";

export class ConfiguracionController {
  static async get(req, res, next) {
    try {
      const config = await configuracionService.get();
      res.json(config);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { precioPinturaM2, materiaPrimaPinturaId } = req.body;
      const updateData = {};

      if (precioPinturaM2 !== undefined) {
        const precio = Number(precioPinturaM2);
        if (isNaN(precio) || precio <= 0) {
          return res.status(400).json({ error: "precioPinturaM2 debe ser un número mayor a 0" });
        }
        updateData.precioPinturaM2 = precio;
      }

      if (materiaPrimaPinturaId !== undefined) {
        updateData.materiaPrimaPinturaId = materiaPrimaPinturaId || null;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No hay datos para actualizar" });
      }

      const updated = await configuracionService.update(updateData);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async aplicarATodas(req, res, next) {
    try {
      const { precioPinturaM2 } = req.body;
      if (precioPinturaM2 === undefined || isNaN(Number(precioPinturaM2)) || Number(precioPinturaM2) <= 0) {
        return res.status(400).json({ error: "precioPinturaM2 debe ser un número mayor a 0" });
      }
      const precio = Number(precioPinturaM2);
      await configuracionService.update({ precioPinturaM2: precio });
      const result = await configuracionService.aplicarPrecioPinturaATodas(precio);
      res.json({ success: true, modificadas: result.modificadas });
    } catch (error) {
      next(error);
    }
  }
}
