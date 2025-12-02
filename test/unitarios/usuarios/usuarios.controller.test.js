
import { expect } from 'chai';
import sinon from 'sinon';
import { UsuariosController } from '../../../src/controllers/usuarios.controller.js';
import { usuariosService } from '../../../src/services/usuarios.service.js';

const mockReq = { params: {}, body: {}, user: { _id: 'id1', role: 'user' } };
const mockRes = {
  status: sinon.stub().returnsThis(),
  json: sinon.stub().returnsThis(),
  setHeader: sinon.stub().returnsThis(),
};
const next = sinon.stub();

describe('UsuariosController', function () {
  beforeEach(function () {
    sinon.restore();
    sinon.stub(usuariosService, 'getUsuarios').resolves([{ _id: 'id1' }]);
    sinon.stub(usuariosService, 'getUsuariosById').resolves({ _id: 'id1' });
    sinon.stub(usuariosService, 'updateUsuario').resolves({ _id: 'id1' });
    sinon.stub(usuariosService, 'delete').resolves({ _id: 'id1' });
  });
  afterEach(function () {
    sinon.restore();
  });

  describe('getUsuarios', function () {
    it('debe retornar usuarios correctamente', async function () {
      const req = { ...mockReq };
      const res = { ...mockRes };
      await UsuariosController.getUsuarios(req, res, next);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
    });
  });

  describe('getUsuariosById', function () {
    it('debe retornar usuario por id', async function () {
      const req = { ...mockReq, params: { id: 'id1' } };
      const res = { ...mockRes };
      await UsuariosController.getUsuariosById(req, res, next);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
    });
  });

  describe('updateUsuario', function () {
    it('debe actualizar usuario', async function () {
      const req = { ...mockReq, params: { id: 'id1' }, body: { email: 'a@b.com' } };
      const res = { ...mockRes };
      await UsuariosController.updateUsuario(req, res, next);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
    });
  });

  describe('deleteUsuario', function () {
    it('debe eliminar usuario', async function () {
      const req = { ...mockReq, params: { id: 'id1' } };
      const res = { ...mockRes };
      await UsuariosController.deleteUsuario(req, res, next);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
    });
  });
});
