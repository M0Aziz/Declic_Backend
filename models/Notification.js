const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  content: String,
  date: {
    type: Date,
    default: Date.now
  },
    vu: { type: Boolean, default: false },
vuByUser: { type: Boolean, default: false }

});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
