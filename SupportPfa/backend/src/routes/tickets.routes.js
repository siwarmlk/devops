const express = require('express');
const { Ticket, TICKET_STATUSES } = require('../models/Ticket');

const router = express.Router();

const ticketPopulate = { path: 'assignedTo', select: 'username' };

router.get('/', async (_req, res) => {
  const tickets = await Ticket.find().populate(ticketPopulate).sort({ createdAt: -1 });
  res.json(tickets);
});

router.get('/:id', async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate(ticketPopulate);
  if (!ticket) {
    return res.status(404).json({ message: 'Ticket introuvable.' });
  }
  return res.json(ticket);
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!TICKET_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }

  const updatedTicket = await Ticket.findByIdAndUpdate(id, { status }, { new: true }).populate(
    ticketPopulate
  );

  if (!updatedTicket) {
    return res.status(404).json({ message: 'Ticket introuvable.' });
  }

  return res.json(updatedTicket);
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, category, status } = req.body;

  if (!title && !description && !category && !status) {
    return res.status(400).json({ message: 'Aucune modification fournie.' });
  }
  if (status && !TICKET_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }

  const payload = {};
  if (typeof title === 'string' && title.trim()) payload.title = title.trim();
  if (typeof description === 'string' && description.trim()) payload.description = description.trim();
  if (typeof category === 'string' && category.trim()) payload.category = category.trim();
  if (status) payload.status = status;

  const updated = await Ticket.findByIdAndUpdate(id, payload, { new: true }).populate(ticketPopulate);
  if (!updated) {
    return res.status(404).json({ message: 'Ticket introuvable.' });
  }
  return res.json(updated);
});

router.patch('/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { unassign } = req.body;

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    return res.status(404).json({ message: 'Ticket introuvable.' });
  }

  if (unassign) {
    ticket.assignedTo = null;
  } else {
    ticket.assignedTo = req.user.id;
    if (ticket.status === 'To Do') {
      ticket.status = 'In Progress';
    }
  }

  await ticket.save();
  const populated = await Ticket.findById(ticket._id).populate(ticketPopulate);
  return res.json(populated);
});

router.delete('/:id', async (req, res) => {
  const deleted = await Ticket.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Ticket introuvable.' });
  }
  return res.json({ ok: true, id: req.params.id });
});

module.exports = router;
