import { MateriaPrimaDAOMongo as MateriaPrimaDao } from "../dao/index.js";
import XLSX from "xlsx";
import logger from "../config/logger.js";

const FAMILY_CATEGORY_MAP = {
    // Hierro
    "0001": "hierro",
    "0002": "hierro",
    "0003": "hierro",
    "0004": "hierro",
    "0005": "hierro",
    "0006": "hierro",
    "0007": "hierro",
    "0011": "hierro",
    "0012": "hierro",
    "0133": "hierro",
    "0134": "hierro",
    "0318": "hierro",
    "0339": "hierro",
    "0682": "hierro",
    "0683": "hierro",
    "0684": "hierro",
    "0685": "hierro",

    // Insumos
    "0010": "insumos",
    "0235": "insumos",
    "1030": "insumos",
    "0236": "insumos",
    "0233": "insumos",

    // Caños
    "0015": "caño",
    "0016": "caño",
    "0017": "caño",

    // Malla
    "0025": "malla",
    "0237": "malla",
    "0037": "malla",

    // Cerraduras
    "0045": "cerraduras",
    "0092": "cerraduras",
    "0048": "cerraduras",
    "0117": "cerraduras",

    // Bisagras
    "0030": "bisagras",
    "0031": "bisagras",
    "0032": "bisagras",
    "0093": "bisagras",

    // Accesorios
    "0081": "accesorios",
    "0158": "accesorios",
    "0170": "accesorios",
    "0184": "accesorios",
    "0251": "accesorios",
    "0297": "accesorios",
    "0473": "accesorios",
    "0474": "accesorios",
    "1040": "accesorios",
    "1050": "accesorios",
    "1060": "accesorios",
    "0522": "accesorios",
    "0532": "accesorios",
    "0534": "accesorios",
    "0570": "accesorios",

    // Chapa
    "0013": "chapa",
    "0014": "chapa",
    "0326": "chapa",
    "0327": "chapa",
    "0329": "chapa",
    "0330": "chapa",
    "0332": "chapa",
};

const DEFAULT_CATEGORY = "sin_categoria";

const ALLOWED_FAMILY_CODES = new Set([
    "0001",
    "0002",
    "0003",
    "0005",
    "0007",
    "0013",
    "0014",
    "0015",
    "0016",
    "0017",
    "0025",
    "0030",
    "0031",
    "0032",
    "0037",
    "0045",
    "0048",
    "0092",    
    "0117",
    "0158",
    "0233",
    "0235",
    "0236",
    "0237",
    "0326",
    "0329",
    "0330",
    "0332",
    "0473",
    "0474",
    "0522",
    "0532",
    "0534",
    "0570",
    "0682",
    "0683",
    "0684",
    "0685",
    "1030",
    "1060",
]);

const PREFIX_MAP = {
    CA: "Caño",
    EST: "Estructural",
    RED: "Redondo",
    CUAD: "Cuadrado",
    RECT: "Rectangular",
    CH: "Chapa",
    
};

const capitalizeWord = (word = "") => {
    if (!word) return "";
    const lower = word.toLocaleLowerCase("es-AR");
    return lower.charAt(0).toLocaleUpperCase("es-AR") + lower.slice(1);
};

const normalizeFamilyCode = (value = "") => {
    const raw = value?.toString().trim();
    if (!raw) return "0000";
    return raw.padStart(4, "0");
};

const getCategoryFromFamily = (familyCode) => ({
    categoria: FAMILY_CATEGORY_MAP[familyCode] || DEFAULT_CATEGORY,
    type: familyCode,
});

const normalizeDimension = (value = "") => value.toString().replace(/\s+/g, "").replace(/\*/g, "X");

const formatDimensionToken = (value = "") => {
    const cleaned = normalizeDimension(value);
    if (!cleaned) return "";
    return cleaned.replace(/\./g, ",").toUpperCase();
};

const humanizeNombre = (value = "") => {
    const trimmed = value?.replace(/\.+$/, "").trim();
    if (!trimmed) return "";
    const dotParts = trimmed.split(".").filter(Boolean);
    const parts = dotParts.length ? dotParts : trimmed.split(/[\s-]+/).filter(Boolean);
    return parts
        .map((token) => {
            const upper = token.toUpperCase();
            if (PREFIX_MAP[upper]) return PREFIX_MAP[upper];
            return capitalizeWord(token.replace(/_/g, " "));
        })
        .join(" ");
};

const parseDescripcion = (descripcion = "") => {
    const clean = descripcion.trim();
    if (!clean) {
        return { nombre: "", medida: "", espesor: "" };
    }

    const firstDigitIdx = clean.search(/[0-9]/);
    let rawNombre = clean;
    let dimensionSegment = "";

    if (firstDigitIdx !== -1) {
        rawNombre = clean.slice(0, firstDigitIdx).replace(/[.\s]+$/, "");
        dimensionSegment = clean.slice(firstDigitIdx).trim();
    }

    if (!rawNombre) {
        const [fallbackNombre, ...rest] = clean.split(/\s+/);
        rawNombre = fallbackNombre || "";
        dimensionSegment = dimensionSegment || rest.join(" ");
    }

    const nombre = humanizeNombre(rawNombre);
    if (!dimensionSegment) {
        return { nombre, medida: "", espesor: "" };
    }

    const tokens = dimensionSegment
        .split(/[xX]/)
        .map((token) => formatDimensionToken(token))
        .filter(Boolean);

    if (tokens.length === 0) {
        return { nombre, medida: "", espesor: "" };
    }

    if (tokens.length === 1) {
        return { nombre, medida: tokens[0], espesor: "" };
    }

    if (tokens.length === 2) {
        return { nombre, medida: tokens[0], espesor: tokens[1] };
    }

    const medida = `${tokens[0]}X${tokens[1]}`;
    const espesorTokens = tokens.slice(2);
    const espesor = espesorTokens.length > 0 ? espesorTokens.join("X") : "";

    return { nombre, medida, espesor };
};

const parseNumber = (value) => {
    if (typeof value === "number") return value;
    if (value === null || value === undefined) return null;

    const raw = value.toString().trim();
    if (!raw) return null;

    const sign = raw.startsWith("-") ? -1 : 1;
    const unsigned = raw.replace(/^[+-]/, "");
    const cleaned = unsigned.replace(/[^0-9.,]/g, "");
    if (!cleaned) return null;

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    const digitsAfter = (idx) => (idx === -1 ? 0 : cleaned.length - idx - 1);

    let decimalSeparator = null;
    if (lastComma !== -1 && lastDot !== -1) {
        decimalSeparator = lastComma > lastDot ? "," : ".";
    } else if (lastComma !== -1) {
        decimalSeparator = digitsAfter(lastComma) <= 2 ? "," : null;
    } else if (lastDot !== -1) {
        decimalSeparator = digitsAfter(lastDot) <= 2 ? "." : null;
    }

    let normalized = "";
    if (decimalSeparator) {
        const idx = cleaned.lastIndexOf(decimalSeparator);
        const integerPart = cleaned.slice(0, idx).replace(/[^0-9]/g, "");
        const fractionalPart = cleaned.slice(idx + 1).replace(/[^0-9]/g, "");
        normalized = integerPart.length ? integerPart : "0";
        normalized += "." + (fractionalPart || "0");
    } else {
        normalized = cleaned.replace(/[^0-9]/g, "");
    }

    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed * sign;
};

const pickPrecio = (row) => parseNumber(row["PRECIO_X_BARRA_FINAL"]);


export class MateriaPrimaService {
    constructor(dao){
        this.MateriaPrimaDao = dao;
    }

    async createMateriaPrima(data) {
        return await this.MateriaPrimaDao.create(data);
    }

    async getAllMateriaPrimas({ page = 1, limit = 10, filters = {} } = {}) {
        return await this.MateriaPrimaDao.getPaginated({ page, limit, filters });
    }

    async getMateriaPrimaById(id) {
        return await this.MateriaPrimaDao.getById(id);
    }

    async updateMateriaPrima(id, data) {
        return await this.MateriaPrimaDao.update(id, data);
    }

    async deleteMateriaPrima(id) {
        return await this.MateriaPrimaDao.delete(id);
    }

    async deleteAllMateriaPrimas() {
        return await this.MateriaPrimaDao.deleteAll();
    }

    async getMateriaPrimasByCategory(category) {
        return await this.MateriaPrimaDao.getByCategory(category);
    }


    async getAllCategories() {
        return await this.MateriaPrimaDao.getAllCategories();
    }

    async getMateriaPrimasByType(type) {
        return await this.MateriaPrimaDao.getByType(type);
    }

    async importFromExcel(fileBuffer, options = {}) {
        if (!fileBuffer) {
            throw new Error("No se recibió archivo para importar");
        }

        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = options.sheetName || workbook.SheetNames[0];
        if (!sheetName) {
            throw new Error("El archivo no contiene hojas válidas");
        }

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
        const summary = {
            total: rows.length,
            inserted: 0,
            updated: 0,
            skipped: [],
        };

        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const rowNumber = idx + 2; // considera fila de encabezado

            const familyCode = normalizeFamilyCode(row.FAMILIA ?? "");
            if (!ALLOWED_FAMILY_CODES.has(familyCode)) {
                continue;
            }

            const descripcion = row.DESCRIPCION ?? "";
            const { nombre, medida, espesor } = parseDescripcion(descripcion);
            const precio = pickPrecio(row);
            if (!nombre || !medida) {
                summary.skipped.push({ row: rowNumber, reason: "Descripción incompleta" });
                continue;
            }
            if (precio === null) {
                summary.skipped.push({ row: rowNumber, reason: "Precio no válido" });
                continue;
            }

            const { categoria, type } = getCategoryFromFamily(familyCode);

            const normalizedEspesor = espesor || "";
            const filter = {
                nombre,
                medida,
                espesor: normalizedEspesor,
                type,
            };

            let existing = await this.MateriaPrimaDao.findOneByFields(filter);
            if (!existing && !normalizedEspesor) {
                const { espesor: _omit, ...rest } = filter;
                existing = await this.MateriaPrimaDao.findOneByFields(rest);
            }

            const payload = {
                nombre,
                categoria,
                type,
                medida,
                espesor: normalizedEspesor,
                precio,
                celdaExcel: rowNumber,
            };

            if (existing) {
                await this.MateriaPrimaDao.update(existing._id, payload);
                summary.updated += 1;
            } else {
                await this.MateriaPrimaDao.create({ ...payload, stock: 0 });
                summary.inserted += 1;
            }
        }

        logger.info("Importación de materias primas finalizada", summary);
        return summary;
    }

}

export const materiaPrimaService = new MateriaPrimaService(MateriaPrimaDao);
