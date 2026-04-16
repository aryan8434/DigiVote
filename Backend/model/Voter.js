const mongoose = require("mongoose");
const { Schema } = mongoose;

const voterSchema = new Schema(
  {
    fullName: {
      type: String,
      default: "",
      trim: true,
    },
    fatherOrHusbandName: {
      type: String,
      default: "",
      trim: true,
    },
    dateOfBirth: {
      type: String,
      default: "",
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    aadhar: {
      type: String,
      default: "",
      trim: true,
    },
    voterId: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      permanent: { type: String, default: "" },
      current: { type: String, default: "" },
    },
    constituency: {
      type: String,
      default: "",
      trim: true,
    },
    ward: {
      type: String,
      default: "",
      trim: true,
    },
    booth: {
      type: String,
      default: "",
      trim: true,
    },
    contact: {
      type: String,
      default: "",
      trim: true,
    },
    // Biometrics - SHA-256 hashed only
    fingerprintHash: {
      type: String,
      trim: true,
      default: "",
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
  { timestamps: true },
);

// Index for fast lookup during voting
voterSchema.index({ aadhar: 1, constituency: 1, ward: 1 });

const Voter = mongoose.model("Voter", voterSchema);
module.exports = Voter;
