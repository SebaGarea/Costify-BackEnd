import { expect } from "chai";
import request from "supertest";
import sinon from "sinon";
import { ventasService } from "../../src/services/ventas.service.js";

const { default: app } = await import("../../src/app.js");

describe("Integración - Ventas API", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("GET /api/ventas responde 200 con datos", async () => {
    const ventasMock = [
      { _id: "507f1f77bcf86cd799439050", cliente: "Empresa SA" },
    ];
    sandbox.stub(ventasService, "getAllVentas").resolves(ventasMock);

    const res = await request(app).get("/api/ventas");

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(ventasMock);
  });

  it("GET /api/ventas con paginación usa el servicio paginado", async () => {
    const paginated = {
      docs: [{ _id: "507f1f77bcf86cd799439051", cliente: "ACME" }],
      totalDocs: 1,
      totalPages: 1,
      page: 2,
      limit: 5,
    };
    sandbox.stub(ventasService, "getAllVentasPaginated").resolves(paginated);

    const res = await request(app).get("/api/ventas?page=2&limit=5");

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(paginated);
  });

  it("POST /api/ventas crea una venta", async () => {
    const payload = {
      cliente: "Empresa SA",
      medio: "online",
      productoId: "507f1f77bcf86cd799439012",
      cantidad: 3,
      valorEnvio: 50,
    };
    const created = { _id: "507f1f77bcf86cd799439052", ...payload };
    sandbox.stub(ventasService, "createVenta").resolves(created);

    const res = await request(app).post("/api/ventas").send(payload);

    expect(res.status).to.equal(201);
    expect(res.body).to.deep.equal(created);
  });

  it("GET /api/ventas/:id retorna 400 si el id es inválido", async () => {
    const res = await request(app).get("/api/ventas/invalid-id");

    expect(res.status).to.equal(400);
    expect(res.body.errores[0].msg).to.equal("ID inválido");
  });

  it("PUT /api/ventas/:id actualiza exitosamente", async () => {
    const updated = { _id: "507f1f77bcf86cd799439052", estado: "finalizada" };
    sandbox.stub(ventasService, "updateVenta").resolves(updated);

    const res = await request(app)
      .put("/api/ventas/507f1f77bcf86cd799439052")
      .send({ estado: "finalizada" });

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(updated);
  });

  it("PUT /api/ventas/:id responde 404 si no existe", async () => {
    sandbox.stub(ventasService, "updateVenta").resolves(null);

    const res = await request(app)
      .put("/api/ventas/507f1f77bcf86cd799439052")
      .send({ estado: "finalizada" });

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal("Venta no encontrada");
  });

  it("DELETE /api/ventas/:id elimina exitosamente", async () => {
    sandbox.stub(ventasService, "deleteVenta").resolves({ acknowledged: true });

    const res = await request(app).delete(
      "/api/ventas/507f1f77bcf86cd799439052"
    );

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal(
      "Venta eliminada, ID: 507f1f77bcf86cd799439052"
    );
  });

  it("DELETE /api/ventas/:id responde 404 si no existe", async () => {
    sandbox.stub(ventasService, "deleteVenta").resolves(null);

    const res = await request(app).delete(
      "/api/ventas/507f1f77bcf86cd799439052"
    );

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal("Venta no encontrada");
  });
});
