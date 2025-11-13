/**
 * @swagger
 * tags:
 *   name: Ventas
 *   description: Endpoints para gestión de ventas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Venta:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         fecha:
 *           type: string
 *           format: date-time
 *         cliente:
 *           type: string
 *         medio:
 *           type: string
 *         producto:
 *           type: string
 *         productoNombre:
 *           type: string
 *         plantilla:
 *           type: string
 *         cantidad:
 *           type: number
 *         descripcion:
 *           type: string
 *         valorEnvio:
 *           type: number
 *         valorTotal:
 *           type: number
 *         seña:
 *           type: number
 *         restan:
 *           type: number
 *         estado:
 *           type: string
 *           enum: [pendiente, en_proceso, finalizada, despachada, cancelada]
 */

/**
 * @swagger
 * /ventas:
 *   post:
 *     summary: Crea una nueva venta
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente:
 *                 type: string
 *               medio:
 *                 type: string
 *               productoId:
 *                 type: string
 *               cantidad:
 *                 type: number
 *               valorEnvio:
 *                 type: number
 *               seña:
 *                 type: number
 *               estado:
 *                 type: string
 *     responses:
 *       201:
 *         description: Venta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venta'
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /ventas:
 *   get:
 *     summary: Obtiene todas las ventas (paginadas si se envía page/limit)
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         description: Página de resultados
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Lista de ventas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Venta'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */

/**
 * @swagger
 * /ventas/{id}:
 *   get:
 *     summary: Obtiene una venta por ID
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     responses:
 *       200:
 *         description: Venta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venta'
 *       404:
 *         description: Venta no encontrada
 */

/**
 * @swagger
 * /ventas/{id}:
 *   put:
 *     summary: Actualiza una venta por ID
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Venta'
 *     responses:
 *       200:
 *         description: Venta actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Venta'
 *       404:
 *         description: Venta no encontrada
 */

/**
 * @swagger
 * /ventas/{id}:
 *   delete:
 *     summary: Elimina una venta por ID
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     responses:
 *       200:
 *         description: Venta eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Venta no encontrada
 */

/**
 * @swagger
 * /ventas/cliente/{clienteId}:
 *   get:
 *     summary: Obtiene ventas por cliente
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: clienteId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Ventas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Venta'
 *       404:
 *         description: No se encontraron ventas para este cliente
 */

/**
 * @swagger
 * /ventas/estado/{estado}:
 *   get:
 *     summary: Obtiene ventas por estado
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: estado
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pendiente, en_proceso, finalizada, despachada, cancelada]
 *         description: Estado de la venta
 *     responses:
 *       200:
 *         description: Ventas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Venta'
 *       404:
 *         description: No se encontraron ventas con este estado
 */