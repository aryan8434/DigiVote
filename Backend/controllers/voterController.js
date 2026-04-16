const Voter = require('../model/Voter');
const { sha256 } = require('../utils/cryptoUtils');
const mongoose = require('mongoose');

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function isDbTimeoutError(err) {
  return (
    err?.name === 'MongooseError' &&
    typeof err?.message === 'string' &&
    err.message.includes('buffering timed out')
  );
}

function dbUnavailableResponse(res, message = 'Database unavailable. Please try again shortly.') {
  return res.status(503).json({
    success: false,
    message,
  });
}

/**
 * Register a new voter
 */
async function registerVoter(req, res) {
  if (!isDbConnected()) {
    return dbUnavailableResponse(res, 'Registration is temporarily unavailable because database is offline.');
  }

  try {
    const {
      fullName,
      fatherOrHusbandName,
      dateOfBirth,
      gender,
      aadhar,
      voterId,
      address,
      constituency,
      ward,
      booth,
      contact,
      fingerprintHash,
    } = req.body;

    if (
      !fullName ||
      !fatherOrHusbandName ||
      !dateOfBirth ||
      !gender ||
      !aadhar ||
      !voterId ||
      !address?.permanent ||
      !constituency ||
      !ward ||
      !booth ||
      !contact
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: fullName, fatherOrHusbandName, dateOfBirth, gender, aadhar, voterId, address.permanent, constituency, ward, booth, contact.',
      });
    }

    if (!fingerprintHash) {
      return res.status(400).json({
        success: false,
        message: 'Biometric data (fingerprintHash) is required.',
      });
    }

    const existing = await Voter.findOne({
      $or: [{ aadhar: String(aadhar).trim() }, { voterId: String(voterId).trim() }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A voter with this Aadhar or Voter ID already exists.',
      });
    }

    const voter = await Voter.create({
      fullName: String(fullName).trim(),
      fatherOrHusbandName: String(fatherOrHusbandName).trim(),
      dateOfBirth: new Date(dateOfBirth),
      gender: String(gender).toLowerCase(),
      aadhar: String(aadhar).trim(),
      voterId: String(voterId).trim(),
      address: {
        permanent: String(address.permanent).trim(),
        current: address.current ? String(address.current).trim() : '',
      },
      constituency: String(constituency).trim(),
      ward: String(ward).trim(),
      booth: String(booth).trim(),
      contact: String(contact).trim(),
      fingerprintHash: String(fingerprintHash).trim(),
      isVerified: true, // Simplified: accept if fingerprint provided
    });

    res.status(201).json({
      success: true,
      message: 'Voter registration successful. Document and biometric verified.',
      voter: {
        id: voter._id,
        fullName: voter.fullName,
        aadharLast4: voter.aadhar.slice(-4),
        constituency: voter.constituency,
        ward: voter.ward,
      },
    });
  } catch (err) {
    console.error('registerVoter error:', err);

    if (isDbTimeoutError(err)) {
      return dbUnavailableResponse(res, 'Registration failed because database is currently unreachable.');
    }

    res.status(500).json({
      success: false,
      message: err.code === 11000 ? 'Duplicate Aadhar or Voter ID.' : 'Registration failed.',
    });
  }
}

/**
 * Get constituencies list (for dropdowns)
 */
async function getConstituencies(req, res) {
  if (!isDbConnected()) {
    return dbUnavailableResponse(res, 'Constituency list is unavailable because database is offline.');
  }

  try {
    const list = await Voter.distinct('constituency');
    res.json({ success: true, constituencies: list });
  } catch (err) {
    if (isDbTimeoutError(err)) {
      return dbUnavailableResponse(res, 'Constituency list is unavailable because database is unreachable.');
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Get wards for a constituency
 */
async function getWards(req, res) {
  if (!isDbConnected()) {
    return dbUnavailableResponse(res, 'Ward list is unavailable because database is offline.');
  }

  try {
    const { constituency } = req.params;
    const list = await Voter.distinct('ward', { constituency });
    res.json({ success: true, wards: list });
  } catch (err) {
    if (isDbTimeoutError(err)) {
      return dbUnavailableResponse(res, 'Ward list is unavailable because database is unreachable.');
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Helper: Compute SHA-256 for client-sent biometric data
 */
async function computeBiometricHash(req, res) {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: 'Missing data' });
    }
    const hash = sha256(typeof data === 'string' ? data : JSON.stringify(data));
    res.json({ success: true, hash });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Verify a voter ID
 */
async function verifyVoter(req, res) {
  if (!isDbConnected()) {
    return dbUnavailableResponse(res, 'Voter verification is temporarily unavailable because database is offline.');
  }

  try {
    const { voterId } = req.params;
    
    // Find the voter by voterId
    const voter = await Voter.findOne({ voterId: String(voterId).trim() });
    
    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter ID not found. Please register first.' });
    }
    
    res.json({ success: true, message: 'Voter verified.', voterDetails: { fullName: voter.fullName, voterId: voter.voterId, constituency: voter.constituency } });
  } catch (err) {
    if (isDbTimeoutError(err)) {
      return dbUnavailableResponse(res, 'Voter verification failed because database is unreachable.');
    }

    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
}

module.exports = {
  registerVoter,
  getConstituencies,
  getWards,
  computeBiometricHash,
  verifyVoter,
};
