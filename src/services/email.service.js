import nodemailer from "nodemailer";
import logger from "../config/logger.js";

class EmailService {
  constructor() {
    this.transporter = null;
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
    if (EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: Number(EMAIL_PORT),
        secure: Number(EMAIL_PORT) === 465,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });
    } else {
      logger.warn("EmailService: configuración SMTP incompleta. No se enviarán correos.");
    }
  }

  async sendMail({ to, subject, text, html }) {
    if (!this.transporter) {
      logger.warn("EmailService: intento de envío sin transporter configurado", { to, subject });
      return;
    }
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    await this.transporter.sendMail({ from, to, subject, text, html });
  }

  async sendVerificationEmail({ to, name, verificationUrl }) {
    const subject = "Confirma tu correo para acceder a Costify";
    const text = `Hola ${name},\n\nGracias por registrarte en Costify. Confirma tu correo haciendo clic en el siguiente enlace:\n${verificationUrl}\n\nSi no fuiste tú, ignora este correo.`;
    const html = `
      <p>Hola <strong>${name}</strong>,</p>
      <p>Gracias por registrarte en Costify. Por favor confirma tu correo haciendo clic en el siguiente enlace:</p>
      <p><a href="${verificationUrl}" target="_blank">Confirmar mi correo</a></p>
      <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
    `;
    await this.sendMail({ to, subject, text, html });
  }
}

export const emailService = new EmailService();
