# Costify — BackEnd

> API REST para la gestión integral de un negocio de fabricación a medida: costos, ventas, producción, contenido de redes y un **asistente de IA** con tool-calling sobre los datos reales del negocio. Construida con **Node.js**, **Express** y **MongoDB**.

![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/IA-Google_Gemini-8E75B2?logo=google&logoColor=white)
![Swagger](https://img.shields.io/badge/Docs-Swagger-85EA2D?logo=swagger&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

---

## 📖 Descripción

**Costify** ayuda a talleres, fábricas y emprendimientos a calcular precios de venta de forma flexible y precisa, controlar ventas y cobros, organizar la producción y planificar contenido. Este repositorio contiene la **API**, consumida por el [frontend en React](https://github.com/SebaGarea/Costify-FronEnd).

---

## 🚀 Funcionalidades

### Dominio del negocio
- **Materias primas** — insumos con categoría, tipo, medida, stock y precio; importación masiva desde Excel.
- **Plantillas de costo (presupuestos)** — "recetas" por secciones (herrería, carpintería, pintura, otros) con materiales, consumibles, extras, porcentajes de ganancia y cálculo de **precios por plataforma**. Soportan **archivos adjuntos** (PDF/imágenes vía Cloudinary) y comentarios.
- **Productos** — catálogo vinculado a plantillas, con **imágenes en Cloudinary** y stock; precio recalculado en vivo desde la plantilla.
- **Ventas** — registro con estados, seña, saldo, snapshots de precio/materiales, fecha de entrega y cliente.
- **Tareas** — recordatorios con prioridad, vencimiento, tags y estados.
- **Eventos de calendario** — eventos manuales para la vista unificada.
- **Contenido de redes** — planificación de publicaciones por canal (idea → programada → publicada).
- **Lista de compras** — documento colaborativo por secciones.
- **Configuración** — perfil del negocio (usado como contexto del asistente de IA).

### Asistente de IA 🤖
- Endpoint de **chat con streaming** basado en **Google Gemini** con **tool-calling**.
- **Herramientas de lectura**: métricas del negocio, entregas próximas, búsqueda de productos, materias con stock bajo, márgenes por producto, comparación de ventas mensuales, clima, dólar y búsqueda web.
- **Herramientas de escritura**: crear/completar/editar/borrar tareas, registrar cobros, marcar entregas, crear ventas y productos, sumar a la lista de compras y crear publicaciones.
- **Contexto real**: inyecta un resumen del negocio + la fecha actual (zona horaria de Argentina) + el perfil del negocio en el prompt.
- **Historial server-side** por usuario, **resumen proactivo** determinístico (sin consumir cuota de IA), **rate-limit** y **modelo de respaldo** con reintentos ante errores transitorios (503).

### Transversal
- **Autenticación y autorización** — Passport (local, JWT y Google OAuth 2.0).
- **Validación profesional** de datos con [express-validator](https://express-validator.github.io/).
- **Seguridad HTTP** con [Helmet](https://github.com/helmetjs/helmet) y rate limiting.
- **Documentación interactiva** con Swagger.
- **Logging estructurado** con Winston.
- **Emails** transaccionales (invitaciones) con Nodemailer.

---

## 🛠️ Tecnologías

| Categoría | Stack |
|---|---|
| **Core** | Node.js, Express, MongoDB, Mongoose |
| **IA** | [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini) |
| **Auth** | Passport (local, JWT, Google OAuth 2.0), bcrypt |
| **Archivos / Media** | Cloudinary, Multer |
| **Seguridad** | Helmet, express-rate-limit, express-validator |
| **Docs** | Swagger (`swagger-ui-express`, `swagger-jsdoc`) |
| **Email** | Nodemailer |
| **Logging** | Winston |
| **Datos auxiliares** | xlsx (importación Excel) |
| **Testing** | Mocha, Chai, Sinon, Supertest |
| **Infra** | Docker, Caddy (reverse proxy + TLS) |

---

## 📦 Instalación y uso

```bash
# 1. Clonar
git clone https://github.com/SebaGarea/Costify-BackEnd.git
cd Costify-BackEnd

# 2. Dependencias
npm install

# 3. Variables de entorno (.env) — ver sección siguiente

# 4. Levantar en desarrollo (con nodemon)
npm run dev

# 5. Producción
npm start
```

El servidor queda en `http://localhost:8080` y la documentación Swagger en [`/api-docs`](http://localhost:8080/api-docs).

### 🔑 Variables de entorno principales

```bash
PORT=8080
MONGO_URI=mongodb://localhost:27017/costify
JWT_SECRET=tu_secreto
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:8080/api/sessions/googlecallback

# Cloudinary (imágenes de productos / adjuntos de plantillas)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Asistente de IA (Google Gemini)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite          # opcional
GEMINI_FALLBACK_MODEL=gemini-2.0-flash      # opcional
```

---

## 🐳 Docker

```bash
docker compose up --build
```

Levanta la API y MongoDB. Para producción, la carpeta [`deploy/`](deploy/) incluye `docker-compose.prod.yml`, `Caddyfile` (reverse proxy + TLS automático) y una guía paso a paso ([`DEPLOY-ORACLE.md`](deploy/DEPLOY-ORACLE.md)).

---

## 🧪 Testing

```bash
npm test               # unitarios + integración
npm run test:unit      # servicios y utilidades
npm run test:integration  # endpoints REST
```

Los tests de integración levantan la app con `supertest`, mockean la autenticación y reemplazan servicios/DAOs con `sinon`, por lo que no requieren una base de datos real.

---

## ☁️ Despliegue

- **Producción:** contenedor Docker en **Oracle Cloud** detrás de **Caddy** (TLS automático), con **Render** como entorno de respaldo.
- **Frontend:** desplegado en **Vercel**.

---

## 🗂️ Estructura del proyecto

```
Costify-App/
├── src/
│   ├── app.js
│   ├── config/            # logger, passport, swagger, etc.
│   ├── controllers/       # controladores por entidad (+ chat)
│   ├── dao/               # acceso a datos y modelos Mongoose
│   ├── routes/            # routers REST
│   ├── services/          # lógica de negocio (+ ai, herramientas, contextoNegocio)
│   ├── middlewares/
│   │   └── validations/   # validaciones con express-validator
│   └── utils/             # utilidades (pricing, etc.)
├── deploy/                # Docker prod, Caddy y guía de despliegue
├── test/
│   ├── integracion/
│   └── unitarios/
└── package.json
```

---

## 📑 Endpoints principales

```http
# Usuarios / sesiones
POST   /api/usuarios/registro
POST   /api/usuarios/login
GET    /api/usuarios/current

# Productos  (multipart: imágenes)
GET|POST            /api/productos
GET|PUT|DELETE      /api/productos/:id

# Materias primas
GET|POST            /api/materiasPrimas
GET|PUT|DELETE      /api/materiasPrimas/:id

# Plantillas de costo  (adjuntos PDF/imagen)
GET|POST            /api/plantillas
GET|PUT|DELETE      /api/plantillas/:id

# Ventas
GET|POST            /api/ventas
GET|PUT|DELETE      /api/ventas/:id

# Tareas
GET|POST            /api/tareas
GET|PUT|DELETE      /api/tareas/:id

# Eventos de calendario
GET|POST|PUT|DELETE /api/eventos

# Contenido (redes)
GET|POST|PUT|DELETE /api/contenido

# Lista de compras
GET|PUT             /api/lista-compras

# Configuración
GET|PUT             /api/configuracion

# Asistente de IA
POST   /api/chat            # chat con streaming + tool-calling
GET    /api/chat/history    # historial del usuario
DELETE /api/chat/history    # limpiar historial
GET    /api/chat/resumen    # resumen proactivo del negocio
```

> Las rutas protegidas requieren JWT. Consultá Swagger (`/api-docs`) para parámetros y respuestas.

---

## 📝 Logging con Winston

Logs estructurados en consola y archivos (`logs/error.log`, `logs/combined.log`). Controladores, servicios y middlewares registran eventos, advertencias y errores.

```js
import logger from "./config/logger.js";
logger.info("Venta creada", { ventaId: id });
logger.error("Error en el chat IA", { error: err.message });
```

---

## 🗺️ Roadmap

- [x] Autenticación (local + Google) y protección de rutas con JWT
- [x] Validación con express-validator y seguridad con Helmet
- [x] Documentación Swagger/OpenAPI
- [x] Logging con Winston
- [x] Tests automatizados (unitarios + integración)
- [x] Asistente de IA con tool-calling, historial y resumen proactivo
- [x] Despliegue con Docker + Caddy en Oracle Cloud
- [ ] Reportes y estadísticas avanzadas de costos
- [ ] Exportación de presupuestos
- [ ] Panel de administración y control de roles

---

**Hecho con dedicación por [Sebastián Garea](https://github.com/SebaGarea)**
