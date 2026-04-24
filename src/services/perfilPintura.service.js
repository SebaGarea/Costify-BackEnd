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
  // Rectangulares (perímetro = 2 × (ancho + alto) / 1000, número mayor primero)
  { nombre: "CAÑO 40×20", tipo: "rectangular", perimetro: 0.12 },
  { nombre: "CAÑO 60×20", tipo: "rectangular", perimetro: 0.16 },
  { nombre: "CAÑO 50×25", tipo: "rectangular", perimetro: 0.15 },
  { nombre: "CAÑO 60×30", tipo: "rectangular", perimetro: 0.18 },
  { nombre: "CAÑO 60×40", tipo: "rectangular", perimetro: 0.20 },
  { nombre: "CAÑO 80×40", tipo: "rectangular", perimetro: 0.24 },
  { nombre: "CAÑO 100×50", tipo: "rectangular", perimetro: 0.30 },
  { nombre: "CAÑO 80×60", tipo: "rectangular", perimetro: 0.28 },
  { nombre: "CAÑO 120×60", tipo: "rectangular", perimetro: 0.36 },
  // Redondos (perímetro = π × diámetro / 1000)
  { nombre: "CAÑO REDONDO ø21.3", tipo: "redondo", perimetro: 0.067 },
  { nombre: "CAÑO REDONDO ø26.9", tipo: "redondo", perimetro: 0.085 },
  { nombre: "CAÑO REDONDO ø33.7", tipo: "redondo", perimetro: 0.106 },
  { nombre: "CAÑO REDONDO ø42.4", tipo: "redondo", perimetro: 0.133 },
  { nombre: "CAÑO REDONDO ø48.3", tipo: "redondo", perimetro: 0.152 },
  { nombre: "CAÑO REDONDO ø60.3", tipo: "redondo", perimetro: 0.189 },
  // En L en pulgadas (perímetro = 2 × pulgada × 0.0254)
  { nombre: 'ÁNGULO 1/2"',   tipo: "L", perimetro: 0.025 },
  { nombre: 'ÁNGULO 5/8"',   tipo: "L", perimetro: 0.032 },
  { nombre: 'ÁNGULO 3/4"',   tipo: "L", perimetro: 0.038 },
  { nombre: 'ÁNGULO 7/8"',   tipo: "L", perimetro: 0.044 },
  { nombre: 'ÁNGULO 1"',     tipo: "L", perimetro: 0.051 },
  { nombre: 'ÁNGULO 1,1/4"', tipo: "L", perimetro: 0.064 },
  { nombre: 'ÁNGULO 1,1/2"', tipo: "L", perimetro: 0.076 },
  { nombre: 'ÁNGULO 1,3/4"', tipo: "L", perimetro: 0.089 },
  { nombre: 'ÁNGULO 2"',     tipo: "L", perimetro: 0.102 },
  { nombre: 'ÁNGULO 2,1/4"', tipo: "L", perimetro: 0.114 },
  { nombre: 'ÁNGULO 2,1/2"', tipo: "L", perimetro: 0.127 },
  { nombre: 'ÁNGULO 3"',     tipo: "L", perimetro: 0.152 },
  // Planchuela en pulgadas (placeholder — modificar superficie según necesidad)
  { nombre: 'PLANCHUELA 1/2"',   tipo: "planchuela", perimetro: 0.025 },
  { nombre: 'PLANCHUELA 5/8"',   tipo: "planchuela", perimetro: 0.032 },
  { nombre: 'PLANCHUELA 3/4"',   tipo: "planchuela", perimetro: 0.038 },
  { nombre: 'PLANCHUELA 7/8"',   tipo: "planchuela", perimetro: 0.044 },
  { nombre: 'PLANCHUELA 1"',     tipo: "planchuela", perimetro: 0.051 },
  { nombre: 'PLANCHUELA 1,1/4"', tipo: "planchuela", perimetro: 0.064 },
  { nombre: 'PLANCHUELA 1,1/2"', tipo: "planchuela", perimetro: 0.076 },
  { nombre: 'PLANCHUELA 1,3/4"', tipo: "planchuela", perimetro: 0.089 },
  { nombre: 'PLANCHUELA 2"',     tipo: "planchuela", perimetro: 0.102 },
  { nombre: 'PLANCHUELA 2,1/4"', tipo: "planchuela", perimetro: 0.114 },
  { nombre: 'PLANCHUELA 2,1/2"', tipo: "planchuela", perimetro: 0.127 },
  { nombre: 'PLANCHUELA 3"',     tipo: "planchuela", perimetro: 0.152 },
  // Tee en pulgadas (placeholder — modificar superficie según necesidad)
  { nombre: 'TEE 1/2"',   tipo: "tee", perimetro: 0.025 },
  { nombre: 'TEE 5/8"',   tipo: "tee", perimetro: 0.032 },
  { nombre: 'TEE 3/4"',   tipo: "tee", perimetro: 0.038 },
  { nombre: 'TEE 7/8"',   tipo: "tee", perimetro: 0.044 },
  { nombre: 'TEE 1"',     tipo: "tee", perimetro: 0.051 },
  { nombre: 'TEE 1,1/4"', tipo: "tee", perimetro: 0.064 },
  { nombre: 'TEE 1,1/2"', tipo: "tee", perimetro: 0.076 },
  { nombre: 'TEE 1,3/4"', tipo: "tee", perimetro: 0.089 },
  { nombre: 'TEE 2"',     tipo: "tee", perimetro: 0.102 },
  { nombre: 'TEE 2,1/4"', tipo: "tee", perimetro: 0.114 },
  { nombre: 'TEE 2,1/2"', tipo: "tee", perimetro: 0.127 },
  { nombre: 'TEE 3"',     tipo: "tee", perimetro: 0.152 },
  // Cuadrado Macizo en pulgadas (placeholder — modificar superficie según necesidad)
  { nombre: 'CUADRADO MACIZO 1/2"',   tipo: "cuadMacizo", perimetro: 0.025 },
  { nombre: 'CUADRADO MACIZO 5/8"',   tipo: "cuadMacizo", perimetro: 0.032 },
  { nombre: 'CUADRADO MACIZO 3/4"',   tipo: "cuadMacizo", perimetro: 0.038 },
  { nombre: 'CUADRADO MACIZO 7/8"',   tipo: "cuadMacizo", perimetro: 0.044 },
  { nombre: 'CUADRADO MACIZO 1"',     tipo: "cuadMacizo", perimetro: 0.051 },
  { nombre: 'CUADRADO MACIZO 1,1/4"', tipo: "cuadMacizo", perimetro: 0.064 },
  { nombre: 'CUADRADO MACIZO 1,1/2"', tipo: "cuadMacizo", perimetro: 0.076 },
  { nombre: 'CUADRADO MACIZO 1,3/4"', tipo: "cuadMacizo", perimetro: 0.089 },
  { nombre: 'CUADRADO MACIZO 2"',     tipo: "cuadMacizo", perimetro: 0.102 },
  { nombre: 'CUADRADO MACIZO 2,1/4"', tipo: "cuadMacizo", perimetro: 0.114 },
  { nombre: 'CUADRADO MACIZO 2,1/2"', tipo: "cuadMacizo", perimetro: 0.127 },
  { nombre: 'CUADRADO MACIZO 3"',     tipo: "cuadMacizo", perimetro: 0.152 },
  // Redondo Macizo en pulgadas (placeholder — modificar superficie según necesidad)
  { nombre: 'REDONDO MACIZO 1/2"',   tipo: "redMacizo", perimetro: 0.025 },
  { nombre: 'REDONDO MACIZO 5/8"',   tipo: "redMacizo", perimetro: 0.032 },
  { nombre: 'REDONDO MACIZO 3/4"',   tipo: "redMacizo", perimetro: 0.038 },
  { nombre: 'REDONDO MACIZO 7/8"',   tipo: "redMacizo", perimetro: 0.044 },
  { nombre: 'REDONDO MACIZO 1"',     tipo: "redMacizo", perimetro: 0.051 },
  { nombre: 'REDONDO MACIZO 1,1/4"', tipo: "redMacizo", perimetro: 0.064 },
  { nombre: 'REDONDO MACIZO 1,1/2"', tipo: "redMacizo", perimetro: 0.076 },
  { nombre: 'REDONDO MACIZO 1,3/4"', tipo: "redMacizo", perimetro: 0.089 },
  { nombre: 'REDONDO MACIZO 2"',     tipo: "redMacizo", perimetro: 0.102 },
  { nombre: 'REDONDO MACIZO 2,1/4"', tipo: "redMacizo", perimetro: 0.114 },
  { nombre: 'REDONDO MACIZO 2,1/2"', tipo: "redMacizo", perimetro: 0.127 },
  { nombre: 'REDONDO MACIZO 3"',     tipo: "redMacizo", perimetro: 0.152 },
];

export const perfilPinturaService = {
  async getAll() {
    const total = await PerfilPinturaDAOMongo.count();
    if (total === 0) {
      await PerfilPinturaDAOMongo.hardDeleteAll();
      for (const perfil of PERFILES_DEFAULT) {
        await PerfilPinturaDAOMongo.create(perfil);
      }
    } else {
      // Normalizar nombres de rectangulares: número mayor primero (ej. 40×20, no 20×40)
      const todos = await PerfilPinturaDAOMongo.getAll();
      for (const perfil of todos) {
        if (perfil.tipo !== "rectangular") continue;
        const match = perfil.nombre.match(/(\d+)×(\d+)/);
        if (!match) continue;
        const a = parseInt(match[1]);
        const b = parseInt(match[2]);
        if (a < b) {
          await PerfilPinturaDAOMongo.update(perfil._id, { nombre: perfil.nombre.replace(`${a}×${b}`, `${b}×${a}`) });
        }
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
