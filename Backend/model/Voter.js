const mongoose = require('mongoose');
const { Schema } = mongoose;

const voterSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    fatherOrHusbandName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    aadhar: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 12,
      maxLength: 12,
    },
    voterId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    address: {
      permanent: { type: String, required: true },
      current: { type: String, default: '' },
    },
    constituency: {
      type: String,
      required: true,
      trim: true,
    },
    ward: {
      type: String,
      required: true,
      trim: true,
    },
    booth: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    // Biometrics - SHA-256 hashed only
    fingerprintHash: {
      type: String,
      trim: true,
      default: null,
    },
    faceDataHash: {
      type: String,
      trim: true,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastVotedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast lookup during voting
voterSchema.index({ aadhar: 1, constituency: 1, ward: 1 });

const Voter = mongoose.model('Voter', voterSchema);
module.exports = Voter;
