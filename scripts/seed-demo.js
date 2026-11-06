/**
 * Carga la base de la DEMO pública con datos ficticios (borra todo y vuelve a cargar).
 *
 * Uso:  DEMO_MODE=true DB_NAME=costify_demo node scripts/seed-demo.js
 *
 * Medida de seguridad: aborta si DEMO_MODE no es "true" o si DB_NAME no contiene "demo",
 * así nunca puede tocar la base real.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { config, generaHash } from "../src/config/config.js";
import {
  usuariosModelo,
  MateriaPrimaModel,
  PlantillaCostoModel,
  ProductoModel,
  VentasModel,
  TareasModel,
  EventoCalendarioModel,
  ListaCompraModel,
  ChatMessageModel,
  CuentaDineroModel,
  CategoriaMovimientoModel,
  MovimientoModel,
  invitacionesModelo,
  IntegracionMercadoPagoModel,
} from "../src/dao/models/index.js";
import { ConfiguracionModel } from "../src/dao/models/ConfiguracionSchema.js";
import { PerfilPinturaModel } from "../src/dao/models/PerfilPinturaSchema.js";

dotenv.config();

export const DEMO_EMAIL = "demo@costify.com";
export const DEMO_PASSWORD = "Demo1234";
const SOCIOS = ["Ana", "Martín"];

if (process.env.DEMO_MODE !== "true" || !String(config.DB_NAME || "").toLowerCase().includes("demo")) {
  console.error(`⛔ ABORTADO: solo corre con DEMO_MODE=true y una base cuyo nombre contenga "demo" (DB_NAME="${config.DB_NAME}").`);
  process.exit(1);
}

// ---------- Fechas relativas a hoy (al mediodía UTC, como el resto de la app) ----------
const hoyAR = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
const dia = (offset) => {
  const d = new Date(`${hoyAR()}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

const run = async () => {
  await mongoose.connect(config.MONGO_URL, { dbName: config.DB_NAME });
  console.log(`🌱 Cargando la demo en "${config.DB_NAME}"...`);
  await mongoose.connection.db.dropDatabase();

  // ── Usuario demo (sin permisos de admin) ──
  const usuario = await usuariosModelo.create({
    first_name: "Usuario",
    last_name: "Demo",
    email: DEMO_EMAIL,
    password: generaHash(DEMO_PASSWORD),
    role: "user",
    emailVerified: true,
    statusMessage: "Probando Costify 👋",
  });

  // ── Configuración del negocio ficticio ──
  await ConfiguracionModel.create({
    precioPinturaM2: 6500,
    perfilNegocio:
      "Taller Demo es una herrería y carpintería a medida (ficticia). Fabrica rejas, portones, puertas y muebles de hierro y madera. Vende por Mercado Libre, Instagram y WhatsApp.",
    sociosCaja: SOCIOS,
  });

  // ── Perfiles para calcular pintura ──
  const perfiles = await PerfilPinturaModel.insertMany([
    { nombre: "Caño cuadrado 20x20", tipo: "cuadrado", perimetro: 0.08 },
    { nombre: "Caño cuadrado 40x40", tipo: "cuadrado", perimetro: 0.16 },
    { nombre: "Caño redondo 1\"", tipo: "redondo", perimetro: 0.08 },
    { nombre: "Planchuela 1\" x 1/8\"", tipo: "planchuela", perimetro: 0.054 },
  ]);
  const perfil = Object.fromEntries(perfiles.map((p) => [p.nombre, p]));

  // ── Materias primas ──
  const mps = await MateriaPrimaModel.insertMany([
    { nombre: "Caño cuadrado 20x20", categoria: "Hierro", type: "Cuadrado", medida: "20x20", unidad: "barra 6mt", espesor: "1.6mm", precio: 14800, stock: 25 },
    { nombre: "Caño cuadrado 40x40", categoria: "Hierro", type: "Cuadrado", medida: "40x40", unidad: "barra 6mt", espesor: "2.0mm", precio: 31500, stock: 12 },
    { nombre: "Caño redondo 1\"", categoria: "Hierro", type: "Redondo", medida: "1\"", unidad: "barra 6mt", espesor: "2.0mm", precio: 12900, stock: 18 },
    { nombre: "Planchuela 1\" x 1/8\"", categoria: "Hierro", type: "Planchuela", medida: "1\" x 1/8\"", unidad: "barra 6mt", precio: 8600, stock: 30 },
    { nombre: "Chapa lisa 1.2mm", categoria: "Hierro", type: "Chapa", medida: "1.22x2.44", unidad: "plancha", espesor: "1.2mm", precio: 58000, stock: 4 },
    { nombre: "Tablón de pino 1\" x 6\"", categoria: "Madera", type: "Tablón", nombreMadera: "Pino", medida: "1\" x 6\"", unidad: "metro", precio: 4200, stock: 40 },
    { nombre: "Bisagra 3\"", categoria: "Herrajes", type: "Bisagras", medida: "3\"", unidad: "par", precio: 2900, stock: 60 },
    { nombre: "Cerradura de embutir", categoria: "Herrajes", type: "Cerraduras", medida: "estándar", unidad: "unidad", precio: 18500, stock: 2 },
    { nombre: "Tornillos autoperforantes", categoria: "Buloneria", type: "Tornillos", medida: "14x1\"", unidad: "100u", precio: 5400, stock: 9 },
    { nombre: "Antióxido negro", categoria: "Pinturas", type: "Base", medida: "4L", unidad: "lata", precio: 26000, stock: 3 },
    { nombre: "Esmalte sintético negro", categoria: "Pinturas", type: "Esmalte", medida: "4L", unidad: "lata", precio: 34000, stock: 2 },
  ]);
  const mp = Object.fromEntries(mps.map((m) => [m.nombre, m]));
  const item = (nombre, cantidad, categoria, extra = {}) => ({
    materiaPrima: mp[nombre]._id,
    valor: mp[nombre].precio,
    cantidad,
    categoria,
    categoriaMP: mp[nombre].categoria,
    tipoMP: mp[nombre].type,
    medidaMP: mp[nombre].medida,
    espesorMP: mp[nombre].espesor,
    nombreMadera: mp[nombre].nombreMadera,
    ...extra,
  });
  const extrasBase = (envio = 0) => ({
    creditoCamioneta: { valor: 0, porcentaje: 0 },
    envio: { valor: envio, porcentaje: 0 },
    camposPersonalizados: [],
  });

  // ── Plantillas de costo (los totales se recalculan con la lógica real de la app) ──
  const plantillas = await PlantillaCostoModel.insertMany([
    {
      nombre: "Reja para ventana 1,20 x 1,00",
      categoria: "Herrería",
      tipoProyecto: "Reja",
      tags: ["reja", "ventana", "residencial"],
      items: [
        item("Caño cuadrado 20x20", 3, "Herrería", { perfilPinturaId: perfil["Caño cuadrado 20x20"]._id, perfilPinturaPerimetro: 0.08 }),
        item("Planchuela 1\" x 1/8\"", 1, "Herrería"),
        item("Antióxido negro", 0.25, "Pintura"),
      ],
      porcentajesPorCategoria: { Herrería: 120, Pintura: 80 },
      consumibles: { Herrería: 6000, Pintura: 2000 },
      extras: extrasBase(),
    },
    {
      nombre: "Portón corredizo 3,00 x 2,00",
      categoria: "Herrería",
      tipoProyecto: "Portón",
      tags: ["portón", "exterior"],
      items: [
        item("Caño cuadrado 40x40", 4, "Herrería"),
        item("Caño cuadrado 20x20", 6, "Herrería"),
        item("Chapa lisa 1.2mm", 2, "Herrería"),
        item("Cerradura de embutir", 1, "Herrería"),
        item("Esmalte sintético negro", 1, "Pintura"),
      ],
      porcentajesPorCategoria: { Herrería: 110, Pintura: 80 },
      consumibles: { Herrería: 25000, Pintura: 6000 },
      extras: extrasBase(35000),
    },
    {
      nombre: "Mesa ratona hierro y pino",
      categoria: "Mixta",
      tipoProyecto: "Mueble",
      tags: ["mueble", "interior"],
      items: [
        item("Caño cuadrado 20x20", 1.5, "Herrería"),
        item("Tablón de pino 1\" x 6\"", 4, "Carpintería"),
        item("Esmalte sintético negro", 0.25, "Pintura"),
      ],
      porcentajesPorCategoria: { Herrería: 130, Carpintería: 120, Pintura: 80 },
      consumibles: { Herrería: 4000, Carpintería: 5000, Pintura: 1500 },
      extras: extrasBase(),
    },
    {
      nombre: "Puerta de chapa simple",
      categoria: "Herrería",
      tipoProyecto: "Puerta",
      tags: ["puerta", "exterior"],
      items: [
        item("Caño cuadrado 40x40", 2, "Herrería"),
        item("Chapa lisa 1.2mm", 1, "Herrería"),
        item("Bisagra 3\"", 2, "Herrería"),
        item("Cerradura de embutir", 1, "Herrería"),
        item("Antióxido negro", 0.5, "Pintura"),
      ],
      porcentajesPorCategoria: { Herrería: 115, Pintura: 80 },
      consumibles: { Herrería: 12000, Pintura: 3000 },
      extras: extrasBase(),
    },
  ]);
  const { plantillaCostoService } = await import("../src/services/plantillaCosto.service.js");
  await plantillaCostoService.recalculateAllPlantillas();
  const pl = await PlantillaCostoModel.find().lean();
  const precioDe = (nombre) => Math.round(pl.find((p) => p.nombre === nombre)?.precioFinal || 0);

  // ── Productos (sin imágenes: la demo no usa Cloudinary) ──
  const productos = await ProductoModel.insertMany([
    { nombre: "Reja para ventana", descripcion: "Reja de caño 20x20 con planchuela, antióxido negro.", planillaCosto: plantillas[0]._id, catalogo: "rejas", modelo: "ventana-120", precio: precioDe(plantillas[0].nombre), stock: 2 },
    { nombre: "Portón corredizo", descripcion: "Portón de 3 metros con chapa y cerradura.", planillaCosto: plantillas[1]._id, catalogo: "portones", modelo: "corredizo-300", precio: precioDe(plantillas[1].nombre), stock: 0 },
    { nombre: "Mesa ratona industrial", descripcion: "Estructura de hierro y tapa de pino.", planillaCosto: plantillas[2]._id, catalogo: "muebles", modelo: "ratona-industrial", precio: precioDe(plantillas[2].nombre), stock: 3 },
    { nombre: "Puerta de chapa", descripcion: "Puerta exterior con cerradura de embutir.", planillaCosto: plantillas[3]._id, catalogo: "puertas", modelo: "chapa-simple", precio: precioDe(plantillas[3].nombre), stock: 1 },
  ]);

  // ── Ventas (distintos estados y meses, para que el dashboard tenga datos) ──
  const venta = (i, cliente, medio, cantidad, offsetFecha, offsetEntrega, estado, pagado) => {
    const p = productos[i];
    const valorTotal = p.precio * cantidad;
    const sena = pagado === "todo" ? valorTotal : Math.round(valorTotal * pagado);
    return {
      fecha: dia(offsetFecha),
      fechaLimite: dia(offsetEntrega),
      cliente,
      medio,
      producto: p._id,
      productoNombre: p.nombre,
      plantilla: plantillas[i]._id,
      cantidad,
      precioUnitarioSnapshot: p.precio,
      snapshotOrigenPrecio: "catalogo",
      snapshotRegistradoEn: dia(offsetFecha),
      valorTotal,
      seña: sena,
      restan: valorTotal - sena,
      estado,
      ...(estado !== "pendiente" ? { enProcesoAt: dia(offsetFecha + 1) } : {}),
    };
  };
  await VentasModel.insertMany([
    venta(0, "Laura Fernández", "whatsapp", 2, -75, -60, "despachada", "todo"),
    venta(2, "Diego Sosa", "mercado_libre", 1, -62, -55, "despachada", "todo"),
    venta(1, "Consorcio Las Lomas", "otro", 1, -48, -30, "despachada", "todo"),
    venta(3, "Pablo Méndez", "instagram", 1, -35, -20, "despachada", "todo"),
    venta(2, "Sofía Ruiz", "mercado_libre", 2, -20, -12, "finalizada", "todo"),
    venta(0, "Marcelo Díaz", "whatsapp", 3, -12, -2, "en_proceso", 0.5),
    venta(1, "Gabriela Torres", "instagram", 1, -6, 9, "en_proceso", 0.4),
    venta(3, "Ricardo Gómez", "whatsapp", 1, -2, 14, "pendiente", 0.3),
    venta(2, "Valentina Paz", "mercado_libre", 1, -1, 6, "pendiente", "todo"),
  ]);

  // ── Tareas y eventos ──
  await TareasModel.insertMany([
    { title: "Pasar presupuesto de baranda a Ricardo", priority: "alta", dueDate: dia(1), tags: ["presupuesto", "cliente"], createdBy: usuario._id },
    { title: "Comprar discos de corte", priority: "media", dueDate: dia(2), tags: ["otros"], createdBy: usuario._id },
    { title: "Sacar fotos del portón para Instagram", priority: "baja", dueDate: dia(5), tags: ["otros"], createdBy: usuario._id },
    { title: "Confirmar medidas con Gabriela", priority: "alta", dueDate: dia(-1), tags: ["cliente"], createdBy: usuario._id },
    { title: "Pintar reja de Marcelo", status: "hecho", priority: "media", dueDate: dia(-3), tags: ["cliente"], createdBy: usuario._id },
  ]);
  await EventoCalendarioModel.insertMany([
    { title: "Medición en obra (Consorcio Las Lomas)", fecha: dia(3), hora: "10:00", createdBy: usuario._id },
    { title: "Retiro de chapa en el corralón", fecha: dia(7), hora: "09:30", createdBy: usuario._id },
  ]);

  // ── Lista de compras ──
  const li = (nombre, cantidad) => ({
    id: `demo-${Math.random().toString(36).slice(2, 9)}`,
    categoria: mp[nombre].categoria,
    tipo: mp[nombre].type,
    medida: mp[nombre].medida,
    espesor: mp[nombre].espesor || "",
    materiaId: String(mp[nombre]._id),
    nombreMadera: mp[nombre].nombreMadera || "",
    cantidad: String(cantidad),
    descripcion: "",
    detalle: "",
    precioOverride: null,
    esPersonalizado: false,
    nombrePersonalizado: "",
    valorPersonalizado: 0,
  });
  await ListaCompraModel.create({
    key: "global",
    sectionItems: {
      herreria: [li("Caño cuadrado 40x40", 4), li("Cerradura de embutir", 2)],
      carpinteria: [li("Tablón de pino 1\" x 6\"", 6)],
      pintura: [li("Esmalte sintético negro", 1)],
      otros: [],
    },
  });

  // ── Caja: cuentas, movimientos de 3 meses y retiros de socios ──
  const { asegurarDatosIniciales } = await import("../src/services/caja.service.js");
  await asegurarDatosIniciales();
  const inicio = dia(-90);
  await CuentaDineroModel.updateOne({ nombre: "Efectivo" }, { $set: { saldoInicial: 450000, fechaSaldoInicial: inicio } });
  await CuentaDineroModel.updateOne({ integracion: "mercadopago" }, { $set: { saldoInicial: 180000, fechaSaldoInicial: inicio } });
  await CuentaDineroModel.updateOne({ nombre: "Cuenta secundaria" }, { $set: { saldoInicial: 0, fechaSaldoInicial: inicio, activa: false } });
  const efectivo = await CuentaDineroModel.findOne({ nombre: "Efectivo" }).lean();
  const mpCuenta = await CuentaDineroModel.findOne({ integracion: "mercadopago" }).lean();
  const cat = Object.fromEntries((await CategoriaMovimientoModel.find().lean()).map((c) => [c.clave || c.nombre, c._id]));

  const mov = (tipo, monto, offset, cuenta, categoria, descripcion, extra = {}) => ({
    tipo, monto, fecha: dia(offset), cuenta: cuenta._id, categoria: categoria ?? null, descripcion,
    origen: { tipo: "manual" }, createdBy: usuario._id, ...extra,
  });
  const movimientos = [];
  // Ingresos por ventas
  [[-74, 260000, efectivo], [-60, 145000, mpCuenta], [-45, 610000, efectivo], [-33, 238000, efectivo], [-18, 290000, mpCuenta], [-11, 180000, efectivo], [-5, 150000, mpCuenta], [-1, 145000, mpCuenta]]
    .forEach(([d, m, c]) => movimientos.push(mov("ingreso", m, d, c, cat.ventas, "Cobro de venta")));
  // Plata de Mercado Libre que todavía no se liberó
  movimientos.push(mov("ingreso", 132000, -1, mpCuenta, cat.ventas, "Venta Mercado Libre: mesa ratona", { liberacion: dia(8) }));
  // Gastos del taller
  [
    [-80, 185000, efectivo, cat.materiales, "Caños y chapa (corralón)"],
    [-70, 42000, mpCuenta, "Servicios", "Luz del taller"],
    [-58, 96000, efectivo, cat.materiales, "Hierro para portón"],
    [-52, 38000, mpCuenta, "Flete / Combustible", "Combustible camioneta"],
    [-40, 65000, efectivo, "Pintura", "Antióxido y esmalte"],
    [-38, 45000, mpCuenta, "Servicios", "Luz e internet"],
    [-27, 120000, efectivo, cat.materiales, "Chapa y cerraduras"],
    [-21, 54000, efectivo, "Herramientas", "Amoladora nueva"],
    [-15, 31000, mpCuenta, "Flete / Combustible", "Flete entrega portón"],
    [-8, 47000, mpCuenta, "Servicios", "Luz del taller"],
    [-4, 72000, efectivo, cat.materiales, "Tablones de pino"],
  ].forEach(([d, m, c, k, desc]) => movimientos.push(mov("egreso", m, d, c, cat[k] ?? k, desc)));
  // Retiros de socios
  [[-60, 120000, "Ana"], [-59, 120000, "Martín"], [-30, 100000, "Ana"], [-29, 100000, "Martín"], [-3, 60000, "Ana"]]
    .forEach(([d, m, socio]) => movimientos.push(mov("egreso", m, d, efectivo, cat.retiros, `Retiro de ${socio}`, { socio })));
  // Transferencia entre cuentas
  movimientos.push(mov("transferencia", 100000, -25, mpCuenta, null, "Retiro de Mercado Pago a efectivo", { cuentaDestino: efectivo._id }));
  await MovimientoModel.insertMany(movimientos);

  // Colecciones que la demo no usa: quedan vacías.
  await Promise.all([ChatMessageModel.deleteMany({}), invitacionesModelo.deleteMany({}), IntegracionMercadoPagoModel.deleteMany({})]);

  console.log(`✅ Demo lista: ${DEMO_EMAIL} / ${DEMO_PASSWORD} · ${mps.length} materias primas · ${plantillas.length} plantillas · ${productos.length} productos · 9 ventas · ${movimientos.length} movimientos de caja`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("❌ Error cargando la demo:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
