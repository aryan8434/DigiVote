const mongoose = require('mongoose');
const { Schema } = mongoose;

const candidateSchema = new Schema(
  {
    photoURL: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    partyName: {
      type: String,
      required: true,
      trim: true,
    },
    symbolURL: {
      type: String,
      trim: true,
      default: '',
    },
    position: {
      type: String,
      required: true,
      trim: true,
    }, // e.g. "Member of Parliament - Central District"
    constituency: {
      type: String,
      required: true,
      trim: true,
    },
    education: [
      {
        type: String,
        trim: true,
      },
    ],
    experience: [
      {
        type: String,
        trim: true,
      },
    ],
    achievements: [
      {
        type: String,
        trim: true,
      },
    ],
    promises: [
      {
        type: String,
        trim: true,
      },
    ],
    criminalRecord: {
      type: String,
      trim: true,
      default: 'NONE',
    },
    assetsDeclared: {
      type: String,
      trim: true,
      default: '',
    },
    contact: {
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

candidateSchema.index({ constituency: 1 });

const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;
