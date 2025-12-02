
import { expect } from 'chai';
import sinon from 'sinon';
import { ventasController } from '../../../src/controllers/ventas.controller.js';
import { ventasService } from '../../../src/services/ventas.service.js';

const mockReq = { params: {}, body: {}, query: {} };
const mockRes = {
  status: sinon.stub().returnsThis(),
  json: sinon.stub().returnsThis(),
};
const next = sinon.stub();

describe('ventasController', function () {
  beforeEach(function () {
    sinon.restore();
    sinon.stub(ventasService, 'createVenta').resolves({ _id: 'v1' });
    sinon.stub(ventasService, 'getAllVentas').resolves([{ _id: 'v1' }]);
    sinon.stub(ventasService, 'getAllVentasPaginated').resolves([{ _id: 'v1' }]);
    sinon.stub(ventasService, 'getVentaById').resolves({ _id: 'v1' });
    sinon.stub(ventasService, 'updateVenta').resolves({ _id: 'v1', cantidad: 2 });
    sinon.stub(ventasService, 'deleteVenta').resolves(true);
  });
  afterEach(function () {
    sinon.restore();
  });

  describe('createVenta', function () {
    it('debe crear una venta', async function () {
      const req = { ...mockReq, body: { productoId: 'p1', cantidad: 1 } };
      const res = { ...mockRes };
      await ventasController.createVenta(req, res, next);
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
    });
  });

  describe('getAllVentas', function () {
    it('debe retornar todas las ventas', async function () {
      const req = { ...mockReq };
      const res = { ...mockRes };
      await ventasController.getAllVentas(req, res, next);
      expect(res.json.called).to.be.true;
    });
  });

  describe('getVentaById', function () {
    it('debe retornar venta por id', async function () {
      const req = { ...mockReq, params: { id: 'v1' } };
      const res = { ...mockRes };
      await ventasController.getVentaById(req, res, next);
      expect(res.json.called).to.be.true;
    });
  });

  describe('updateVenta', function () {
    it('debe actualizar venta', async function () {
      const req = { ...mockReq, params: { id: 'v1' }, body: { cantidad: 2 } };
      const res = { ...mockRes };
      await ventasController.updateVenta(req, res, next);
      expect(res.json.called).to.be.true;
    });
  });

  describe('deleteVenta', function () {
    it('debe eliminar venta', async function () {
      const req = { ...mockReq, params: { id: 'v1' } };
      const res = { ...mockRes };
      await ventasController.deleteVenta(req, res, next);
      expect(res.json.called).to.be.true;
    });
  });
});
