import { VentasModel } from "./models/index.js";

export class VentasDAOMongo {
  static async create(data) {
    return await VentasModel.create(data);
  }

  static async getAll() {
    return await VentasModel.find().sort({ createdAt: -1, fecha: -1, _id: -1 }).populate({
      path: 'producto',
      populate: { path: 'planillaCosto' }
    }).lean();
  }
  static async getAllPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const ALERT_THRESHOLD_DAYS = 5;
    const DESPACHADA_WINDOW_DAYS = 30;
    const dueSoonLimit = 200;
    const thresholdDate = new Date(now.getTime() + ALERT_THRESHOLD_DAYS * dayMs);
    const windowStartDate = new Date(now.getTime() - DESPACHADA_WINDOW_DAYS * dayMs);

    const [items, total, metricsAgg] = await Promise.all([
      VentasModel.find()
        .sort({ createdAt: -1, fecha: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'producto', populate: { path: 'planillaCosto' } })
        .lean(),
      VentasModel.countDocuments({}),
      VentasModel.aggregate([
        {
          $facet: {
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
    return await VentasModel.findById(id).populate({
      path: 'producto',
      populate: { path: 'planillaCosto' }
    }).lean();
  }

  static async update(id, ventasData) {
    return await VentasModel.findByIdAndUpdate(id, ventasData, {
      new: true,
    }).lean();
  }

  static async delete(id) {
    return await VentasModel.findByIdAndDelete(id).lean();
  }

  static async getByCliente(cliente) {
    return await VentasModel.find({ cliente: cliente }).sort({ createdAt: -1, fecha: -1, _id: -1 }).lean();
  }

  static async getByEstado(estado) {
    return await VentasModel.find({ estado: estado }).sort({ createdAt: -1, fecha: -1, _id: -1 }).lean();
  }
}
