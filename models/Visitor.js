const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  os: String,
  browser: String,
  device: String,
  city: String,
  country: String,
  urlVisited: String,
  role:String,
  heardFrom :String,
  counter :Number,
  visitedAt: {
    type: Date,
    default: Date.now,
  }
});

const visitorSchema = new mongoose.Schema({
  visits: [visitSchema],
  admin: {
    password: String,
  }
});

module.exports = mongoose.model('Visitor', visitorSchema);
