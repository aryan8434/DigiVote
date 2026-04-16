const Config = require("../model/config");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const FALLBACK_CONFIG_PATH = path.join(
  __dirname,
  "../config/localElectionConfig.json",
);

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function readFallbackConfig() {
  try {
    if (!fs.existsSync(FALLBACK_CONFIG_PATH)) return null;
    const raw = fs.readFileSync(FALLBACK_CONFIG_PATH, "utf8").trim();
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function getEffectiveConfig() {
  if (isDbConnected()) {
    return await Config.findOne().sort({ createdAt: -1 }).lean();
  }
  return readFallbackConfig();
}

// Voter registration is always open — no time check needed
async function checkRegistrationOpen(req, res, next) {
  next();
}

// Candidate registration window is controlled by admin via candidateRegStart and candidateRegEnd
async function checkCandidateRegistrationOpen(req, res, next) {
  try {
    const config = await getEffectiveConfig();
    if (!config || !config.candidateRegStart || !config.candidateRegEnd) {
      return res.status(503).json({
        success: false,
        message:
          "Candidate registration window has not been configured by admin yet.",
      });
    }
    const now = new Date();
    if (now < new Date(config.candidateRegStart)) {
      return res.status(403).json({
        success: false,
        message: "Candidate registration has not started yet.",
        candidateRegStart: config.candidateRegStart,
      });
    }
    if (now > new Date(config.candidateRegEnd)) {
      return res.status(403).json({
        success: false,
        message: "Candidate registration window has closed.",
        candidateRegEnd: config.candidateRegEnd,
      });
    }
    req.electionConfig = config;
    next();
  } catch (err) {
    res
      .status(503)
      .json({
        success: false,
        message: "Database unavailable. Please try again shortly.",
      });
  }
}

async function checkVotingOpen(req, res, next) {
  try {
    const config = await getEffectiveConfig();
    if (!config) {
      return res.status(503).json({
        success: false,
        message: "Election not configured.",
      });
    }
    const now = new Date();
    const startTime = config.startTime ? new Date(config.startTime) : null;
    const endTime = config.endTime ? new Date(config.endTime) : null;

    if (!startTime || now < startTime) {
      return res.status(403).json({
        success: false,
        message: "Voting has not started yet.",
        startTime: startTime ? startTime.toISOString() : null,
      });
    }
    if (endTime && now > endTime) {
      return res.status(403).json({
        success: false,
        message: "Voting has ended.",
        endTime: endTime.toISOString(),
      });
    }
    req.electionConfig = config;
    next();
  } catch (err) {
    res
      .status(503)
      .json({
        success: false,
        message: "Database unavailable. Please try again shortly.",
      });
  }
}

async function getServerTime(req, res) {
  try {
    const config = await getEffectiveConfig();
    res.json({
      serverTime: new Date().toISOString(),
      config: config
        ? {
            electionStatus: config.electionStatus,
            startTime: config.startTime,
            endTime: config.endTime,
            registrationDeadline: config.registrationDeadline,
          }
        : null,
    });
  } catch (err) {
    res
      .status(503)
      .json({
        success: false,
        message: "Database unavailable. Please try again shortly.",
      });
  }
}

module.exports = {
  checkRegistrationOpen,
  checkCandidateRegistrationOpen,
  checkVotingOpen,
  getServerTime,
};
