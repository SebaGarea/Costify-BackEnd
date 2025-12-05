import { expect } from "chai";
import request from "supertest";
import sinon from "sinon";
import { plantillaCostoService } from "../../src/services/plantillaCosto.service.js";

const { default: app } = await import("../../src/app.js");

const setAuthHandler = globalThis.__setAuthHandler;
const resetAuthHandler = globalThis.__resetAuthHandler;

describe("Integración - Plantillas de Costo API", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    resetAuthHandler();
  });

  afterEach(() => {
    sandbox.restore();
    resetAuthHandler();
  });

  it("GET /api/plantillas responde 200 con datos", async () => {
    const plantillasMock = [
      { _id: "507f1f77bcf86cd799439040", nombre: "Base Metal" },
    ];
    sandbox.stub(plantillaCostoService, "getAllPlantillas").resolves(plantillasMock);

    const res = await request(app).get("/api/plantillas?categoria=metal");

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(plantillasMock);
  });

  it("GET /api/plantillas responde 404 si no hay datos", async () => {
    sandbox.stub(plantillaCostoService, "getAllPlantillas").resolves(null);

    const res = await request(app).get("/api/plantillas");

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal("No se encontraron plantillas de costo");
  });

  it("POST /api/plantillas crea una plantilla", async () => {
    const payload = {
      nombre: "Plantilla Premium",
      items: [
        {
          materiaPrima: "507f1f77bcf86cd799439011",
          cantidad: 2,
          categoria: "Metal",
        },
      ],
      porcentajesPorCategoria: { Metal: 0.5 },
    };
    const created = { _id: "507f1f77bcf86cd799439041", ...payload };
    sandbox.stub(plantillaCostoService, "createPlantilla").resolves(created);

    const res = await request(app).post("/api/plantillas").send(payload);

    expect(res.status).to.equal(201);
    expect(res.body).to.deep.equal(created);
  });

  it("POST /api/plantillas responde 401 si falta autenticación", async () => {
    setAuthHandler((req, res, _next) =>
      res.status(401).json({ mensaje: "No autenticado" })
    );

    const res = await request(app)
      .post("/api/plantillas")
      .send({
        nombre: "Plantilla Premium",
        items: [
          {
            materiaPrima: "507f1f77bcf86cd799439011",
            cantidad: 2,
            categoria: "Metal",
          },
        ],
      });

    expect(res.status).to.equal(401);
    expect(res.body.mensaje).to.equal("No autenticado");
  });

  it("GET /api/plantillas/:id retorna 400 si el id es inválido", async () => {
    const res = await request(app).get("/api/plantillas/invalid-id");

    expect(res.status).to.equal(400);
    expect(res.body.errores[0].msg).to.equal("ID inválido");
  });

  it("PUT /api/plantillas/:id actualiza exitosamente", async () => {
    const updated = { _id: "507f1f77bcf86cd799439041", nombre: "Plantilla" };
    sandbox.stub(plantillaCostoService, "updatePlantilla").resolves(updated);

    const res = await request(app)
      .put("/api/plantillas/507f1f77bcf86cd799439041")
      .send({ nombre: "Plantilla" });

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(updated);
  });

  it("PUT /api/plantillas/:id responde 404 si no existe", async () => {
    sandbox.stub(plantillaCostoService, "updatePlantilla").resolves(null);

    const res = await request(app)
      .put("/api/plantillas/507f1f77bcf86cd799439041")
      .send({ nombre: "Plantilla" });

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal("Plantilla no encontrada");
  });

  it("POST /api/plantillas responde 400 ante validaciones fallidas", async () => {
    const res = await request(app).post("/api/plantillas").send({});

    expect(res.status).to.equal(400);
    expect(res.body.errores[0].msg).to.exist;
  });

  it("DELETE /api/plantillas/:id elimina exitosamente", async () => {
    const plantilla = { _id: "507f1f77bcf86cd799439041" };
    sandbox.stub(plantillaCostoService, "deletePlantilla").resolves(plantilla);

    const res = await request(app).delete(
      "/api/plantillas/507f1f77bcf86cd799439041"
    );

    expect(res.status).to.equal(200);
    expect(res.body.mensaje).to.equal("Plantilla eliminada");
  });

  it("DELETE /api/plantillas/:id responde 404 si no existe", async () => {
    sandbox.stub(plantillaCostoService, "deletePlantilla").resolves(null);

    const res = await request(app).delete(
      "/api/plantillas/507f1f77bcf86cd799439041"
    );

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal("Plantilla no encontrada");
  });

  it("DELETE /api/plantillas/:id responde 403 si el rol es insuficiente", async () => {
    setAuthHandler((req, res, _next) =>
      res.status(403).json({ mensaje: "Sin permisos" })
    );

    const res = await request(app).delete(
      "/api/plantillas/507f1f77bcf86cd799439041"
    );

    expect(res.status).to.equal(403);
    expect(res.body.mensaje).to.equal("Sin permisos");
  });

  it("POST /api/plantillas responde 500 si el servicio lanza error", async () => {
    const payload = {
      nombre: "Plantilla Premium",
      items: [
        {
          materiaPrima: "507f1f77bcf86cd799439011",
          cantidad: 2,
          categoria: "Metal",
        },
      ],
    };
    sandbox
      .stub(plantillaCostoService, "createPlantilla")
      .rejects(new Error("DAO caído"));

    const res = await request(app).post("/api/plantillas").send(payload);

    expect(res.status).to.equal(500);
    expect(res.body.mensaje).to.equal("DAO caído");
  });
});
