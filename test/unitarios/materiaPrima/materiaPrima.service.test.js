import { MateriaPrimaService } from "../../../src/services/index.js";
import { expect } from "chai";
import sinon from "sinon";


describe("MateriaPrimaService", () => {
    let daoMock;
    let service;

    beforeEach(() => {
        daoMock = {
            create: sinon.stub(),
            getAll: sinon.stub(),
            getById: sinon.stub(),
            update: sinon.stub(),
            delete: sinon.stub(),
            getByCategory: sinon.stub(),
            getAllCategories: sinon.stub(),
            getByType: sinon.stub()
        };
        service = new MateriaPrimaService(daoMock);
    });

    afterEach(() => {
        sinon.restore();
    });

    it("debe crear una materia prima", async () => {
        const data = { nombre: "Acero" };
        daoMock.create.resolves({ _id: "1", ...data });
        const result = await service.createMateriaPrima(data);
        expect(result).to.deep.equal({ _id: "1", ...data });
        expect(daoMock.create.calledOnceWith(data)).to.be.true;
    });

    it("debe obtener todas las materias primas", async () => {
        const materias = [{ _id: "1" }, { _id: "2" }];
        daoMock.getAll.resolves(materias);
        const result = await service.getAllMateriaPrimas();
        expect(result).to.deep.equal(materias);
        expect(daoMock.getAll.calledOnce).to.be.true;
    });

    it("debe obtener materia prima por id", async () => {
        daoMock.getById.resolves({ _id: "1", nombre: "Acero" });
        const result = await service.getMateriaPrimaById("1");
        expect(result).to.deep.equal({ _id: "1", nombre: "Acero" });
        expect(daoMock.getById.calledOnceWith("1")).to.be.true;
    });

    it("debe actualizar materia prima", async () => {
        const updateData = { nombre: "Hierro" };
        daoMock.update.resolves({ _id: "1", ...updateData });
        const result = await service.updateMateriaPrima("1", updateData);
        expect(result).to.deep.equal({ _id: "1", ...updateData });
        expect(daoMock.update.calledOnceWith("1", updateData)).to.be.true;
    });

    it("debe eliminar materia prima", async () => {
        daoMock.delete.resolves(true);
        const result = await service.deleteMateriaPrima("1");
        expect(result).to.be.true;
        expect(daoMock.delete.calledOnceWith("1")).to.be.true;
    });

    it("debe obtener materias primas por categoría", async () => {
        const categoria = "Metales";
        const materias = [{ _id: "1", categoria }];
        daoMock.getByCategory.resolves(materias);
        const result = await service.getMateriaPrimasByCategory(categoria);
        expect(result).to.deep.equal(materias);
        expect(daoMock.getByCategory.calledOnceWith(categoria)).to.be.true;
    });

    it("debe obtener todas las categorías", async () => {
        const categorias = ["Metales", "Plásticos"];
        daoMock.getAllCategories.resolves(categorias);
        const result = await service.getAllCategories();
        expect(result).to.deep.equal(categorias);
        expect(daoMock.getAllCategories.calledOnce).to.be.true;
    });

    it("debe obtener materias primas por tipo", async () => {
        const tipo = "Ferroso";
        const materias = [{ _id: "1", tipo }];
        daoMock.getByType.resolves(materias);
        const result = await service.getMateriaPrimasByType(tipo);
        expect(result).to.deep.equal(materias);
        expect(daoMock.getByType.calledOnceWith(tipo)).to.be.true;
    });
});
