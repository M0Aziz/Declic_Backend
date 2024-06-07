const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  bio: String, 
  interests: [String], 
  additionalImages: [String],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  profileType: { type: String, enum: ['public', 'private'], default: 'public' },
  city: String, 
  birthDate: Date, 
  username: { type: String, unique: true }, 

  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] ,

  friends: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ['O', 'N','NF','D'], default: 'N' }, // O pour accepté, N pour en attente
      vuByUser: { type: Boolean, default: false }

    }
  ]
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
