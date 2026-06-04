const nodemailer = require('nodemailer');
const config = require('../config/env');

const createTransport = () => {
  if (config.env === 'test') {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
};

const transporter = createTransport();

const sendPasswordResetEmail = async (email, token, name) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Recuperação de senha - Psicopedagogia',
    html: `
      <h2>Olá, ${name}!</h2>
      <p>Você solicitou a recuperação de senha do sistema psicopedagógico.</p>
      <p>Clique no link abaixo para redefinir sua senha (válido por 1 hora):</p>
      <a href="${resetUrl}" style="background:#1976d2;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">
        Redefinir Senha
      </a>
      <p>Se não foi você, ignore este email.</p>
    `,
  });
};

module.exports = { sendPasswordResetEmail };
