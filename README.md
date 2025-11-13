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


## 🛠️ Tecnologías utilizadas

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Autenticación:** Passport (local, JWT, Google)
- **Validación:** express-validator
- **Documentación interactiva:** Swagger (`swagger-ui-express`, `swagger-jsdoc`)
- **Frontend:** React (en desarrollo)
- **Control de versiones:** Git & GitHub

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
- [ ] Gestión avanzada de stock
- [ ] Reportes y estadísticas de costos
- [ ] Exportación de presupuestos
- [ ] Panel de administración y control de roles
- [ ] Tests automatizados
- [ ] Despliegue en la nube

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!  
Si tienes ideas, sugerencias o encuentras un bug, abre un issue o haz un pull request siguiendo las buenas prácticas del repositorio.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

---

**Hecho con dedicacion por Sebastian Garea**