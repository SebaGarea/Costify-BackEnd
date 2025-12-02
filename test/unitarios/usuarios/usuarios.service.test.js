import { expect } from "chai";
import sinon from "sinon";
import { UsuariosService } from "../../../src/services/usuarios.service.js";

describe("usuariosService", () => {
  let service;
  let mockDAO;
  let generaHashStub;

  beforeEach(() => {
    mockDAO = {
      getAll: sinon.stub(),
      getById: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    };
    generaHashStub = sinon.stub().returns("hashed123");
    service = new UsuariosService(mockDAO, generaHashStub);
  });

  describe("getUsuarios", () => {
    it("debe retornar todos los usuarios", async () => {
      mockDAO.getAll.resolves(["user1", "user2"]);
      const result = await service.getUsuarios();
      expect(result).to.deep.equal(["user1", "user2"]);
      expect(mockDAO.getAll.calledOnce).to.be.true;
    });
  });

  describe("getUsuariosById", () => {
    it("debe retornar el usuario por id", async () => {
      mockDAO.getById.resolves({ _id: "abc", nombre: "Test" });
      const result = await service.getUsuariosById("abc");
      expect(result).to.deep.equal({ _id: "abc", nombre: "Test" });
      expect(mockDAO.getById.calledOnceWith("abc")).to.be.true;
    });
  });

  describe("updateUsuario", () => {
    it("debe actualizar el usuario y hashear password si existe", async () => {
      const datos = { password: "123", email: "a@b.com" };
      mockDAO.update.resolves({ _id: "abc", ...datos });
      const result = await service.updateUsuario("abc", datos);
      expect(result._id).to.equal("abc");
      expect(mockDAO.update.calledOnce).to.be.true;
      expect(generaHashStub.calledOnceWith("123")).to.be.true;
      expect(datos.password).to.equal("hashed123");
    });
    it("debe actualizar el usuario sin password", async () => {
      mockDAO.update.resolves({ _id: "abc", email: "a@b.com" });
      const result = await service.updateUsuario("abc", { email: "a@b.com" });
      expect(result._id).to.equal("abc");
      expect(mockDAO.update.calledOnce).to.be.true;
    });
  });

  describe("delete", () => {
    it("debe eliminar el usuario", async () => {
      mockDAO.delete.resolves(true);
      const result = await service.delete("abc");
      expect(result).to.be.true;
      expect(mockDAO.delete.calledOnceWith("abc")).to.be.true;
    });
  });
});
