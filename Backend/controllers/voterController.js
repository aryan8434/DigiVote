const Voter = require('../model/Voter');
const { sha256 } = require('../utils/cryptoUtils');

/**
 * Register a new voter
 */
async function registerVoter(req, res) {
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
      faceDataHash,
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

    if (!fingerprintHash || !faceDataHash) {
      return res.status(400).json({
        success: false,
        message: 'Biometric data (fingerprintHash and faceDataHash) are required.',
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
      faceDataHash: String(faceDataHash).trim(),
      isVerified: true, // Simplified: accept if both biometrics provided
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
  try {
    const list = await Voter.distinct('constituency');
    res.json({ success: true, constituencies: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Get wards for a constituency
 */
async function getWards(req, res) {
  try {
    const { constituency } = req.params;
    const list = await Voter.distinct('ward', { constituency });
    res.json({ success: true, wards: list });
  } catch (err) {
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

module.exports = {
  registerVoter,
  getConstituencies,
  getWards,
  computeBiometricHash,
};
