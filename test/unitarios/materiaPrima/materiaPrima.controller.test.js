import { MateriaPrimaController } from "../../../src/controllers/materiaPrima.controller.js";
import { materiaPrimaService } from "../../../src/services/materiaPrima.service.js";
import logger from "../../../src/config/logger.js";
import { expect } from "chai";
import sinon from "sinon";


describe("MateriaPrimaController", () => {
  describe("create", () => {
    let req, res, next;
    beforeEach(() => {
      req = { body: { nombre: "Acero" } };
      res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe crear materia prima correctamente", async () => {
      sinon.stub(materiaPrimaService, "createMateriaPrima").resolves({ _id: "1", nombre: "Acero" });
      sinon.stub(logger, "info");
      await MateriaPrimaController.create(req, res, next);
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ status: "success", materiaPrima: { _id: "1", nombre: "Acero" } })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no se crea", async () => {
      sinon.stub(materiaPrimaService, "createMateriaPrima").resolves(null);
      sinon.stub(logger, "warn");
      await MateriaPrimaController.create(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("delete", () => {
    let req, res, next;
    beforeEach(() => {
      req = { params: { id: "1" } };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe eliminar materia prima correctamente", async () => {
      sinon.stub(materiaPrimaService, "deleteMateriaPrima").resolves(true);
      sinon.stub(logger, "info");
      await MateriaPrimaController.delete(req, res, next);
      expect(res.json.calledWith({ status: "success", message: "Materia Prima eliminada correctamente" })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no se elimina", async () => {
      sinon.stub(materiaPrimaService, "deleteMateriaPrima").resolves(null);
      sinon.stub(logger, "warn");
      await MateriaPrimaController.delete(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("getAll", () => {
    let req, res, next;
    beforeEach(() => {
      req = { query: {} };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe retornar materias primas si existen", async () => {
      sinon
        .stub(materiaPrimaService, "getAllMateriaPrimas")
        .resolves({
          items: [{ nombre: "Acero" }],
          total: 1,
          page: 1,
          limit: 10,
          availableTypes: ["tipo"],
          availableMedidas: ["medida"],
        });
      sinon.stub(logger, "info");
      await MateriaPrimaController.getAll(req, res, next);
      expect(
        res.json.calledWith({
          status: "success",
          materiasPrimas: [{ nombre: "Acero" }],
          pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          filtersMeta: { availableTypes: ["tipo"], availableMedidas: ["medida"] },
        })
      ).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no hay materias primas", async () => {
      sinon
        .stub(materiaPrimaService, "getAllMateriaPrimas")
        .resolves({ items: [], total: 0, page: 1, limit: 10, availableTypes: [], availableMedidas: [] });
      sinon.stub(logger, "warn");
      await MateriaPrimaController.getAll(req, res, next);
      expect(
        res.json.calledWith({
          status: "success",
          materiasPrimas: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
          filtersMeta: { availableTypes: [], availableMedidas: [] },
        })
      ).to.be.true;
      expect(next.called).to.be.false;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("getAllCategories", () => {
    let req, res, next;
    beforeEach(() => {
      req = {};
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe retornar categorías correctamente", async () => {
      sinon.stub(materiaPrimaService, "getAllCategories").resolves(["metal", "plástico"]);
      sinon.stub(logger, "info");
      await MateriaPrimaController.getAllCategories(req, res, next);
      expect(res.json.calledWith({ status: "success", categorias: [{ nombre: "metal" }, { nombre: "plástico" }] })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no hay categorías", async () => {
      sinon.stub(materiaPrimaService, "getAllCategories").resolves([]);
      sinon.stub(logger, "warn");
      await MateriaPrimaController.getAllCategories(req, res, next);
      expect(
        res.json.calledWith({ status: "success", categorias: [] })
      ).to.be.true;
      expect(next.called).to.be.false;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("getByCategory", () => {
    let req, res, next;
    beforeEach(() => {
      req = { params: { category: "metal" } };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe retornar materias primas por categoría", async () => {
      sinon.stub(materiaPrimaService, "getMateriaPrimasByCategory").resolves([{ nombre: "Acero" }]);
      sinon.stub(logger, "info");
      await MateriaPrimaController.getByCategory(req, res, next);
      expect(res.json.calledWith({ status: "success", materiasPrimas: [{ nombre: "Acero" }] })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no hay materias primas en la categoría", async () => {
      sinon.stub(materiaPrimaService, "getMateriaPrimasByCategory").resolves([]);
      sinon.stub(logger, "warn");
      await MateriaPrimaController.getByCategory(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("getById", () => {
    let req, res, next;
    beforeEach(() => {
      req = { params: { id: "123" } };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe retornar materia prima si existe", async () => {
      sinon.stub(materiaPrimaService, "getMateriaPrimaById").resolves({ nombre: "Acero" });
      sinon.stub(logger, "info");
      await MateriaPrimaController.getById(req, res, next);
      expect(res.json.calledWith({ status: "success", materiaPrima: { nombre: "Acero" } })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no existe", async () => {
      sinon.stub(materiaPrimaService, "getMateriaPrimaById").resolves(null);
      sinon.stub(logger, "warn");
      await MateriaPrimaController.getById(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("getByType", () => {
    let req, res, next;
    beforeEach(() => {
      req = { params: { type: "ferroso" } };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe retornar materias primas por tipo", async () => {
      sinon.stub(materiaPrimaService, "getMateriaPrimasByType").resolves([{ nombre: "Acero" }]);
      sinon.stub(logger, "info");
      await MateriaPrimaController.getByType(req, res, next);
      expect(res.json.calledWith({ status: "success", materiasPrimas: [{ nombre: "Acero" }] })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no hay materias primas de ese tipo", async () => {
      sinon.stub(materiaPrimaService, "getMateriaPrimasByType").resolves([]);
      sinon.stub(logger, "warn");
      await MateriaPrimaController.getByType(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("update", () => {
    let req, res, next;
    beforeEach(() => {
      req = { params: { id: "1" }, body: { nombre: "Nuevo" } };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe actualizar materia prima correctamente", async () => {
      sinon.stub(materiaPrimaService, "updateMateriaPrima").resolves({ _id: "1", nombre: "Nuevo" });
      sinon.stub(logger, "info");
      await MateriaPrimaController.update(req, res, next);
      expect(res.json.calledWith({ status: "success", message: "Materia Prima actualizada correctamente", materiaPrima: { _id: "1", nombre: "Nuevo" } })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no se actualiza", async () => {
      sinon.stub(materiaPrimaService, "updateMateriaPrima").resolves(null);
      sinon.stub(logger, "warn");
      await MateriaPrimaController.update(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });
});
