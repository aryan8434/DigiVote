const express = require('express');
const router = express.Router();
const { castVote, verifyVoterForAuth } = require('../controllers/voteController');
const { checkVotingOpen } = require('../middleware/timeGurad');

router.post('/verify', verifyVoterForAuth);
router.post('/cast', checkVotingOpen, castVote);

module.exports = router;
