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
      url: "/api",
      description: "Este servidor",
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

// La documentación es pública (sirve para mostrar el proyecto) pero de solo
// lectura: no se pueden ejecutar pedidos desde ahí. Con API_DOCS=off se oculta.
export function setupSwagger(app) {
  if (String(process.env.API_DOCS || "").toLowerCase() === "off") return;
  const swaggerSpec = swaggerJSDoc(swaggerOptions);
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Costify API",
      swaggerOptions: { supportedSubmitMethods: [] },
    })
  );
}