const mongoose = require("mongoose");
const Voter = require("../model/Voter");
const Candidate = require("../model/Candidate");
const { Vote } = require("../model/Vote");
const Config = require("../model/Config");
const { hashVoterId, verifyFingerprintHash } = require("../utils/cryptoUtils");

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function maskAadhar(value) {
  const raw = String(value || "").trim();
  if (!raw) return "N/A";
  if (raw.length <= 4) return raw;
  return `${"*".repeat(raw.length - 4)}${raw.slice(-4)}`;
}

/**
 * Cast a vote - uses MongoDB transaction to prevent double voting
 */
async function castVote(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { candidateId, aadhar, constituency, ward, fingerprintHash } =
      req.body;
    const normalized = {
      candidateId: String(candidateId || "").trim(),
      aadhar: String(aadhar || "").trim(),
      constituency: String(constituency || "").trim(),
      ward: String(ward || "").trim(),
      fingerprintHash: String(fingerprintHash || "").trim(),
    };

    if (
      !normalized.candidateId ||
      !normalized.aadhar ||
      !normalized.constituency ||
      !normalized.ward ||
      !normalized.fingerprintHash
    ) {
      console.warn("[castVote] Missing required fields", {
        aadhar: maskAadhar(normalized.aadhar),
        constituency: normalized.constituency,
        ward: normalized.ward,
        hasCandidateId: !!normalized.candidateId,
        hasFingerprintHash: !!normalized.fingerprintHash,
      });
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: candidateId, aadhar, constituency, ward, fingerprintHash",
      });
    }

    const voter = await Voter.findOne({
      aadhar: normalized.aadhar,
      constituency: normalized.constituency,
      ward: normalized.ward,
      isVerified: true,
    })
      .session(session)
      .lean();

    if (!voter) {
      console.warn("[castVote] Voter not found for payload", {
        aadhar: maskAadhar(normalized.aadhar),
        constituency: normalized.constituency,
        ward: normalized.ward,
      });
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Voter not found or not verified for this constituency/ward.",
      });
    }

    if (
      !verifyFingerprintHash(normalized.fingerprintHash, voter.fingerprintHash)
    ) {
      console.warn("[castVote] Fingerprint mismatch", {
        voterId: String(voter._id),
        aadhar: maskAadhar(normalized.aadhar),
        constituency: normalized.constituency,
        ward: normalized.ward,
      });
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        message: "Fingerprint verification failed.",
      });
    }

    const now = new Date();
    if (
      voter.lastVotedAt &&
      now - new Date(voter.lastVotedAt) < THREE_DAYS_MS
    ) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You have already voted. You cannot vote again for 3 days.",
      });
    }

    const candidate = await Candidate.findById(normalized.candidateId)
      .session(session)
      .lean();
    if (!candidate || candidate.constituency !== normalized.constituency) {
      console.warn("[castVote] Candidate constituency mismatch", {
        candidateId: normalized.candidateId,
        payloadConstituency: normalized.constituency,
        candidateConstituency: candidate?.constituency || null,
      });
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid candidate for this constituency.",
      });
    }

    const voterIdHash = hashVoterId(voter._id.toString());
    const existingVote = await Vote.findOne({
      voterIdHash,
      constituency: normalized.constituency,
      ward: normalized.ward,
    })
      .session(session)
      .lean();
    if (existingVote) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: "You have already voted in this election.",
      });
    }

    const lastVote = await Vote.findOne()
      .sort({ _id: -1 })
      .session(session)
      .lean();
    const previousBlockHash = lastVote ? lastVote.currentBlockHash : "0";
    const voteDoc = new Vote({
      candidateId: new mongoose.Types.ObjectId(normalized.candidateId),
      voterIdHash,
      constituency: normalized.constituency,
      ward: normalized.ward,
      previousBlockHash,
    });
    await voteDoc.save({ session });

    await Voter.updateOne(
      { _id: voter._id },
      { $set: { lastVotedAt: now } },
      { session },
    );

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      message: "Vote recorded successfully.",
    });
  } catch (err) {
    if (session) await session.abortTransaction();
    console.error("castVote error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to record vote. Please try again.",
      error: err.name,
    });
  } finally {
    session.endSession();
  }
}

/**
 * Verify voter exists and return limited info for auth flow
 */
async function verifyVoterForAuth(req, res) {
  try {
    const { aadhar, constituency, ward } = req.body;
    const normalized = {
      aadhar: String(aadhar || "").trim(),
      constituency: String(constituency || "").trim(),
      ward: String(ward || "").trim(),
    };

    if (!normalized.aadhar || !normalized.constituency || !normalized.ward) {
      console.warn("[verifyVoterForAuth] Missing fields", {
        aadhar: maskAadhar(normalized.aadhar),
        constituency: normalized.constituency,
        ward: normalized.ward,
      });
      return res.status(400).json({
        success: false,
        message: "Missing aadhar, constituency, or ward.",
      });
    }

    const voter = await Voter.findOne({
      aadhar: normalized.aadhar,
      constituency: normalized.constituency,
      ward: normalized.ward,
      isVerified: true,
    })
      .select("fullName isVerified lastVotedAt")
      .lean();

    if (!voter) {
      console.warn("[verifyVoterForAuth] Voter not found", {
        aadhar: maskAadhar(normalized.aadhar),
        constituency: normalized.constituency,
        ward: normalized.ward,
      });
      return res.status(404).json({
        success: false,
        message: "Voter not found or not verified.",
      });
    }

    const now = new Date();
    const canVote =
      !voter.lastVotedAt || now - new Date(voter.lastVotedAt) >= THREE_DAYS_MS;

    res.json({
      success: true,
      canVote,
      lastVotedAt: voter.lastVotedAt,
      message: canVote
        ? "Voter verified. Proceed to biometric verification."
        : "You have already voted. Cannot vote again for 3 days.",
    });
  } catch (err) {
    console.error("verifyVoterForAuth error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Get searchable constituency names for results page
 */
async function getResultConstituencies(req, res) {
  try {
    const [candidateConstituencies, voteConstituencies] = await Promise.all([
      Candidate.distinct("constituency"),
      Vote.distinct("constituency"),
    ]);

    const list = Array.from(
      new Set([
        ...(candidateConstituencies || []),
        ...(voteConstituencies || []),
      ]),
    )
      .filter(Boolean)
      .map((item) => String(item).trim())
      .sort((a, b) => a.localeCompare(b));

    res.json({ success: true, constituencies: list });
  } catch (err) {
    console.error("getResultConstituencies error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch constituencies." });
  }
}

/**
 * Get constituency result with winner and all candidate vote counts
 */
async function getConstituencyResult(req, res) {
  try {
    const constituency = String(req.query.constituency || "").trim();
    if (!constituency) {
      return res.status(400).json({
        success: false,
        message: "constituency query parameter is required.",
      });
    }

    const candidates = await Candidate.find({ constituency })
      .select("name partyName photoURL symbolURL position constituency")
      .lean();

    if (!candidates.length) {
      return res.status(404).json({
        success: false,
        message: "No candidates found for this constituency.",
      });
    }

    const voteCounts = await Vote.aggregate([
      { $match: { constituency } },
      { $group: { _id: "$candidateId", votes: { $sum: 1 } } },
    ]);

    const countByCandidate = new Map(
      voteCounts.map((item) => [String(item._id), Number(item.votes || 0)]),
    );

    const candidateResults = candidates
      .map((candidate) => ({
        ...candidate,
        voteCount: countByCandidate.get(String(candidate._id)) || 0,
      }))
      .sort(
        (a, b) => b.voteCount - a.voteCount || a.name.localeCompare(b.name),
      );

    const winner = candidateResults[0] || null;

    res.json({
      success: true,
      constituency,
      totalVotesCast: candidateResults.reduce((sum, c) => sum + c.voteCount, 0),
      winner,
      candidates: candidateResults,
    });
  } catch (err) {
    console.error("getConstituencyResult error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch election result." });
  }
}

module.exports = {
  castVote,
  verifyVoterForAuth,
  getResultConstituencies,
  getConstituencyResult,
};
