const Candidate = require('../model/Candidate');
const mongoose = require('mongoose');
const { uploadToCloudinary } = require('../utils/cloudinary');

const parseArray = (item) => {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  try { return JSON.parse(item); } catch(e) { return item.split(',').map(s=>s.trim()); }
};

/**
 * Register a new candidate
 */
async function registerCandidate(req, res) {
  try {
    let {
      name,
      partyName,
      position,
      constituency,
      education,
      experience,
      achievements,
      promises,
      criminalRecord,
      assetsDeclared,
      contact,
    } = req.body;

    let photoURL = req.body.photoURL || '';
    let symbolURL = req.body.symbolURL || '';

    // Handle incoming JSON strings for array fields
    education = parseArray(education);
    experience = parseArray(experience);
    achievements = parseArray(achievements);
    promises = parseArray(promises);
    
    let parsedContact = {};
    if (contact) {
      if (typeof contact === 'string') {
        try { parsedContact = JSON.parse(contact); } catch (e) { parsedContact = {}; }
      } else { parsedContact = contact; }
    }

    if (
      !name ||
      !partyName ||
      !position ||
      !constituency ||
      !education?.length ||
      !experience?.length ||
      !achievements?.length ||
      !promises?.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: name, partyName, position, constituency, education, experience, achievements, promises.',
      });
    }

    // Upload files if they exist
    if (req.files && req.files['photoURL'] && req.files['photoURL'][0]) {
      const file = req.files['photoURL'][0];
      photoURL = await uploadToCloudinary(file.buffer, file.mimetype, 'candidates/photos');
    }
    if (req.files && req.files['symbolURL'] && req.files['symbolURL'][0]) {
      const file = req.files['symbolURL'][0];
      symbolURL = await uploadToCloudinary(file.buffer, file.mimetype, 'candidates/symbols');
    }

    const candidate = await Candidate.create({
      name: String(name).trim(),
      partyName: String(partyName).trim(),
      symbolURL: symbolURL ? String(symbolURL).trim() : '',
      photoURL: photoURL ? String(photoURL).trim() : '',
      position: String(position).trim(),
      constituency: String(constituency).trim(),
      education: education.map((e) => String(e).trim()),
      experience: experience.map((e) => String(e).trim()),
      achievements: achievements.map((a) => String(a).trim()),
      promises: promises.map((p) => String(p).trim()),
      criminalRecord: criminalRecord ? String(criminalRecord).trim() : 'NONE',
      assetsDeclared: assetsDeclared ? String(assetsDeclared).trim() : '',
      contact: {
        email: String(parsedContact.email || '').trim(),
        phone: String(parsedContact.phone || '').trim(),
        facebook: String(parsedContact.facebook || '').trim(),
        twitter: String(parsedContact.twitter || '').trim(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Candidate registration successful.',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        partyName: candidate.partyName,
        constituency: candidate.constituency,
      },
    });
  } catch (err) {
    console.error('registerCandidate error:', err);
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
    });
  }
}

/**
 * List candidates by constituency
 */
async function listCandidates(req, res) {
  try {
    const { constituency } = req.query;
    const filter = constituency ? { constituency: String(constituency).trim() } : {};
    const candidates = await Candidate.find(filter)
      .select(
        'name partyName symbolURL photoURL position education experience achievements promises criminalRecord assetsDeclared contact'
      )
      .lean();
    res.json({ success: true, candidates });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Search candidates (for Help Desk)
 */
async function searchCandidates(req, res) {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) {
      return res.json({ success: true, candidates: [] });
    }
    const search = new RegExp(String(q).trim(), 'i');
    const candidates = await Candidate.find({
      $or: [
        { name: search },
        { partyName: search },
        { position: search },
        { constituency: search },
      ],
    })
      .select('name partyName symbolURL photoURL position education experience achievements promises criminalRecord assetsDeclared contact')
      .limit(20)
      .lean();
    res.json({ success: true, candidates });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  registerCandidate,
  listCandidates,
  searchCandidates,
};
