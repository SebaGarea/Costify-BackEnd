import { expect } from 'chai';
import sinon from 'sinon';
import { PlantillaCostoService } from '../../../src/services/plantillaCosto.service.js';

describe('PlantillaCostoService', () => {
  const mockDAO = {
    create: sinon.stub(),
    getAll: sinon.stub(),
    getById: sinon.stub(),
    update: sinon.stub(),
    delete: sinon.stub(),
  };
  const mockMateriaPrimaModel = { findById: sinon.stub() };
  let service;

  beforeEach(() => {
    service = new PlantillaCostoService(mockDAO);
    sinon.resetHistory();
  });

  describe('createPlantilla', () => {
    it('debe crear una plantilla correctamente', async () => {
      mockDAO.create.resolves({ _id: 'p1', nombre: 'Plantilla' });
      const data = { items: [], porcentajesPorCategoria: {}, nombre: 'Plantilla' };
      const result = await service.createPlantilla(data);
      expect(result._id).to.equal('p1');
      expect(mockDAO.create.calledOnce).to.be.true;
    });
  });

  describe('getAllPlantillas', () => {
    it('debe retornar todas las plantillas', async () => {
      mockDAO.getAll.resolves(['plantilla1', 'plantilla2']);
      const result = await service.getAllPlantillas();
      expect(result).to.deep.equal(['plantilla1', 'plantilla2']);
      expect(mockDAO.getAll.calledOnce).to.be.true;
    });
  });

  describe('getPlantillaById', () => {
    it('debe retornar plantilla por id', async () => {
      mockDAO.getById.resolves({ _id: 'p1' });
      const result = await service.getPlantillaById('p1');
      expect(result._id).to.equal('p1');
      expect(mockDAO.getById.calledOnceWith('p1')).to.be.true;
    });
  });

  describe('updatePlantilla', () => {
    it('debe actualizar una plantilla', async () => {
      mockDAO.update.resolves({ _id: 'p1', nombre: 'Plantilla2' });
      const data = { nombre: 'Plantilla2', items: [], porcentajesPorCategoria: {}, consumibles: {} };
      const result = await service.updatePlantilla('p1', data);
      expect(result.nombre).to.equal('Plantilla2');
      expect(mockDAO.update.calledOnce).to.be.true;
    });
  });

  describe('deletePlantilla', () => {
    it('debe eliminar una plantilla', async () => {
      mockDAO.delete.resolves(true);
      const result = await service.deletePlantilla('p1');
      expect(result).to.be.true;
      expect(mockDAO.delete.calledOnceWith('p1')).to.be.true;
    });
  });
});
