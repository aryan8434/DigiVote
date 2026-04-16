const mongoose = require('mongoose');
const { Schema } = mongoose;

const configSchema = new Schema(
  {
    electionStatus: {
      type: String,
      enum: ['registration', 'waiting', 'voting', 'ended'],
      default: 'registration',
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    candidateRegStart: {
      type: Date,
      default: null,
    },
    candidateRegEnd: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Config = mongoose.model('Config', configSchema);
module.exports = Config;
