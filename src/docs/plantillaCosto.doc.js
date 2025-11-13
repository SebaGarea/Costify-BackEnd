/**
 * @swagger
 * tags:
 *   name: PlantillasCosto
 *   description: Endpoints para gestión de plantillas de costo
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ItemPlantilla:
 *       type: object
 *       properties:
 *         materiaPrima:
 *           type: string
 *         cantidad:
 *           type: number
 *         categoria:
 *           type: string
 *     PlantillaCosto:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nombre:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemPlantilla'
 *         porcentajesPorCategoria:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         descripcion:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         tipoProyecto:
 *           type: string
 */

/**
 * @swagger
 * /plantillas-costo:
 *   post:
 *     summary: Crea una nueva plantilla de costo
 *     tags: [PlantillasCosto]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlantillaCosto'
 *     responses:
 *       201:
 *         description: Plantilla creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlantillaCosto'
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /plantillas-costo:
 *   get:
 *     summary: Obtiene todas las plantillas de costo
 *     tags: [PlantillasCosto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de plantillas de costo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PlantillaCosto'
 */

/**
 * @swagger
 * /plantillas-costo/{id}:
 *   get:
 *     summary: Obtiene una plantilla de costo por ID
 *     tags: [PlantillasCosto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la plantilla de costo
 *     responses:
 *       200:
 *         description: Plantilla encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlantillaCosto'
 *       404:
 *         description: Plantilla no encontrada
 */

/**
 * @swagger
 * /plantillas-costo/{id}:
 *   put:
 *     summary: Actualiza una plantilla de costo por ID
 *     tags: [PlantillasCosto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la plantilla de costo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlantillaCosto'
 *     responses:
 *       200:
 *         description: Plantilla actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlantillaCosto'
 *       404:
 *         description: Plantilla no encontrada
 */

/**
 * @swagger
 * /plantillas-costo/{id}:
 *   delete:
 *     summary: Elimina una plantilla de costo por ID
 *     tags: [PlantillasCosto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la plantilla de costo
 *     responses:
 *       200:
 *         description: Plantilla eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 plantilla:
 *                   $ref: '#/components/schemas/PlantillaCosto'
 *       404:
 *         description: Plantilla no encontrada
 */