import { VentasModel } from "./models/index.js";

// Filtros de la página de ventas (por estado de la venta o saldo pendiente).
export const FILTROS_VENTAS = {
  todas: {},
  sin_despachar: { estado: { $nin: ["despachada", "cancelada"] } },
  pendiente: { estado: "pendiente" },
  en_proceso: { estado: "en_proceso" },
  finalizada: { estado: "finalizada" },
  despachada: { estado: "despachada" },
  cancelada: { estado: "cancelada" },
  con_saldo: { restan: { $gt: 0 }, estado: { $ne: "cancelada" } },
};

export class VentasDAOMongo {
  static async create(data) {
    return await VentasModel.create(data);
  }

  static async getAll() {
    return await VentasModel.find().sort({ createdAt: -1, fecha: -1, _id: -1 })
      .populate({
        path: 'producto',
        populate: { path: 'planillaCosto' }
      })
      .populate('createdBy', 'first_name last_name email')
      .populate('updatedBy', 'first_name last_name email')
      .lean();
  }
  static async getAllPaginated(page = 1, limit = 10, filtro = "todas") {
    const skip = (page - 1) * limit;
    const match = FILTROS_VENTAS[filtro] ?? {};
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const ALERT_THRESHOLD_DAYS = 5;
    const DESPACHADA_WINDOW_DAYS = 30;
    const dueSoonLimit = 200;
    const thresholdDate = new Date(now.getTime() + ALERT_THRESHOLD_DAYS * dayMs);
    const windowStartDate = new Date(now.getTime() - DESPACHADA_WINDOW_DAYS * dayMs);

    const [items, total, metricsAgg] = await Promise.all([
      VentasModel.find(match)
        .sort({ createdAt: -1, fecha: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'producto', populate: { path: 'planillaCosto' } })
        .populate('createdBy', 'first_name last_name email')
        .populate('updatedBy', 'first_name last_name email')
        .lean(),
      VentasModel.countDocuments(match),
      VentasModel.aggregate([
        {
          $facet: {
            // Cantidad de ventas de cada filtro (para mostrarla en los botones).
            conteos: [
              {
                $group: {
                  _id: null,
                  todas: { $sum: 1 },
                  sin_despachar: { $sum: { $cond: [{ $in: ["$estado", ["despachada", "cancelada"]] }, 0, 1] } },
                  pendiente: { $sum: { $cond: [{ $eq: ["$estado", "pendiente"] }, 1, 0] } },
                  en_proceso: { $sum: { $cond: [{ $eq: ["$estado", "en_proceso"] }, 1, 0] } },
                  finalizada: { $sum: { $cond: [{ $eq: ["$estado", "finalizada"] }, 1, 0] } },
                  despachada: { $sum: { $cond: [{ $eq: ["$estado", "despachada"] }, 1, 0] } },
                  cancelada: { $sum: { $cond: [{ $eq: ["$estado", "cancelada"] }, 1, 0] } },
                  con_saldo: {
                    $sum: {
                      $cond: [
                        { $and: [{ $gt: ["$restan", 0] }, { $ne: ["$estado", "cancelada"] }] },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            pending: [
              { $match: { restan: { $gt: 0 } } },
              { $group: { _id: null, pendingAmountTotal: { $sum: "$restan" } } },
            ],
            status: [
              { $match: { estado: { $in: ["en_proceso", "finalizada"] } } },
              { $group: { _id: "$estado", count: { $sum: 1 } } },
            ],
            despachadaLast30: [
              { $match: { estado: "despachada" } },
              {
                $addFields: {
                  fechaRef: {
                    $ifNull: [
                      "$fechaDespacho",
                      {
                        $ifNull: [
                          "$fechaEntrega",
                          {
                            $ifNull: [
                              "$updatedAt",
                              { $ifNull: ["$fecha", "$createdAt"] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              { $match: { fechaRef: { $gte: windowStartDate } } },
              { $count: "count" },
            ],
            dueSoonCount: [
              {
                $match: {
                  estado: { $nin: ["finalizada", "despachada"] },
                  fechaLimite: { $ne: null },
                },
              },
              { $match: { fechaLimite: { $lte: thresholdDate } } },
              { $count: "count" },
            ],
            dueSoonList: [
              {
                $match: {
                  estado: { $nin: ["finalizada", "despachada"] },
                  fechaLimite: { $ne: null },
                },
              },
              { $match: { fechaLimite: { $lte: thresholdDate } } },
              { $sort: { fechaLimite: 1, _id: 1 } },
              { $limit: dueSoonLimit },
              {
                $lookup: {
                  from: "productos",
                  localField: "producto",
                  foreignField: "_id",
                  as: "productoDoc",
                },
              },
              {
                $unwind: {
                  path: "$productoDoc",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 0,
                  id: { $toString: "$_id" },
                  cliente: { $ifNull: ["$cliente", "Sin cliente"] },
                  producto: {
                    $let: {
                      vars: {
                        productoNombre: { $ifNull: ["$productoNombre", ""] },
                        productoFallback: {
                          $trim: {
                            input: {
                              $concat: [
                                { $ifNull: ["$productoDoc.nombre", ""] },
                                " ",
                                { $ifNull: ["$productoDoc.modelo", ""] },
                              ],
                            },
                          },
                        },
                      },
                      in: {
                        $cond: [
                          { $gt: [{ $strLenCP: "$$productoNombre" }, 0] },
                          "$$productoNombre",
                          "$$productoFallback",
                        ],
                      },
                    },
                  },
                  fechaLimite: "$fechaLimite",
                  diffDays: {
                    $ceil: {
                      $divide: [{ $subtract: ["$fechaLimite", now] }, dayMs],
                    },
                  },
                  estado: {
                    $cond: [{ $lt: ["$fechaLimite", now] }, "vencida", "proxima"],
                  },
                },
              },
            ],
          },
        },
      ]),
    ]);

    const metrics = metricsAgg?.[0] ?? {};
    const { _id: _ignorado, ...conteosFiltro } = metrics?.conteos?.[0] ?? {};
    const pendingAmountTotal = Number(metrics?.pending?.[0]?.pendingAmountTotal ?? 0);
    const statusMetricsGlobal = {
      en_proceso: 0,
      finalizada: 0,
      despachada: Number(metrics?.despachadaLast30?.[0]?.count ?? 0),
    };
    if (Array.isArray(metrics?.status)) {
      for (const row of metrics.status) {
        if (row && typeof row._id === "string") {
          statusMetricsGlobal[row._id] = Number(row.count ?? 0);
        }
      }
    }
    const dueSoonCountGlobal = Number(metrics?.dueSoonCount?.[0]?.count ?? 0);
    const dueSoonListGlobal = Array.isArray(metrics?.dueSoonList) ? metrics.dueSoonList : [];
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      items,
      total,
      filtro: FILTROS_VENTAS[filtro] ? filtro : "todas",
      conteosFiltro,
      page,
      limit,
      totalPages,
      pendingAmountTotal,
      statusMetricsGlobal,
      dueSoonCountGlobal,
      dueSoonListGlobal,
    };
  }

  static async getById(id) {
    return await VentasModel.findById(id)
      .populate({
        path: 'producto',
        populate: { path: 'planillaCosto' }
      })
      .populate('createdBy', 'first_name last_name email')
      .populate('updatedBy', 'first_name last_name email')
      .lean();
  }

  static async update(id, ventasData) {
    return await VentasModel.findByIdAndUpdate(id, ventasData, {
      new: true,
    })
      .populate('createdBy', 'first_name last_name email')
      .populate('updatedBy', 'first_name last_name email')
      .lean();
  }

  static async delete(id) {
    return await VentasModel.findByIdAndDelete(id).lean();
  }

  static async getByCliente(cliente) {
    return await VentasModel.find({ cliente: cliente })
      .sort({ createdAt: -1, fecha: -1, _id: -1 })
      .populate('createdBy', 'first_name last_name email')
      .lean();
  }

  static async getByEstado(estado) {
    return await VentasModel.find({ estado: estado })
      .sort({ createdAt: -1, fecha: -1, _id: -1 })
      .populate('createdBy', 'first_name last_name email')
      .lean();
  }
}
