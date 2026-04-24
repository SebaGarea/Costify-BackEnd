import { PerfilPinturaDAOMongo } from "../dao/PerfilPinturaDAOMongo.js";

const PERFILES_DEFAULT = [
  // Cuadrados (perímetro = 4 × lado / 1000)
  { nombre: "CAÑO 20×20", tipo: "cuadrado", perimetro: 0.08 },
  { nombre: "CAÑO 25×25", tipo: "cuadrado", perimetro: 0.10 },
  { nombre: "CAÑO 30×30", tipo: "cuadrado", perimetro: 0.12 },
  { nombre: "CAÑO 38×38", tipo: "cuadrado", perimetro: 0.152 },
  { nombre: "CAÑO 40×40", tipo: "cuadrado", perimetro: 0.16 },
  { nombre: "CAÑO 50×50", tipo: "cuadrado", perimetro: 0.20 },
  { nombre: "CAÑO 60×60", tipo: "cuadrado", perimetro: 0.24 },
  { nombre: "CAÑO 80×80", tipo: "cuadrado", perimetro: 0.32 },
  { nombre: "CAÑO 100×100", tipo: "cuadrado", perimetro: 0.40 },
  // Rectangulares (perímetro = 2 × (ancho + alto) / 1000)
  { nombre: "CAÑO 20×40", tipo: "rectangular", perimetro: 0.12 },
  { nombre: "CAÑO 20×60", tipo: "rectangular", perimetro: 0.16 },
  { nombre: "CAÑO 25×50", tipo: "rectangular", perimetro: 0.15 },
  { nombre: "CAÑO 30×60", tipo: "rectangular", perimetro: 0.18 },
  { nombre: "CAÑO 40×60", tipo: "rectangular", perimetro: 0.20 },
  { nombre: "CAÑO 40×80", tipo: "rectangular", perimetro: 0.24 },
  { nombre: "CAÑO 50×100", tipo: "rectangular", perimetro: 0.30 },
  { nombre: "CAÑO 60×80", tipo: "rectangular", perimetro: 0.28 },
  { nombre: "CAÑO 60×120", tipo: "rectangular", perimetro: 0.36 },
  // Redondos (perímetro = π × diámetro / 1000)
  { nombre: "CAÑO REDONDO ø21.3", tipo: "redondo", perimetro: 0.067 },
  { nombre: "CAÑO REDONDO ø26.9", tipo: "redondo", perimetro: 0.085 },
  { nombre: "CAÑO REDONDO ø33.7", tipo: "redondo", perimetro: 0.106 },
  { nombre: "CAÑO REDONDO ø42.4", tipo: "redondo", perimetro: 0.133 },
  { nombre: "CAÑO REDONDO ø48.3", tipo: "redondo", perimetro: 0.152 },
  { nombre: "CAÑO REDONDO ø60.3", tipo: "redondo", perimetro: 0.189 },
  // En L (perímetro ≈ ala1 + ala2, superficie exterior)
  { nombre: "ÁNGULO L 20×20", tipo: "L", perimetro: 0.04 },
  { nombre: "ÁNGULO L 25×25", tipo: "L", perimetro: 0.05 },
  { nombre: "ÁNGULO L 30×30", tipo: "L", perimetro: 0.06 },
  { nombre: "ÁNGULO L 40×40", tipo: "L", perimetro: 0.08 },
  { nombre: "ÁNGULO L 50×50", tipo: "L", perimetro: 0.10 },
  { nombre: "ÁNGULO L 65×65", tipo: "L", perimetro: 0.13 },
];

export const perfilPinturaService = {
  async getAll() {
    const total = await PerfilPinturaDAOMongo.count();
    if (total === 0) {
      for (const perfil of PERFILES_DEFAULT) {
        await PerfilPinturaDAOMongo.create(perfil);
      }
    }
    return PerfilPinturaDAOMongo.getAll();
  },

  getById(id) {
    return PerfilPinturaDAOMongo.getById(id);
  },

  create(data) {
    return PerfilPinturaDAOMongo.create(data);
  },

  update(id, data) {
    return PerfilPinturaDAOMongo.update(id, data);
  },

  delete(id) {
    return PerfilPinturaDAOMongo.delete(id);
  },
};
