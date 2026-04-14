const Config = require('../model/Config');

/**
 * Get current election config (public)
 */
async function getConfig(req, res) {
  try {
    const config = await Config.findOne().sort({ createdAt: -1 }).lean();
    if (!config) {
      return res.json({
        success: true,
        config: {
          electionStatus: 'registration',
          startTime: null,
          endTime: null,
          candidateRegStart: null,
          candidateRegEnd: null,
        },
        serverTime: new Date().toISOString(),
      });
    }
    res.json({
      success: true,
      config: {
        electionStatus: config.electionStatus,
        startTime: config.startTime,
        endTime: config.endTime,
        candidateRegStart: config.candidateRegStart,
        candidateRegEnd: config.candidateRegEnd,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Update election config (admin only)
 */
async function updateConfig(req, res) {
  try {
    const { electionStatus, startTime, endTime, candidateRegStart, candidateRegEnd } = req.body;
    const config = await Config.findOneAndUpdate(
      {},
      {
        $set: {
          ...(electionStatus && { electionStatus }),
          ...(startTime ? { startTime: new Date(startTime) } : { startTime: null }),
          ...(endTime ? { endTime: new Date(endTime) } : { endTime: null }),
          ...(candidateRegStart ? { candidateRegStart: new Date(candidateRegStart) } : { candidateRegStart: null }),
          ...(candidateRegEnd ? { candidateRegEnd: new Date(candidateRegEnd) } : { candidateRegEnd: null }),
        },
      },
      { upsert: true, new: true }
    );
    res.json({
      success: true,
      config: {
        electionStatus: config.electionStatus,
        startTime: config.startTime,
        endTime: config.endTime,
        candidateRegStart: config.candidateRegStart,
        candidateRegEnd: config.candidateRegEnd,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
}

module.exports = { getConfig, updateConfig };
