
const mongoose = require('mongoose');
 
const UserSchema = new mongoose.Schema({
  uname: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});
 
module.exports = mongoose.model('User', UserSchema);