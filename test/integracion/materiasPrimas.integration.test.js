import { expect } from "chai";
import request from "supertest";
import sinon from "sinon";
import { materiaPrimaService } from "../../src/services/materiaPrima.service.js";

const { default: app } = await import("../../src/app.js");

const setAuthHandler = globalThis.__setAuthHandler;
const resetAuthHandler = globalThis.__resetAuthHandler;

describe("Integración - Materias Primas API", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    resetAuthHandler();
  });

  afterEach(() => {
    sandbox.restore();
    resetAuthHandler();
  });

  it("GET /api/materiasPrimas responde 200 con datos", async () => {
    const materiasMock = [
      { _id: "507f1f77bcf86cd799439011", nombre: "Acero" },
      { _id: "507f1f77bcf86cd799439012", nombre: "Aluminio" },
    ];
    sandbox
      .stub(materiaPrimaService, "getAllMateriaPrimas")
      .resolves(materiasMock);

    const res = await request(app).get("/api/materiasPrimas");

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal("success");
    expect(res.body.materiasPrimas).to.deep.equal(materiasMock);
  });

  it("GET /api/materiasPrimas responde 404 cuando no hay registros", async () => {
    sandbox.stub(materiaPrimaService, "getAllMateriaPrimas").resolves([]);

    const res = await request(app).get("/api/materiasPrimas");

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal("No se encontraron materias primas");
  });

  it("POST /api/materiasPrimas crea materia prima", async () => {
    const payload = {
      nombre: "Cobre",
      categoria: "Metales",
      tipo: "No ferroso",
      unidad: "kg",
      precio: 150,
    };

    const created = { _id: "507f1f77bcf86cd799439013", ...payload };
    sandbox
      .stub(materiaPrimaService, "createMateriaPrima")
      .resolves(created);

    const res = await request(app).post("/api/materiasPrimas").send(payload);

    expect(res.status).to.equal(201);
    expect(res.body.status).to.equal("success");
    expect(res.body.materiaPrima).to.deep.equal(created);
  });

  it("POST /api/materiasPrimas responde 401 si falta autenticación", async () => {
    setAuthHandler((req, res, _next) =>
      res.status(401).json({ mensaje: "No autenticado" })
    );

    const res = await request(app).post("/api/materiasPrimas").send({
      nombre: "Cobre",
      categoria: "Metales",
      tipo: "No ferroso",
      unidad: "kg",
      precio: 150,
    });

    expect(res.status).to.equal(401);
    expect(res.body.mensaje).to.equal("No autenticado");
  });

  it("GET /api/materiasPrimas/:id retorna 400 si el id es inválido", async () => {
    const res = await request(app).get("/api/materiasPrimas/invalid-id");

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("errores");
    expect(res.body.errores[0].msg).to.equal("ID inválido");
  });

  it("PUT /api/materiasPrimas/:id actualiza exitosamente", async () => {
    const updated = { _id: "507f1f77bcf86cd799439014", nombre: "Acero" };
    sandbox
      .stub(materiaPrimaService, "updateMateriaPrima")
      .resolves(updated);

    const res = await request(app)
      .put("/api/materiasPrimas/507f1f77bcf86cd799439014")
      .send({ nombre: "Acero" });

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal("success");
    expect(res.body.materiaPrima).to.deep.equal(updated);
  });

  it("PUT /api/materiasPrimas/:id responde 400 si no se actualiza", async () => {
    sandbox
      .stub(materiaPrimaService, "updateMateriaPrima")
      .resolves(null);

    const res = await request(app)
      .put("/api/materiasPrimas/507f1f77bcf86cd799439014")
      .send({ nombre: "Acero" });

    expect(res.status).to.equal(400);
    expect(res.body.mensaje).to.equal("No se pudo actualizar la materia prima");
  });

  it("POST /api/materiasPrimas responde 400 ante validaciones fallidas", async () => {
    const res = await request(app).post("/api/materiasPrimas").send({});

    expect(res.status).to.equal(400);
    expect(res.body.errores[0].msg).to.exist;
  });

  it("DELETE /api/materiasPrimas/:id elimina exitosamente", async () => {
    sandbox
      .stub(materiaPrimaService, "deleteMateriaPrima")
      .resolves({ acknowledged: true });

    const res = await request(app).delete(
      "/api/materiasPrimas/507f1f77bcf86cd799439014"
    );

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal(
      "Materia Prima eliminada correctamente"
    );
  });

  it("DELETE /api/materiasPrimas/:id responde 400 si no existe", async () => {
    sandbox
      .stub(materiaPrimaService, "deleteMateriaPrima")
      .resolves(null);

    const res = await request(app).delete(
      "/api/materiasPrimas/507f1f77bcf86cd799439014"
    );

    expect(res.status).to.equal(400);
    expect(res.body.mensaje).to.equal("No se pudo eliminar la materia prima");
  });

  it("DELETE /api/materiasPrimas/:id responde 403 si el rol es insuficiente", async () => {
    setAuthHandler((req, res, _next) =>
      res.status(403).json({ mensaje: "Sin permisos" })
    );

    const res = await request(app).delete(
      "/api/materiasPrimas/507f1f77bcf86cd799439014"
    );

    expect(res.status).to.equal(403);
    expect(res.body.mensaje).to.equal("Sin permisos");
  });

  it("POST /api/materiasPrimas responde 500 si el servicio lanza error", async () => {
    const payload = {
      nombre: "Bronce",
      categoria: "Metales",
      tipo: "No ferroso",
      unidad: "kg",
      precio: 200,
    };
    sandbox
      .stub(materiaPrimaService, "createMateriaPrima")
      .rejects(new Error("Fallo DAO"));

    const res = await request(app).post("/api/materiasPrimas").send(payload);

    expect(res.status).to.equal(500);
    expect(res.body.mensaje).to.equal("Fallo DAO");
  });
});
