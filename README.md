# Costify

Costify es una aplicación para la gestión de costos de fabricación de productos, pensada para talleres, fábricas y emprendimientos que necesitan calcular precios de venta de manera flexible y precisa, considerando insumos, servicios y plataformas de venta.

---

## 🚀 Funcionalidades principales

- **Gestión de Materias Primas:**  
  Carga y administra insumos con nombre, categoría, unidad de medida, stock y valor por unidad.

- **Plantillas de Costos:**  
  Crea “recetas” para productos combinando distintos materiales, cantidades, servicios extra y porcentaje de ganancia.

- **Catálogo de Productos:**  
  Relaciona plantillas de costos con productos finales y visualiza el costo y precio de venta según cada plataforma.

- **Gestión de Ventas:**  
  Registra ventas, controla estados, calcula totales y gestiona clientes.

- **Autenticación y autorización:**  
  Login local y con Google, protección de rutas con JWT y control de roles.

- **Validación profesional de datos:**  
  Todas las rutas que reciben datos usan middlewares de [express-validator](https://express-validator.github.io/docs/) para asegurar la calidad y seguridad de la información.

---

## 🆕 Últimas mejoras

- **Cobertura de pruebas ampliada:** ahora cada entidad clave (materias primas, productos, plantillas, ventas y usuarios) tiene tests de integración para los flujos de actualización y borrado, incluyendo casos 200 y 404.
- **Validaciones más estrictas en plantillas de costo:** los middlewares verifican IDs, estructura de items y porcentajes personalizados, registrando advertencias detalladas en Winston cuando hay errores.
- **Actualización segura de usuarios:** el servicio vuelve a hashear contraseñas al modificar perfiles y abstrae el DAO para facilitar los tests unitarios.

---


## 🛠️ Tecnologías utilizadas

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Autenticación:** Passport (local, JWT, Google)
- **Validación:** express-validator
- **Documentación interactiva:** Swagger (`swagger-ui-express`, `swagger-jsdoc`)
- **Testing y QA:** Mocha, Chai, Sinon, Supertest (integración end-to-end) y Jest para utilidades puntuales
- **Frontend:** React (en desarrollo)
- **Control de versiones:** Git & GitHub
- **Logging profesional:** Winston (logs estructurados en consola y archivos)

---

## 📦 Instalación y uso

1. Clona el repositorio:
   ```bash
   git clone https://github.com/SebaGarea/Costify-App.git
   ```
2. Instala las dependencias:
  ```bash
  npm install
  ```
  > Incluye las dependencias para Swagger:
  > ```bash
  > npm install swagger-ui-express swagger-jsdoc
  > ```
3. Crea un archivo `.env` con tus variables de entorno (ver ejemplo en `.env.example` si existe).
4. Inicia el servidor:
   ```bash
   npm start
   ```

5. El backend estará disponible en `http://localhost:8080` por defecto.
6. La documentación interactiva de la API estará disponible en:
  - [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

---

## 🗂️ Estructura del proyecto

```
Costify-App/
├── src/
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── dao/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   │   └── validations/
│   └── utils/
├── package.json
├── README.md
└── ...
```

---


## 📑 Ejemplo de endpoints principales

```http
# Usuarios
POST   /api/usuarios/registro
POST   /api/usuarios/login
GET    /api/usuarios/current
GET    /api/usuarios/:id
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id

# Productos
GET    /api/productos
POST   /api/productos
GET    /api/productos/:id
PUT    /api/productos/:id
DELETE /api/productos/:id
GET    /api/productos/catalogo/:catalogo
GET    /api/productos/modelo/:modelo

# Materias Primas
GET    /api/materiasPrimas
POST   /api/materiasPrimas
GET    /api/materiasPrimas/:id
PUT    /api/materiasPrimas/:id
DELETE /api/materiasPrimas/:id
GET    /api/materiasPrimas/categories
GET    /api/materiasPrimas/category/:category
GET    /api/materiasPrimas/type/:type

# Plantillas de Costo
GET    /api/plantillas
POST   /api/plantillas
GET    /api/plantillas/:id
PUT    /api/plantillas/:id
DELETE /api/plantillas/:id

# Ventas
GET    /api/ventas
POST   /api/ventas
GET    /api/ventas/:id
PUT    /api/ventas/:id
DELETE /api/ventas/:id
GET    /api/ventas/cliente/:clienteId
GET    /api/ventas/estado/:estado
```
> Todas las rutas protegidas requieren autenticación JWT.
> Consulta la documentación Swagger para detalles de parámetros y respuestas.

---

## ⚠️ Estado del proyecto

Este proyecto **está en desarrollo** y puede contener cambios frecuentes y funcionalidades incompletas.

---


## 💡 Roadmap

- [x] Validación profesional de datos con express-validator
- [x] Autenticación de usuarios y protección de rutas
- [x] Documentación Swagger/OpenAPI
- [x] Logging con Winston
- [ ] Tests automatizados
- [ ] Gestión avanzada de stock
- [ ] Reportes y estadísticas de costos
- [ ] Exportación de presupuestos
- [ ] Panel de administración y control de roles
- [ ] Despliegue en la nube

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!  
Si tienes ideas, sugerencias o encuentras un bug, abre un issue o haz un pull request siguiendo las buenas prácticas del repositorio.

---


## 📝 Logging profesional con Winston

El proyecto implementa logs estructurados usando [Winston](https://github.com/winstonjs/winston):

- Todos los controladores, servicios y middlewares registran eventos importantes, advertencias y errores.
- Los logs se muestran en consola (con colores según el nivel) y se guardan en archivos dentro de la carpeta `logs/`.
- Los errores y advertencias de validación también quedan registrados para facilitar el monitoreo y debugging.
- Los archivos principales de log son:
  - `logs/error.log`: solo errores
  - `logs/combined.log`: todos los eventos
- Puedes revisar los logs para analizar el funcionamiento y detectar problemas en producción.

**Ejemplo de uso en el código:**
```js
import logger from './config/logger.js';

logger.info('Usuario creado correctamente', { usuarioId: id });
logger.warn('Stock bajo en producto', { productoId, stock });
logger.error('Error al crear venta', { error: err.message, stack: err.stack });
```

Para más detalles, revisa la configuración en `src/config/logger.js`.

---

**Hecho con dedicacion por Sebastian Garea**