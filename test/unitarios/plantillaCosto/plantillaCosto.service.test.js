import { expect } from 'chai';
import sinon from 'sinon';
import { PlantillaCostoService } from '../../../src/services/plantillaCosto.service.js';

describe('PlantillaCostoService', () => {
  let mockDAO;
  let service;

  beforeEach(() => {
    mockDAO = {
      create: sinon.stub(),
      getAll: sinon.stub(),
      getById: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    };
    service = new PlantillaCostoService(mockDAO);
  });

  describe('createPlantilla', () => {
    it('debe crear una plantilla correctamente', async () => {
      mockDAO.create.resolves({ _id: 'p1', nombre: 'Plantilla' });
      const data = { items: [], porcentajesPorCategoria: {}, nombre: 'Plantilla' };
      const result = await service.createPlantilla(data);
      expect(result._id).to.equal('p1');
      expect(mockDAO.create.calledOnce).to.be.true;
    });

    it('debe incluir los totales de la categoría "otros" en el payload', async () => {
      mockDAO.create.resolves({ _id: 'p2', nombre: 'Con Otros' });
      const payload = {
        nombre: 'Con Otros',
        items: [
          {
            categoria: 'otros',
            valor: 500,
            cantidad: 2,
            esPersonalizado: true,
          },
        ],
        porcentajesPorCategoria: { otros: 25 },
        consumibles: { otros: 100 },
        tags: [],
      };

      await service.createPlantilla(payload);

      const subtotalesMatcher = sinon.match(
        (value) => {
          const subtotalOtros = value?.otros ?? value?.get?.('otros');
          return subtotalOtros === 1100;
        },
        'subtotales.otros === 1100'
      );

      sinon.assert.calledWithMatch(
        mockDAO.create,
        sinon.match({
          costoTotal: 1100,
          precioFinal: 1375,
          ganancia: 275,
          categoria: 'Otros',
          subtotales: subtotalesMatcher,
        })
      );
    });

    it('debe normalizar y persistir los extras con su total', async () => {
      mockDAO.create.resolves({ _id: 'p3', nombre: 'Con Extras' });
      const extrasPayload = {
        creditoCamioneta: { valor: '100', porcentaje: '10' },
        envio: { valor: 50 },
        camposPersonalizados: [
          { nombre: 'Adicional', valor: 200, porcentaje: 5 },
          { nombre: '   ', valor: 0, porcentaje: 0 },
        ],
      };

      await service.createPlantilla({
        nombre: 'Con Extras',
        items: [],
        porcentajesPorCategoria: {},
        consumibles: {},
        extras: extrasPayload,
      });

      const extrasEsperados = {
        creditoCamioneta: { valor: 100, porcentaje: 10 },
        envio: { valor: 50, porcentaje: 0 },
        camposPersonalizados: [{ nombre: 'Adicional', valor: 200, porcentaje: 5 }],
      };

      sinon.assert.calledWithMatch(
        mockDAO.create,
        sinon.match({
          extras: sinon.match((extras) => {
            expect(extras).to.deep.equal(extrasEsperados);
            return true;
          }, 'extras normalizados'),
          extrasTotal: 370,
          costoTotal: 370,
          precioFinal: 370,
        })
      );
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

  describe('duplicatePlantilla', () => {
    it('debe duplicar una plantilla con nuevo nombre', async () => {
      const origen = {
        _id: 'p1',
        nombre: 'Base',
        categoria: 'Mixta',
        tipoProyecto: 'Otro',
        tags: ['exterior'],
        items: [
          {
            materiaPrima: { _id: 'mp1', nombre: 'Hierro' },
            cantidad: 2,
            categoria: 'Metal',
            valor: 100,
          },
        ],
        porcentajesPorCategoria: { Metal: 10 },
        consumibles: { Metal: 5 },
        extras: { envio: { valor: 50, porcentaje: 0 } },
      };

      const getByIdStub = sinon.stub(service, 'getPlantillaById').resolves(origen);
      const createStub = sinon.stub(service, 'createPlantilla').resolves({ _id: 'p2', nombre: 'Copia' });

      const result = await service.duplicatePlantilla('p1', { nombre: 'Copia' });

      expect(result._id).to.equal('p2');
      expect(getByIdStub.calledOnceWith('p1')).to.be.true;
      sinon.assert.calledWithMatch(
        createStub,
        sinon.match({
          nombre: 'Copia',
          categoria: 'Mixta',
          tipoProyecto: 'Otro',
          tags: ['exterior'],
          porcentajesPorCategoria: { Metal: 10 },
          consumibles: { Metal: 5 },
          extras: sinon.match.any,
          items: [sinon.match({ materiaPrima: 'mp1' })],
        })
      );
    });

    it('debe retornar null si no existe la plantilla origen', async () => {
      sinon.stub(service, 'getPlantillaById').resolves(null);
      const createSpy = sinon.spy(service, 'createPlantilla');

      const result = await service.duplicatePlantilla('missing');

      expect(result).to.equal(null);
      expect(createSpy.called).to.be.false;
    });
  });
});
