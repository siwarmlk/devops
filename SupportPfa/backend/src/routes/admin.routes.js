const express = require('express');
const bcrypt = require('bcryptjs');
const { Ticket } = require('../models/Ticket');
const { SupportUser } = require('../models/SupportUser');
const { requireRole } = require('../middleware/authMiddleware');
const {
  getTicketCategories,
  setTicketCategories,
  getModelSupervision,
  setModelSupervision
} = require('../utils/adminConfig');

const router = express.Router();

router.use(requireRole(['admin']));

router.get('/dashboard', async (_req, res) => {
  const [totalTickets, openTickets, closedTickets, totalAgents, categories, modelSupervision] =
    await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['To Do', 'In Progress', 'Waiting for Customer'] } }),
      Ticket.countDocuments({ status: { $in: ['Resolved', 'Closed'] } }),
      SupportUser.countDocuments({ role: 'support' }),
      getTicketCategories(),
      getModelSupervision()
    ]);

  return res.json({
    totalTickets,
    openTickets,
    closedTickets,
    totalAgents,
    totalCategories: categories.length,
    modelSupervision
  });
});

router.get('/tickets', async (_req, res) => {
  const tickets = await Ticket.find().populate({ path: 'assignedTo', select: 'username role' }).sort({ createdAt: -1 });
  return res.json(tickets);
});

router.patch('/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, category, status, assignedTo } = req.body;
  const payload = {};
  if (typeof title === 'string' && title.trim()) payload.title = title.trim();
  if (typeof description === 'string' && description.trim()) payload.description = description.trim();
  if (typeof category === 'string' && category.trim()) payload.category = category.trim();
  if (typeof status === 'string' && status.trim()) payload.status = status.trim();
  if (assignedTo === null || typeof assignedTo === 'string') payload.assignedTo = assignedTo;

  const updated = await Ticket.findByIdAndUpdate(id, payload, { new: true }).populate({
    path: 'assignedTo',
    select: 'username role'
  });
  if (!updated) {
    return res.status(404).json({ message: 'Ticket introuvable.' });
  }
  return res.json(updated);
});

router.delete('/tickets/:id', async (req, res) => {
  const deleted = await Ticket.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Ticket introuvable.' });
  }
  return res.json({ ok: true, id: req.params.id });
});

router.get('/agents', async (_req, res) => {
  const agents = await SupportUser.find({ role: 'support' }).select('_id username role createdAt').sort({ createdAt: -1 });
  return res.json(agents);
});

router.post('/agents', async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!username || !password) {
    return res.status(400).json({ message: 'username et password sont requis.' });
  }
  const exists = await SupportUser.findOne({ username });
  if (exists) {
    return res.status(409).json({ message: 'Ce username existe deja.' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const created = await SupportUser.create({ username, password: hashed, role: 'support' });
  return res.status(201).json({ id: created._id.toString(), username: created.username, role: created.role });
});

router.delete('/agents/:id', async (req, res) => {
  const deleted = await SupportUser.findOneAndDelete({ _id: req.params.id, role: 'support' });
  if (!deleted) {
    return res.status(404).json({ message: 'Agent introuvable.' });
  }
  await Ticket.updateMany({ assignedTo: deleted._id }, { $set: { assignedTo: null } });
  return res.json({ ok: true, id: req.params.id });
});

router.get('/categories', async (_req, res) => {
  const categories = await getTicketCategories();
  return res.json({ categories });
});

router.put('/categories', async (req, res) => {
  const raw = Array.isArray(req.body.categories) ? req.body.categories : [];
  const cleaned = raw
    .map((c) => String(c || '').trim())
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);
  if (!cleaned.length) {
    return res.status(400).json({ message: 'La liste des categories ne peut pas etre vide.' });
  }
  await setTicketCategories(cleaned);
  return res.json({ categories: cleaned });
});

router.get('/model-supervision', async (_req, res) => {
  const data = await getModelSupervision();
  return res.json(data);
});

router.put('/model-supervision', async (req, res) => {
  const updated = await setModelSupervision(req.body || {});
  return res.json(updated);
});

module.exports = router;
