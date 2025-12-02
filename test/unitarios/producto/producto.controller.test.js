import { productoController } from "../../../src/controllers/producto.controller.js";
import { productoService } from "../../../src/services/index.js";
import logger from "../../../src/config/logger.js";
import { expect } from "chai";
import sinon from "sinon";

describe("ProductoController", () => {
  describe("create", () => {
    let req, res, next;
    beforeEach(() => {
      req = { body: { nombre: "Tornillo" }, files: [] };
      res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe crear producto correctamente", async () => {
      sinon.stub(productoService, "createProducto").resolves({ _id: "1", nombre: "Tornillo" });
      sinon.stub(logger, "info");
      await productoController.create(req, res, next);
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ _id: "1", nombre: "Tornillo" })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no se crea", async () => {
      sinon.stub(productoService, "createProducto").resolves(null);
      sinon.stub(logger, "warn");
      await productoController.create(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("getAll", () => {
    let req, res, next;
    beforeEach(() => {
      req = {};
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe retornar productos si existen", async () => {
      sinon.stub(productoService, "getAllProductos").resolves([{ nombre: "Tornillo" }]);
      sinon.stub(logger, "info");
      await productoController.getAll(req, res, next);
      expect(res.json.calledWith([{ nombre: "Tornillo" }])).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no hay productos", async () => {
      sinon.stub(productoService, "getAllProductos").resolves(null);
      sinon.stub(logger, "warn");
      await productoController.getAll(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("getById", () => {
    let req, res, next;
    beforeEach(() => {
      req = { params: { id: "1" } };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe retornar producto si existe", async () => {
      sinon.stub(productoService, "getProductoById").resolves({ _id: "1", nombre: "Tornillo" });
      sinon.stub(logger, "info");
      await productoController.getById(req, res, next);
      expect(res.json.calledWith({ _id: "1", nombre: "Tornillo" })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no existe", async () => {
      sinon.stub(productoService, "getProductoById").resolves(null);
      sinon.stub(logger, "warn");
      await productoController.getById(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("getByCatalogo", () => {
    let req, res, next;
    beforeEach(() => {
      req = { params: { catalogo: "herramientas" } };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe retornar productos por catálogo", async () => {
      sinon.stub(productoService, "getProductByCatalogo").resolves([{ _id: "1", catalogo: "herramientas" }]);
      sinon.stub(logger, "info");
      await productoController.getByCatalogo(req, res, next);
      expect(res.json.calledWith([{ _id: "1", catalogo: "herramientas" }])).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no hay productos en el catálogo", async () => {
      sinon.stub(productoService, "getProductByCatalogo").resolves(null);
      sinon.stub(logger, "warn");
      await productoController.getByCatalogo(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("getByModelo", () => {
    let req, res, next;
    beforeEach(() => {
      req = { params: { modelo: "industrial" } };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe retornar productos por modelo", async () => {
      sinon.stub(productoService, "getProductByModelo").resolves([{ _id: "1", modelo: "industrial" }]);
      sinon.stub(logger, "info");
      await productoController.getByModelo(req, res, next);
      expect(res.json.calledWith([{ _id: "1", modelo: "industrial" }])).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no hay productos en el modelo", async () => {
      sinon.stub(productoService, "getProductByModelo").resolves(null);
      sinon.stub(logger, "warn");
      await productoController.getByModelo(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });

  describe("update", () => {
    let req, res, next;
    beforeEach(() => {
      req = { params: { id: "1" }, body: { nombre: "Tornillo grande" }, files: [] };
      res = { json: sinon.stub() };
      next = sinon.stub();
      sinon.restore();
    });
    it("debe actualizar producto correctamente", async () => {
      sinon.stub(productoService, "updateProducto").resolves({ _id: "1", nombre: "Tornillo grande" });
      sinon.stub(logger, "info");
      await productoController.update(req, res, next);
      expect(res.json.calledWith({ _id: "1", nombre: "Tornillo grande" })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no se actualiza", async () => {
      sinon.stub(productoService, "updateProducto").resolves(null);
      sinon.stub(logger, "warn");
      await productoController.update(req, res, next);
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
    it("debe eliminar producto correctamente", async () => {
      sinon.stub(productoService, "getProductoById").resolves({ _id: "1", imagenes: [] });
      sinon.stub(productoService, "deleteProducto").resolves(true);
      sinon.stub(logger, "info");
      await productoController.delete(req, res, next);
      expect(res.json.calledWith({ mensaje: "Producto eliminado", producto: true })).to.be.true;
      expect(logger.info.called).to.be.true;
    });
    it("debe retornar error si no existe el producto para eliminar", async () => {
      sinon.stub(productoService, "getProductoById").resolves(null);
      sinon.stub(logger, "warn");
      await productoController.delete(req, res, next);
      expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
      expect(logger.warn.called).to.be.true;
    });
  });
});
