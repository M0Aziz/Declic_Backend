const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateStart: Date,
  dateEnd : Date,
  city: String,
  name: String,
  location: String,
  showLocation :  { type: Boolean, default: false } ,
  description: String,
  profileType: { type: String, enum: ['public', 'private'], default: 'public' },
  price : Number,
  currency : String,
  category: [String],
  image : String,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  waitingList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  repeat : [String],
  visibility: { type: Boolean, default: true } ,
  unsubscribeDeadline: Date,
  date : Date,
  reported:  [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ['O', 'N'], default: 'N' },
      activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }, 

    }
  ] ,

});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
