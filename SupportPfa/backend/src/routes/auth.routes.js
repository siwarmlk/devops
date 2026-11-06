const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SupportUser } = require('../models/SupportUser');

const login = async (req, res) => {
  try {
    console.log('login', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username et password sont requis.' });
    }

    const user = await SupportUser.findOne({ username: String(username).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
    let role = user.role || 'support';
    if (user.username === adminUsername) {
      role = 'admin';
      if (user.role !== 'admin') {
        await SupportUser.updateOne({ _id: user._id }, { $set: { role: 'admin' } });
      }
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT_SECRET non configure sur le serveur.' });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, role },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user._id.toString(), username: user.username, role }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
};

module.exports = { login };
