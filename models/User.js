const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true }, 
  password: String,
  profilePicture: String, 
  //token:String,
  role: { type: String, enum: ['admin', 'user'], default: 'user' } ,
  phoneNumber: String,
  firstTime: { type: Boolean, default: true },

  isLoggedIn: { type: Boolean, default: false }, 
  lastLogin: { type: Date, default: Date.now } ,
  isBanned: { type: Boolean, default: false }, // Champ pour indiquer si le compte est banni
  isSuspended: { type: Boolean, default: false }, // Champ pour indiquer si le compte est temporairement désactivé
  suspensionEndDate: Date, 
  reasonForSuspension : String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
