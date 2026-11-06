const mongoose = require('mongoose');

const TICKET_STATUSES = [
  'To Do',
  'In Progress',
  'Waiting for Customer',
  'Resolved',
  'Closed'
];

const DEFAULT_TICKET_CATEGORIES = [
  'Authentification',
  'Support technique',
  'Reseau',
  'Materiel',
  'Logiciel',
  'Messagerie',
  'Securite',
  'Gestion des comptes',
  'Information',
  'Reclamation',
  'Demande de service',
  'Urgence'
];

const ticketSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      trim: true,
      default: 'Question generale'
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: 'To Do'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportUser',
      default: null
    },
    trackingCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    }
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = {
  Ticket,
  TICKET_STATUSES,
  DEFAULT_TICKET_CATEGORIES
};
