---

## 🚧 Próximas funcionalidades

- Autenticación de usuarios (login y registro)
- Gestión de roles y permisos
- Panel de administración
- Reportes y estadísticas
- Mejoras en la documentación
- Tests automatizados
- Despliegue en la nube

¿Tienes ideas o sugerencias? ¡Abrí un issue o colaborá con un pull request!
---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si quieres colaborar, abre un issue o haz un pull request siguiendo las buenas prácticas del repositorio.

---
# Costify# Costify

Costify es una aplicación para la gestión de costos de fabricación de productos, especialmente diseñada para talleres, fábricas o emprendimientos que necesitan calcular precios de venta de manera flexible y precisa, considerando diferentes insumos, servicios y plataformas de venta.

---

## 🚀 Funcionalidades principales

- **Gestión de Materias Primas**  
  Carga y administra insumos con nombre, categoría, unidad de medida, stock y valor por unidad.

- **Plantillas de Costos**  
  Crea “recetas” para productos combinando distintos materiales, cantidades, servicios extra y porcentaje de ganancia.

- **Precios por Plataforma**  
  Calcula y almacena precios diferenciados para cada canal de venta (ejemplo: Mercado Libre, tienda física, mayoristas, etc).

- **Catálogo de Productos**  
  Relaciona plantillas de costos con productos finales y visualiza el costo y precio de venta según cada plataforma.

- **CRUD completo**  
  Para materias primas, plantillas de costos y productos.

---

## 🛠️ Tecnologías utilizadas

- **Backend:** Node.js, Express, MongoDB, Mongoose. (EN DESARROLLO)
- **Frontend:** React (EN DESARROLLO)
- **Control de versiones:** Git & GitHub

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
│   └── utils/
├── package.json
├── README.md
└── ...
```

---

## 📦 Instalación y uso

1. Clona el repositorio:
  ```bash
  git clone https://github.com/tu-usuario/Costify-App.git
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

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más información.

---

## 🛠️ Tecnologías utilizadas

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React (en desarrollo)
- **Control de versiones:** Git & GitHub

---

## ⚠️ Estado del proyecto

Este proyecto **está en desarrollo** y aún no está finalizado. Puede contener cambios frecuentes y funcionalidades incompletas.

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
│   └── utils/
├── package.json
├── README.md
└── ...

- Cargá tus materias primas: hierro, madera, pinturas, accesorios, etc.
- Armá una plantilla de costos para cada producto (ej: mesa, estantería), seleccionando insumos, cantidades y servicios.
- Definí el porcentaje de ganancia y los precios sugeridos para cada plataforma de venta.
- Consultá tus plantillas guardadas cuando necesites repetir o editar un presupuesto.
- Generá el catálogo de productos con sus precios finales.

---

## 💡 Roadmap

- [ ] Autenticación de usuarios
- [ ] Reportes y estadísticas de costos
- [ ] Gestión avanzada de stock
- [ ] Exportación de presupuestos
- [ ] Mejora de interfaz y experiencia de usuario

---

## 📝 Contribuciones

¡Las sugerencias y mejoras son bienvenidas!  
Si tenés ideas o encontrás un bug, abrí un issue o hacé un pull request.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

---

**Hecho con pasión por Seba Garea**