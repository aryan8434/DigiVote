const Config = require('../model/Config');

async function checkRegistrationOpen(req, res, next) {
  try {
    const config = await Config.findOne().sort({ createdAt: -1 }).lean();
    if (!config || !config.registrationDeadline) {
      return res.status(503).json({
        success: false,
        message: 'Registration is not configured.',
      });
    }
    const now = new Date();
    if (now > config.registrationDeadline) {
      return res.status(403).json({
        success: false,
        message: 'Registration is closed. Deadline has passed.',
      });
    }
    req.electionConfig = config;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function checkVotingOpen(req, res, next) {
  try {
    const config = await Config.findOne().sort({ createdAt: -1 }).lean();
    if (!config) {
      return res.status(503).json({
        success: false,
        message: 'Election not configured.',
      });
    }
    const now = new Date();
    const startTime = config.startTime ? new Date(config.startTime) : null;
    const endTime = config.endTime ? new Date(config.endTime) : null;

    if (!startTime || now < startTime) {
      return res.status(403).json({
        success: false,
        message: 'Voting has not started yet.',
        startTime: startTime ? startTime.toISOString() : null,
      });
    }
    if (endTime && now > endTime) {
      return res.status(403).json({
        success: false,
        message: 'Voting has ended.',
        endTime: endTime.toISOString(),
      });
    }
    req.electionConfig = config;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getServerTime(req, res) {
  try {
    const config = await Config.findOne().sort({ createdAt: -1 }).lean();
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { checkRegistrationOpen, checkVotingOpen, getServerTime };

