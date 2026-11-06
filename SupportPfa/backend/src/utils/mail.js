const nodemailer = require('nodemailer');

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

/**
 * @param {{ email: string; trackingCode: string; title: string; firstName: string }} ticket
 */
const sendTicketConfirmationEmail = async (ticket) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:4200').replace(/\/$/, '');
  const trackUrl = `${appUrl}/suivi-demande`;

  const transporter = buildTransporter();
  const text = [
    `Bonjour ${ticket.firstName},`,
    '',
    'Nous avons bien recu votre demande de support.',
    `Objet : ${ticket.title}`,
    '',
    `Votre code de suivi : ${ticket.trackingCode}`,
    '',
    `Pour connaitre l'avancement : ${trackUrl}`,
    'Saisissez ce code sur la page « Suivre ma demande ».',
    '',
    'Cordialement,',
    "L'equipe support"
  ].join('\n');

  if (!transporter || !from) {
    console.info(
      '[mail] SMTP non configure — email non envoye. Code de suivi:',
      ticket.trackingCode,
      '->',
      ticket.email
    );
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    await transporter.sendMail({
      from,
      to: ticket.email,
      subject: `Confirmation demande support — ${ticket.trackingCode}`,
      text
    });
    return { sent: true };
  } catch (err) {
    console.error('[mail] Echec envoi email:', err.message);
    return { sent: false, reason: err.message };
  }
};

module.exports = { sendTicketConfirmationEmail };
