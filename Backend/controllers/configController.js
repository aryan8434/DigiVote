const Config = require("../model/config");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const ALLOWED_ELECTION_STATUSES = new Set([
  "registration",
  "waiting",
  "voting",
  "ended",
]);

const DEFAULT_CONFIG = {
  electionStatus: "registration",
  startTime: null,
  endTime: null,
  candidateRegStart: null,
  candidateRegEnd: null,
};

const FALLBACK_CONFIG_PATH = path.join(
  __dirname,
  "../config/localElectionConfig.json",
);

function normalizeDateForStorage(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function normalizeConfigForStorage(config) {
  return {
    electionStatus: config.electionStatus || DEFAULT_CONFIG.electionStatus,
    startTime: normalizeDateForStorage(config.startTime),
    endTime: normalizeDateForStorage(config.endTime),
    candidateRegStart: normalizeDateForStorage(config.candidateRegStart),
    candidateRegEnd: normalizeDateForStorage(config.candidateRegEnd),
  };
}

function loadLocalFallbackConfig() {
  try {
    if (!fs.existsSync(FALLBACK_CONFIG_PATH)) {
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readFileSync(FALLBACK_CONFIG_PATH, "utf8");
    if (!raw.trim()) {
      return { ...DEFAULT_CONFIG };
    }
    const parsed = JSON.parse(raw);
    return {
      electionStatus: parsed.electionStatus || DEFAULT_CONFIG.electionStatus,
      startTime: parsed.startTime || null,
      endTime: parsed.endTime || null,
      candidateRegStart: parsed.candidateRegStart || null,
      candidateRegEnd: parsed.candidateRegEnd || null,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveLocalFallbackConfig(config) {
  const serialized = normalizeConfigForStorage(config);
  fs.writeFileSync(FALLBACK_CONFIG_PATH, JSON.stringify(serialized, null, 2));
  return serialized;
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

let localFallbackConfig = loadLocalFallbackConfig();

function parseOptionalDate(raw, fieldName) {
  if (raw === undefined) {
    return { provided: false };
  }

  if (raw === null || raw === "") {
    return { provided: true, value: null };
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return {
      provided: true,
      error: `${fieldName} must be a valid date-time value.`,
    };
  }

  return { provided: true, value: parsed };
}

function shapeConfig(config) {
  return {
    electionStatus: config.electionStatus,
    startTime: config.startTime,
    endTime: config.endTime,
    candidateRegStart: config.candidateRegStart,
    candidateRegEnd: config.candidateRegEnd,
  };
}

function mergeConfig(base, updates) {
  return {
    electionStatus:
      updates.electionStatus !== undefined
        ? updates.electionStatus
        : base.electionStatus,
    startTime:
      updates.startTime !== undefined ? updates.startTime : base.startTime,
    endTime: updates.endTime !== undefined ? updates.endTime : base.endTime,
    candidateRegStart:
      updates.candidateRegStart !== undefined
        ? updates.candidateRegStart
        : base.candidateRegStart,
    candidateRegEnd:
      updates.candidateRegEnd !== undefined
        ? updates.candidateRegEnd
        : base.candidateRegEnd,
  };
}

/**
 * Get current election config (public)
 */
async function getConfig(req, res) {
  if (!isDbConnected()) {
    return res.json({
      success: true,
      config: localFallbackConfig,
      serverTime: new Date().toISOString(),
      persisted: false,
      message: "Database unavailable. Returning locally cached configuration.",
    });
  }

  try {
    const config = await Config.findOne().sort({ createdAt: -1 }).lean();
    if (!config) {
      return res.json({
        success: true,
        config: {
          electionStatus: "registration",
          startTime: null,
          endTime: null,
          candidateRegStart: null,
          candidateRegEnd: null,
        },
        serverTime: new Date().toISOString(),
      });
    }

    localFallbackConfig = normalizeConfigForStorage(shapeConfig(config));

    res.json({
      success: true,
      config: shapeConfig(config),
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to fetch election config:", err);
    res.status(500).json({
      success: false,
      message: "Unable to load election configuration right now.",
    });
  }
}

/**
 * Update election config (admin only)
 */
async function updateConfig(req, res) {
  try {
    const {
      electionStatus,
      startTime,
      endTime,
      candidateRegStart,
      candidateRegEnd,
    } = req.body;

    if (
      electionStatus !== undefined &&
      !ALLOWED_ELECTION_STATUSES.has(electionStatus)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid electionStatus. Allowed values: registration, waiting, voting, ended.",
      });
    }

    const parsedStart = parseOptionalDate(startTime, "startTime");
    const parsedEnd = parseOptionalDate(endTime, "endTime");
    const parsedCandidateStart = parseOptionalDate(
      candidateRegStart,
      "candidateRegStart",
    );
    const parsedCandidateEnd = parseOptionalDate(
      candidateRegEnd,
      "candidateRegEnd",
    );

    const parseError = [
      parsedStart,
      parsedEnd,
      parsedCandidateStart,
      parsedCandidateEnd,
    ].find((result) => result.error);

    if (parseError) {
      return res
        .status(400)
        .json({ success: false, message: parseError.error });
    }

    const startValue = parsedStart.provided ? parsedStart.value : undefined;
    const endValue = parsedEnd.provided ? parsedEnd.value : undefined;
    if (
      startValue instanceof Date &&
      endValue instanceof Date &&
      startValue >= endValue
    ) {
      return res.status(400).json({
        success: false,
        message: "Voting end time must be later than voting start time.",
      });
    }

    const candidateStartValue = parsedCandidateStart.provided
      ? parsedCandidateStart.value
      : undefined;
    const candidateEndValue = parsedCandidateEnd.provided
      ? parsedCandidateEnd.value
      : undefined;
    if (
      candidateStartValue instanceof Date &&
      candidateEndValue instanceof Date &&
      candidateStartValue >= candidateEndValue
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Candidate registration end time must be later than candidate registration start time.",
      });
    }

    const updateFields = {
      ...(electionStatus !== undefined && { electionStatus }),
      ...(parsedStart.provided && { startTime: parsedStart.value }),
      ...(parsedEnd.provided && { endTime: parsedEnd.value }),
      ...(parsedCandidateStart.provided && {
        candidateRegStart: parsedCandidateStart.value,
      }),
      ...(parsedCandidateEnd.provided && {
        candidateRegEnd: parsedCandidateEnd.value,
      }),
    };

    if (!isDbConnected()) {
      localFallbackConfig = saveLocalFallbackConfig(
        mergeConfig(localFallbackConfig, updateFields),
      );
      return res.json({
        success: true,
        config: localFallbackConfig,
        persisted: false,
        message: "Saved locally. Database is currently unavailable.",
      });
    }

    const config = await Config.findOneAndUpdate(
      {},
      { $set: updateFields },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    localFallbackConfig = saveLocalFallbackConfig(shapeConfig(config));

    res.json({
      success: true,
      config: shapeConfig(config),
    });
  } catch (err) {
    console.error("Failed to update election config:", err);

    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid election configuration data.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to update configuration right now. Please try again.",
    });
  }
}

module.exports = { getConfig, updateConfig };
