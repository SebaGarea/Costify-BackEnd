/**
 * Popula la base de datos DEMO con datos ficticios.
 * Seguro para correr múltiples veces: limpia y re-inserta.
 *
 * Uso:
 *   node scripts/seed-demo.js
 *
 * Requiere que .env tenga DB_NAME=costify_demo (u otro nombre que contenga "demo").
 * Si DB_NAME no incluye "demo", el script aborta como medida de seguridad.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "../src/config/config.js";
import { usuariosModelo } from "../src/dao/models/UserSchema.js";
import { MateriaPrimaModel } from "../src/dao/models/MateriaPrimaSchema.js";
import { PlantillaCostoModel } from "../src/dao/models/PlantillaCostoSchema.js";
import { ProductoModel } from "../src/dao/models/ProductoSchema.js";
import { VentasModel } from "../src/dao/models/VentasSchema.js";

dotenv.config();

// Medida de seguridad: abortar si no estamos apuntando a la DB demo
if (!config.DB_NAME?.toLowerCase().includes("demo")) {
  console.error(
    `\n⛔  ABORTADO — DB_NAME es "${config.DB_NAME}". ` +
      `Este script solo corre si DB_NAME contiene "demo".\n` +
      `Configurá DB_NAME=costify_demo en tu .env.\n`
  );
  process.exit(1);
}

const run = async () => {
  if (!config.MONGO_URL) {
    console.error("MONGO_URL no está configurado en .env");
    process.exit(1);
  }

  console.log(`\n🌱 Conectando a "${config.DB_NAME}"...`);
  await mongoose.connect(config.MONGO_URL, { dbName: config.DB_NAME });
  console.log("✅ Conexión establecida\n");

  // — Limpiar colecciones —
  console.log("🗑️  Limpiando colecciones demo...");
  await Promise.all([
    usuariosModelo.deleteMany({}),
    MateriaPrimaModel.deleteMany({}),
    PlantillaCostoModel.deleteMany({}),
    ProductoModel.deleteMany({}),
    VentasModel.deleteMany({}),
  ]);

  // ── 1. USUARIO DEMO ──────────────────────────────────────────────────────────
  console.log("👤 Creando usuario demo...");
  const passwordHash = bcrypt.hashSync("Demo1234", 10);
  await usuariosModelo.create({
    first_name: "Demo",
    last_name: "Costify",
    email: "demo@costify.com",
    password: passwordHash,
    role: "admin",
    emailVerified: true,
  });

  // ── 2. MATERIAS PRIMAS ───────────────────────────────────────────────────────
  console.log("🔩 Creando materias primas...");
  const mps = await MateriaPrimaModel.insertMany([
    {
      nombre: "Caño cuadrado 20x20",
      categoria: "Hierro",
      type: "Cuadrado",
      medida: "20x20",
      unidad: "barra 6mt",
      espesor: "1.6mm",
      precio: 4800,
      stock: 25,
    },
    {
      nombre: "Caño redondo 1\"",
      categoria: "Hierro",
      type: "Redondo",
      medida: "1\"",
      unidad: "barra 6mt",
      espesor: "2.0mm",
      precio: 3200,
      stock: 18,
    },
    {
      nombre: "Chapa lisa 1.2mm",
      categoria: "Hierro",
      type: "Chapa",
      medida: "1.22x2.44",
      unidad: "plancha",
      espesor: "1.2mm",
      precio: 9500,
      stock: 10,
    },
    {
      nombre: "Bisagra 3\"",
      categoria: "Herrajes",
      type: "Bisagras",
      medida: "3\"",
      unidad: "par",
      precio: 350,
      stock: 60,
    },
    {
      nombre: "Candado 40mm",
      categoria: "Herrajes",
      type: "Candados",
      medida: "40mm",
      unidad: "unidad",
      precio: 1800,
      stock: 12,
    },
    {
      nombre: "Tornillos hex 1/4\" x 1\"",
      categoria: "Buloneria",
      type: "Tornillos",
      medida: "1/4\" x 1\"",
      unidad: "100u",
      precio: 620,
      stock: 30,
    },
    {
      nombre: "Pintura base anticorrosiva",
      categoria: "Pinturas",
      type: "Base",
      medida: "4L",
      unidad: "lata",
      precio: 3800,
      stock: 8,
    },
    {
      nombre: "Pintura esmalte blanco",
      categoria: "Pinturas",
      type: "Esmalte",
      medida: "4L",
      unidad: "lata",
      precio: 4600,
      stock: 6,
    },
  ]);

  // Mapa por nombre para referenciar fácilmente
  const mp = Object.fromEntries(mps.map((m) => [m.nombre, m]));

  // ── 3. PLANTILLAS ────────────────────────────────────────────────────────────
  console.log("📋 Creando plantillas de costo...");
  const plantillas = await PlantillaCostoModel.insertMany([
    {
      nombre: "Reja básica 1m x 1m",
      categoria: "Herrería",
      tipoProyecto: "Reja",
      tags: ["reja", "interior", "residencial"],
      items: [
        {
          materiaPrima: mp["Caño cuadrado 20x20"]._id,
          cantidad: 4,
          valor: mp["Caño cuadrado 20x20"].precio,
          categoria: "Herrería",
          categoriaMP: "Hierro",
          tipoMP: "Cuadrado",
          medidaMP: "20x20",
          espesorMP: "1.6mm",
        },
        {
          materiaPrima: mp["Bisagra 3\""]._id,
          cantidad: 2,
          valor: mp["Bisagra 3\""].precio,
          categoria: "Herrería",
          categoriaMP: "Herrajes",
          tipoMP: "Bisagras",
          medidaMP: "3\"",
        },
      ],
      porcentajesPorCategoria: { Herrería: 140 },
      consumibles: { Herrería: 500 },
      extras: {
        creditoCamioneta: { valor: 0, porcentaje: 0 },
        envio: { valor: 800, porcentaje: 0 },
        camposPersonalizados: [],
      },
      extrasTotal: 800,
      costoTotal: 20900,
      subtotales: { Herrería: 20100 },
      precioFinal: 30300,
      ganancia: 9400,
    },
    {
      nombre: "Puerta corrediza 2m x 1m",
      categoria: "Herrería",
      tipoProyecto: "Puerta",
      tags: ["puerta", "corrediza", "exterior"],
      items: [
        {
          materiaPrima: mp["Caño cuadrado 20x20"]._id,
          cantidad: 8,
          valor: mp["Caño cuadrado 20x20"].precio,
          categoria: "Herrería",
          categoriaMP: "Hierro",
          tipoMP: "Cuadrado",
          medidaMP: "20x20",
          espesorMP: "1.6mm",
        },
        {
          materiaPrima: mp["Chapa lisa 1.2mm"]._id,
          cantidad: 2,
          valor: mp["Chapa lisa 1.2mm"].precio,
          categoria: "Herrería",
          categoriaMP: "Hierro",
          tipoMP: "Chapa",
          medidaMP: "1.22x2.44",
          espesorMP: "1.2mm",
        },
        {
          materiaPrima: mp["Pintura base anticorrosiva"]._id,
          cantidad: 1,
          valor: mp["Pintura base anticorrosiva"].precio,
          categoria: "Pintura",
          categoriaMP: "Pinturas",
          tipoMP: "Base",
          medidaMP: "4L",
        },
      ],
      porcentajesPorCategoria: { Herrería: 150, Pintura: 120 },
      consumibles: { Herrería: 900, Pintura: 300 },
      extras: {
        creditoCamioneta: { valor: 1500, porcentaje: 0 },
        envio: { valor: 1200, porcentaje: 0 },
        camposPersonalizados: [],
      },
      extrasTotal: 2700,
      costoTotal: 64300,
      subtotales: { Herrería: 58400, Pintura: 4200 },
      precioFinal: 98200,
      ganancia: 33900,
    },
    {
      nombre: "Portón residencial 3m x 2m",
      categoria: "Herrería",
      tipoProyecto: "Portón",
      tags: ["portón", "exterior", "residencial"],
      items: [
        {
          materiaPrima: mp["Caño cuadrado 20x20"]._id,
          cantidad: 16,
          valor: mp["Caño cuadrado 20x20"].precio,
          categoria: "Herrería",
          categoriaMP: "Hierro",
          tipoMP: "Cuadrado",
          medidaMP: "20x20",
          espesorMP: "1.6mm",
        },
        {
          materiaPrima: mp["Caño redondo 1\""]._id,
          cantidad: 6,
          valor: mp["Caño redondo 1\""].precio,
          categoria: "Herrería",
          categoriaMP: "Hierro",
          tipoMP: "Redondo",
          medidaMP: "1\"",
          espesorMP: "2.0mm",
        },
        {
          materiaPrima: mp["Candado 40mm"]._id,
          cantidad: 1,
          valor: mp["Candado 40mm"].precio,
          categoria: "Herrería",
          categoriaMP: "Herrajes",
          tipoMP: "Candados",
          medidaMP: "40mm",
        },
        {
          materiaPrima: mp["Pintura esmalte blanco"]._id,
          cantidad: 2,
          valor: mp["Pintura esmalte blanco"].precio,
          categoria: "Pintura",
          categoriaMP: "Pinturas",
          tipoMP: "Esmalte",
          medidaMP: "4L",
        },
      ],
      porcentajesPorCategoria: { Herrería: 155, Pintura: 130 },
      consumibles: { Herrería: 1200, Pintura: 500 },
      extras: {
        creditoCamioneta: { valor: 2000, porcentaje: 0 },
        envio: { valor: 2500, porcentaje: 0 },
        camposPersonalizados: [],
      },
      extrasTotal: 4500,
      costoTotal: 116200,
      subtotales: { Herrería: 104200, Pintura: 10700 },
      precioFinal: 184200,
      ganancia: 68000,
    },
  ]);

  // ── 4. PRODUCTOS ─────────────────────────────────────────────────────────────
  console.log("📦 Creando productos...");
  const productos = await ProductoModel.insertMany([
    {
      nombre: "Reja básica cuadrada",
      descripcion: "Reja de caño cuadrado 20x20 con bisagras, acabado pintado.",
      planillaCosto: plantillas[0]._id,
      catalogo: "rejas",
      modelo: "basica-cuadrada",
      precio: 30300,
      stock: 3,
      activo: true,
    },
    {
      nombre: "Puerta corrediza estándar",
      descripcion: "Puerta corrediza de hierro con chapa, con pintura base.",
      planillaCosto: plantillas[1]._id,
      catalogo: "puertas",
      modelo: "corrediza-estandar",
      precio: 98200,
      stock: 1,
      activo: true,
    },
    {
      nombre: "Portón residencial doble hoja",
      descripcion: "Portón de hierro para entrada vehicular, con candado incluido.",
      planillaCosto: plantillas[2]._id,
      catalogo: "portones",
      modelo: "residencial-doble",
      precio: 184200,
      stock: 0,
      activo: true,
    },
  ]);

  // ── 5. VENTAS ────────────────────────────────────────────────────────────────
  console.log("💰 Creando ventas...");
  const ahora = new Date();
  const hace10 = new Date(ahora); hace10.setDate(ahora.getDate() - 10);
  const hace5 = new Date(ahora); hace5.setDate(ahora.getDate() - 5);
  const en15 = new Date(ahora); en15.setDate(ahora.getDate() + 15);
  const en30 = new Date(ahora); en30.setDate(ahora.getDate() + 30);

  await VentasModel.insertMany([
    {
      fecha: hace10,
      fechaLimite: hace5,
      cliente: "Juan García",
      medio: "efectivo",
      producto: productos[0]._id,
      productoNombre: productos[0].nombre,
      plantilla: plantillas[0]._id,
      cantidad: 2,
      precioUnitarioSnapshot: 30300,
      valorTotal: 60600,
      seña: 60600,
      restan: 0,
      snapshotOrigenPrecio: "catalogo",
      snapshotRegistradoEn: hace10,
      estado: "despachada",
    },
    {
      fecha: hace5,
      fechaLimite: en15,
      cliente: "María López",
      medio: "transferencia",
      producto: productos[1]._id,
      productoNombre: productos[1].nombre,
      plantilla: plantillas[1]._id,
      cantidad: 1,
      precioUnitarioSnapshot: 98200,
      valorTotal: 98200,
      seña: 40000,
      restan: 58200,
      snapshotOrigenPrecio: "catalogo",
      snapshotRegistradoEn: hace5,
      estado: "en_proceso",
      enProcesoAt: hace5,
    },
    {
      fecha: ahora,
      fechaLimite: en30,
      cliente: "Carlos Rodríguez",
      medio: "transferencia",
      producto: productos[2]._id,
      productoNombre: productos[2].nombre,
      plantilla: plantillas[2]._id,
      cantidad: 1,
      precioUnitarioSnapshot: 184200,
      valorTotal: 184200,
      seña: 50000,
      restan: 134200,
      snapshotOrigenPrecio: "catalogo",
      snapshotRegistradoEn: ahora,
      estado: "pendiente",
    },
  ]);

  console.log("\n✅ Seed demo completado:");
  console.log("   👤 1 usuario  — demo@costify.com / Demo1234");
  console.log("   🔩 8 materias primas");
  console.log("   📋 3 plantillas de costo");
  console.log("   📦 3 productos");
  console.log("   💰 3 ventas (despachada / en_proceso / pendiente)");
  console.log("\n🚀 La demo está lista para usar.\n");

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("❌ Error durante el seed:", error);
  mongoose.disconnect().finally(() => process.exit(1));
});
