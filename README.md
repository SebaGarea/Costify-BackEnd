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
3. Crea un archivo `.env` con tus variables de entorno (ver ejemplo en `.env.example` si existe).
4. Inicia el servidor:
   ```bash
   npm start
   ```
5. El backend estará disponible en `http://localhost:8080` por defecto.

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

## 📑 Ejemplo de endpoints

```http
POST /api/usuarios/registro
POST /api/usuarios/login
GET  /api/productos
POST /api/productos
GET  /api/ventas
POST /api/ventas
```
> Todas las rutas protegidas requieren autenticación JWT.

---

## ⚠️ Estado del proyecto

Este proyecto **está en desarrollo** y puede contener cambios frecuentes y funcionalidades incompletas.

---

## 💡 Roadmap

- [x] Validación profesional de datos con express-validator
- [x] Autenticación de usuarios y protección de rutas
- [ ] Gestión avanzada de stock
- [ ] Reportes y estadísticas de costos
- [ ] Exportación de presupuestos
- [ ] Panel de administración y control de roles
- [ ] Documentación Swagger/OpenAPI
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