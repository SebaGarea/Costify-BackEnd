import { ProductoService } from "../../../src/services/producto.service.js";
import { expect } from "chai";
import sinon from "sinon";

describe("ProductoService", () => {
  let daoMock;
  let service;

  beforeEach(() => {
    daoMock = {
      create: sinon.stub(),
      getAll: sinon.stub(),
      getById: sinon.stub(),
      getByCatalogo: sinon.stub(),
      getByModelo: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    };
    service = new ProductoService(daoMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("debe crear un producto", async () => {
    const data = { nombre: "Tornillo" };
    daoMock.create.resolves({ _id: "1", ...data });
    const result = await service.createProducto(data);
    expect(result).to.deep.equal({ _id: "1", ...data, precioActual: 0 });
    expect(daoMock.create.calledOnceWith(data)).to.be.true;
  });

  it("debe obtener todos los productos", async () => {
    const productos = [{ _id: "1" }, { _id: "2" }];
    daoMock.getAll.resolves(productos);
    const result = await service.getAllProductos();
    expect(result).to.deep.equal([
      { _id: "1", precioActual: 0 },
      { _id: "2", precioActual: 0 },
    ]);
    expect(daoMock.getAll.calledOnce).to.be.true;
  });

  it("debe obtener producto por id", async () => {
    daoMock.getById.resolves({ _id: "1", nombre: "Tornillo" });
    const result = await service.getProductoById("1");
    expect(result).to.deep.equal({ _id: "1", nombre: "Tornillo", precioActual: 0 });
    expect(daoMock.getById.calledOnceWith("1")).to.be.true;
  });

  it("debe obtener productos por catálogo", async () => {
    const catalogo = "herramientas";
    const productos = [{ _id: "1", catalogo }];
    daoMock.getByCatalogo.resolves(productos);
    const result = await service.getProductByCatalogo(catalogo);
    expect(result).to.deep.equal([{ _id: "1", catalogo, precioActual: 0 }]);
    expect(daoMock.getByCatalogo.calledOnceWith(catalogo)).to.be.true;
  });

  it("debe obtener productos por modelo", async () => {
    const modelo = "industrial";
    const productos = [{ _id: "1", modelo }];
    daoMock.getByModelo.resolves(productos);
    const result = await service.getProductByModelo(modelo);
    expect(result).to.deep.equal([{ _id: "1", modelo, precioActual: 0 }]);
    expect(daoMock.getByModelo.calledOnceWith(modelo)).to.be.true;
  });

  it("debe actualizar producto", async () => {
    const updateData = { nombre: "Tornillo grande" };
    daoMock.update.resolves({ _id: "1", ...updateData });
    const result = await service.updateProducto("1", updateData);
    expect(result).to.deep.equal({ _id: "1", ...updateData, precioActual: 0 });
    expect(daoMock.update.calledOnceWith("1", updateData)).to.be.true;
  });

  it("debe eliminar producto", async () => {
    daoMock.delete.resolves(true);
    const result = await service.deleteProducto("1");
    expect(result).to.be.true;
    expect(daoMock.delete.calledOnceWith("1")).to.be.true;
  });
});
