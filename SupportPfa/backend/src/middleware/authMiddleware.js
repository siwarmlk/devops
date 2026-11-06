const jwt = require('jsonwebtoken');
const { SupportUser } = require('../models/SupportUser');

const configuredAdminUsername = () => (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();

/**
 * Middleware async : JWT valide, puis utilisateur chargé depuis la base (rôle toujours à jour).
 */
const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant. Connectez-vous.' });
  }

  const token = header.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ message: 'JWT_SECRET non configure sur le serveur.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expire.' });
  }

  try {
    const dbUser = await SupportUser.findById(payload.sub).select('username role');
    if (!dbUser) {
      return res.status(401).json({ message: 'Session invalide : utilisateur introuvable.' });
    }

    let role = dbUser.role || 'support';
    if (dbUser.username === configuredAdminUsername()) {
      role = 'admin';
      if (dbUser.role !== 'admin') {
        await SupportUser.updateOne({ _id: dbUser._id }, { $set: { role: 'admin' } });
      }
    }

    req.user = { id: dbUser._id.toString(), username: dbUser.username, role };
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur lors de la verification de session.' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Utilisateur non authentifie.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Acces refuse pour ce role.' });
  }
  return next();
};

module.exports = { authMiddleware, requireRole };
