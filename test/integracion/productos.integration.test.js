import { expect } from "chai";
import request from "supertest";
import sinon from "sinon";
import { productoService } from "../../src/services/producto.service.js";

const { default: app } = await import("../../src/app.js");

describe("Integración - Productos API", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("GET /api/productos responde 200 con datos", async () => {
    const productosMock = [
      { _id: "507f1f77bcf86cd799439030", nombre: "Silla", catalogo: "hogar" },
    ];
    sandbox.stub(productoService, "getAllProductos").resolves(productosMock);

    const res = await request(app).get("/api/productos");

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(productosMock);
  });

  it("GET /api/productos responde 404 si no hay productos", async () => {
    sandbox.stub(productoService, "getAllProductos").resolves(null);

    const res = await request(app).get("/api/productos");

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal("No se encontraron productos");
  });

  it("POST /api/productos crea un producto", async () => {
    const payload = {
      nombre: "Mesa",
      catalogo: "hogar",
      modelo: "m-123",
      precio: 199.99,
    };
    const created = { _id: "507f1f77bcf86cd799439031", ...payload };
    sandbox.stub(productoService, "createProducto").resolves(created);

    const res = await request(app).post("/api/productos").send(payload);

    expect(res.status).to.equal(201);
    expect(res.body).to.deep.equal(created);
  });

  it("GET /api/productos/:id retorna 400 si el id es inválido", async () => {
    const res = await request(app).get("/api/productos/invalid-id");

    expect(res.status).to.equal(400);
    expect(res.body.errores[0].msg).to.equal("ID inválido");
  });

  it("PUT /api/productos/:id actualiza exitosamente", async () => {
    const updated = { _id: "507f1f77bcf86cd799439032", nombre: "Mesa" };
    sandbox.stub(productoService, "updateProducto").resolves(updated);

    const res = await request(app)
      .put("/api/productos/507f1f77bcf86cd799439032")
      .send({ nombre: "Mesa" });

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(updated);
  });

  it("PUT /api/productos/:id responde 400 si no se actualiza", async () => {
    sandbox.stub(productoService, "updateProducto").resolves(null);

    const res = await request(app)
      .put("/api/productos/507f1f77bcf86cd799439032")
      .send({ nombre: "Mesa" });

    expect(res.status).to.equal(400);
    expect(res.body.mensaje).to.equal("No se pudo actualizar el producto");
  });

  it("DELETE /api/productos/:id elimina exitosamente", async () => {
    const producto = { _id: "507f1f77bcf86cd799439032", imagenes: [] };
    sandbox.stub(productoService, "getProductoById").resolves(producto);
    sandbox.stub(productoService, "deleteProducto").resolves(producto);

    const res = await request(app).delete(
      "/api/productos/507f1f77bcf86cd799439032"
    );

    expect(res.status).to.equal(200);
    expect(res.body.mensaje).to.equal("Producto eliminado");
  });

  it("DELETE /api/productos/:id responde 404 si no existe", async () => {
    sandbox.stub(productoService, "getProductoById").resolves(null);

    const res = await request(app).delete(
      "/api/productos/507f1f77bcf86cd799439032"
    );

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal("Producto no encontrado");
  });
});
