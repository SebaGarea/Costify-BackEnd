import { invitacionesModelo } from "./models/index.js";

export class InvitationDaoMongo {
  static create(invitation) {
    return invitacionesModelo.create(invitation);
  }

  static findByCode(code) {
    return invitacionesModelo.findOne({ code }).lean();
  }

  static getAll() {
    return invitacionesModelo.find().sort({ createdAt: -1 }).lean();
  }

  static markUsed(id, userId) {
    return invitacionesModelo.findByIdAndUpdate(
      id,
      {
        $inc: { usedCount: 1 },
        $push: { usedBy: userId },
      },
      { new: true }
    );
  }

  static updateById(id, update) {
    return invitacionesModelo.findByIdAndUpdate(id, update, { new: true }).lean();
  }
}
