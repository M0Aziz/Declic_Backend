const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  type: { type: String },
  date: Date,
  reported: { type: Number, default: 0 } ,
  vuByUser: { type: Boolean, default: false }


});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
