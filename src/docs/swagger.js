import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Costify API",
    version: "1.0.0",
    description: "Documentación de la API de Costify para gestión de costos, productos, ventas y usuarios.",
  },
  servers: [
    {
      url: "http://localhost:8080/api",
      description: "Servidor local",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

export const swaggerOptions = {
  swaggerDefinition,
  apis: [
    "./src/routes/*.js", 
    "./src/controllers/*.js", 
    "./src/docs/*.js",
  ],
};

export function setupSwagger(app) {
  const swaggerSpec = swaggerJSDoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}