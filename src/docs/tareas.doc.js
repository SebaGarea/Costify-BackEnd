/**
 * @swagger
 * tags:
 *   name: Tareas
 *   description: Endpoints para gestión de tareas internas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Tarea:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pendiente, hecho]
 *         priority:
 *           type: string
 *           enum: [baja, media, alta]
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             enum: [presupuesto, cliente, otros]
 *         createdBy:
 *           type: string
 *         updatedBy:
 *           type: string
 */

/**
 * @swagger
 * /tareas:
 *   post:
 *     summary: Crea una nueva tarea
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pendiente, hecho]
 *               priority:
 *                 type: string
 *                 enum: [baja, media, alta]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [presupuesto, cliente, otros]
 *     responses:
 *       201:
 *         description: Tarea creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tarea'
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /tareas:
 *   get:
 *     summary: Obtiene tareas (paginadas si se envía page/limit)
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         schema:
 *           type: string
 *         description: Búsqueda por título o notas
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pendiente, hecho]
 *       - name: priority
 *         in: query
 *         schema:
 *           type: string
 *           enum: [baja, media, alta]
 *       - name: tag
 *         in: query
 *         schema:
 *           type: string
 *           enum: [presupuesto, cliente, otros]
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, dueDate]
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de tareas
 */

/**
 * @swagger
 * /tareas/{id}:
 *   get:
 *     summary: Obtiene una tarea por ID
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tarea encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tarea'
 *       404:
 *         description: Tarea no encontrada
 */

/**
 * @swagger
 * /tareas/{id}:
 *   put:
 *     summary: Actualiza una tarea por ID
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tarea'
 *     responses:
 *       200:
 *         description: Tarea actualizada
 *       404:
 *         description: Tarea no encontrada
 */

/**
 * @swagger
 * /tareas/{id}:
 *   delete:
 *     summary: Elimina una tarea por ID
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tarea eliminada
 *       404:
 *         description: Tarea no encontrada
 */
