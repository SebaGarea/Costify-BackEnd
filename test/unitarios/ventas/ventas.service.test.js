import { expect } from 'chai';
import sinon from 'sinon';
import { VentasService } from '../../../src/services/ventas.service.js';
import * as ProductoSchema from '../../../src/dao/models/ProductoSchema.js';

const mockDAO = {
  create: sinon.stub(),
  getAll: sinon.stub(),
  getAllPaginated: sinon.stub(),
  getById: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub(),
};

describe('VentasService', () => {
  let service;
  let productoStub;
  beforeEach(() => {
    service = new VentasService(mockDAO);
    sinon.resetHistory();
    // Stub global para ProductoModel.findById
    productoStub = sinon.stub(ProductoSchema.ProductoModel, 'findById').resolves({ precio: 100 });
  });
  afterEach(() => {
    productoStub.restore();
  });

  describe('createVenta', () => {
    it('debe crear una venta correctamente', async () => {
      mockDAO.create.resolves({ _id: 'v1', valorTotal: 200 });
      const data = { productoId: 'p1', cantidad: 2, cliente: 'c1' };
      const result = await service.createVenta(data);
      expect(result._id).to.equal('v1');
      expect(mockDAO.create.calledOnce).to.be.true;
    });
  });

  describe('getAllVentas', () => {
    it('debe retornar todas las ventas', async () => {
      mockDAO.getAll.resolves(['venta1', 'venta2']);
      const result = await service.getAllVentas();
      expect(result).to.deep.equal(['venta1', 'venta2']);
      expect(mockDAO.getAll.calledOnce).to.be.true;
    });
  });

  describe('getAllVentasPaginated', () => {
    it('debe retornar ventas paginadas', async () => {
      mockDAO.getAllPaginated.resolves(['venta1']);
      const result = await service.getAllVentasPaginated(1, 1);
      expect(result).to.deep.equal(['venta1']);
      expect(mockDAO.getAllPaginated.calledOnce).to.be.true;
    });
  });

  describe('getVentaById', () => {
    it('debe retornar venta por id', async () => {
      mockDAO.getById.resolves({ _id: 'v1' });
      const result = await service.getVentaById('v1');
      expect(result._id).to.equal('v1');
      expect(mockDAO.getById.calledOnceWith('v1')).to.be.true;
    });
  });

  describe('updateVenta', () => {
    it('debe actualizar una venta', async () => {
      mockDAO.getById.resolves({
        _id: 'v1',
        cantidad: 1,
        producto: 'p1',
        valorEnvio: 0,
        seña: 0
      });
      mockDAO.update.resolves({ _id: 'v1', cantidad: 2 });
      const result = await service.updateVenta('v1', { cantidad: 2 });
      expect(result.cantidad).to.equal(2);
      expect(mockDAO.update.calledOnce).to.be.true;
    });
  });

  describe('deleteVenta', () => {
    it('debe eliminar una venta', async () => {
      mockDAO.delete.resolves(true);
      const result = await service.deleteVenta('v1');
      expect(result).to.be.true;
      expect(mockDAO.delete.calledOnceWith('v1')).to.be.true;
    });
  });
});
