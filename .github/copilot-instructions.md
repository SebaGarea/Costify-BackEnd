# Copilot Instructions for Costify-App

## Overview
Costify-App is a Node.js/Express backend for managing manufacturing costs, products, and sales. It uses MongoDB (via Mongoose), Passport for authentication, and Winston for logging. All API endpoints are documented with Swagger and protected with JWT where required.

## Architecture & Key Components
- **src/app.js**: Main entry point, sets up Express, middleware, routes, error handling.
- **src/config/**: Configuration files (database, logger, Passport strategies).
- **src/controllers/**: Route handlers for each domain (materiaPrima, producto, ventas, usuarios, plantillaCosto).
- **src/dao/**: Data access objects for MongoDB, one per domain.
- **src/models/**: Mongoose schemas for each entity.
- **src/routes/**: Express routers, grouped by domain.
- **src/services/**: Business logic, called by controllers.
- **src/middlewares/**: Error handling and validations (express-validator).
- **src/docs/**: Swagger/OpenAPI documentation setup and per-domain docs.
- **logs/**: Winston log files (`error.log`, `combined.log`).

## Developer Workflows
- **Install dependencies:** `npm install`
- **Run server:** `npm start` (default port: 8080)
- **API docs:** [http://localhost:8080/api-docs](http://localhost:8080/api-docs)
- **Environment:** Create `.env` file (see `.env.example` if present)
- **Logging:** All logs go to `logs/` via Winston. See `src/config/logger.js` for setup.
- **Testing:** Test folders exist (`test/integracion/`, `test/unitarios/`), but automated tests are not yet implemented.

## Project-Specific Patterns & Conventions
- **Validation:** All incoming data is validated using express-validator middlewares in `src/middlewares/validations/`.
- **Authentication:** Passport supports local, JWT, and Google strategies. Protected routes require JWT.
- **Error Handling:** Centralized in `src/middlewares/error.handler.js`. All errors are logged.
- **Logging:** Use Winston (`logger.info`, `logger.warn`, `logger.error`). Always include context (e.g., IDs, error details).
- **Swagger Docs:** API endpoints and models are documented in `src/docs/` and exposed via `/api-docs`.
- **DTOs:** User DTOs in `src/dtos/usuarios.dto.js`.
- **Uploads:** File uploads are stored in `uploads/`.

## Integration Points & External Dependencies
- **MongoDB:** Connection configured in `src/config/config.js`.
- **Passport:** Strategies in `src/config/passport.config.js`.
- **Swagger:** Setup in `src/docs/swagger.js`.
- **Winston:** Logging setup in `src/config/logger.js`.

## Examples
- **Logging:**
  ```js
  import logger from './config/logger.js';
  logger.info('Usuario creado correctamente', { usuarioId: id });
  logger.warn('Stock bajo en producto', { productoId, stock });
  logger.error('Error al crear venta', { error: err.message, stack: err.stack });
  ```
- **Validation Middleware:**
  ```js
  import { body } from 'express-validator';
  // ...existing code...
  [body('email').isEmail(), body('password').isLength({ min: 6 })]
  ```

## Key Files & Directories
- `src/app.js`, `src/config/`, `src/controllers/`, `src/dao/`, `src/models/`, `src/routes/`, `src/services/`, `src/middlewares/`, `src/docs/`, `logs/`

---
For unclear or missing conventions, review `README.md` and `src/config/logger.js`. Ask maintainers for clarification if needed.
