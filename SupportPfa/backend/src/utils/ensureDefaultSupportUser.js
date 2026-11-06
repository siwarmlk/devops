const bcrypt = require('bcryptjs');
const { SupportUser } = require('../models/SupportUser');

const ensureDefaultSupportUser = async () => {
  const username = (process.env.SUPPORT_USERNAME || 'support').toLowerCase().trim();
  const plainPassword = process.env.SUPPORT_PASSWORD || 'support123';

  const existing = await SupportUser.findOne({ username });
  if (!existing) {
    const password = await bcrypt.hash(plainPassword, 10);
    await SupportUser.create({ username, password, role: 'support' });
    console.log(`Compte support par defaut cree: ${username} / ${plainPassword}`);
  }

  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const existingAdmin = await SupportUser.findOne({ username: adminUsername });
  if (!existingAdmin) {
    const password = await bcrypt.hash(adminPassword, 10);
    await SupportUser.create({ username: adminUsername, password, role: 'admin' });
    console.log(`Compte admin par defaut cree: ${adminUsername} / ${adminPassword}`);
  } else if (existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin';
    await existingAdmin.save();
    console.log(`Compte ${adminUsername}: role corrige vers admin`);
  }
};

module.exports = { ensureDefaultSupportUser };
