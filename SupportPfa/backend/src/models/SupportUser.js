const mongoose = require('mongoose');

const supportUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['support', 'admin'],
      default: 'support'
    }
  },
  { timestamps: true }
);

const SupportUser = mongoose.model('SupportUser', supportUserSchema);

module.exports = { SupportUser };
