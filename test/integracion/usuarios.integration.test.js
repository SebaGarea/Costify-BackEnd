import { expect } from "chai";
import request from "supertest";
import sinon from "sinon";
import { usuariosService } from "../../src/services/usuarios.service.js";

const { default: app } = await import("../../src/app.js");

describe("Integración - Usuarios API", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("GET /api/usuarios responde 200 con DTOs", async () => {
    const usuariosMock = [
      {
        _id: "507f1f77bcf86cd799439060",
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@costify.com",
        role: "admin",
      },
    ];
    sandbox.stub(usuariosService, "getUsuarios").resolves(usuariosMock);

    const res = await request(app).get("/api/usuarios");

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal("success");
    expect(res.body.usuarios).to.deep.equal([
      {
        nombre_completo: "Jane Doe",
        email: "jane@costify.com",
        rol: "admin",
      },
    ]);
  });

  it("GET /api/usuarios/:id retorna 400 si el id es inválido", async () => {
    const res = await request(app).get("/api/usuarios/invalid-id");

    expect(res.status).to.equal(400);
    expect(res.body.errores[0].msg).to.equal("ID inválido");
  });

  it("PUT /api/usuarios/:id actualiza y devuelve DTO", async () => {
    const updated = {
      _id: "507f1f77bcf86cd799439060",
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@costify.com",
      role: "admin",
    };
    sandbox.stub(usuariosService, "updateUsuario").resolves(updated);

    const res = await request(app)
      .put("/api/usuarios/507f1f77bcf86cd799439060")
      .send({ first_name: "Jane" });

    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal("succes");
    expect(res.body.usuario).to.deep.equal({
      nombre_completo: "Jane Doe",
      email: "jane@costify.com",
      rol: "admin",
    });
  });

  it("PUT /api/usuarios/:id responde 404 si no existe", async () => {
    sandbox.stub(usuariosService, "updateUsuario").resolves(null);

    const res = await request(app)
      .put("/api/usuarios/507f1f77bcf86cd799439060")
      .send({ first_name: "Jane" });

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal(
      "No se encontró ningún usuario con el ID: 507f1f77bcf86cd799439060"
    );
  });

  it("DELETE /api/usuarios/:id elimina y retorna payload", async () => {
    const deleted = {
      _id: "507f1f77bcf86cd799439060",
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@costify.com",
      role: "admin",
    };
    sandbox.stub(usuariosService, "delete").resolves(deleted);

    const res = await request(app).delete("/api/usuarios/507f1f77bcf86cd799439060");

    expect(res.status).to.equal(200);
    expect(res.body.payload).to.equal("succes");
    expect(res.body.usuario).to.deep.equal({
      nombre_completo: "Jane Doe",
      email: "jane@costify.com",
      rol: "admin",
    });
  });

  it("DELETE /api/usuarios/:id responde 404 si no existe", async () => {
    sandbox.stub(usuariosService, "delete").resolves(null);

    const res = await request(app).delete(
      "/api/usuarios/507f1f77bcf86cd799439060"
    );

    expect(res.status).to.equal(404);
    expect(res.body.mensaje).to.equal(
      "No se encontró ningún usuario con el ID: 507f1f77bcf86cd799439060"
    );
  });
});
