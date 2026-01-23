import crypto from "crypto";
import { InvitationDaoMongo } from "../dao/index.js";

const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : undefined);

export class InvitacionesService {
  constructor(dao) {
    this.dao = dao;
  }

  generateCode() {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
  }

  async createInvitation({ email, role = "user", maxUses = 1, expiresAt }, createdBy) {
    const invitation = {
      code: this.generateCode(),
      email: normalizeEmail(email) ?? undefined,
      role,
      maxUses: Number(maxUses) || 1,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy,
    };
    return this.dao.create(invitation);
  }

  async listInvitations() {
    return this.dao.getAll();
  }

  async validateInvitation(code, email) {
    if (!code) {
      throw new Error("Código de invitación requerido");
    }
    const normalizedCode = code.trim().toUpperCase();
    const invitation = await this.dao.findByCode(normalizedCode);
    if (!invitation) {
      throw new Error("Código de invitación inválido");
    }
    if (!invitation.isActive) {
      throw new Error("La invitación ya fue utilizada o está desactivada");
    }
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      throw new Error("La invitación está vencida");
    }
    if (invitation.usedCount >= invitation.maxUses) {
      throw new Error("La invitación alcanzó el máximo de usos");
    }
    if (invitation.email && normalizeEmail(email) !== invitation.email) {
      throw new Error("El correo no coincide con la invitación");
    }
    return invitation;
  }

  async markInvitationUsed(invitationId, userId) {
    const updated = await this.dao.markUsed(invitationId, userId);
    if (!updated) return;
    if (updated.usedCount >= updated.maxUses) {
      await this.dao.updateById(invitationId, { isActive: false });
    }
  }
}

export const invitacionesService = new InvitacionesService(InvitationDaoMongo);
