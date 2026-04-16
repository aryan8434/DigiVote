const mongoose = require("mongoose");
const crypto = require("crypto");
const { Schema } = mongoose;

const voteSchema = new Schema(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    voterIdHash: {
      type: String,
      required: true,
    }, // SHA-256 of voterId for anonymity
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
    timestamp: {
      type: Date,
      default: Date.now,
    },
    previousBlockHash: {
      type: String,
      default: "0",
    },
    currentBlockHash: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Generate current block hash from document content
function computeBlockHash(doc) {
  const data = JSON.stringify({
    candidateId: String(doc.candidateId),
    voterIdHash: doc.voterIdHash,
    constituency: doc.constituency,
    ward: doc.ward,
    timestamp: doc.timestamp
      ? doc.timestamp.toISOString()
      : new Date().toISOString(),
    previousBlockHash: doc.previousBlockHash,
  });
  return crypto.createHash("sha256").update(data).digest("hex");
}

voteSchema.pre("save", async function () {
  try {
    if (!this.isNew) return;

    // Use the document's session if it exists (for transactions)
    const session = this.$session();
    const Vote = mongoose.model("Vote");
    const lastVote = await Vote.findOne()
      .sort({ _id: -1 })
      .session(session)
      .lean();

    this.previousBlockHash = lastVote ? lastVote.currentBlockHash : "0";
    this.currentBlockHash = computeBlockHash(this);
  } catch (err) {
    throw err;
  }
});

const Vote = mongoose.model("Vote", voteSchema);
module.exports = { Vote, computeBlockHash };
