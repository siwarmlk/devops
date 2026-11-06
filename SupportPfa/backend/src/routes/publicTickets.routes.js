const { randomInt } = require('crypto');
const { Ticket } = require('../models/Ticket');
const { getTicketCategories } = require('../utils/adminConfig');
const { sendTicketConfirmationEmail } = require('../utils/mail');
const { classifyTicket } = require('../utils/ticketClassifier');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

const TRACKING_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateTrackingCode = () => {
  let raw = '';
  for (let i = 0; i < 10; i += 1) {
    raw += TRACKING_CHARS[randomInt(TRACKING_CHARS.length)];
  }
  return `SUP-${raw}`;
};

const assignUniqueTrackingCode = async () => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const trackingCode = generateTrackingCode();
    const exists = await Ticket.findOne({ trackingCode }).select('_id').lean();
    if (!exists) {
      return trackingCode;
    }
  }
  throw new Error('Impossible de generer un code de suivi unique.');
};

const getPublicCategories = async (_req, res) => {
  const categories = await getTicketCategories();
  return res.json({ categories });
};

const createPublicTicket = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, title, description, category } = req.body;

    if (
      !isNonEmptyString(firstName) ||
      !isNonEmptyString(lastName) ||
      !isNonEmptyString(phone) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(title) ||
      !isNonEmptyString(description)
    ) {
      return res.status(400).json({
        message: 'firstName, lastName, phone, email, title et description sont obligatoires.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Email invalide.' });
    }

    const allowedCategories = await getTicketCategories();
    let finalCategory = category;

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({ message: 'Categorie invalide.' });
    }

    if (!finalCategory) {
      finalCategory = await classifyTicket(title, description);
    }

    const trackingCode = await assignUniqueTrackingCode();

    const ticket = await Ticket.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      title: title.trim(),
      description: description.trim(),
      category: finalCategory || 'Question generale',
      trackingCode
    });

    await sendTicketConfirmationEmail({
      email: ticket.email,
      trackingCode: ticket.trackingCode,
      title: ticket.title,
      firstName: ticket.firstName
    });

    return res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur lors de la creation du ticket.' });
  }
};

const getTicketByTrackingCode = async (req, res) => {
  try {
    const raw = String(req.params.code || '').trim().toUpperCase();
    if (!raw || raw.length < 6) {
      return res.status(400).json({ message: 'Code de suivi invalide.' });
    }

    const ticket = await Ticket.findOne({ trackingCode: raw })
      .select('trackingCode status title category createdAt updatedAt')
      .lean();

    if (!ticket) {
      return res.status(404).json({ message: 'Aucune demande trouvee pour ce code.' });
    }

    return res.json({
      trackingCode: ticket.trackingCode,
      status: ticket.status,
      title: ticket.title,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur lors de la consultation.' });
  }
};

module.exports = { createPublicTicket, getTicketByTrackingCode, getPublicCategories };
