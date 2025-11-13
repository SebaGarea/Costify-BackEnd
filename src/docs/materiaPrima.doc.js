/**
 * @swagger
 * tags:
 *   name: MateriasPrimas
 *   description: Endpoints para gestión de materias primas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MateriaPrima:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nombre:
 *           type: string
 *         categoria:
 *           type: string
 *         type:
 *           type: string
 *         medida:
 *           type: string
 *         espesor:
 *           type: string
 *         precio:
 *           type: number
 *         stock:
 *           type: number
 */

/**
 * @swagger
 * /materiasPrimas:
 *   get:
 *     summary: Obtiene todas las materias primas
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de materias primas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 materiasPrimas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MateriaPrima'
 */

/**
 * @swagger
 * /materiasPrimas/{id}:
 *   get:
 *     summary: Obtiene una materia prima por ID
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la materia prima
 *     responses:
 *       200:
 *         description: Materia prima encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 materiaPrima:
 *                   $ref: '#/components/schemas/MateriaPrima'
 *       404:
 *         description: Materia prima no encontrada
 */

/**
 * @swagger
 * /materiasPrimas:
 *   post:
 *     summary: Crea una nueva materia prima
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MateriaPrima'
 *     responses:
 *       201:
 *         description: Materia prima creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 materiaPrima:
 *                   $ref: '#/components/schemas/MateriaPrima'
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /materiasPrimas/{id}:
 *   put:
 *     summary: Actualiza una materia prima por ID
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la materia prima
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MateriaPrima'
 *     responses:
 *       200:
 *         description: Materia prima actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 materiaPrima:
 *                   $ref: '#/components/schemas/MateriaPrima'
 *       400:
 *         description: No se pudo actualizar la materia prima
 */

/**
 * @swagger
 * /materiasPrimas/{id}:
 *   delete:
 *     summary: Elimina una materia prima por ID
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la materia prima
 *     responses:
 *       200:
 *         description: Materia prima eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: No se pudo eliminar la materia prima
 */

/**
 * @swagger
 * /materiasPrimas/category/{category}:
 *   get:
 *     summary: Obtiene materias primas por categoría
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: category
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la categoría
 *     responses:
 *       200:
 *         description: Materias primas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 materiasPrimas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MateriaPrima'
 *       404:
 *         description: No se encontraron materias primas en la categoría
 */

/**
 * @swagger
 * /materiasPrimas/categories:
 *   get:
 *     summary: Obtiene todas las categorías de materias primas
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 categorias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nombre:
 *                         type: string
 *       404:
 *         description: No se encontraron categorías
 */

/**
 * @swagger
 * /materiasPrimas/type/{type}:
 *   get:
 *     summary: Obtiene materias primas por tipo
 *     tags: [MateriasPrimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de materia prima
 *     responses:
 *       200:
 *         description: Materias primas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 materiasPrimas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MateriaPrima'
 *       404:
 *         description: No se encontraron materias primas de ese tipo
 */