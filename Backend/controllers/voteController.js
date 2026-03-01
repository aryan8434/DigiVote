const mongoose = require('mongoose');
const Voter = require('../model/Voter');
const Candidate = require('../model/Candidate');
const { Vote } = require('../model/Vote');
const Config = require('../model/Config');
const { hashVoterId, verifyFingerprintHash } = require('../utils/cryptoUtils');

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Cast a vote - uses MongoDB transaction to prevent double voting
 */
async function castVote(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { candidateId, aadhar, constituency, ward, fingerprintHash } = req.body;

    if (!candidateId || !aadhar || !constituency || !ward || !fingerprintHash) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateId, aadhar, constituency, ward, fingerprintHash',
      });
    }

    const voter = await Voter.findOne({
      aadhar: String(aadhar).trim(),
      constituency: String(constituency).trim(),
      ward: String(ward).trim(),
      isVerified: true,
    })
      .session(session)
      .lean();

    if (!voter) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Voter not found or not verified for this constituency/ward.',
      });
    }

    if (!verifyFingerprintHash(fingerprintHash, voter.fingerprintHash)) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        message: 'Fingerprint verification failed.',
      });
    }

    const now = new Date();
    if (voter.lastVotedAt && now - new Date(voter.lastVotedAt) < THREE_DAYS_MS) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'You have already voted. You cannot vote again for 3 days.',
      });
    }

    const candidate = await Candidate.findById(candidateId).session(session).lean();
    if (!candidate || candidate.constituency !== constituency) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid candidate for this constituency.',
      });
    }

    const voterIdHash = hashVoterId(voter._id.toString());
    const existingVote = await Vote.findOne({ voterIdHash, constituency, ward })
      .session(session)
      .lean();
    if (existingVote) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: 'You have already voted in this election.',
      });
    }

    const lastVote = await Vote.findOne().sort({ _id: -1 }).session(session).lean();
    const previousBlockHash = lastVote ? lastVote.currentBlockHash : '0';
    const voteDoc = new Vote({
      candidateId: new mongoose.Types.ObjectId(candidateId),
      voterIdHash,
      constituency,
      ward,
      previousBlockHash,
    });
    await voteDoc.save({ session });

    await Voter.updateOne(
      { _id: voter._id },
      { $set: { lastVotedAt: now } },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      message: 'Vote recorded successfully.',
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('castVote error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote. Please try again.',
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
    if (!aadhar || !constituency || !ward) {
      return res.status(400).json({
        success: false,
        message: 'Missing aadhar, constituency, or ward.',
      });
    }

    const voter = await Voter.findOne({
      aadhar: String(aadhar).trim(),
      constituency: String(constituency).trim(),
      ward: String(ward).trim(),
      isVerified: true,
    })
      .select('fullName isVerified lastVotedAt')
      .lean();

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found or not verified.',
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
        ? 'Voter verified. Proceed to biometric verification.'
        : 'You have already voted. Cannot vote again for 3 days.',
    });
  } catch (err) {
    console.error('verifyVoterForAuth error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { castVote, verifyVoterForAuth };
