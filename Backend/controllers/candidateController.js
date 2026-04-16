const Candidate = require("../model/Candidate");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { uploadToCloudinary } = require("../utils/cloudinary");

const LOCAL_CANDIDATES_PATH = path.join(
  __dirname,
  "../config/localCandidates.json",
);

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function readLocalCandidates() {
  try {
    if (!fs.existsSync(LOCAL_CANDIDATES_PATH)) return [];
    const raw = fs.readFileSync(LOCAL_CANDIDATES_PATH, "utf8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCandidates(candidates) {
  fs.writeFileSync(LOCAL_CANDIDATES_PATH, JSON.stringify(candidates, null, 2));
  return candidates;
}

function mapCandidatePayload({
  name,
  partyName,
  symbolURL,
  photoURL,
  position,
  constituency,
  education,
  experience,
  achievements,
  promises,
  criminalRecord,
  assetsDeclared,
}) {
  const normalizeArray = (items) =>
    Array.isArray(items)
      ? items.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

  return {
    name: String(name || "").trim(),
    partyName: String(partyName || "").trim(),
    symbolURL: symbolURL ? String(symbolURL).trim() : "",
    photoURL: photoURL ? String(photoURL).trim() : "",
    position: String(position || "").trim(),
    constituency: String(constituency || "").trim(),
    education: normalizeArray(education),
    experience: normalizeArray(experience),
    achievements: normalizeArray(achievements),
    promises: normalizeArray(promises),
    criminalRecord: criminalRecord ? String(criminalRecord).trim() : "NONE",
    assetsDeclared: assetsDeclared ? String(assetsDeclared).trim() : "",
  };
}

const parseArray = (item) => {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  try {
    return JSON.parse(item);
  } catch (e) {
    return item.split(",").map((s) => s.trim());
  }
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
    } = req.body;

    let photoURL = req.body.photoURL || "";
    let symbolURL = req.body.symbolURL || "";

    // Handle incoming JSON strings for array fields
    education = parseArray(education);
    experience = parseArray(experience);
    achievements = parseArray(achievements);
    promises = parseArray(promises);

    // Upload files if they exist
    if (req.files && req.files["photoURL"] && req.files["photoURL"][0]) {
      const file = req.files["photoURL"][0];
      try {
        photoURL = await uploadToCloudinary(
          file.buffer,
          file.mimetype,
          "candidates/photos",
        );
      } catch (uploadErr) {
        console.error("photo upload error:", uploadErr.message);
      }
    }
    if (req.files && req.files["symbolURL"] && req.files["symbolURL"][0]) {
      const file = req.files["symbolURL"][0];
      try {
        symbolURL = await uploadToCloudinary(
          file.buffer,
          file.mimetype,
          "candidates/symbols",
        );
      } catch (uploadErr) {
        console.error("symbol upload error:", uploadErr.message);
      }
    }

    const payload = mapCandidatePayload({
      name,
      partyName,
      symbolURL,
      photoURL,
      position,
      constituency,
      education,
      experience,
      achievements,
      promises,
      criminalRecord,
      assetsDeclared,
    });

    if (!isDbConnected()) {
      const localCandidates = readLocalCandidates();
      const localCandidate = {
        ...payload,
        _id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      localCandidates.push(localCandidate);
      writeLocalCandidates(localCandidates);

      return res.status(201).json({
        success: true,
        persisted: false,
        message:
          "Candidate registration saved locally. Database is currently unavailable.",
        candidate: {
          id: localCandidate._id,
          name: localCandidate.name,
          partyName: localCandidate.partyName,
          constituency: localCandidate.constituency,
        },
      });
    }

    const candidate = await Candidate.create(payload);

    res.status(201).json({
      success: true,
      message: "Candidate registration successful.",
      candidate: {
        id: candidate._id,
        name: candidate.name,
        partyName: candidate.partyName,
        constituency: candidate.constituency,
      },
    });
  } catch (err) {
    console.error("registerCandidate error:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
}

/**
 * List candidates by constituency
 */
async function listCandidates(req, res) {
  try {
    const { constituency } = req.query;
    const filter = constituency
      ? { constituency: String(constituency).trim() }
      : {};

    if (!isDbConnected()) {
      const local = readLocalCandidates();
      const candidates = constituency
        ? local.filter((c) => c.constituency === String(constituency).trim())
        : local;
      return res.json({ success: true, candidates, persisted: false });
    }

    const candidates = await Candidate.find(filter)
      .select(
        "name partyName symbolURL photoURL position education experience achievements promises criminalRecord assetsDeclared",
      )
      .lean();
    res.json({ success: true, candidates });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: "Candidate list temporarily unavailable.",
    });
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

    if (!isDbConnected()) {
      const query = String(q).trim().toLowerCase();
      const candidates = readLocalCandidates()
        .filter((c) =>
          [c.name, c.partyName, c.position, c.constituency]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query)),
        )
        .slice(0, 20);

      return res.json({ success: true, candidates, persisted: false });
    }

    const search = new RegExp(String(q).trim(), "i");
    const candidates = await Candidate.find({
      $or: [
        { name: search },
        { partyName: search },
        { position: search },
        { constituency: search },
      ],
    })
      .select(
        "name partyName symbolURL photoURL position education experience achievements promises criminalRecord assetsDeclared",
      )
      .limit(20)
      .lean();
    res.json({ success: true, candidates });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: "Candidate search temporarily unavailable.",
    });
  }
}

module.exports = {
  registerCandidate,
  listCandidates,
  searchCandidates,
};
