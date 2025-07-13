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

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React (en desarrollo)
- **Control de versiones:** Git & GitHub

---

## 🗂️ Estructura del proyecto

```
costify/
├── costify-backend/
│   ├── models/
│   ├── routes/
│   ├── index.js
│   └── package.json
└── costify-frontend/
    ├── src/
    ├── public/
    └── package.json
```

---

## 📦 Instalación y primer uso

1. **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/costify.git
    ```

2. **Backend**
    ```bash
    cd costify-backend
    npm install
    # Crea un archivo .env si quieres usar MongoDB Atlas o configura la URL en index.js
    npm start
    ```

3. **Frontend**
    ```bash
    cd ../costify-frontend
    npm install
    npm start
    ```

4. Accede a la app en [http://localhost:3000](http://localhost:3000)

---

## ✨ Ejemplo de uso

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