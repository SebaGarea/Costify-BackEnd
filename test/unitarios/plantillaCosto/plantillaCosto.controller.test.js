import { expect } from 'chai';
import sinon from 'sinon';
import { plantillaCostoController } from '../../../src/controllers/plantillaCosto.controller.js';
import { plantillaCostoService } from '../../../src/services/plantillaCosto.service.js';

describe('plantillaCostoController', function () {
  const mockReq = { params: {}, body: {}, query: {} };
  const mockRes = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
  };
  const next = sinon.stub();

  beforeEach(function () {
    sinon.restore();
    sinon.stub(plantillaCostoService, 'createPlantilla').resolves({ _id: 'p1' });
    sinon.stub(plantillaCostoService, 'getAllPlantillas').resolves([{ _id: 'p1' }]);
    sinon.stub(plantillaCostoService, 'getPlantillaById').resolves({ _id: 'p1' });
    sinon.stub(plantillaCostoService, 'updatePlantilla').resolves({ _id: 'p1', nombre: 'Plantilla2' });
    sinon.stub(plantillaCostoService, 'deletePlantilla').resolves(true);
  });
  afterEach(function () {
    sinon.restore();
  });

  describe('create', function () {
    it('debe crear una plantilla', async function () {
      const req = { ...mockReq, body: { nombre: 'Plantilla' } };
      const res = { ...mockRes };
      await plantillaCostoController.create(req, res, next);
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
    });
  });

  describe('getAll', function () {
    it('debe retornar todas las plantillas', async function () {
      const req = { ...mockReq };
      const res = { ...mockRes };
      await plantillaCostoController.getAll(req, res, next);
      expect(res.json.called).to.be.true;
    });
  });

  describe('getById', function () {
    it('debe retornar plantilla por id', async function () {
      const req = { ...mockReq, params: { id: 'p1' } };
      const res = { ...mockRes };
      await plantillaCostoController.getById(req, res, next);
      expect(res.json.called).to.be.true;
    });
  });

  describe('update', function () {
    it('debe actualizar plantilla', async function () {
      const req = { ...mockReq, params: { id: 'p1' }, body: { nombre: 'Plantilla2' } };
      const res = { ...mockRes };
      await plantillaCostoController.update(req, res, next);
      expect(res.json.called).to.be.true;
    });
  });

  describe('delete', function () {
    it('debe eliminar plantilla', async function () {
      const req = { ...mockReq, params: { id: 'p1' } };
      const res = { ...mockRes };
      await plantillaCostoController.delete(req, res, next);
      expect(res.json.called).to.be.true;
    });
  });
});
